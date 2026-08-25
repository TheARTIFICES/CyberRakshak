import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import RobotHero from "./RobotHero";

type BootPhase = 0 | 1 | 2 | 3;

export default function HeroSection() {
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [phase, setPhase] = useState<BootPhase>(0);
  const [bootComplete, setBootComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [quoteText, setQuoteText] = useState("");
  const [showQuoteCursor, setShowQuoteCursor] = useState(true);
  const quoteIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const bootSequence = [
    { text: "Meet CyRa.", pause: 1000, delete: true },
    { text: "The Sovereign Intelligence.", pause: 500, delete: true },
    { text: "Connecting to CyberRakshak...", pause: 500, delete: true },
    { text: "CyberRakshak", pause: 0, delete: false }
  ];

  const quote = "SECURITY IS NOT A PASSIVE DEFENSE. IT IS AN ACTIVE INTELLIGENCE.";

  // Typewriter effect for headline
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const currentStep = bootSequence[phase];
    
    if (!currentStep) return;

    if (!isDeleting && displayText === currentStep.text) {
      // Finished typing
      if (currentStep.delete) {
        // Wait, then delete
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, currentStep.pause);
      } else {
        // Final phase - boot complete
        setBootComplete(true);
        setShowCursor(false);
      }
    } else if (isDeleting && displayText === "") {
      // Finished deleting, move to next phase
      setIsDeleting(false);
      if (phase < 3) {
        setPhase((prev) => (prev + 1) as BootPhase);
      }
    } else {
      // Typing or deleting
      const speed = isDeleting ? 30 : 80;
      timeout = setTimeout(() => {
        if (isDeleting) {
          setDisplayText(currentStep.text.substring(0, displayText.length - 1));
        } else {
          setDisplayText(currentStep.text.substring(0, displayText.length + 1));
        }
      }, speed);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, phase]);

  // Typewriter effect for right quote (starts after bootComplete)
  useEffect(() => {
    if (!bootComplete) return;

    // Delay before starting quote typewriter
    const delay = setTimeout(() => {
      let currentIndex = 0;
      quoteIntervalRef.current = setInterval(() => {
        if (currentIndex < quote.length) {
          setQuoteText(quote.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          setShowQuoteCursor(false);
          if (quoteIntervalRef.current) {
            clearInterval(quoteIntervalRef.current);
            quoteIntervalRef.current = null;
          }
        }
      }, 50);
    }, 500);

    return () => {
      clearTimeout(delay);
      if (quoteIntervalRef.current) {
        clearInterval(quoteIntervalRef.current);
        quoteIntervalRef.current = null;
      }
    };
  }, [bootComplete, quote]);

  // Blinking cursor animation for headline
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Blinking cursor animation for quote
  useEffect(() => {
    if (!bootComplete) return;
    const interval = setInterval(() => {
      setShowQuoteCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, [bootComplete]);

  const isFinalPhase = phase === 3 && !isDeleting && displayText === bootSequence[3].text;

  return (
    <div id="home" className="relative w-full h-screen bg-black overflow-hidden">
      {/* CENTER 3D ROBOT */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <RobotHero />
      </div>

      {/* LEFT COLUMN - Boot Sequence & Console */}
      <div className="absolute left-16 top-1/2 -translate-y-1/2 text-white max-w-2xl z-20">
        {/* Main Headline - Typewriter */}
        <h1 
          className={`leading-tight mb-4 min-h-[120px] ${
            isFinalPhase
              ? "text-6xl md:text-7xl font-bold text-white"
              : "text-4xl md:text-5xl font-mono text-green-400"
          }`}
        >
          {displayText}
          {showCursor && !bootComplete && (
            <span className="text-cyan-400 animate-pulse">|</span>
          )}
        </h1>

        {/* Console Content - Only visible after boot complete */}
        <div className={`transition-opacity duration-1000 mt-6 space-y-6 ${bootComplete ? 'opacity-100' : 'opacity-0'}`}>
          {/* Sub-Headline */}
          <p className="text-2xl md:text-3xl font-semibold text-cyan-400">
            Powered by CyRa. Unified by Design.
          </p>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
            A unified defense platform where CyRa—our sovereign AI—proactively hunts threats 
            and orchestrates remediation before you even see the alert.
          </p>

          {/* Buttons */}
          <div className="flex gap-4 items-center">
            <Link
              to="/dashboard"
              className="px-6 py-2.5 bg-cyan-500/20 text-cyan-300 font-semibold rounded-full text-sm border border-cyan-500/60 hover:bg-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all inline-flex items-center gap-2"
            >
              Launch Console
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Big White Quote with Typewriter */}
      {bootComplete && (
        <div className="absolute right-20 top-1/2 -translate-y-1/2 max-w-2xl z-20">
          <div className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight text-right uppercase">
            {quoteText}
            {showQuoteCursor && quoteText.length < quote.length && (
              <span className="text-white animate-pulse">|</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
