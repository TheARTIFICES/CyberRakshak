import cyraImg from "@/assets/cyra-front.png"; // correct import for Vite projects

export default function CyraIntro() {
  return (
    <section className="relative w-full bg-white pt-10 pb-32">
      <div className="container mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

        {/* LEFT TEXT */}
        <div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Meet CyRa — the sovereign intelligence behind CyberRakshak.
          </h2>

          <p className="text-lg text-gray-700 mb-4">
            Built to predict threats. Engineered to outpace them.
          </p>

          <p className="text-gray-600 leading-relaxed text-[15px]">
            CyRa is the autonomous AI sentinel powering the CyberRakshak platform.  
            The name itself comes from its origin — <strong>CyRa = CyberRakshak</strong>.  
            Developed with sovereign AI architecture, CyRa continuously monitors your  
            entire attack surface, anticipates threats, and orchestrates automated  
            defense across every integrated scanner.
          </p>

          <button className="mt-8 px-6 py-3 bg-black rounded-full text-white hover:bg-gray-900">
            Discover CyRa
          </button>
        </div>

        {/* RIGHT STATIC IMAGE */}
        <div className="flex justify-center">
          <img
            src={cyraImg}
            alt="CyRa Sentinel"
            className="w-[420px] drop-shadow-2xl rounded-xl"
          />
        </div>

      </div>
    </section>
  );
}

