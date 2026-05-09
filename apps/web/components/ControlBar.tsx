'use client';

import { SessionStatus } from '@/lib/types';

const INTERVAL_OPTIONS = [4, 6, 8, 12, 16];

interface Props {
  status: SessionStatus;
  currentSlideIndex: number;
  slideCount: number;
  busy: boolean;
  autoplayEnabled: boolean;
  autoplayIntervalSeconds: number;
  onStart: () => Promise<void>;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  onEnd: () => Promise<void>;
  onPrev: () => Promise<void>;
  onNext: () => Promise<void>;
  onGoto: (index: number) => Promise<void>;
  onAutoplayToggle: (enabled: boolean) => Promise<void>;
  onAutoplayIntervalChange: (seconds: number) => Promise<void>;
}

export function ControlBar(props: Props) {
  const {
    status,
    currentSlideIndex,
    slideCount,
    busy,
    autoplayEnabled,
    autoplayIntervalSeconds,
    onStart,
    onPause,
    onResume,
    onEnd,
    onPrev,
    onNext,
    onGoto,
    onAutoplayToggle,
    onAutoplayIntervalChange,
  } = props;

  return (
    <div className="card" style={{ marginTop: 20, padding: 16, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <ActionButton disabled={busy || status !== 'idle'} onClick={onStart}>Start</ActionButton>
        <ActionButton disabled={busy || status !== 'presenting'} onClick={onPause}>Pause</ActionButton>
        <ActionButton disabled={busy || (status !== 'paused' && status !== 'answering')} onClick={onResume}>Resume</ActionButton>
        <ActionButton disabled={busy || status === 'ended'} onClick={onEnd}>End</ActionButton>
        <ActionButton disabled={busy || status === 'ended' || currentSlideIndex === 0} onClick={onPrev}>Previous</ActionButton>
        <ActionButton disabled={busy || status === 'ended' || currentSlideIndex >= slideCount - 1} onClick={onNext}>Next</ActionButton>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--muted)' }}>
            Slide {currentSlideIndex + 1} / {slideCount}
          </span>
          <span style={{ color: autoplayEnabled ? '#86efac' : 'var(--muted)', fontSize: 13 }}>
            {autoplayEnabled ? `Presenter mode on · ${autoplayIntervalSeconds}s` : 'Presenter mode off'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ color: 'var(--muted)', fontSize: 13 }}>
            Pace
            <select
              value={autoplayIntervalSeconds}
              disabled={busy}
              onChange={(event) => void onAutoplayIntervalChange(Number(event.target.value))}
              style={{
                marginLeft: 8,
                borderRadius: 10,
                border: '1px solid rgba(15,23,42,0.12)',
                background: '#ffffff',
                color: 'var(--text)',
                padding: '8px 10px',
              }}
            >
              {INTERVAL_OPTIONS.map((seconds) => (
                <option key={seconds} value={seconds}>
                  {seconds}s / slide
                </option>
              ))}
            </select>
          </label>
          <ActionButton
            disabled={busy || status === 'ended' || (status === 'idle' && autoplayEnabled)}
            onClick={() => onAutoplayToggle(!autoplayEnabled)}
          >
            {autoplayEnabled ? 'Stop presenter mode' : 'Start presenter mode'}
          </ActionButton>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {Array.from({ length: slideCount }).map((_, index) => (
          <button
            key={index}
            onClick={() => void onGoto(index)}
            disabled={busy || status === 'ended'}
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: index === currentSlideIndex ? 'none' : '1px solid rgba(15,23,42,0.12)',
              background: index === currentSlideIndex ? 'linear-gradient(135deg, #2563eb, #0ea5e9)' : '#ffffff',
              color: index === currentSlideIndex ? '#ffffff' : 'var(--text)',
              fontWeight: 700,
            }}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActionButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => Promise<void> }) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={disabled}
      style={{
        borderRadius: 12,
        padding: '10px 16px',
        border: '1px solid rgba(15,23,42,0.12)',
        background: disabled ? 'rgba(148,163,184,0.14)' : '#ffffff',
        color: disabled ? 'var(--muted)' : 'var(--text)',
      }}
    >
      {children}
    </button>
  );
}
