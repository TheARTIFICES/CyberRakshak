import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { path: '#home', label: 'HOME' },
    { path: '#cyra', label: 'CYRA' },
    { path: '#platform', label: 'PLATFORM' },
    { path: '#intelligence', label: 'INTELLIGENCE' },
    { path: '#sovereignty', label: 'SOVEREIGNTY' },
  ];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Sticky Navbar - Cortex Style */}
      <nav 
        className="sticky top-0 z-50 border-b border-white/5"
        style={{
          backgroundColor: "#000000",
          height: "70px",
        }}
      >
        <div className="container mx-auto px-6 lg:px-8 h-full">
          <div className="flex items-center h-full relative">
            {/* Logo - Left */}
            <a 
              href="#home" 
              className="text-lg font-medium text-white transition-colors hover:text-cyan-400"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 600,
              }}
            >
              CyberRakshak
            </a>

            {/* Navigation Links - Centered (Desktop) */}
            <div className="hidden md:flex items-center space-x-8 h-full absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  className="text-sm font-medium transition-colors text-neutral-400 hover:text-cyan-400"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden ml-auto text-white"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* GET STARTED Button - Right (Desktop) */}
            <Link
              to="/dashboard"
              className="hidden md:block ml-auto text-sm font-semibold text-cyan-400 border border-cyan-500/50 rounded-full px-5 py-2.5 transition-all hover:bg-cyan-500/10 hover:border-cyan-500 hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 600,
              }}
            >
              GET STARTED
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-white/5 bg-black">
            <div className="container mx-auto px-6 py-4 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  onClick={handleLinkClick}
                  className="block text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                  style={{
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/dashboard"
                onClick={handleLinkClick}
                className="block text-sm font-semibold text-cyan-400 border border-cyan-500/50 rounded-full px-5 py-2.5 text-center transition-all hover:bg-cyan-500/10 hover:border-cyan-500"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontWeight: 600,
                }}
              >
                GET STARTED
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}


