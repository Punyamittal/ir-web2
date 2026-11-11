import type { Config } from "tailwindcss";

/**
 * Colors are defined as CSS variables in `styles/tokens.css` and mapped in
 * `src/app/globals.css` `@theme`. Components should use semantic utilities:
 * bg-bg, text-heading, text-fg, text-fg-muted, border-line, bg-accent, etc.
 */
const config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "var(--white)",
        cobalt: {
          25: "var(--cobalt-25)",
          50: "var(--cobalt-50)",
          100: "var(--cobalt-100)",
          200: "var(--cobalt-200)",
          300: "var(--cobalt-300)",
          400: "var(--cobalt-400)",
          500: "var(--cobalt-500)",
          600: "var(--cobalt-600)",
          700: "var(--cobalt-700)",
          800: "var(--cobalt-800)",
          900: "var(--cobalt-900)",
          950: "var(--cobalt-950)",
        },
        bg: { DEFAULT: "var(--bg)", alt: "var(--bg-alt)" },
        card: { DEFAULT: "var(--card)", alt: "var(--card-alt)" },
        heading: "var(--heading)",
        fg: { DEFAULT: "var(--text)", muted: "var(--muted)" },
        line: { DEFAULT: "var(--line)", strong: "var(--line-strong)" },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
        },
        "on-accent": "var(--on-accent)",
        illustration: "var(--illustration)",
        "focus-ring": "var(--focus-ring)",
      },
    },
  },
} satisfies Config;

export default config;
