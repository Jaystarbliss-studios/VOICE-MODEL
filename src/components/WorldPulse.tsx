import React, { useState, useEffect } from 'react';
import { WorldPulseItem } from '../types';
import {
  Globe2,
  Sparkles,
  RefreshCw,
  Volume2,
  TrendingUp,
  MapPin,
  MessageCircle,
  Quote,
} from 'lucide-react';

interface WorldPulseProps {
  onDiscussWithAngel: (topicPrompt: string) => void;
  onPlayTTS?: (text: string) => void;
}

export const WorldPulse: React.FC<WorldPulseProps> = ({
  onDiscussWithAngel,
  onPlayTTS,
}) => {
  const [pulseList, setPulseList] = useState<WorldPulseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPulse = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/world-pulse');
      const data = await res.json();
      if (data.pulse && Array.isArray(data.pulse)) {
        setPulseList(data.pulse);
      }
    } catch (e) {
      console.error('Failed to fetch world pulse:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPulse();
  }, []);

  return (
    <div id="world-pulse-panel" className="flex flex-col h-full rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-teal-400" />
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 font-mono">
              Global Pulse & Intelligence
            </h3>
            <p className="text-[11px] text-zinc-400">
              Cross-cultural market dispatches, clinical insights & situational wit from Angel.
            </p>
          </div>
        </div>

        <button
          id="refresh-pulse-btn"
          onClick={fetchPulse}
          disabled={isLoading}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 transition disabled:opacity-40"
          title="Refresh Global Briefings"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {pulseList.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-teal-500/40 transition space-y-3 shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase text-teal-400 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded-md">
                <MapPin className="w-3 h-3" />
                {item.region}
              </span>
              <div className="flex items-center gap-1.5">
                {onPlayTTS && (
                  <button
                    onClick={() => onPlayTTS(`${item.title}. ${item.summary} Angel says: ${item.angelNote}`)}
                    className="p-1 text-zinc-400 hover:text-amber-300 transition"
                    title="Read aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() =>
                    onDiscussWithAngel(
                      `Angel, let's talk about this dispatch from ${item.region}: "${item.title}". You noted: "${item.angelNote}". What is your strategic take on this?`
                    )
                  }
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition font-medium"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Discuss</span>
                </button>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-zinc-100">{item.title}</h4>
            <p className="text-xs text-zinc-300 leading-relaxed">{item.summary}</p>

            {/* Angel's Direct Personal Commentary */}
            <div className="p-3 rounded-lg bg-amber-500/5 border-l-2 border-amber-400/80 space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
                <Quote className="w-3 h-3" />
                <span>Angel's Candid Take</span>
              </div>
              <p className="text-xs italic text-amber-100/90 leading-relaxed">
                "{item.angelNote}"
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
