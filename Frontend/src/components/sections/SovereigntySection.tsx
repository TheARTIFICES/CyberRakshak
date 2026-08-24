import React, { useState, useEffect } from 'react';

export default function SovereigntySection() {
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition(prev => {
        if (prev >= 2) {
          setDirection(-1);
          return prev - 1;
        } else if (prev <= 0) {
          setDirection(1);
          return prev + 1;
        }
        return prev + direction;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [direction]);

  return (
    <section className="w-full min-h-screen bg-white flex flex-col items-center justify-center py-20 relative overflow-hidden">
      {/* TOP TRANSITION: Gray Geometric Trapezoid */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] z-20">
        <svg
          className="relative block w-full h-[60px] md:h-[100px]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M1200,0 L0,0 L0,20 L300,20 L350,100 L850,100 L900,20 L1200,20 Z"
            className="fill-slate-100"
          />
        </svg>
      </div>

      {/* Main Container */}
      <div className="relative z-20 w-full px-6 md:px-12 lg:px-24">
        {/* HEADER */}
        <div className="text-center mb-16 pt-16">
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-widest text-slate-900 uppercase mb-6">
            DATA SOVEREIGNTY
          </h2>
          <p className="text-slate-600 text-center text-lg mt-6 max-w-3xl mx-auto">
            Absolute data residency. Your intelligence never touches the cloud.
          </p>
        </div>

        {/* CENTERPIECE: THE INFRASTRUCTURE VAULT */}
        <div className="max-w-5xl mx-auto mt-16 relative">
          {/* The Box */}
          <div className="border-4 border-slate-100 rounded-3xl p-12 relative">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-bold">
              YOUR INFRASTRUCTURE (AIR-GAPPED)
            </div>

            {/* The Flow */}
            <div className="flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0">
              {/* Encrypted Logs */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                    <path d="M8 12h.01"></path>
                    <path d="M12 12h.01"></path>
                    <path d="M16 12h.01"></path>
                  </svg>
                </div>
                <h3 className="font-bold text-slate-900">Encrypted Logs</h3>
              </div>

              {/* Connection Line 1 */}
              <div className="hidden md:block relative w-16 h-1">
                <div className="absolute top-0 left-0 w-full h-full bg-emerald-600 rounded-full"></div>
                {position === 0 && (
                  <div className="absolute top-1/2 left-0 w-3 h-3 bg-emerald-600 rounded-full transform -translate-y-1/2"></div>
                )}
              </div>

              {/* Local Inference */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"></path>
                  </svg>
                </div>
                <h3 className="font-bold text-slate-900">Local Inference</h3>
              </div>

              {/* Connection Line 2 */}
              <div className="hidden md:block relative w-16 h-1">
                <div className="absolute top-0 left-0 w-full h-full bg-emerald-600 rounded-full"></div>
                {position === 1 && (
                  <div className="absolute top-1/2 right-0 w-3 h-3 bg-emerald-600 rounded-full transform -translate-y-1/2"></div>
                )}
              </div>

              {/* Internal IPs */}
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </div>
                <h3 className="font-bold text-slate-900">Internal IPs</h3>
              </div>
            </div>

            {/* Mobile Animation */}
            <div className="md:hidden mt-8 relative h-16">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-emerald-600 rounded-full"></div>
              <div 
                className="absolute top-1/2 w-4 h-4 bg-emerald-600 rounded-full transform -translate-y-1/2 transition-all duration-1000 ease-linear"
                style={{ left: `${(position / 2) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* SPECS GRID - High-Density 3D Flip Cards */}
        <div className="mt-20">
          <div className="max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* CARD 1: DEPLOYMENT */}
              <div className="group perspective-1000 h-[300px]">
                <div className="relative w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180 cursor-pointer shadow-xl rounded-2xl">
                  {/* Front Face */}
                  <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 shadow-lg rounded-2xl flex flex-col items-center justify-center p-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                        <line x1="6" y1="6" x2="6.01" y2="6"></line>
                        <line x1="6" y1="18" x2="6.01" y2="18"></line>
                      </svg>
                    </div>
                    <h4 className="text-slate-900 font-bold text-lg text-center">DEPLOYMENT</h4>
                    <p className="text-emerald-600 font-semibold mt-2 text-center">Bare Metal / Docker</p>
                  </div>

                  {/* Back Face */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0f172a] border border-slate-200 rounded-2xl p-6 flex flex-col justify-center">
                    <ul className="space-y-2">
                      <li className="text-lg text-white">• On-Premise Installation</li>
                      <li className="text-lg text-white">• Private Gov Cloud</li>
                      <li className="text-lg text-white">• Kubernetes Helm Charts</li>
                      <li className="text-lg text-white">• Offline Mode Support</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* CARD 2: AI MODEL */}
              <div className="group perspective-1000 h-[300px]">
                <div className="relative w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180 cursor-pointer shadow-xl rounded-2xl">
                  {/* Front Face */}
                  <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 shadow-lg rounded-2xl flex flex-col items-center justify-center p-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path>
                        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path>
                      </svg>
                    </div>
                    <h4 className="text-slate-900 font-bold text-lg text-center">AI MODEL</h4>
                    <p className="text-emerald-600 font-semibold mt-2 text-center">Llama-3 (Quantized)</p>
                  </div>

                  {/* Back Face */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0f172a] border border-slate-200 rounded-2xl p-6 flex flex-col justify-center">
                    <ul className="space-y-2">
                      <li className="text-lg text-white">• Local Inference Core</li>
                      <li className="text-lg text-white">• No External API Calls</li>
                      <li className="text-lg text-white">• Zero Data Leakage</li>
                      <li className="text-lg text-white">• Custom Fine-Tuning</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* CARD 3: TELEMETRY */}
              <div className="group perspective-1000 h-[300px]">
                <div className="relative w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180 cursor-pointer shadow-xl rounded-2xl">
                  {/* Front Face */}
                  <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 shadow-lg rounded-2xl flex flex-col items-center justify-center p-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        <path d="M9.5 9h5L12 12z"></path>
                      </svg>
                    </div>
                    <h4 className="text-slate-900 font-bold text-lg text-center">TELEMETRY</h4>
                    <p className="text-emerald-600 font-semibold mt-2 text-center">100% Localhost</p>
                  </div>

                  {/* Back Face */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0f172a] border border-slate-200 rounded-2xl p-6 flex flex-col justify-center">
                    <ul className="space-y-2">
                      <li className="text-lg text-white">• AES-256 Encrypted</li>
                      <li className="text-lg text-white">• Data at Rest & Motion</li>
                      <li className="text-lg text-white">• Local Log Retention</li>
                      <li className="text-lg text-white">• Role-Based Access</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* CARD 4: COMPLIANCE */}
              <div className="group perspective-1000 h-[300px]">
                <div className="relative w-full h-full transition-all duration-700 transform-style-3d group-hover:rotate-y-180 cursor-pointer shadow-xl rounded-2xl">
                  {/* Front Face */}
                  <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 shadow-lg rounded-2xl flex flex-col items-center justify-center p-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </div>
                    <h4 className="text-slate-900 font-bold text-lg text-center">COMPLIANCE</h4>
                    <p className="text-emerald-600 font-semibold mt-2 text-center">NTRO / ISO 27001</p>
                  </div>

                  {/* Back Face */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0f172a] border border-slate-200 rounded-2xl p-6 flex flex-col justify-center">
                    <ul className="space-y-2">
                      <li className="text-lg text-white">• CERT-In Guidelines</li>
                      <li className="text-lg text-white">• Critical Infra Ready</li>
                      <li className="text-lg text-white">• DPDP Act 2023</li>
                      <li className="text-lg text-white">• Audit-Ready Logs</li>
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