import React from 'react';
import { useAIHealth } from '../context/AIHealthContext';

export default function AIBanner() {
  const { isOnline, textModel, visionModel, checked, recheck } = useAIHealth();

  if (!checked) return null;
  if (isOnline && textModel.available && visionModel.available) return null;

  return (
    <div className="bg-subtle border-b border-warning px-4 py-2.5 text-warning text-xs flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        
        <div>
          <span className="font-bold">AI Engine Status: </span>
          {!isOnline ? (
            <span>
              Ollama server is offline. Local deterministic features (meals, workouts, logging) work normally. To enable full AI, start Ollama (<code className="bg-ink/50 px-1 py-0.5 rounded-sm text-warning">ollama serve</code>) and pull models.
            </span>
          ) : (
            <span>
              Ollama is running, but missing models: {!textModel.available && <span className="font-mono bg-ink/50 px-1 rounded-sm mx-0.5">ollama pull {textModel.name}</span>}
              {!visionModel.available && <span className="font-mono bg-ink/50 px-1 rounded-sm mx-0.5">ollama pull {visionModel.name}</span>}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={recheck}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-subtle hover:bg-subtle text-warning font-semibold rounded-sm text-[11px] transition cursor-pointer"
      >
        
        <span>Check Status</span>
      </button>
    </div>
  );
}
