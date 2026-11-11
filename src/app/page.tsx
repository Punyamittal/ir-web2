import { Footer } from "@/components/footer";
import {
  About,
  EventsDeadlines,
  FAQ,
  ImpactStrip,
  ScrollProgress,
  StudentStories,
} from "@/components/home";
import HeroExtras from "@/components/home/HeroExtras";
import MarqueeRibbon from "@/components/home/MarqueeRibbon";
import PartnerExplorerLazy from "@/components/partners/PartnerExplorerLazy";
import Navbar from "@/components/navbar";
import PageLoader from "@/components/ui/PageLoader";
import SectionSkeleton from "@/components/ui/SectionSkeleton";
import Skiper39 from "@/components/ui/skiper39";
import dynamic from "next/dynamic";

const Programs = dynamic(() => import("@/components/home/Programs"), {
  loading: () => (
    <SectionSkeleton id="programs" label="Loading programs" className="min-h-[900px]" />
  ),
});

const StudentJourney = dynamic(
  () => import("@/components/home/StudentJourney"),
  {
    loading: () => (
      <SectionSkeleton id="journey" label="Loading journey" className="min-h-[640px]" />
    ),
  },
);

export default function Home() {
  return (
    <>
      {/* Outside <main> — splash CSS veils main, so the loader must not live inside it */}
      <PageLoader />
      <main className="bg-white">
        <ScrollProgress />

        {/* Hero — do not recolor */}
        {/* svh: stable on phones (100vh grows/shrinks with the address bar and makes the hero jump) */}
        <div id="hero" className="relative h-screen w-full supports-[height:100svh]:h-svh">
          <Navbar />
          <Skiper39 />
          <HeroExtras />
        </div>

        <ImpactStrip />
        <MarqueeRibbon />
        <About />

        <PartnerExplorerLazy />

        <Programs />
        <StudentJourney />
        <StudentStories />
        <EventsDeadlines />
        <FAQ />

        <Footer />
      </main>
    </>
  );
}
