// Shown instead of the page when a phone is held upright: the Library is filmed widescreen.
export default function RotatePrompt({ className = "" }: { className?: string }) {
  return (
    <div className={`rotate ${className}`} role="status">
      <div className="rotate-phone" aria-hidden="true"><span /></div>
      <div className="rotate-title">Turn your phone sideways</div>
      <div className="rotate-sub">The Library of Doors is filmed in widescreen.</div>
      <div className="rotate-hint">Not turning? Switch off rotation lock in your quick settings.</div>
    </div>
  );
}
