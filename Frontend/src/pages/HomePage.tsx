import HeroSection from "../components/hero/HeroSection";
import CyraIntroSection from "../components/sections/CyraIntroSection";
import PlatformSection from "../components/sections/PlatformSection";
import IntelligenceSection from "../components/sections/IntelligenceSection";
import SovereigntySection from "../components/sections/SovereigntySection";

export default function HomePage() {
  return (
    <div className="w-full bg-black text-white">
      <section id="home">
        <HeroSection />
      </section>
      <section id="cyra">
        <CyraIntroSection />
      </section>
      <section id="platform">
        <PlatformSection />
      </section>
      <section id="intelligence">
        <IntelligenceSection />
      </section>
      <section id="sovereignty">
        <SovereigntySection />
      </section>
    </div>
  );
}
