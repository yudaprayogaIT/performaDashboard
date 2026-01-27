import { useState, useEffect, useCallback } from "react";

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const enterFullscreen = useCallback(async (element?: HTMLElement) => {
    const elem = element || document.documentElement;
    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      }
    } catch (error) {
      console.error("Error entering fullscreen:", error);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error exiting fullscreen:", error);
    }
  }, []);

  const toggleFullscreen = useCallback(
    async (element?: HTMLElement) => {
      if (isFullscreen) {
        await exitFullscreen();
      } else {
        await enterFullscreen(element);
      }
    },
    [isFullscreen, enterFullscreen, exitFullscreen]
  );

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
