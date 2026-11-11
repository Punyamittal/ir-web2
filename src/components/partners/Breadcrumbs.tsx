"use client";

type Crumb = { label: string; onClick?: () => void };

type BreadcrumbsProps = {
  crumbs: Crumb[];
  onBackGlobe: () => void;
  showZoom?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
};

export default function Breadcrumbs({
  crumbs,
  onBackGlobe,
  showZoom,
  onZoomIn,
  onZoomOut,
}: BreadcrumbsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav
        aria-label="Map location"
        className="flex flex-wrap items-center gap-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-fg-muted"
      >
        {crumbs.map((c, i) => (
          <span key={c.label + i} className="flex items-center gap-1">
            {i > 0 && <span className="text-fg-muted">/</span>}
            {c.onClick ? (
              <button
                type="button"
                onClick={c.onClick}
                className="text-heading ink-underline"
              >
                {c.label}
              </button>
            ) : (
              <span className="text-accent">{c.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {showZoom && (
          <>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={onZoomIn}
              className="flex size-8 items-center justify-center border border-line-strong text-sm text-heading hover:bg-accent hover:text-on-accent"
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={onZoomOut}
              className="flex size-8 items-center justify-center border border-line-strong text-sm text-heading hover:bg-accent hover:text-on-accent"
            >
              −
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onBackGlobe}
          className="border border-line-strong px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-heading hover:bg-accent hover:text-on-accent"
        >
          Back to globe
        </button>
      </div>
    </div>
  );
}
