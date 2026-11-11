import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

/** Shared ink strokes for the jet doodle (hero + journey path). */
export function DoodlePlaneGlyph(
  props: SVGProps<SVGGElement> & { trail?: boolean },
) {
  const { trail = true, ...rest } = props;
  return (
    <g fill="none" aria-hidden {...rest}>
      <path
        d="M8 22.5 C18 21, 34 19.5, 52 18.5 L78 16.2 C82 15.8, 86 16.5, 88 18.5 C86.5 20.2, 82 20.8, 78 20.5 L54 22.8 C36 24.2, 20 24.5, 10 24.2 Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M88 18.5 C90 18.2, 92 17.8, 93.5 18.6 C92.2 19.8, 90 20.2, 88 20.2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M62 17.2 C66 15.4, 72 15.2, 76 16.4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M48 20 L38 8.5 C37.2 7.4, 38.4 6.8, 39.6 7.2 L58 16.8"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M50 22.5 L42 33 C41.4 34, 42.6 34.5, 43.6 33.9 L60 23.2"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M14 22 L10 12.5 C9.5 11.4, 10.8 10.9, 11.8 11.6 L22 20.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M16 23.5 L12 28.5 M16 23.5 L20 28"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M55 21.5 C57 23.2, 61 23.4, 64 22.2"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      {trail ? (
        <path
          d="M6 22 C3 21.2, 2 20, 1 18.5 M5 24.5 C2.5 25, 1.5 26, 1 27.5"
          stroke="currentColor"
          strokeWidth="1.05"
          strokeLinecap="round"
          opacity="0.55"
        />
      ) : null}
    </g>
  );
}

/** Hand-ink jet — readable as a plane, still a fountain-pen doodle */
export function DoodlePlane(props: Props) {
  return (
    <svg viewBox="0 0 96 40" fill="none" aria-hidden {...props}>
      <DoodlePlaneGlyph />
    </svg>
  );
}

export function DoodlePlus({ open, ...props }: Props & { open?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d={open ? "M6 6l12 12M18 6L6 18" : "M12 5v14M5 12h14"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{
          transform: open ? "rotate(0deg)" : undefined,
          transformOrigin: "center",
        }}
      />
    </svg>
  );
}

/** Open-Peeps-inspired ink bust (simple, reusable) */
export function InkBust({ seed = 0, ...props }: Props & { seed?: number }) {
  const hair = seed % 3;
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden {...props}>
      <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="1.2" />
      {/* head */}
      <ellipse cx="40" cy="36" rx="14" ry="16" stroke="currentColor" strokeWidth="1.3" />
      {hair === 0 && (
        <path d="M26 32c4-10 24-10 28 0" stroke="currentColor" strokeWidth="1.4" />
      )}
      {hair === 1 && (
        <path
          d="M27 30c2-8 10-12 13-12s11 4 13 12"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      )}
      {hair === 2 && (
        <path d="M28 34c3-9 21-9 24 0M30 28h20" stroke="currentColor" strokeWidth="1.3" />
      )}
      <circle cx="34" cy="36" r="1.2" fill="currentColor" />
      <circle cx="46" cy="36" r="1.2" fill="currentColor" />
      <path d="M36 44c2 2 6 2 8 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      {/* shoulders */}
      <path
        d="M18 72c6-14 14-18 22-18s16 4 22 18"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function DoodleBarcode(props: Props) {
  return (
    <svg viewBox="0 0 48 32" fill="currentColor" aria-hidden {...props}>
      {[2, 5, 7, 10, 12, 15, 18, 20, 23, 26, 28, 31, 34, 37, 40, 43].map((x, i) => (
        <rect key={x} x={x} y="4" width={i % 3 === 0 ? 2.2 : 1.1} height="24" />
      ))}
    </svg>
  );
}

export function ScribbleCircle(props: Props) {
  return (
    <svg viewBox="0 0 120 80" fill="none" aria-hidden {...props}>
      <path
        d="M12 42c4-22 30-34 56-30s44 22 40 44-34 28-58 24S8 58 12 42z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        pathLength={1}
      />
    </svg>
  );
}
