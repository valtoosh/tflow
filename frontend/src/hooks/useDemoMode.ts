import { useState, useCallback, useEffect } from 'react';

const DEMO_MODE_KEY = 'tigerflow-demo-mode';

export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    // Default to true for hackathon demo
    const stored = localStorage.getItem(DEMO_MODE_KEY);
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem(DEMO_MODE_KEY, isDemoMode.toString());
  }, [isDemoMode]);

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode(prev => !prev);
  }, []);

  const enableDemoMode = useCallback(() => {
    setIsDemoMode(true);
  }, []);

  const disableDemoMode = useCallback(() => {
    setIsDemoMode(false);
  }, []);

  return {
    isDemoMode,
    toggleDemoMode,
    enableDemoMode,
    disableDemoMode,
  };
}
