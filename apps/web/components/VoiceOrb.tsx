'use client';

export function VoiceOrb({ level = 0, active = false }: { level?: number; active?: boolean }) {
  const normalized = Math.max(0, Math.min(1, level));
  const scale = 1 + normalized * 0.18;
  const glow = 0.18 + normalized * 0.72;
  const ring = 52 + normalized * 28;
  const wobble = active ? 'voice-orb-float 4.8s ease-in-out infinite' : 'voice-orb-breathe 5.5s ease-in-out infinite';

  return (
    <div className="voice-orb-shell" aria-label="Audio-only voice presenter visualization">
      <div className="voice-orb-backdrop" />
      <div
        className="voice-orb-halo voice-orb-halo-one"
        style={{ transform: `scale(${1.05 + normalized * 0.25})`, opacity: glow }}
      />
      <div
        className="voice-orb-halo voice-orb-halo-two"
        style={{ transform: `scale(${1.18 + normalized * 0.42})`, opacity: 0.16 + normalized * 0.28 }}
      />
      <div
        className="voice-orb-core"
        style={{ transform: `scale(${scale})`, animation: wobble, boxShadow: `0 0 ${ring}px rgba(37, 99, 235, ${0.28 + normalized * 0.35})` }}
      >
        <div className="voice-orb-shine" />
        <div className="voice-orb-liquid" style={{ transform: `translateY(${18 - normalized * 24}px) rotate(${normalized * 8}deg)` }} />
        <div className="voice-orb-pulse" style={{ opacity: 0.16 + normalized * 0.5 }} />
      </div>
      <div className="voice-orb-caption">
        <strong>{active ? 'Audio flowing' : 'Audio-only presenter'}</strong>
        <span>{active ? 'Pipecat voice stream' : 'Waiting for voice stream'}</span>
      </div>

      <style jsx>{`
        .voice-orb-shell {
          position: relative;
          min-height: 260px;
          width: 100%;
          display: grid;
          place-items: center;
          isolation: isolate;
          overflow: hidden;
          border-radius: 16px;
          background:
            radial-gradient(circle at 28% 24%, rgba(125, 211, 252, 0.34), transparent 30%),
            radial-gradient(circle at 72% 76%, rgba(99, 102, 241, 0.24), transparent 34%),
            linear-gradient(145deg, rgba(255,255,255,0.86), rgba(239,246,255,0.72));
        }
        .voice-orb-backdrop {
          position: absolute;
          inset: 18px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(59,130,246,0.12), transparent 65%);
          filter: blur(10px);
          animation: voice-orb-spin 18s linear infinite;
        }
        .voice-orb-halo {
          position: absolute;
          width: 185px;
          height: 185px;
          border-radius: 999px;
          border: 1px solid rgba(59, 130, 246, 0.28);
          transition: transform 120ms ease-out, opacity 120ms ease-out;
        }
        .voice-orb-halo-one { background: radial-gradient(circle, rgba(14,165,233,0.08), transparent 62%); }
        .voice-orb-halo-two { width: 225px; height: 225px; border-color: rgba(124,58,237,0.2); }
        .voice-orb-core {
          position: relative;
          width: 146px;
          height: 146px;
          border-radius: 999px;
          overflow: hidden;
          background:
            radial-gradient(circle at 32% 24%, rgba(255,255,255,0.98), rgba(219,234,254,0.6) 22%, transparent 38%),
            linear-gradient(145deg, #38bdf8 0%, #2563eb 48%, #7c3aed 100%);
          transition: transform 90ms ease-out, box-shadow 120ms ease-out;
          z-index: 1;
        }
        .voice-orb-shine {
          position: absolute;
          inset: 14px auto auto 22px;
          width: 58px;
          height: 38px;
          border-radius: 999px;
          background: rgba(255,255,255,0.58);
          filter: blur(6px);
          transform: rotate(-28deg);
        }
        .voice-orb-liquid {
          position: absolute;
          inset: 48% -18% -22% -18%;
          border-radius: 45% 55% 0 0;
          background: linear-gradient(90deg, rgba(14,165,233,0.7), rgba(168,85,247,0.74));
          filter: blur(1px);
          transition: transform 100ms ease-out;
          animation: voice-orb-wave 3.2s ease-in-out infinite;
        }
        .voice-orb-pulse {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle, transparent 42%, rgba(255,255,255,0.45) 72%, transparent 74%);
          animation: voice-orb-pulse 1.8s ease-in-out infinite;
        }
        .voice-orb-caption {
          position: absolute;
          bottom: 18px;
          display: grid;
          gap: 3px;
          text-align: center;
          color: #1e3a8a;
          font-size: 13px;
        }
        .voice-orb-caption span { color: var(--muted); font-size: 12px; }
        @keyframes voice-orb-float { 0%,100% { translate: 0 0; border-radius: 50% 48% 52% 50%; } 50% { translate: 0 -7px; border-radius: 47% 53% 48% 52%; } }
        @keyframes voice-orb-breathe { 0%,100% { scale: 0.98; } 50% { scale: 1.03; } }
        @keyframes voice-orb-wave { 0%,100% { border-radius: 46% 54% 0 0; } 50% { border-radius: 58% 42% 0 0; } }
        @keyframes voice-orb-pulse { 0%,100% { transform: scale(0.92); } 50% { transform: scale(1.08); } }
        @keyframes voice-orb-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
