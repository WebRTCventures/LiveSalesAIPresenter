'use client';

import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, type RemoteTrack } from 'livekit-client';
import { startHeyGenAvatarSession } from '@/lib/api';

interface HeyGenAvatarPanelProps {
  sessionId: string;
  talkTrack: string;
  speaking: boolean;
}

type AvatarStatus = 'idle' | 'starting' | 'ready' | 'speaking' | 'error';

export function HeyGenAvatarPanel({ sessionId, talkTrack, speaking }: HeyGenAvatarPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const roomRef = useRef<Room | null>(null);
  const [status, setStatus] = useState<AvatarStatus>('idle');
  const [error, setError] = useState('');
  const [micEnabled, setMicEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function attachRemoteTrack(track: RemoteTrack) {
      if (track.kind === Track.Kind.Video && videoRef.current) {
        track.attach(videoRef.current);
        void videoRef.current.play().catch(() => undefined);
        setStatus('ready');
      }

      if (track.kind === Track.Kind.Audio && audioRef.current) {
        track.attach(audioRef.current);
        void audioRef.current.play().catch(() => undefined);
      }
    }

    async function startAvatarTransport() {
      setStatus('starting');
      setError('');
      setMicEnabled(false);

      try {
        const response = await startHeyGenAvatarSession(sessionId);
        const join = response.heygen;
        if (!join?.livekit_url || !join?.access_token) {
          throw new Error(response.nextStep || 'Pipecat HeyGen transport is still starting.');
        }
        if (cancelled) return;

        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        room.on(RoomEvent.TrackSubscribed, (track) => attachRemoteTrack(track));
        room.on(RoomEvent.Disconnected, () => {
          setStatus('idle');
          setMicEnabled(false);
        });

        await room.connect(join.livekit_url, join.access_token);

        // HeyGenTransport receives user speech from this same HeyGen-provided
        // LiveKit room. Without publishing the browser mic, the avatar can be
        // visible but the Pipecat pipeline has no user audio to process.
        await room.localParticipant.setMicrophoneEnabled(true);
        if (!cancelled) {
          setMicEnabled(true);
          setStatus('ready');
        }
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Pipecat HeyGen avatar failed to start');
      }
    }

    void startAvatarTransport();

    return () => {
      cancelled = true;
      setMicEnabled(false);
      const room = roomRef.current;
      roomRef.current = null;
      room?.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    if (status === 'ready' && speaking) setStatus('speaking');
    if (status === 'speaking' && !speaking) setStatus('ready');
  }, [speaking, status]);

  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="card" style={{ padding: 20 }}>
      <h3 style={{ marginTop: 0 }}>Video avatar presenter</h3>
      <div
        style={{
          aspectRatio: '4 / 5',
          borderRadius: 18,
          background: 'linear-gradient(180deg, #020617, #0f172a)',
          border: '1px solid rgba(15,23,42,0.08)',
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#020617' }}
        />
        <audio ref={audioRef} autoPlay />
        {status !== 'ready' && status !== 'speaking' ? (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24, color: '#e2e8f0' }}>
            <div>
              <strong>{status === 'starting' ? 'Starting Pipecat HeyGen avatar…' : 'Pipecat HeyGen avatar'}</strong>
              <p style={{ margin: '8px 0 0', color: '#94a3b8', lineHeight: 1.5 }}>
                {error || 'Waiting for avatar video, audio, and microphone transport.'}
              </p>
            </div>
          </div>
        ) : null}
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            padding: '6px 10px',
            borderRadius: 999,
            background: status === 'speaking' ? 'rgba(37,99,235,0.84)' : 'rgba(15,23,42,0.68)',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {statusLabel} · Mic {micEnabled ? 'on' : 'off'}
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <p style={{ marginBottom: 6, color: 'var(--muted)' }}>Current talk track</p>
        <p style={{ margin: 0, lineHeight: 1.5 }}>{talkTrack}</p>
      </div>
    </div>
  );
}
