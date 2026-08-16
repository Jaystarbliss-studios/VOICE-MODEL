import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import {
  MessageSquare,
  Copy,
  Check,
  Trash2,
  Download,
  Volume2,
  Sparkles,
  User,
  ShieldAlert,
  Save,
  BookmarkCheck,
} from 'lucide-react';

interface TranscriptViewProps {
  messages: ChatMessage[];
  onClearTranscript: () => void;
  onSaveToVault?: () => void;
  onPlayTTS?: (text: string) => void;
  liveUserTranscript?: string;
  liveAngelTranscript?: string;
  isLiveActive: boolean;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  messages,
  onClearTranscript,
  onSaveToVault,
  onPlayTTS,
  liveUserTranscript,
  liveAngelTranscript,
  isLiveActive,
}) => {
  const [copied, setCopied] = useState(false);
  const [savedVaultSuccess, setSavedVaultSuccess] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new messages or streaming transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, liveUserTranscript, liveAngelTranscript]);

  const handleSaveToVaultClick = () => {
    if (onSaveToVault) {
      onSaveToVault();
      setSavedVaultSuccess(true);
      setTimeout(() => setSavedVaultSuccess(false), 2500);
    }
  };

  const handleCopy = () => {
    const text = messages
      .map(
        (m) =>
          `[${new Date(m.timestamp).toLocaleTimeString()}] ${
            m.sender === 'user' ? 'You' : 'Angel'
          }: ${m.text}`
      )
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = messages
      .map(
        (m) =>
          `[${new Date(m.timestamp).toLocaleString()}] ${
            m.sender === 'user' ? 'You' : 'Angel'
          }:\n${m.text}\n`
      )
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Angel-Session-Transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="transcript-view-panel"
      className="flex flex-col h-full rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl shadow-xl overflow-hidden"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/40">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold tracking-wide text-zinc-200 uppercase font-mono">
            Live Dialogue Transcript
          </span>
          {isLiveActive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Syncing
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onSaveToVault && (
            <button
              id="save-to-vault-btn"
              onClick={handleSaveToVaultClick}
              disabled={messages.length === 0}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${
                savedVaultSuccess
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 disabled:opacity-30'
              }`}
              title="Save this conversation into Angel's Vault"
            >
              {savedVaultSuccess ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save to Vault</span>
                </>
              )}
            </button>
          )}
          <button
            id="copy-transcript-btn"
            onClick={handleCopy}
            disabled={messages.length === 0}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 disabled:opacity-40 transition"
            title="Copy Dialogue"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            id="download-transcript-btn"
            onClick={handleDownload}
            disabled={messages.length === 0}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 disabled:opacity-40 transition"
            title="Download Transcript"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            id="clear-transcript-btn"
            onClick={onClearTranscript}
            disabled={messages.length === 0}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-300 hover:bg-rose-950/30 disabled:opacity-40 transition"
            title="Clear Transcript"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 scroll-smooth">
        {messages.length === 0 && !liveUserTranscript && !liveAngelTranscript ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
            <Sparkles className="w-8 h-8 text-amber-500/30 animate-pulse" />
            <p className="text-sm font-serif text-zinc-400">"Speak your mind. I'm listening with full attention."</p>
            <p className="text-xs text-zinc-600 font-mono">
              Press "Start Live Dialogue" to begin real-time voice streaming with Angel.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isAngel = msg.sender === 'angel';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-sm animate-in fade-in duration-200 ${
                    isAngel ? 'items-start' : 'items-start flex-row-reverse'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                      isAngel
                        ? 'border-amber-500/40 bg-gradient-to-tr from-amber-600 to-yellow-400 text-stone-950 font-serif font-bold text-xs shadow-md shadow-amber-500/20'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {isAngel ? 'A' : <User className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 space-y-1.5 shadow-md ${
                      isAngel
                        ? 'bg-zinc-800/80 border border-amber-500/20 text-zinc-100'
                        : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/15 border border-amber-500/30 text-amber-100'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-zinc-400">
                      <span className="font-semibold text-zinc-300">
                        {isAngel ? 'Angel' : 'You'}
                      </span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Image Attachment if present */}
                    {msg.imageUrl && (
                      <div className="rounded-lg overflow-hidden border border-zinc-700 max-w-xs my-1">
                        <img src={msg.imageUrl} alt="Shared context" className="w-full h-auto object-cover" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.text}
                    </div>

                    {/* TTS Playback Action */}
                    {isAngel && onPlayTTS && (
                      <div className="pt-1 flex items-center justify-end">
                        <button
                          onClick={() => onPlayTTS(msg.text)}
                          className="flex items-center gap-1 text-[10px] text-amber-400/80 hover:text-amber-300 transition"
                          title="Read this turn aloud"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Replay Audio</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Live Streaming User Speech Indicator */}
            {liveUserTranscript && (
              <div className="flex gap-3 text-sm items-start flex-row-reverse animate-pulse">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-teal-500/40 bg-teal-900/40 text-teal-300">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="max-w-[82%] rounded-2xl px-4 py-2.5 bg-teal-950/40 border border-teal-500/30 text-teal-200 space-y-1">
                  <div className="text-[10px] font-mono text-teal-400">Transcribing Speech...</div>
                  <div className="text-xs leading-relaxed italic">{liveUserTranscript}</div>
                </div>
              </div>
            )}

            {/* Live Streaming Angel Speech Indicator */}
            {liveAngelTranscript && (
              <div className="flex gap-3 text-sm items-start animate-pulse">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-amber-500/40 bg-gradient-to-tr from-amber-600 to-yellow-400 text-stone-950 font-serif font-bold text-xs shadow-md">
                  A
                </div>
                <div className="max-w-[82%] rounded-2xl px-4 py-2.5 bg-amber-950/40 border border-amber-500/30 text-amber-200 space-y-1">
                  <div className="text-[10px] font-mono text-amber-400">Angel Responding...</div>
                  <div className="text-xs leading-relaxed italic">{liveAngelTranscript}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
