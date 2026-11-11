"use client";

import SectionSkeleton from "@/components/ui/SectionSkeleton";
import dynamic from "next/dynamic";

const PartnerExplorer = dynamic(
  () => import("./PartnerExplorer").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <SectionSkeleton
        id="partners"
        label="Connecting partner map"
        tone="blue"
        className="min-h-[1100px] lg:min-h-[960px]"
      />
    ),
  },
);

export default function PartnerExplorerLazy() {
  return <PartnerExplorer />;
}
