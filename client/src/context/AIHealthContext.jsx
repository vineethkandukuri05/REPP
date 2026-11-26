import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AIHealthContext = createContext(null);

export function AIHealthProvider({ children }) {
  const [health, setHealth] = useState({
    isOnline: false,
    textModel: { name: 'llama3.1:8b', available: false },
    visionModel: { name: 'llama3.2-vision', available: false },
    checked: false,
    error: null,
  });

  const checkHealth = useCallback(async () => {
    try {
      const data = await api.get('/ai/health');
      setHealth({
        isOnline: !!data.isOnline,
        textModel: data.textModel || { name: 'llama3.1:8b', available: false },
        visionModel: data.visionModel || { name: 'llama3.2-vision', available: false },
        checked: true,
        error: data.error || null,
      });
    } catch (err) {
      setHealth((prev) => ({
        ...prev,
        isOnline: false,
        checked: true,
        error: err.message || 'AI engine unreachable',
      }));
    }
  }, []);

  useEffect(() => {
    checkHealth();
    // Poll every 45s
    const interval = setInterval(checkHealth, 45000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <AIHealthContext.Provider value={{ ...health, recheck: checkHealth }}>
      {children}
    </AIHealthContext.Provider>
  );
}

export function useAIHealth() {
  const context = useContext(AIHealthContext);
  if (!context) {
    throw new Error('useAIHealth must be used within an AIHealthProvider');
  }
  return context;
}
