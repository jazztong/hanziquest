'use client';

import { useEffect, useState } from 'react';
import { isSoundOn, toggleSound } from '@/lib/sfx';

/**
 * Mute toggle.
 *
 * Rendered from state set in an effect rather than read during render: the
 * preference lives in localStorage, which does not exist on the server, and
 * reading it during render would make the server and client markup disagree.
 */
export default function SoundToggle({ className = '' }: { className?: string }) {
  const [on, setOn] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOn(isSoundOn());
    setReady(true);
  }, []);

  return (
    <button
      type="button"
      aria-label={on ? 'Turn sound off' : 'Turn sound on'}
      aria-pressed={on}
      title={on ? 'Sound on' : 'Sound off'}
      onClick={() => setOn(toggleSound())}
      className={`btn btn-ghost px-2.5 py-1 text-xs ${className}`}
      style={{ opacity: ready ? 1 : 0.5 }}
    >
      <span aria-hidden>{on ? '🔔' : '🔕'}</span>
    </button>
  );
}
