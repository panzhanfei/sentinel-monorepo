import { NavBar, HeroSection, FeaturesSection } from "@/app/src/components";

const LandingPage = () => {
  const text =
    "© 2026 Sentinel Protocol. Disclaimer: Digital assets involve significant risk. Sentinel's AI-driven audits are supplementary tools and do not guarantee 100% security. Use at your own risk.";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30 font-sans">
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div>
            <div className="mb-4 font-black text-2xl tracking-tighter text-indigo-500">
              SENTINEL
            </div>
            <p className="text-slate-500 text-sm">{text}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage
