/** Hand-drawn horizon under the hero crowd */
export default function HeroExtras() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-[38%] z-[6] h-8 w-full text-ink/40"
      preserveAspectRatio="none"
      viewBox="0 0 1200 40"
    >
      <path
        d="M0 22 C 120 18, 200 26, 320 20 S 520 14, 640 22 S 860 28, 1000 18 S 1120 24, 1200 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
