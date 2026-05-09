from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[3]
PIPECAT_APP = ROOT / 'apps' / 'pipecat'
sys.path.insert(0, str(PIPECAT_APP))

import server as pipecat_server  # noqa: E402


@pytest.fixture(autouse=True)
def reset_pipecat_state() -> None:
    pipecat_server.SESSIONS.clear()
    pipecat_server.LIVE_SESSIONS.clear()
    yield
    pipecat_server.SESSIONS.clear()
    pipecat_server.LIVE_SESSIONS.clear()


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setattr(
        pipecat_server,
        '_fetch_contract',
        lambda session_id: {
            'public_token': 'public-test-token',
            'avatar': None,
            'realtime': {'enabled': True, 'browser_direct_supported': False},
            'tool_manifest': [{'name': 'get_current_slide'}, {'name': 'next_slide'}],
            'pipecat_plan': {'proof_path': 'voice-only'},
        },
    )
    monkeypatch.setattr(
        pipecat_server,
        '_fetch_instructions',
        lambda session_id: {'instructions': 'Use slide context and keep answers concise.'},
    )
    return TestClient(pipecat_server.app)


def test_pipecat_transcript_loop_handles_slide_tools_and_grounded_answers(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    slide_state = {'index': 0}
    api_calls: list[tuple[str, str, dict[str, Any] | None]] = []

    def fake_get_json(url: str) -> dict[str, Any]:
        api_calls.append(('GET', url, None))
        if url.endswith('/current-slide'):
            index = slide_state['index']
            return {
                'index': index,
                'title': f'Slide {index + 1} title',
                'summary': f'Summary for slide {index + 1}',
            }
        raise AssertionError(f'unexpected GET {url}')

    def fake_post_json(url: str, payload: dict[str, Any]) -> dict[str, Any]:
        api_calls.append(('POST', url, payload))
        if url.endswith('/next-slide'):
            slide_state['index'] = 1
            return {'ok': True}
        if url.endswith('/ask'):
            return {
                'answer': 'The main value proposition is a faster, guided live sales demo grounded in the uploaded deck.',
                'citations': [{'slide_index': 0, 'reason': 'grounded answer'}],
            }
        raise AssertionError(f'unexpected POST {url}')

    monkeypatch.setattr(pipecat_server, '_get_json', fake_get_json)
    monkeypatch.setattr(pipecat_server, '_post_json', fake_post_json)

    connect_res = client.post('/sessions/session-1/connect', json={'publicToken': 'public-test-token'})
    assert connect_res.status_code == 200
    assert connect_res.json()['connected'] is True

    current_slide_res = client.post('/sessions/session-1/ask', json={'transcript': 'What slide am I on?'})
    assert current_slide_res.status_code == 200
    current_slide = current_slide_res.json()
    assert current_slide['answer'].startswith('Current slide is 1: Slide 1 title')
    assert current_slide['agent_status'] == 'speaking'

    next_slide_res = client.post('/sessions/session-1/ask', json={'transcript': 'next slide'})
    assert next_slide_res.status_code == 200
    next_slide = next_slide_res.json()
    assert next_slide['answer'].startswith('Moved to slide 2: Slide 2 title')
    assert pipecat_server.SESSIONS['session-1'].tool_state['last_tool_result']['tool_name'] == 'next_slide'

    grounded_res = client.post('/sessions/session-1/ask', json={'transcript': 'What is the main value proposition?'})
    assert grounded_res.status_code == 200
    grounded = grounded_res.json()
    assert 'value proposition' in grounded['answer']
    assert grounded['citations'] == [{'slide_index': 0, 'reason': 'grounded answer'}]

    assert any(method == 'POST' and url.endswith('/api/sessions/session-1/next-slide') and payload == {} for method, url, payload in api_calls)
    assert any(
        method == 'POST'
        and url.endswith('/api/sessions/session-1/ask')
        and payload == {'question': 'What is the main value proposition?'}
        for method, url, payload in api_calls
    )
