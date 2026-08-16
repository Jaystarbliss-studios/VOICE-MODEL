import React, { useState } from 'react';
import { MemoryItem, StoredConversation, ChatMessage } from '../types';
import {
  Lock,
  Plus,
  Trash2,
  Bookmark,
  Briefcase,
  HeartPulse,
  Bell,
  Shield,
  Search,
  Sparkles,
  MessageSquare,
  History,
  RotateCcw,
  Eye,
  Calendar,
  Layers,
  ArrowRight,
  User,
} from 'lucide-react';

interface AngelVaultProps {
  memories: MemoryItem[];
  conversations: StoredConversation[];
  onAddMemory: (category: MemoryItem['category'], content: string, importance: MemoryItem['importance']) => void;
  onDeleteMemory: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRestoreConversation: (messages: ChatMessage[]) => void;
}

export const AngelVault: React.FC<AngelVaultProps> = ({
  memories,
  conversations,
  onAddMemory,
  onDeleteMemory,
  onDeleteConversation,
  onRestoreConversation,
}) => {
  const [vaultView, setVaultView] = useState<'memories' | 'conversations'>('conversations');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('personal');
  const [newImportance, setNewImportance] = useState<MemoryItem['importance']>('medium');
  const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);

  const categories: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Vault Notes', icon: <Bookmark className="w-3.5 h-3.5" /> },
    { id: 'personal', label: 'Personal & Habits', icon: <Bookmark className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'business', label: 'Business Strategy', icon: <Briefcase className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'health', label: 'Health & Medical', icon: <HeartPulse className="w-3.5 h-3.5 text-rose-400" /> },
    { id: 'reminder', label: 'Reminders & Milestones', icon: <Bell className="w-3.5 h-3.5 text-yellow-400" /> },
    { id: 'confidential', label: 'Confidential & Private', icon: <Lock className="w-3.5 h-3.5 text-purple-400" /> },
  ];

  const filteredMemories = memories.filter((m) => {
    const matchesCat = activeCategory === 'all' || m.category === activeCategory;
    const matchesSearch = m.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesTitle = c.title.toLowerCase().includes(q);
    const matchesSummary = c.summary?.toLowerCase().includes(q) || false;
    const matchesMsg = c.messages?.some((m) => m.text.toLowerCase().includes(q)) || false;
    return matchesTitle || matchesSummary || matchesMsg;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    onAddMemory(newCategory, newContent.trim(), newImportance);
    setNewContent('');
    setShowAddModal(false);
  };

  const getBadgeStyle = (cat: MemoryItem['category']) => {
    switch (cat) {
      case 'business':
        return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
      case 'health':
        return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
      case 'reminder':
        return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300';
      case 'confidential':
        return 'border-purple-500/30 bg-purple-500/10 text-purple-300';
      default:
        return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    }
  };

  return (
    <div id="angel-vault-panel" className="flex flex-col h-full rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 font-mono">
              Angel's Memory Vault & Stored Conversations
            </h3>
            <p className="text-[11px] text-zinc-400">
              Where your previous conversations and strategic memories are securely preserved.
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setVaultView('conversations')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
              vaultView === 'conversations'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Chat History ({conversations.length})</span>
          </button>
          <button
            onClick={() => setVaultView('memories')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
              vaultView === 'memories'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Memory Notes ({memories.length})</span>
          </button>
        </div>
      </div>

      {/* Search & Action Bar */}
      <div className="p-3 border-b border-zinc-800/80 space-y-2.5 bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder={
                vaultView === 'conversations'
                  ? 'Search past conversations by title or topic...'
                  : "Search Angel's memory notes..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {vaultView === 'memories' && (
            <button
              id="add-memory-btn"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-medium transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Note</span>
            </button>
          )}
        </div>

        {vaultView === 'memories' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg shrink-0 transition text-xs font-medium ${
                  activeCategory === c.id
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                    : 'bg-zinc-950/40 text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                {c.icon}
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {vaultView === 'conversations' ? (
          /* Stored Conversations List */
          filteredConversations.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
              <History className="w-8 h-8 text-zinc-600" />
              <p className="text-xs text-zinc-400 font-medium">No previous conversations recorded yet.</p>
              <p className="text-[11px] text-zinc-500 max-w-sm">
                Any dialogue or voice session with Angel can be saved directly using the "Save to Vault" button in the Live Dialogue tab.
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-amber-500/40 transition group space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </span>
                    <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-amber-300 transition">
                      {conv.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-600" />
                      {new Date(conv.createdAt).toLocaleDateString()} {new Date(conv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => onDeleteConversation(conv.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-1 rounded transition"
                      title="Delete Conversation from Vault"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {conv.summary && (
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                    {conv.summary}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                  <span className="text-[10px] font-mono text-zinc-500">
                    {conv.messages?.length || conv.messageCount || 0} dialogue turns
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedConversation(conv)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
                    >
                      <Eye className="w-3 h-3 text-zinc-400" />
                      <span>Review</span>
                    </button>
                    <button
                      onClick={() => onRestoreConversation(conv.messages)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-medium transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Load into Chat</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          /* Memory Notes List */
          filteredMemories.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center text-zinc-500 space-y-1">
              <Sparkles className="w-6 h-6 text-zinc-600" />
              <p className="text-xs">No memories found in this section.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs text-amber-400 hover:underline pt-1"
              >
                Record a context point or preference
              </button>
            </div>
          ) : (
            filteredMemories.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-amber-500/30 transition group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-medium uppercase px-2 py-0.5 rounded-md border ${getBadgeStyle(
                      item.category
                    )}`}
                  >
                    {item.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => onDeleteMemory(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-0.5 rounded transition"
                      title="Delete Memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-200 leading-relaxed">{item.content}</p>
              </div>
            ))
          )
        )}
      </div>

      {/* Review Conversation Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-zinc-900 border border-amber-500/40 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>{selectedConversation.title}</span>
                </h4>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Recorded on {new Date(selectedConversation.createdAt).toLocaleString()} • {selectedConversation.messages.length} messages
                </p>
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                Close
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-950/40">
              {selectedConversation.messages.map((m, idx) => {
                const isAngel = m.sender === 'angel';
                return (
                  <div
                    key={idx}
                    className={`flex gap-3 text-xs ${
                      isAngel ? 'items-start' : 'items-start flex-row-reverse'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                        isAngel
                          ? 'border-amber-500/40 bg-gradient-to-tr from-amber-600 to-yellow-400 text-stone-950 font-serif font-bold text-[10px]'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {isAngel ? 'A' : <User className="w-3 h-3" />}
                    </div>

                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 space-y-1 ${
                        isAngel
                          ? 'bg-zinc-900 border border-zinc-800 text-zinc-100'
                          : 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 text-amber-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                      <span className="text-[9px] text-zinc-500 block font-mono">
                        {new Date(m.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-mono">Preserved in Angel's Vault</span>
              <button
                onClick={() => {
                  onRestoreConversation(selectedConversation.messages);
                  setSelectedConversation(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Load this Dialogue into Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="w-full max-w-md p-5 rounded-2xl bg-zinc-900 border border-amber-500/40 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>Store Fact in Angel's Memory</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-zinc-400">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                <option value="personal">Personal Habits & Preferences</option>
                <option value="business">Business & Strategic Ventures</option>
                <option value="health">Medical & Clinical Wellness</option>
                <option value="reminder">Reminders & Key Dates</option>
                <option value="confidential">Confidential & Private Details</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-zinc-400">Memory Note Content</label>
              <textarea
                rows={3}
                placeholder="e.g., Currently vetting a cross-border logistics pilot in Accra. Values high-yield ROI over vanity metrics..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium text-xs shadow-md shadow-amber-500/20"
              >
                Commit to Memory
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
