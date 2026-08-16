export type LiveConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type AngelState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted' | 'muted';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'angel';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
  audioBase64?: string;
  imageUrl?: string;
  tag?: string;
}

export interface MemoryItem {
  id: string;
  category: 'personal' | 'business' | 'health' | 'reminder' | 'confidential';
  content: string;
  timestamp: string;
  importance: 'high' | 'medium' | 'low';
}

export interface WorldPulseItem {
  id: string;
  region: string;
  title: string;
  summary: string;
  angelNote: string;
}

export type WakeWordPreset =
  | 'hey_angel'
  | 'wake_up_angel'
  | 'hello_angel'
  | 'hi_angel'
  | 'angel'
  | 'hey_shawn'
  | 'custom';

export interface WakeWordConfig {
  enabled: boolean;
  selectedPreset: WakeWordPreset;
  customKeyword: string;
  sensitivity: 'low' | 'medium' | 'high';
  autoRespond: boolean;
  wakeGreetingPrompt: string;
  soundFeedback: boolean;
}

export interface AudioSettings {
  voice: string;
  micGain: number;
  outputVolume: number;
  pushToTalk: boolean;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  wakeWord: WakeWordConfig;
}

export interface StoredConversation {
  id: string;
  title: string;
  summary?: string;
  messageCount: number;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  isLiveSession?: boolean;
}

export interface ScenarioPrompt {
  id: string;
  title: string;
  badge: string;
  description: string;
  prompt: string;
  category: 'strategy' | 'negotiation' | 'wellness' | 'culture' | 'humor';
}
