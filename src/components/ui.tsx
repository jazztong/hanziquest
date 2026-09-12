'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

/**
 * Shared UI primitives.
 *
 * These exist because the same four or five shapes were re-typed on every
 * screen - a stat tile in three places, a page header with a back button in
 * five, a progress bar in six - and they had already drifted apart. A stat tile
 * on the hub used different type sizes from the identical one on the parent
 * dashboard.
 *
 * Mobile-first is enforced here rather than remembered per page:
 *  - `Screen` owns the side gutter and the safe-area inset, so no page sets its
 *    own horizontal padding and no page forgets the iPhone notch.
 *  - Touch targets are at least 44px, which is the smallest reliably tappable
 *    size; several buttons were under 30px.
 *  - Nothing has a min-width wider than a 320px screen.
 */

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export type ScreenWidth = 'narrow' | 'default' | 'wide';

const WIDTH: Record<ScreenWidth, string> = {
  narrow: 'max-w-lg',
  default: 'max-w-2xl',
  wide: 'max-w-4xl',
};

/**
 * The page frame.
 *
 * Owns the side gutter (16px minimum at every width) and the bottom safe-area
 * inset. `pb-24` leaves room for a thumb and for iOS home-indicator overlap.
 */
export function Screen({
  children,
  width = 'default',
  className = '',
}: {
  children: React.ReactNode;
  width?: ScreenWidth;
  className?: string;
}) {
  return (
    <main
      // px-4 and pb-24 are deliberately not set as classes: the inline styles
      // below override them anyway, so carrying both left two sources of truth
      // for the same gutter, and they had already drifted.
      className={`min-h-dvh pt-4 mx-auto w-full ${WIDTH[width]} ${className}`}
      style={{
        paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      {children}
    </main>
  );
}

/** Centred single-message screen: loading, empty, error. */
export function Centred({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh grid place-items-center px-6 text-center">
      <div className="max-w-sm w-full">{children}</div>
    </main>
  );
}

/**
 * Page header with a back affordance.
 *
 * `back` is a route rather than history.back(): landing here from a link should
 * still take you somewhere sensible rather than out of the app.
 */
export function PageHeader({
  back,
  title,
  subtitle,
  right,
}: {
  back?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 mb-4 min-w-0">
      {back && (
        <Link
          href={back}
          aria-label="Back"
          className="btn btn-ghost shrink-0 grid place-items-center"
          style={{ minWidth: 44, minHeight: 44, padding: 0 }}
        >
          <span aria-hidden>←</span>
        </Link>
      )}
      {(title || subtitle) && (
        <div className="min-w-0 flex-1">
          {/* Truncated, but carrying the full text in a title attribute: a long
              chapter name is clipped on a phone and was otherwise unrecoverable. */}
          {title && (
            <div
              className="text-sm font-semibold truncate"
              title={typeof title === 'string' ? title : undefined}
            >
              {title}
            </div>
          )}
          {subtitle && (
            <div
              className="text-[11px] text-[var(--color-slate)] truncate"
              title={typeof subtitle === 'string' ? subtitle : undefined}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </header>
  );
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Card({
  children,
  className = '',
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section';
}) {
  const Tag = as;
  return <Tag className={`surface p-4 sm:p-5 ${className}`}>{children}</Tag>;
}

export function Section({
  title,
  sub,
  children,
  className = '',
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface p-4 sm:p-5 mb-4 ${className}`}>
      <h2 className="font-bold">{title}</h2>
      {sub && <p className="text-xs text-[var(--color-slate-soft)] mt-0.5">{sub}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * Animated panel for a step in a flow.
 *
 * Every multi-step screen had its own copy of these transition values, and they
 * had drifted to three different durations.
 */
export function Panel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Data display
// ---------------------------------------------------------------------------

/**
 * A single number with a label.
 *
 * `value` is deliberately `ReactNode`: several callers pass an em-dash for
 * "not measured yet", which is different from zero and must not render as 0.
 */
export function Stat({
  value,
  label,
  sub,
  className = '',
}: {
  value: React.ReactNode;
  label: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={`surface p-3 text-center ${className}`}>
      <div className="text-xl sm:text-2xl font-bold text-[var(--color-jade-bright)] tabular-nums">
        {value}
      </div>
      <div className="text-[11px] text-[var(--color-paper-dim)] mt-0.5 leading-tight">{label}</div>
      {sub && <div className="text-[10px] text-[var(--color-slate)] leading-tight">{sub}</div>}
    </div>
  );
}

export function Progress({
  value,
  max = 100,
  className = '',
  tone,
}: {
  value: number;
  max?: number;
  className?: string;
  /** Override the fill, e.g. to go red as a clock runs out. */
  tone?: string;
}) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={`progress ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <i style={{ width: `${pct}%`, ...(tone ? { background: tone } : null) }} />
    </div>
  );
}

export function Pill({
  children,
  tone,
  className = '',
}: {
  children: React.ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span className={`pill ${className}`} style={tone ? { color: tone } : undefined}>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

export function Loading({ what = 'Loading…' }: { what?: string }) {
  return (
    <Centred>
      <p className="text-[var(--color-slate-soft)]">{what}</p>
    </Centred>
  );
}

/**
 * Error state with a recovery route.
 *
 * Always offers an action. Five screens previously rendered a dead end when an
 * API call failed, which reads as the app being broken rather than the session
 * having expired.
 */
export function ErrorState({
  message,
  hint,
  action,
  /**
   * Show the Map link alongside the action. Turn it off when the action already
   * goes to the map - lesson/[id] rendered "Back to the map" next to "Map", two
   * buttons to the same place, which reads as a broken screen, not a recovery.
   */
  map = true,
}: {
  message: string;
  hint?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  map?: boolean;
}) {
  return (
    <Centred>
      <p className="text-[var(--color-cinnabar)] font-semibold">{message}</p>
      {hint && (
        <p className="text-sm text-[var(--color-slate-soft)] mt-2 leading-relaxed">{hint}</p>
      )}
      <div className="flex gap-2 mt-6">
        {(map || !action) && (
          <Link href="/play" className="btn btn-ghost flex-1">
            Map
          </Link>
        )}
        {action &&
          (action.href ? (
            <Link href={action.href} className="btn btn-primary flex-1">
              {action.label}
            </Link>
          ) : (
            <button className="btn btn-primary flex-1" onClick={action.onClick}>
              {action.label}
            </button>
          ))}
      </div>
    </Centred>
  );
}

/**
 * Option list for multiple-choice answers.
 *
 * One column on a phone, always. A two-column grid looked tidier but truncated
 * the longer English glosses, and a truncated option cannot be answered.
 */
export function OptionList({
  children,
  columns = 1,
}: {
  children: React.ReactNode;
  columns?: 1 | 2;
}) {
  return (
    <div className={`grid gap-2 ${columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
      {children}
    </div>
  );
}
