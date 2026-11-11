type SectionHeadingProps = {
  eyebrow?: string;
  /** Plain string, or [before, italicEmphasis, after?] */
  heading: string | [string, string] | [string, string, string];
  /** italicize the second line/phrase */
  italicSecond?: boolean;
  align?: "left" | "center" | "offset";
  className?: string;
};

export default function SectionHeading({
  eyebrow,
  heading,
  italicSecond = true,
  align = "left",
  className = "",
}: SectionHeadingProps) {
  const alignCls =
    align === "center"
      ? "text-center mx-auto"
      : align === "offset"
        ? "ml-[8%] md:ml-[12%]"
        : "";

  const lines = Array.isArray(heading) ? heading : [heading];

  return (
    <div className={`${alignCls} ${className}`}>
      {eyebrow ? (
        <p className="mb-4 font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.2em] text-fg-muted">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="max-w-[18ch] font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,3.25rem)] font-medium leading-[1.02] tracking-[-0.01em] text-heading">
        {lines.length === 1 && <span className="block">{lines[0]}</span>}
        {lines.length === 2 && (
          <>
            <span className="block">{lines[0]}</span>
            <span className={`block ${italicSecond ? "italic" : ""}`}>
              {lines[1].replace(/\.$/, "")}
            </span>
          </>
        )}
        {lines.length === 3 && (
          <>
            <span className="block">
              {lines[0]}{" "}
              <em className="italic font-medium">{lines[1]}</em> {lines[2]}
            </span>
          </>
        )}
      </h2>
    </div>
  );
}
