import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LiveConnectionState,
  AngelState,
  ChatMessage,
  MemoryItem,
  StoredConversation,
  AudioSettings,
} from './types';
import { LiveAudioClient } from './services/liveAudioClient';
import { WakeWordDetector } from './services/wakeWordDetector';
import { AngelOrbVisualizer } from './components/AngelOrbVisualizer';
import { LiveVoiceControls } from './components/LiveVoiceControls';
import { TranscriptView } from './components/TranscriptView';
import { AngelVault } from './components/AngelVault';
import { WorldPulse } from './components/WorldPulse';
import { BrainstormStudio } from './components/BrainstormStudio';
import { ChatDrawer } from './components/ChatDrawer';
import { VoiceAndWakeSettings } from './components/VoiceAndWakeSettings';
import {
  Sparkles,
  Shield,
  Globe2,
  Lightbulb,
  MessageSquare,
  Volume2,
  VolumeX,
  Heart,
  Crown,
  BookOpen,
  Info,
  Radio,
  Sliders,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'voice' | 'vault' | 'pulse' | 'brainstorm' | 'settings'>('voice');

  // Connection & Live Audio State
  const [connectionState, setConnectionState] = useState<LiveConnectionState>('disconnected');
  const [angelState, setAngelState] = useState<AngelState>('idle');
  const [inputLevel, setInputLevel] = useState<number>(0);
  const [outputLevel, setOutputLevel] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Wake Word Detection State
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [wakeWordFlashMessage, setWakeWordFlashMessage] = useState<string | null>(null);
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);

  // Transcripts & Messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [liveUserTranscript, setLiveUserTranscript] = useState<string>('');
  const [liveAngelTranscript, setLiveAngelTranscript] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Memories & Conversations
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [conversations, setConversations] = useState<StoredConversation[]>([]);

  // Audio & Wake Word Settings
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    voice: 'Kore',
    micGain: 1.0,
    outputVolume: 1.0,
    pushToTalk: false,
    noiseSuppression: true,
    echoCancellation: true,
    wakeWord: {
      enabled: true,
      selectedPreset: 'hey_shawn',
      customKeyword: '',
      sensitivity: 'medium',
      autoRespond: true,
      wakeGreetingPrompt: "I'm right here. What are we strategizing today?",
      soundFeedback: true,
    },
  });

  // Client Instance Ref
  const liveClientRef = useRef<LiveAudioClient | null>(null);

  // Fetch initial memories and stored conversations
  const fetchMemories = useCallback(async () => {
    try {
      const res = await fetch('/api/memories');
      const data = await res.json();
      if (data.memories) {
        setMemories(data.memories);
      }
    } catch (e) {
      console.error('Failed to load memories:', e);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
    fetchConversations();
  }, [fetchMemories, fetchConversations]);

  // Automatic Conversation Sync into Angel's Vault
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (messages.length < 2) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const firstUserMsg = messages.find((m) => m.sender === 'user')?.text;
        const title = firstUserMsg
          ? firstUserMsg.slice(0, 45) + (firstUserMsg.length > 45 ? '...' : '')
          : `Executive Consultation • ${new Date().toLocaleDateString()}`;

        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            messages,
            summary: `Automated sync: Consultation with Angel (${messages.length} messages).`,
          }),
        });
        const data = await res.json();
        if (data.conversation) {
          setConversations((prev) => {
            const filtered = prev.filter((c) => c.title !== title);
            return [data.conversation, ...filtered];
          });
        }
      } catch (e) {
        console.warn('Auto-save error:', e);
      }
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [messages]);

  // Wake Word Detection Engine
  useEffect(() => {
    // Only listen for wake word when NOT actively connected to live audio stream
    const isLiveActive = connectionState === 'connected';
    const isWwEnabled = audioSettings.wakeWord?.enabled !== false;

    if (!isWwEnabled || isLiveActive) {
      if (wakeWordDetectorRef.current) {
        wakeWordDetectorRef.current.stop();
        wakeWordDetectorRef.current = null;
      }
      return;
    }

    const detector = new WakeWordDetector(audioSettings.wakeWord);
    detector.setCallbacks({
      onWake: (res) => {
        console.log('⚡ Wake word matched:', res.matchedPhrase, 'Remaining prompt:', res.remainingPrompt);
        setWakeWordDetected(true);
        setWakeWordFlashMessage(`Keyword "${res.matchedPhrase}" detected! Waking Angel...`);

        setTimeout(() => {
          setWakeWordDetected(false);
          setWakeWordFlashMessage(null);
        }, 3000);

        // Wake Angel and start Live Audio connection
        handleConnectLive();

        // If user also spoke a question with the wake word (e.g. "Hey Angel, check market pulse")
        if (res.remainingPrompt && res.remainingPrompt.trim()) {
          setTimeout(() => {
            handleSendMessage(res.remainingPrompt);
          }, 800);
        }
      },
      onStatus: (listening, err) => {
        if (err) console.debug('Wake word status notice:', err);
      },
    });

    detector.start();
    wakeWordDetectorRef.current = detector;

    return () => {
      if (wakeWordDetectorRef.current) {
        wakeWordDetectorRef.current.stop();
        wakeWordDetectorRef.current = null;
      }
    };
  }, [audioSettings.wakeWord, connectionState]);

  // Handle Live Audio Setup
  const handleConnectLive = async () => {
    setErrorMessage(null);
    if (liveClientRef.current) {
      liveClientRef.current.disconnect();
    }

    const client = new LiveAudioClient({
      onStatusChange: (status) => {
        setConnectionState(status);
      },
      onAngelStateChange: (state) => {
        setAngelState(state);
      },
      onUserTranscript: (text) => {
        setLiveUserTranscript((prev) => (prev ? `${prev} ${text}` : text));
      },
      onAngelTranscript: (text) => {
        setLiveAngelTranscript((prev) => (prev ? `${prev} ${text}` : text));
      },
      onTurnComplete: () => {
        // Commit live turn to transcript log
        setLiveUserTranscript((u) => {
          if (u.trim()) {
            setMessages((prev) => [
              ...prev,
              {
                id: `msg-${Date.now()}-u`,
                sender: 'user',
                text: u.trim(),
                timestamp: new Date().toISOString(),
              },
            ]);
          }
          return '';
        });

        setLiveAngelTranscript((a) => {
          if (a.trim()) {
            setMessages((prev) => [
              ...prev,
              {
                id: `msg-${Date.now()}-a`,
                sender: 'angel',
                text: a.trim(),
                timestamp: new Date().toISOString(),
              },
            ]);
          }
          return '';
        });
      },
      onError: (err) => {
        setErrorMessage(err);
      },
      onAudioLevel: (inLvl, outLvl) => {
        setInputLevel(inLvl);
        setOutputLevel(outLvl);
      },
    });

    liveClientRef.current = client;
    await client.connect();
  };

  const handleDisconnectLive = () => {
    if (liveClientRef.current) {
      liveClientRef.current.disconnect();
      liveClientRef.current = null;
    }
    setConnectionState('disconnected');
    setAngelState('idle');
    setInputLevel(0);
    setOutputLevel(0);
    setIsCameraActive(false);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (liveClientRef.current) {
      liveClientRef.current.setMuted(nextMuted);
    }
  };

  const handleTogglePushToTalk = (enabled: boolean) => {
    setIsPushToTalk(enabled);
    setAudioSettings((prev) => ({ ...prev, pushToTalk: enabled }));
    if (liveClientRef.current) {
      liveClientRef.current.setPushToTalk(enabled);
    }
  };

  const handlePushToTalkActive = (active: boolean) => {
    if (liveClientRef.current) {
      liveClientRef.current.setPushToTalkActive(active);
    }
  };

  const handleToggleCamera = useCallback(() => {
    setIsCameraActive((prev) => !prev);
  }, []);

  const handleSendImageFrame = useCallback((base64Jpeg: string) => {
    if (liveClientRef.current) {
      liveClientRef.current.sendImageFrame(base64Jpeg);
    }
  }, []);

  const handleUpdateAudioSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    setAudioSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (liveClientRef.current) {
        if (newSettings.micGain !== undefined) {
          liveClientRef.current.setMicGain(newSettings.micGain);
        }
        if (newSettings.outputVolume !== undefined) {
          liveClientRef.current.setOutputVolume(newSettings.outputVolume);
        }
      }
      return updated;
    });
  }, []);

  // Dual Fallback: Text/REST messaging
  const handleSendMessage = async (text: string, imageBase64?: string) => {
    if (!text && !imageBase64) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      text,
      imageUrl: imageBase64,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // If connected to Live API, stream through live socket
    if (connectionState === 'connected' && liveClientRef.current) {
      if (imageBase64) {
        const rawBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
        liveClientRef.current.sendImageFrame(rawBase64);
      }
      if (text) {
        liveClientRef.current.sendText(text);
      }
      return;
    }

    // Otherwise use server REST endpoint
    setIsChatLoading(true);
    setAngelState('thinking');

    try {
      const history = messages.slice(-8).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          contextImage: imageBase64,
          history,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        const angelMsg: ChatMessage = {
          id: `msg-${Date.now()}-a`,
          sender: 'angel',
          text: data.reply,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, angelMsg]);

        // Synthesize speech for response
        handlePlayTTS(data.reply);
      }
    } catch (e: any) {
      console.error('Chat error:', e);
      setErrorMessage('Failed to receive response from Angel');
    } finally {
      setIsChatLoading(false);
      setAngelState('idle');
    }
  };

  // Play TTS audio
  const handlePlayTTS = async (text: string) => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: audioSettings.voice }),
      });
      const data = await res.json();
      if (data.audio) {
        // Play audio buffer
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtxClass({ sampleRate: 24000 });
        const binaryString = atob(data.audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const int16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
          float32[i] = int16[i] < 0 ? int16[i] / 32768 : int16[i] / 32767;
        }
        const buffer = ctx.createBuffer(1, float32.length, 24000);
        buffer.getChannelData(0).set(float32);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(ctx.destination);
        setAngelState('speaking');
        src.start();
        src.onended = () => {
          setAngelState(connectionState === 'connected' ? 'listening' : 'idle');
        };
      }
    } catch (e) {
      console.error('TTS playback error:', e);
    }
  };

  // Vault Actions
  const handleAddMemory = async (
    category: MemoryItem['category'],
    content: string,
    importance: MemoryItem['importance']
  ) => {
    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, content, importance }),
      });
      const data = await res.json();
      if (data.memory) {
        setMemories((prev) => [data.memory, ...prev]);
      }
    } catch (e) {
      console.error('Failed to add memory:', e);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await fetch(`/api/memories/${id}`, { method: 'DELETE' });
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error('Failed to delete memory:', e);
    }
  };

  // Conversation Storage Actions
  const handleSaveConversationToVault = async () => {
    if (messages.length === 0) return;
    try {
      // Create meaningful title from first user message or date
      const firstUserMsg = messages.find((m) => m.sender === 'user')?.text;
      const title = firstUserMsg
        ? firstUserMsg.slice(0, 45) + (firstUserMsg.length > 45 ? '...' : '')
        : `Executive Consultation - ${new Date().toLocaleDateString()}`;

      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          messages,
          summary: `Archived dialogue with Angel consisting of ${messages.length} messages.`,
        }),
      });
      const data = await res.json();
      if (data.conversation) {
        setConversations((prev) => [data.conversation, ...prev]);
      }
    } catch (e) {
      console.error('Failed to save conversation to vault:', e);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error('Failed to delete conversation:', e);
    }
  };

  const handleRestoreConversation = (restoredMessages: ChatMessage[]) => {
    setMessages(restoredMessages);
    setActiveTab('voice');
  };

  const handleLaunchScenarioPrompt = (promptText: string) => {
    setActiveTab('voice');
    if (connectionState === 'connected') {
      liveClientRef.current?.sendText(promptText);
    } else {
      handleSendMessage(promptText);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-500/30 selection:text-amber-200 flex flex-col">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-amber-600/10 via-yellow-700/5 to-transparent blur-3xl rounded-full" />
        <div className="absolute -bottom-40 left-1/4 w-[500px] h-[400px] bg-gradient-to-t from-teal-900/10 to-transparent blur-3xl rounded-full" />
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-stone-800/80 bg-stone-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-600 to-yellow-700 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-stone-950 rounded-[14px] flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg font-semibold tracking-wide text-stone-100">
                  Angel
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  Live Voice Companion
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-mono tracking-tight hidden sm:block">
                M.D. • Ph.D. • Korea · Nigeria · Ghana · SA · US · China · Japan
              </p>
            </div>
          </div>

          {/* Quick Wake Word Status Pill & Nav Tabs */}
          <div className="flex items-center gap-2">
            {/* Wake Word Status Pill */}
            <button
              id="header-wake-word-status-pill"
              onClick={() => setActiveTab('settings')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition ${
                audioSettings.wakeWord?.enabled !== false
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
              title="Click to configure Wake Word & Voice Settings"
            >
              <Radio className={`w-3.5 h-3.5 ${audioSettings.wakeWord?.enabled !== false ? 'text-emerald-400 animate-pulse' : 'text-stone-500'}`} />
              <span>
                {audioSettings.wakeWord?.enabled !== false
                  ? `Wake Word: "${
                      audioSettings.wakeWord?.selectedPreset === 'custom' && audioSettings.wakeWord?.customKeyword
                        ? audioSettings.wakeWord.customKeyword
                        : audioSettings.wakeWord?.selectedPreset === 'wake_up_angel'
                        ? 'Wake up Angel'
                        : audioSettings.wakeWord?.selectedPreset === 'hello_angel'
                        ? 'Hello Angel'
                        : audioSettings.wakeWord?.selectedPreset === 'hi_angel'
                        ? 'Hi Angel'
                        : audioSettings.wakeWord?.selectedPreset === 'angel'
                        ? 'Angel'
                        : 'Hey Angel'
                    }"`
                  : 'Wake Word: Off'}
              </span>
            </button>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 p-1 bg-stone-900/90 rounded-2xl border border-stone-800">
              {[
                { id: 'voice', label: 'Live Voice', icon: <Sparkles className="w-4 h-4" /> },
                { id: 'vault', label: 'Memory Vault', icon: <Shield className="w-4 h-4" /> },
                { id: 'pulse', label: 'Global Pulse', icon: <Globe2 className="w-4 h-4" /> },
                { id: 'brainstorm', label: 'Strategy Hub', icon: <Lightbulb className="w-4 h-4" /> },
                { id: 'settings', label: 'Wake Word & Voice', icon: <Sliders className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 border border-transparent'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Wake Word Detection Alert Banner */}
      {wakeWordFlashMessage && (
        <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-stone-950 px-4 py-2 text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 animate-bounce">
          <Zap className="w-4 h-4 text-stone-950 animate-spin" />
          <span>⚡ {wakeWordFlashMessage}</span>
        </div>
      )}

      {/* Error notification banner */}
      {errorMessage && (
        <div className="bg-rose-950/80 border-b border-rose-800/80 px-4 py-2 text-xs text-rose-200 flex items-center justify-between max-w-7xl mx-auto w-full">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-100 ml-4 font-mono underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left / Primary Column: Visualizer & Controls OR Settings Tab */}
        <div className={activeTab === 'settings' ? 'lg:col-span-12 flex flex-col gap-5' : 'lg:col-span-7 flex flex-col gap-5'}>
          {activeTab === 'settings' && (
            <VoiceAndWakeSettings
              settings={audioSettings}
              onUpdateSettings={handleUpdateAudioSettings}
              onClose={() => setActiveTab('voice')}
            />
          )}

          {activeTab === 'voice' && (
            <div className="flex flex-col items-center justify-between p-6 rounded-3xl bg-gradient-to-b from-stone-900/80 to-stone-950/90 border border-stone-800/90 shadow-2xl backdrop-blur-2xl min-h-[520px]">
              {/* Persona Pill Note & Wake Word quick indicator */}
              <div className="w-full flex items-center justify-between text-xs text-stone-400 font-mono border-b border-stone-800/70 pb-3 flex-wrap gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Direct • Loyal • Unscripted
                </span>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-[10px] text-amber-300 transition"
                  title="Configure Wake Word in Settings"
                >
                  <Radio className="w-3 h-3 text-amber-400" />
                  <span>
                    Wake Word:{' '}
                    <strong>
                      {audioSettings.wakeWord?.enabled !== false
                        ? audioSettings.wakeWord?.selectedPreset === 'custom' && audioSettings.wakeWord?.customKeyword
                          ? `"${audioSettings.wakeWord.customKeyword}"`
                          : audioSettings.wakeWord?.selectedPreset === 'wake_up_angel'
                          ? '"Wake up Angel"'
                          : audioSettings.wakeWord?.selectedPreset === 'hello_angel'
                          ? '"Hello Angel"'
                          : audioSettings.wakeWord?.selectedPreset === 'hi_angel'
                          ? '"Hi Angel"'
                          : audioSettings.wakeWord?.selectedPreset === 'angel'
                          ? '"Angel"'
                          : '"Hey Angel"'
                        : 'Off'}
                    </strong>
                  </span>
                </button>
              </div>

              {/* Central Dynamic Orb */}
              <AngelOrbVisualizer
                state={angelState}
                inputLevel={inputLevel}
                outputLevel={outputLevel}
                isConnected={connectionState === 'connected'}
              />

              {/* Call Controls */}
              <LiveVoiceControls
                connectionState={connectionState}
                onConnect={handleConnectLive}
                onDisconnect={handleDisconnectLive}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
                isPushToTalk={isPushToTalk}
                onTogglePushToTalk={handleTogglePushToTalk}
                onPushToTalkActive={handlePushToTalkActive}
                isCameraActive={isCameraActive}
                onToggleCamera={handleToggleCamera}
                onSendImageFrame={handleSendImageFrame}
                audioSettings={audioSettings}
                onUpdateAudioSettings={handleUpdateAudioSettings}
                inputLevel={inputLevel}
                outputLevel={outputLevel}
              />
            </div>
          )}

          {activeTab === 'vault' && (
            <AngelVault
              memories={memories}
              conversations={conversations}
              onAddMemory={handleAddMemory}
              onDeleteMemory={handleDeleteMemory}
              onDeleteConversation={handleDeleteConversation}
              onRestoreConversation={handleRestoreConversation}
            />
          )}

          {activeTab === 'pulse' && (
            <WorldPulse
              onDiscussWithAngel={handleLaunchScenarioPrompt}
              onPlayTTS={handlePlayTTS}
            />
          )}

          {activeTab === 'brainstorm' && (
            <BrainstormStudio onSelectPrompt={handleLaunchScenarioPrompt} />
          )}

          {/* Quick Scenario Chips underneath Orb (when in voice mode) */}
          {activeTab === 'voice' && (
            <div className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800 space-y-2">
              <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant Consultation Starters</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    label: 'Critique my business pitch',
                    prompt: "Angel, I want your unfiltered opinion on my current business pitch. Point out where my assumptions fall flat.",
                  },
                  {
                    label: 'Tell me a corny one-liner',
                    prompt: "Angel, drop your best corny one-liner and share a quick observation from your travels today.",
                  },
                  {
                    label: 'Audit my focus & endurance',
                    prompt: "Angel, wearing your doctor's hat, how can I structure my recovery to avoid mental fatigue during high-stakes sprints?",
                  },
                  {
                    label: 'West Africa & Asia market check',
                    prompt: "Angel, based on your multi-country background, what cultural intuition am I missing for cross-border expansion?",
                  },
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLaunchScenarioPrompt(chip.prompt)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-stone-950/80 hover:bg-amber-500/10 border border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-amber-200 transition active:scale-95"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Transcript & Dual Chat Drawer (hidden when full-width settings is open) */}
        {activeTab !== 'settings' && (
          <div className="lg:col-span-5 flex flex-col gap-4 min-h-[550px]">
            {/* Transcript Viewer */}
            <div className="flex-1 min-h-[420px]">
              <TranscriptView
                messages={messages}
                onClearTranscript={() => setMessages([])}
                onSaveToVault={handleSaveConversationToVault}
                onPlayTTS={handlePlayTTS}
                liveUserTranscript={liveUserTranscript}
                liveAngelTranscript={liveAngelTranscript}
                isLiveActive={connectionState === 'connected'}
              />
            </div>

            {/* Text & Image Input Bar */}
            <ChatDrawer
              onSendMessage={handleSendMessage}
              isLoading={isChatLoading}
              isConnectedLive={connectionState === 'connected'}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-900 bg-stone-950/90 py-3 text-center text-xs text-stone-600 font-mono">
        Angel Conversational Voice Assistant • Powered by Gemini Live API & Multimodal Audio
      </footer>
    </div>
  );
}
