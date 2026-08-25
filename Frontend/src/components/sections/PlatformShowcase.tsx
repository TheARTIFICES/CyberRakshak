import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Scan, ShieldCheck, Globe, FileText } from 'lucide-react';

// Import images
import dashboardImg from '../../assets/dashboard-preview.png';
import scanImg from '../../assets/background.png'; // Placeholder - replace with actual scan image when available
import remediationImg from '../../assets/background.png'; // Placeholder - replace with actual remediation image when available
import threatImg from '../../assets/background.png'; // Placeholder - replace with actual threat image when available
import reportImg from '../../assets/background.png'; // Placeholder - replace with actual report image when available

interface FeatureItem {
  id: number;
  title: string;
  description: string;
  icon: any; // Using 'any' to match working examples
  image: string;
}

const featureItems: FeatureItem[] = [
  {
    id: 1,
    title: "Command Center",
    description: "Real-time dashboard with comprehensive security posture visualization and control center for all operations.",
    icon: LayoutDashboard,
    image: dashboardImg,
  },
  {
    id: 2,
    title: "Intelligent Scanning",
    description: "Advanced vulnerability scanning with AI-powered prioritization and asset discovery across your infrastructure.",
    icon: Scan,
    image: scanImg,
  },
  {
    id: 3,
    title: "Automated Fixes",
    description: "One-click remediation with playbook automation for rapid response to identified vulnerabilities and threats.",
    icon: ShieldCheck,
    image: remediationImg,
  },
  {
    id: 4,
    title: "Global Intelligence",
    description: "Threat intelligence feed with real-time updates on emerging threats and attack vectors from global sources.",
    icon: Globe,
    image: threatImg,
  },
  {
    id: 5,
    title: "Audit Engine",
    description: "Comprehensive reporting and compliance auditing with customizable dashboards and exportable reports.",
    icon: FileText,
    image: reportImg,
  },
];

export default function PlatformShowcase() {
  const [activeFeature, setActiveFeature] = useState(0);
  const autoPlayIntervalRef = useRef<number | null>(null);

  // Auto-play features every 4 seconds
  useEffect(() => {
    autoPlayIntervalRef.current = window.setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % featureItems.length);
    }, 4000);

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, []);

  // Handle feature selection
  const handleFeatureSelect = (index: number) => {
    setActiveFeature(index);
    
    // Reset the auto-play timer
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
    }
    autoPlayIntervalRef.current = window.setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % featureItems.length);
    }, 4000);
  };

  const currentFeature = featureItems[activeFeature];

  return (
    <section className="min-h-screen w-full flex flex-col justify-center relative py-24 bg-white">
      {/* TOP TRANSITION: Geometric Trapezoid */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] z-20">
        <svg className="relative block w-full h-[60px] md:h-[100px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M1200,0 L0,0 L0,20 L300,20 L350,100 L850,100 L900,20 L1200,20 Z" fill="#000000" />
        </svg>
      </div>
      {/* MAIN CONTENT CONTAINER */}
      <div className="w-full px-6 md:px-12 lg:px-24">
        {/* HEADER */}
        <div className="text-center mx-auto mb-20">
          <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
            OUR PLATFORM
          </h2>
          <p className="text-xl text-slate-500 mt-4 max-w-3xl mx-auto">
            One pane of glass for all your security operations.
          </p>
        </div>

        {/* MAIN GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center mt-20">
          {/* LEFT COLUMN: THE COMMAND STACK (Col-Span-4) */}
          <div className="lg:col-span-4 space-y-6">
            {featureItems.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = index === activeFeature;

              return (
                <div
                  key={feature.id}
                  onClick={() => handleFeatureSelect(index)}
                  className={`
                    transition-all duration-300 cursor-pointer rounded-r-xl p-8
                    ${isActive
                      ? 'bg-slate-50 border-l-8 border-cyan-500 shadow-xl shadow-slate-200/50'
                      : 'border-l-8 border-transparent opacity-50 hover:opacity-100'
                    }
                  `}
                >
                  <div className="flex items-start gap-6">
                    <div className={`flex-shrink-0 ${isActive ? 'text-cyan-500' : 'text-slate-400'}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`${isActive ? 'text-2xl font-bold text-slate-900' : 'text-xl font-medium text-slate-400'}`}>
                        {feature.title}
                      </h3>
                      
                      {/* Description - Only show for active item */}
                      {isActive && (
                        <p className="text-slate-600 mt-2">
                          {feature.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: THE BROWSER WINDOW (Col-Span-8) */}
          <div className="lg:col-span-8">
            <div className="rounded-lg overflow-hidden shadow-2xl border border-slate-200 bg-white">
              {/* Browser Window Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 text-center">
                  <div className="bg-slate-100 rounded px-3 py-1 text-xs text-slate-500 inline-block">
                    cyberrakshak.com
                  </div>
                </div>
              </div>

              {/* Browser Content */}
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={currentFeature.image}
                  alt={`${currentFeature.title} Preview`}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}