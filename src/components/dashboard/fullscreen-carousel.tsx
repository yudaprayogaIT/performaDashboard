"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from "react";

interface FullscreenCarouselProps {
  sections: ReactNode[];
  isActive: boolean;
  onExit: () => void;
  autoPlayInterval?: number;
}

export default function FullscreenCarousel({
  sections,
  isActive,
  onExit,
  autoPlayInterval = 5000,
}: FullscreenCarouselProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false); // Track manual pause
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track resume timeout

  // Clear resume timeout helper
  const clearResumeTimeout = useCallback(() => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  // Auto-advance to next section
  const goToNext = useCallback(() => {
    setCurrentSection((prev) => (prev + 1) % sections.length);
  }, [sections.length]);

  const goToPrev = useCallback(() => {
    setCurrentSection((prev) => (prev - 1 + sections.length) % sections.length);
  }, [sections.length]);

  // Temporary pause (auto-resumes after 10 seconds, unless manually paused)
  const temporaryPause = useCallback(() => {
    if (isManuallyPaused) return; // Don't interfere with manual pause

    clearResumeTimeout();
    setIsPaused(true);

    // Resume auto-play after 10 seconds
    resumeTimeoutRef.current = setTimeout(() => {
      if (!isManuallyPaused) {
        setIsPaused(false);
      }
    }, 10000);
  }, [isManuallyPaused, clearResumeTimeout]);

  const goToSection = useCallback((index: number) => {
    setCurrentSection(index);
    temporaryPause();
  }, [temporaryPause]);

  // Auto-play effect
  useEffect(() => {
    if (!isActive || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      goToNext();
    }, autoPlayInterval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, isPaused, autoPlayInterval, goToNext]);

  // Reset states when carousel becomes inactive
  useEffect(() => {
    if (!isActive) {
      setCurrentSection(0);
      setIsPaused(false);
      setIsManuallyPaused(false);
      clearResumeTimeout();
    }
  }, [isActive, clearResumeTimeout]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case " ":
          goToNext();
          temporaryPause();
          break;
        case "ArrowLeft":
          goToPrev();
          temporaryPause();
          break;
        case "Escape":
          onExit();
          break;
        case "p":
        case "P":
          // Toggle manual pause
          clearResumeTimeout(); // Clear any pending auto-resume
          setIsManuallyPaused((prev) => {
            const newValue = !prev;
            setIsPaused(newValue);
            return newValue;
          });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, goToNext, goToPrev, onExit, temporaryPause, clearResumeTimeout]);

  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 z-50 overflow-hidden"
    >
      {/* Current Section */}
      <div className="h-full w-full overflow-y-hidden">
        <div className="min-h-full p-8">{sections[currentSection]}</div>
      </div>

      {/* Controls Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Bar - Exit & Status */}
        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/50 to-transparent pointer-events-auto">
          <div className="flex items-center justify-end gap-3">
            <div className="flex items-center gap-3">
              {/* <button
                onClick={onExit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
              >
                <span className="material-symbols-outlined">close</span>
                <span className="text-sm font-medium">Exit Fullscreen</span>
              </button> */}

              <button
                onClick={() => {
                  clearResumeTimeout();
                  setIsManuallyPaused((prev) => {
                    const newValue = !prev;
                    setIsPaused(newValue);
                    return newValue;
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
              >
                <span className="material-symbols-outlined">
                  {isPaused ? "play_arrow" : "pause"}
                </span>
                <span className="text-sm font-medium">
                  {isPaused ? "Resume" : "Pause"}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
              <span className="material-symbols-outlined text-primary">
                slideshow
              </span>
              <span className="text-white text-sm font-medium">
                Section {currentSection + 1} of {sections.length}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {/* <button
          onClick={() => {
            goToPrev();
            setIsPaused(true);
            setTimeout(() => setIsPaused(false), 10000);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm pointer-events-auto"
        >
          <span className="material-symbols-outlined text-3xl">
            chevron_left
          </span>
        </button>

        <button
          onClick={() => {
            goToNext();
            setIsPaused(true);
            setTimeout(() => setIsPaused(false), 10000);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm pointer-events-auto"
        >
          <span className="material-symbols-outlined text-3xl">
            chevron_right
          </span>
        </button> */}

        {/* Bottom Bar - Indicators & Progress */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent pointer-events-auto">
          {/* Section Indicators */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {sections.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSection(index)}
                className="group relative"
              >
                <div
                  className={`h-2 rounded-full transition-all ${
                    index === currentSection
                      ? "w-12 bg-primary"
                      : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                >
                  {/* Auto-play progress */}
                  {index === currentSection && !isPaused && (
                    <div
                      className="h-full bg-primary-light rounded-full"
                      style={{
                        animation: `progress ${autoPlayInterval}ms linear`,
                      }}
                    ></div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="flex items-center justify-center gap-6 text-xs text-white/60">
            <span>← → Navigate</span>
            <span>P Pause/Resume</span>
            <span>ESC Exit</span>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
