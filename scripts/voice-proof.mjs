import process from 'node:process';

const apiBase = (process.env.API_BASE_URL || 'http://127.0.0.1:8025').replace(/\/$/, '');
const pipecatBase = (process.env.PIPECAT_SERVICE_URL || 'http://127.0.0.1:8110').replace(/\/$/, '');

async function json(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${url} :: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  const deck = await json(`${apiBase}/api/decks/use-default`, { method: 'POST' });
  const session = await json(`${apiBase}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deck_id: deck.id }),
  });

  const sessionId = session.session_id;
  const publicToken = session.public_token;

  await json(`${pipecatBase}/sessions/${sessionId}/bootstrap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicToken }),
  });

  const liveCreate = await json(`${pipecatBase}/sessions/${sessionId}/live/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicToken }),
  });

  const offerSdp = ['v=0','o=- 0 0 IN IP4 127.0.0.1','s=-','t=0 0','a=group:BUNDLE 0','a=msid-semantic: WMS','m=audio 9 UDP/TLS/RTP/SAVPF 111','c=IN IP4 0.0.0.0','a=mid:0','a=recvonly','a=rtcp-mux','a=ice-ufrag:test','a=ice-pwd:testpassword1234567890','a=fingerprint:sha-256 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF','a=setup:actpass'].join('\r\n') + '\r\n';

  const join = await json(`${pipecatBase}/sessions/${sessionId}/live/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sdp: offerSdp, type: 'offer' }),
  });

  const liveState = await json(`${pipecatBase}/sessions/${sessionId}/live/state`);
  const askSlide = await json(`${pipecatBase}/sessions/${sessionId}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript: 'what slide am I on?' }),
  });
  const askNext = await json(`${pipecatBase}/sessions/${sessionId}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript: 'next slide' }),
  });
  const askGrounded = await json(`${pipecatBase}/sessions/${sessionId}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript: 'What is the main value proposition?' }),
  });
  const publicState = await json(`${apiBase}/api/public/${publicToken}`);

  console.log(JSON.stringify({
    sessionId,
    publicToken,
    liveCreateStatus: liveCreate.status,
    joinStatus: join.status,
    hasAnswerSdp: Boolean(join?.answer?.sdp),
    answerType: join?.answer?.type ?? null,
    liveTransportReady: liveState?.live?.transport_ready ?? null,
    liveRuntimeStatus: liveState?.live?.runtime_status ?? null,
    livePipelineReady: liveState?.live?.pipeline_ready ?? null,
    currentSlideAnswer: askSlide?.answer ?? null,
    nextSlideAnswer: askNext?.answer ?? null,
    groundedAnswer: askGrounded?.answer ?? null,
    finalSlideIndex: publicState?.session?.current_slide_index ?? null,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
