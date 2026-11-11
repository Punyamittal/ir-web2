/** Calm below-fold placeholder — avoids stacking more earth loaders after splash. */
export default function SectionSkeleton({
  label = "Loading",
  tone = "light",
  id,
  className = "min-h-[280px]",
}: {
  label?: string;
  tone?: "light" | "blue";
  /** Keep the real section's anchor so #links work before the chunk arrives */
  id?: string;
  /** Reserve roughly the real section's height so the page doesn't jump when it loads */
  className?: string;
}) {
  const surface = tone === "blue" ? "surface-blue" : "bg-white";
  const bar = tone === "blue" ? "bg-white/20" : "bg-cobalt-100";

  return (
    <section
      id={id}
      className={`${surface} flex flex-col items-center justify-center gap-4 px-6 py-16 ${className}`}
      aria-busy
      aria-label={label}
    >
      <div className={`h-2 w-28 animate-pulse rounded-full ${bar}`} />
      <div className={`h-2 w-44 animate-pulse rounded-full ${bar} opacity-70`} />
      <div className={`h-2 w-36 animate-pulse rounded-full ${bar} opacity-40`} />
    </section>
  );
}
