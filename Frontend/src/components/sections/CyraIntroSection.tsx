import cyraImg from "../../assets/cyra-front.png";
import { Link } from "react-router-dom";

export default function CyRaIntroSection() {
  return (
    <section className="relative bg-white pt-24 pb-6">
      {/* TOP TRANSITION: Geometric Trapezoid */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] z-10">
        <svg
          className="relative block w-full h-[60px] md:h-[100px]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M1200,0 L0,0 L0,20 L300,20 L350,100 L850,100 L900,20 L1200,20 Z"
            className="fill-white"
          ></path>
        </svg>
      </div>

      {/* ====== CONTENT WRAPPER ====== */}
      <div className="max-w-7xl mx-auto px-10 flex justify-between gap-12 items-start">
        {/* LEFT TEXT */}
        <div className="flex-1">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            Meet <span className="text-black">CyRa</span> — the sovereign
            intelligence behind CyberRakshak.
          </h2>

          <p className="text-gray-600 mt-4 text-base">
            Built to predict threats. Engineered to outpace them.
          </p>

          <p className="text-gray-600 mt-6 leading-relaxed text-[15px]">
            CyRa is the autonomous AI sentinel powering the CyberRakshak
            platform. The name itself comes from its origin — CyRa =
            <strong> CyberRakshak</strong>. 
            Developed with sovereign AI architecture, CyRa continuously
            monitors your entire attack surface, anticipates threats, and 
            orchestrates automated defense across every integrated scanner.
          </p>

          <Link
            to="/assistant"
            className="inline-block mt-8 px-6 py-3 bg-black text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition"
          >
            Discover CyRa
          </Link>
        </div>

        {/* RIGHT IMAGE */}
        <div className="flex-shrink-0">
          <img
            src={cyraImg}
            alt="CyRa AI Sentinel"
            className="w-[420px] rounded-xl shadow-xl object-cover"
          />
        </div>
      </div>
    </section>
  );
}
