This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## What else the IR site still needs

See [`SITE_REQUIREMENTS.md`](SITE_REQUIREMENTS.md) for the full list of inner pages, legal pages, system pages, and non-functional requirements (CMS, accessibility, SEO, security). IR-specific items are marked ⭐. The top five priorities are program detail pages, how to apply, forms & downloads, privacy policy, and a CMS.

## Changing the brand color

Outside the hero, the site uses a cobalt + white system defined in [`styles/tokens.css`](styles/tokens.css).

1. Edit the `--cobalt-*` scale (brand = `--cobalt-700`, default `#002A9A`) and `--white`.
2. Semantic tokens (`--bg`, `--heading`, `--text`, `--line`, `--accent`, …) are set by `.surface-light` / `.surface-blue` and remap automatically.
3. Save. Components use utilities like `bg-bg`, `text-heading`, `text-fg`, `border-line`, `bg-accent` via `@theme` in `src/app/globals.css` — no per-component hex edits.

The hero (`#hero` / Skiper39 / Navbar / HeroExtras) is intentionally excluded and keeps its original cream/ink look, with a 120px gradient blending into the first cobalt section.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
