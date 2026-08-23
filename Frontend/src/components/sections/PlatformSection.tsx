import { Eye, Shield, Zap, Scan, FileCheck, AlertTriangle } from 'lucide-react';

export default function PlatformSection() {
  const features = [
    {
      icon: Eye,
      title: "Unified Visibility",
      backContent: [
        "Single pane of glass",
        "No fragmented tools",
        "360° view"
      ]
    },
    {
      icon: Shield,
      title: "Sovereign AI",
      backContent: [
        "Data never leaves premise",
        "On-premise LLM",
        "Custom trained models"
      ]
    },
    {
      icon: Zap,
      title: "Auto-Remediation",
      backContent: [
        "Fix misconfigs instantly",
        "AI-driven playbooks",
        "Zero-touch patching"
      ]
    },
    {
      icon: Scan,
      title: "Continuous Scanning",
      backContent: [
        "Real-time discovery",
        "Asset mapping",
        "No scheduled scans needed"
      ]
    },
    {
      icon: FileCheck,
      title: "Compliance Ready",
      backContent: [
        "Mapped to ISO/NIST",
        "One-click reports",
        "Audit trail logs"
      ]
    },
    {
      icon: AlertTriangle,
      title: "Zero-Day Defense",
      backContent: [
        "Behavioral analysis",
        "Anomaly detection",
        "Proactive shielding"
      ]
    }
  ];

  return (
    <section className="relative bg-gray-100 min-h-screen py-24">
      {/* TOP TRANSITION: Geometric Trapezoid */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] z-20">
        <svg
          className="relative block w-full h-[60px] md:h-[100px]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M1200,0 L0,0 L0,20 L300,20 L350,100 L850,100 L900,20 L1200,20 Z"
            className="fill-gray-100"
          ></path>
        </svg>
      </div>

      {/* Main Container */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#0a0f1f] mb-16 uppercase tracking-tight">
            WHY CYBERRAKSHAK
          </h2>
        </div>

        {/* 6-Card Grid with 3D Flip Effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group h-[300px] cursor-pointer"
                style={{ perspective: '1000px' }}
              >
                {/* Card Container with 3D Transform */}
                <div 
                  className="relative w-full h-full transition-transform duration-700"
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transform: 'rotateY(0deg)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'rotateY(180deg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'rotateY(0deg)';
                  }}
                >
                  {/* Front Face */}
                  <div 
                    className="absolute inset-0 bg-white rounded-xl shadow-lg flex flex-col items-center justify-center p-6"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <Icon className="w-16 h-16 text-blue-500 mb-4" />
                    <h3 className="text-xl font-bold text-[#0a0f1f] text-center">
                      {feature.title}
                    </h3>
                  </div>

                  {/* Back Face */}
                  <div 
                    className="absolute inset-0 bg-[#0a0f1f] rounded-xl shadow-lg flex flex-col items-center justify-center p-6"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <h3 className="text-xl font-bold text-white mb-6 text-center">
                      {feature.title}
                    </h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300 text-left w-full">
                      {feature.backContent.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
