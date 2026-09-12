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
      className={`btn btn-ghost shrink-0 ${className}`}
      // 44x44 rather than the text-button padding: this is a bare emoji, so
      // without an explicit size it collapsed to about 28px - too small to hit.
      style={{ opacity: ready ? 1 : 0.5, minWidth: 44, width: 44, padding: 0 }}
    >
      <span aria-hidden>{on ? '🔔' : '🔕'}</span>
    </button>
  );
}
