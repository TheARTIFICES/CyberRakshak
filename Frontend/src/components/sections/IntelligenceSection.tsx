import React from 'react';

export default function IntelligenceSection() {
  return (
    <section className="w-full min-h-screen bg-slate-100 flex flex-col items-center justify-center py-20 relative overflow-hidden">
      {/* TOP TRANSITION: White Geometric Trapezoid */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] z-20">
        <svg
          className="relative block w-full h-[60px] md:h-[100px]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M1200,0 L0,0 L0,20 L300,20 L350,100 L850,100 L900,20 L1200,20 Z"
            className="fill-white"
          />
        </svg>
      </div>

      {/* Main Container */}
      <div className="relative z-20 w-full px-6 md:px-12 lg:px-24">
        {/* HEADER */}
        <div className="text-center mb-16 pt-16">
          <h2 className="text-6xl md:text-8xl font-extrabold tracking-widest text-slate-900 uppercase mb-6">
            INTELLIGENCE
          </h2>
          <p className="text-slate-600 text-center text-lg mt-6 max-w-3xl mx-auto">
            Turning raw signals into actionable intelligence — instantly.
          </p>
        </div>

        {/* THE HARDCODED LOOP - Perfect Symmetry */}
        <div className="relative w-full min-h-[70vh] flex items-center justify-center">
          <svg viewBox="0 0 1200 600" className="w-full max-w-7xl mx-auto h-auto opacity-100">
            <defs>
              <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </linearGradient>
              <filter id="glow-strong">
                <feGaussianBlur stdDeviation="10" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. THE INFINITY PATH (Perfect Symmetry) */}
            <path
              d="M600,300 C450,300 350,450 200,450 C50,450 50,150 200,150 C350,150 450,300 600,300 C750,300 850,150 1000,150 C1150,150 1150,450 1000,450 C850,450 750,300 600,300 Z"
              fill="none"
              stroke="url(#cyan-glow)"
              strokeWidth="4"
              filter="url(#glow-strong)"
              opacity="0.8"
            />

            {/* 2. THE CONNECTORS (Symmetric Lines) */}
            {/* Left Side */}
            <circle cx="200" cy="130" r="8" fill="#22d3ee" filter="url(#glow-strong)" />
            <line x1="200" y1="130" x2="50" y2="130" stroke="#22d3ee" strokeWidth="2" />
            <text x="40" y="125" fill="#22d3ee" fontSize="14" fontWeight="bold">LAWFUL INTERCEPTION</text>

            <circle cx="100" cy="230" r="8" fill="#22d3ee" filter="url(#glow-strong)" />
            <line x1="100" y1="230" x2="0" y2="230" stroke="#22d3ee" strokeWidth="2" />
            <text x="10" y="225" fill="#22d3ee" fontSize="14" fontWeight="bold">SIGINT SUPPORT</text>

            <circle cx="200" cy="470" r="8" fill="#22d3ee" filter="url(#glow-strong)" />
            <line x1="200" y1="470" x2="50" y2="470" stroke="#22d3ee" strokeWidth="2" />
            <text x="40" y="465" fill="#22d3ee" fontSize="14" fontWeight="bold">NATIONAL NDR</text>

            {/* Right Side (Mirrored) */}
            <circle cx="1000" cy="130" r="8" fill="#22d3ee" filter="url(#glow-strong)" />
            <line x1="1000" y1="130" x2="1150" y2="130" stroke="#22d3ee" strokeWidth="2" />
            <text x="1160" y="125" fill="#22d3ee" fontSize="14" fontWeight="bold" textAnchor="end">APT DEFENSE</text>

            <circle cx="1100" cy="230" r="8" fill="#22d3ee" filter="url(#glow-strong)" />
            <line x1="1100" y1="230" x2="1200" y2="230" stroke="#22d3ee" strokeWidth="2" />
            <text x="1190" y="225" fill="#22d3ee" fontSize="14" fontWeight="bold" textAnchor="end">LATERAL MOVEMENT</text>

            <circle cx="1000" cy="470" r="8" fill="#22d3ee" filter="url(#glow-strong)" />
            <line x1="1000" y1="470" x2="1150" y2="470" stroke="#22d3ee" strokeWidth="2" />
            <text x="1160" y="465" fill="#22d3ee" fontSize="14" fontWeight="bold" textAnchor="end">ZERO-DAY</text>
          </svg>

          {/* CENTER LABELS */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-slate-900 text-2xl font-bold uppercase">NATIONAL SECURITY</div>
            <div className="text-slate-900 text-2xl font-bold uppercase mt-2">ENTERPRISE SECURITY</div>
          </div>
        </div>

        {/* CAPABILITIES GRID - High-Density 3D Flip Cards */}
        <div className="py-24 -mt-20">
          <div className="max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-24">
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 text-center mb-12">
              CAPABILITIES
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Card 1: Exposure Graph */}
              <div className="group perspective-1000 h-[320px]">
                <div className="relative w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180 cursor-pointer shadow-xl rounded-2xl">
                  {/* Front Face */}
                  <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 shadow-lg rounded-2xl flex flex-col items-center justify-center p-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-cyan-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    <h4 className="text-slate-900 font-bold text-xl text-center">Exposure Graph</h4>
                  </div>

                  {/* Back Face */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0f172a] border border-slate-200 rounded-2xl p-6 flex flex-col justify-center">
                    <h5 className="text-cyan-400 font-bold text-lg mb-3">Graph Analytics</h5>
                    <ul className="space-y-2">
                      <li className="text-lg text-white">• Maps 10,000+ nodes</li>
                      <li className="text-lg text-white">• Visualizes attack paths</li>
                      <li className="text-lg text-white">• Identifies hidden assets</li>
                      <li className="text-lg text-white">• Real-time topology update</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Card 2: Threat Forecasting */}
              <div className="group perspective-1000 h-[320px]">
                <div className="relative w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180 cursor-pointer shadow-xl rounded-2xl">
                  {/* Front Face */}
                  <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 shadow-lg rounded-2xl flex flex-col items-center justify-center p-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-green-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <h4 className="text-slate-900 font-bold text-xl text-center">Threat Forecasting</h4>
                  </div>

                  {/* Back Face */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0f172a] border border-slate-200 rounded-2xl p-6 flex flex-col justify-center">
                    <h5 className="text-cyan-400 font-bold text-lg mb-3">Predictive Models</h5>
                    <ul className="space-y-2">
                      <li className="text-lg text-white">• Behavioral Anomaly AI</li>
                      <li className="text-lg text-white">• 48h Pre-Attack Warning</li>
                      <li className="text-lg text-white">• Lateral Movement Prediction</li>
                      <li className="text-lg text-white">• Heuristic Pattern Matching</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Card 3: Adversary Profiling */}
              <div className="group perspective-1000 h-[320px]">
                <div className="relative w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180 cursor-pointer shadow-xl rounded-2xl">
                  {/* Front Face */}
                  <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 shadow-lg rounded-2xl flex flex-col items-center justify-center p-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-blue-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="22" y1="12" x2="18" y2="12"></line>
                      <line x1="6" y1="12" x2="2" y2="12"></line>
                      <line x1="12" y1="6" x2="12" y2="2"></line>
                      <line x1="12" y1="22" x2="12" y2="18"></line>
                    </svg>
                    <h4 className="text-slate-900 font-bold text-xl text-center">Adversary Profiling</h4>
                  </div>

                  {/* Back Face */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0f172a] border border-slate-200 rounded-2xl p-6 flex flex-col justify-center">
                    <h5 className="text-cyan-400 font-bold text-lg mb-3">Attacker Context</h5>
                    <ul className="space-y-2">
                      <li className="text-lg text-white">• APT Group Attribution</li>
                      <li className="text-lg text-white">• TTP Mapping (MITRE)</li>
                      <li className="text-lg text-white">• Campaign Tracking</li>
                      <li className="text-lg text-white">• IOC Correlation</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Card 4: Risk Scoring */}
              <div className="group perspective-1000 h-[320px]">
                <div className="relative w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180 cursor-pointer shadow-xl rounded-2xl">
                  {/* Front Face */}
                  <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 shadow-lg rounded-2xl flex flex-col items-center justify-center p-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-purple-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    <h4 className="text-slate-900 font-bold text-xl text-center">Risk Scoring</h4>
                  </div>

                  {/* Back Face */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0f172a] border border-slate-200 rounded-2xl p-6 flex flex-col justify-center">
                    <h5 className="text-cyan-400 font-bold text-lg mb-3">Dynamic Calculation</h5>
                    <ul className="space-y-2">
                      <li className="text-lg text-white">• Asset Criticality Weight</li>
                      <li className="text-lg text-white">• Active Exploitability</li>
                      <li className="text-lg text-white">• Threat Intelligence Feeds</li>
                      <li className="text-lg text-white">• 0-1000 Real-time Score</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Card 5: Zero-Day Defense */}
              <div className="group perspective-1000 h-[320px]">
                <div className="relative w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180 cursor-pointer shadow-xl rounded-2xl">
                  {/* Front Face */}
                  <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 shadow-lg rounded-2xl flex flex-col items-center justify-center p-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-red-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <h4 className="text-slate-900 font-bold text-xl text-center">Zero-Day Awareness</h4>
                  </div>

                  {/* Back Face */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0f172a] border border-slate-200 rounded-2xl p-6 flex flex-col justify-center">
                    <h5 className="text-cyan-400 font-bold text-lg mb-3">Unknown Threats</h5>
                    <ul className="space-y-2">
                      <li className="text-lg text-white">• Behavior-based Blocking</li>
                      <li className="text-lg text-white">• Virtual Patching</li>
                      <li className="text-lg text-white">• Payload Analysis</li>
                      <li className="text-lg text-white">• Signature-less Defense</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Card 6: Auto-Reports */}
              <div className="group perspective-1000 h-[320px]">
                <div className="relative w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180 cursor-pointer shadow-xl rounded-2xl">
                  {/* Front Face */}
                  <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 shadow-lg rounded-2xl flex flex-col items-center justify-center p-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-yellow-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <h4 className="text-slate-900 font-bold text-xl text-center">Auto-Reports</h4>
                  </div>

                  {/* Back Face */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0f172a] border border-slate-200 rounded-2xl p-6 flex flex-col justify-center">
                    <h5 className="text-cyan-400 font-bold text-lg mb-3">Intelligence Briefs</h5>
                    <ul className="space-y-2">
                      <li className="text-lg text-white">• Executive Summaries</li>
                      <li className="text-lg text-white">• Compliance Mapping</li>
                      <li className="text-lg text-white">• Technical Remediation</li>
                      <li className="text-lg text-white">• Audit Trail Logs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}