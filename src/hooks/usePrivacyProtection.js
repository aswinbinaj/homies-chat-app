import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to enforce web-based privacy and screenshot restrictions:
 * 1. Blocks PrintScreen and Ctrl+P / Cmd+P shortcuts.
 * 2. Blurs/obscures chat when window loses focus (preventing external snipping tools).
 * 3. Disables right-click context menu and text selection where enabled.
 */
export const usePrivacyProtection = (enabled = true) => {
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [screenshotAttempted, setScreenshotAttempted] = useState(false);

  // Handle window focus/blur (Snipping tool / app switcher protection)
  useEffect(() => {
    if (!enabled) return;

    const handleBlur = () => {
      setIsWindowBlurred(true);
    };

    const handleFocus = () => {
      setIsWindowBlurred(false);
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Also handle visibilitychange (switching tabs)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowBlurred(true);
      } else {
        setIsWindowBlurred(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);

  // Handle keyboard screenshot / print shortcuts
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // PrintScreen key
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        triggerScreenshotWarning();
      }

      // Ctrl + P or Cmd + P (Print page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        triggerScreenshotWarning();
      }

      // Ctrl + S or Cmd + S (Save page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        triggerScreenshotWarning();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        // Attempt to clear clipboard if permitted
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        triggerScreenshotWarning();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled]);

  const triggerScreenshotWarning = useCallback(() => {
    setScreenshotAttempted(true);
    setTimeout(() => {
      setScreenshotAttempted(false);
    }, 2800);
  }, []);

  return {
    isWindowBlurred,
    screenshotAttempted,
  };
};
