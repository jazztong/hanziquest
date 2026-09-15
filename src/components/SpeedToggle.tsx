'use client';

import { useEffect, useState } from 'react';
import { cycleSpeechSpeed, speechSpeed } from '@/lib/voices';

/**
 * Cycles how fast lines are read.
 *
 * Sits next to the sound toggle because it answers the same question - "I can't
 * follow this" - and a learner who cannot keep up needs it within reach of the
 * question itself, not buried in a settings screen he will never open.
 *
 * Read in an effect rather than during render: the preference lives in
 * localStorage, which does not exist on the server.
 */
export default function SpeedToggle({ className = '' }: { className?: string }) {
  const [speed, setSpeed] = useState(() => ({ label: '慢', en: 'Steady' }));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = speechSpeed();
    setSpeed({ label: s.label, en: s.en });
    setReady(true);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const next = cycleSpeechSpeed();
        setSpeed({ label: next.label, en: next.en });
      }}
      aria-label={`Reading speed: ${speed.en}. Tap to change.`}
      title={`Reading speed: ${speed.en}`}
      className={`btn btn-ghost shrink-0 ${className}`}
      style={{ opacity: ready ? 1 : 0.5, minHeight: 44, padding: '0 0.6rem' }}
    >
      <span className="zh text-xs">{speed.label}</span>
    </button>
  );
}
