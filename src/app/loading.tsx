import EarthLoader from "@/components/ui/EarthLoader";

/** Matches PageLoader chrome so the RSC → client handoff doesn’t flash. */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white">
      <EarthLoader label="International Relations · VIT Chennai" />
      <p className="mt-6 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.22em] text-cobalt-700/65">
        Loading…
      </p>
      <div
        className="absolute bottom-10 left-1/2 h-[2px] w-40 -translate-x-1/2 overflow-hidden rounded-full bg-cobalt-100"
        aria-hidden
      >
        <div className="h-full w-1/3 rounded-full bg-cobalt-700" />
      </div>
    </div>
  );
}
