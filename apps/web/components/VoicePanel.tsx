'use client';

import { RealtimeClientConfig } from '@/lib/types';
import { VoiceOrb } from './VoiceOrb';

export function VoicePanel({
  talkTrack,
  speaking,
  realtime,
  audioLevel = 0,
}: {
  talkTrack: string;
  speaking: boolean;
  realtime: RealtimeClientConfig | null;
  audioLevel?: number;
}) {
  const realtimeReady = Boolean(realtime?.enabled);
  const realtimeStatusLabel = realtimeReady
    ? `Pipecat/OpenAI Realtime configured for ${realtime?.model}`
    : 'OpenAI Realtime credentials or Pipecat service config still needed';

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 style={{ marginTop: 0 }}>Voice presenter</h3>
      <div
        style={{
          aspectRatio: '4 / 5',
          borderRadius: 18,
          background: 'linear-gradient(180deg, #ffffff, #eff6ff)',
          border: '1px solid rgba(15,23,42,0.08)',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            padding: '6px 10px',
            borderRadius: 999,
            background: speaking ? 'rgba(37,99,235,0.12)' : 'rgba(148,163,184,0.14)',
            color: speaking ? 'var(--accent)' : 'var(--muted)',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {speaking ? 'Speaking' : 'Waiting'}
        </div>

        <div style={{ width: '100%', display: 'grid', gap: 14 }}>
          <div className="card" style={{ background: 'var(--panel-alt)', padding: 16 }}>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 12 }}>Realtime provider</p>
            <strong>{realtime?.provider ?? 'pipecat'}</strong>
            <p style={{ margin: '6px 0 0', color: realtimeReady ? 'var(--accent)' : 'var(--error-text)', fontSize: 13 }}>
              {realtimeStatusLabel}
            </p>
            <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 12 }}>
              Pipecat service: {realtime?.pipecat_service_url ?? process.env.NEXT_PUBLIC_PIPECAT_SERVICE_URL ?? 'http://localhost:8110'}
            </p>
            {realtime?.next_step ? (
              <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 12, lineHeight: 1.5 }}>
                Next: {realtime.next_step}
              </p>
            ) : null}
          </div>

          <div
            style={{
              minHeight: 260,
              borderRadius: 16,
              border: '1px dashed rgba(37,99,235,0.24)',
              background: 'rgba(255,255,255,0.65)',
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
              padding: 20,
              overflow: 'hidden',
            }}
          >
            <VoiceOrb level={audioLevel} active={speaking || audioLevel > 0.04} />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <p style={{ marginBottom: 6, color: 'var(--muted)' }}>Current talk track</p>
        <p style={{ margin: 0, lineHeight: 1.5 }}>{talkTrack}</p>
      </div>
    </div>
  );
}
