/**
 * PlainBackground — flat neutral base for the secondary screens (About /
 * Archive / Install / Game Session setup). Single element, no decoration.
 *
 * Purely decorative: aria-hidden + pointer-events-none.
 */
export default function PlainBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-page-bg"
    />
  );
}
