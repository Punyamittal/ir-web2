"use client";

import dynamic from "next/dynamic";

const ThemePanel = dynamic(() => import("./ThemePanel"), { ssr: false });

/** Client-only gate so production never mounts the theme lab. */
export default function DevThemePanel() {
  if (process.env.NODE_ENV !== "development") return null;
  return <ThemePanel />;
}
