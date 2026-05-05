import { create } from "zustand";

// Map language codes to backend language names
const LANG_CODE_TO_NAME: Record<string, string> = {
  hi: "hindi",
  ta: "tamil",
  bn: "bengali",
  te: "telugu",
  mr: "marathi",
  gu: "gujarati",
  kn: "kannada",
  en: "english",
};

export function getLanguageName(code: string): string {
  return LANG_CODE_TO_NAME[code] || "english";
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  processingTime?: number;
  model?: string;
  language?: string;
  reaction?: "up" | "down" | null;
  bookmarked?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  language: string;
  createdAt: number;
  updatedAt: number;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface SampleQuery {
  id: number;
  hindi: string;
  english: string;
  category: string;
}

// ---------------------------------------------------------------------------
// localStorage helpers (with SSR / private-browsing safety)
// ---------------------------------------------------------------------------
const STORAGE_KEY_MESSAGES = "arthasathi-messages";
const STORAGE_KEY_LANGUAGE = "arthasathi-language";
const STORAGE_KEY_CONVERSATIONS = "arthasathi-conversations";
const STORAGE_KEY_CURRENT_CONV = "arthasathi-current-conv";
const MAX_STORED_MESSAGES = 50;

function loadMessages(): Message[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-MAX_STORED_MESSAGES);
  } catch {
    return [];
  }
}

function saveMessages(messages: Message[]) {
  try {
    if (typeof window === "undefined") return;
    const toStore = messages.slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(toStore));
  } catch {
    // localStorage may be full or disabled
  }
}

function loadLanguage(): string {
  try {
    if (typeof window === "undefined") return "hi";
    const stored = localStorage.getItem(STORAGE_KEY_LANGUAGE);
    if (stored && typeof stored === "string") return stored;
  } catch {
    // ignore
  }
  return "hi";
}

function saveLanguage(lang: string) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY_LANGUAGE, lang);
  } catch {
    // ignore
  }
}

function loadConversations(): Conversation[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
  } catch {
    // ignore
  }
}

function loadCurrentConvId(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(STORAGE_KEY_CURRENT_CONV);
    if (stored) return stored;
  } catch {
    // ignore
  }
  return null;
}

function saveCurrentConvId(id: string | null) {
  try {
    if (typeof window === "undefined") return;
    if (id) {
      localStorage.setItem(STORAGE_KEY_CURRENT_CONV, id);
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_CONV);
    }
  } catch {
    // ignore
  }
}

function clearStorage() {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY_MESSAGES);
    localStorage.removeItem(STORAGE_KEY_LANGUAGE);
  } catch {
    // ignore
  }
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  language: string;
  languages: Language[];
  sampleQueries: SampleQuery[];
  isSidebarOpen: boolean;
  activeTab: "conversations" | "queries" | "rates" | "schemes" | "tax" | "model";
  error: string | null;

  // Conversations
  conversations: Conversation[];
  currentConversationId: string | null;

  // Actions
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  sendMessage: (content: string) => Promise<void>;
  setLanguage: (language: string) => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: "conversations" | "queries" | "rates" | "schemes" | "tax" | "model") => void;
  clearChat: () => void;
  setLanguages: (languages: Language[]) => void;
  setSampleQueries: (queries: SampleQuery[]) => void;
  setReaction: (messageId: string, reaction: "up" | "down" | null) => void;
  toggleBookmark: (messageId: string) => void;

  // Conversation actions
  createConversation: () => string;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: loadMessages(),
  isLoading: false,
  language: loadLanguage(),
  languages: [
    { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు" },
    { code: "mr", name: "Marathi", nativeName: "मराठी" },
    { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
    { code: "en", name: "English", nativeName: "English" },
  ],
  sampleQueries: [],
  isSidebarOpen: true,
  activeTab: "queries",
  error: null,

  // Conversations
  conversations: loadConversations(),
  currentConversationId: loadCurrentConvId(),

  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    set((state) => {
      const updated = [...state.messages, newMessage];
      saveMessages(updated);

      // Also update the current conversation if one exists
      const { currentConversationId, conversations } = state;
      if (currentConversationId) {
        const convIdx = conversations.findIndex((c) => c.id === currentConversationId);
        if (convIdx !== -1) {
          const updatedConvs = [...conversations];
          updatedConvs[convIdx] = {
            ...updatedConvs[convIdx],
            messages: updated,
            updatedAt: Date.now(),
            // Auto-update title from first user message if it's still the default
            title:
              updatedConvs[convIdx].title.startsWith("New Chat")
              && message.role === "user"
              ? message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "")
              : updatedConvs[convIdx].title,
          };
          saveConversations(updatedConvs);
          return {
            messages: updated,
            conversations: updatedConvs,
          };
        }
      }

      return { messages: updated };
    });
  },

  sendMessage: async (content: string) => {
    const { language, messages, addMessage } = get();

    addMessage({ role: "user", content });
    set({ isLoading: true, error: null });

    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          language: getLanguageName(language),
          history,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();

      addMessage({
        role: "assistant",
        content: data.response,
        processingTime: data.processingTime,
        model: data.model,
        language: data.language,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      set({ error: errorMessage });
      addMessage({
        role: "assistant",
        content: `⚠️ Error: ${errorMessage}. Please try again.`,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  setLanguage: (language) => {
    set({ language });
    saveLanguage(language);
  },

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setActiveTab: (activeTab) => set({ activeTab }),

  clearChat: () => {
    const { currentConversationId, conversations } = get();
    set({ messages: [], error: null });
    clearStorage();

    // Also clear the current conversation's messages
    if (currentConversationId) {
      const convIdx = conversations.findIndex((c) => c.id === currentConversationId);
      if (convIdx !== -1) {
        const updatedConvs = [...conversations];
        updatedConvs[convIdx] = {
          ...updatedConvs[convIdx],
          messages: [],
          updatedAt: Date.now(),
        };
        saveConversations(updatedConvs);
        set({ conversations: updatedConvs });
      }
    }
  },

  setLanguages: (languages) => set({ languages }),

  setSampleQueries: (sampleQueries) => set({ sampleQueries }),

  setReaction: (messageId, reaction) => {
    set((state) => {
      const updated = state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, reaction } : msg
      );
      saveMessages(updated);

      // Also update in conversations
      const { currentConversationId, conversations } = state;
      if (currentConversationId) {
        const convIdx = conversations.findIndex((c) => c.id === currentConversationId);
        if (convIdx !== -1) {
          const updatedConvs = [...conversations];
          updatedConvs[convIdx] = {
            ...updatedConvs[convIdx],
            messages: updated,
            updatedAt: Date.now(),
          };
          saveConversations(updatedConvs);
          return { messages: updated, conversations: updatedConvs };
        }
      }

      return { messages: updated };
    });
  },

  toggleBookmark: (messageId) => {
    set((state) => {
      const updated = state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, bookmarked: !msg.bookmarked } : msg
      );
      saveMessages(updated);

      const { currentConversationId, conversations } = state;
      if (currentConversationId) {
        const convIdx = conversations.findIndex((c) => c.id === currentConversationId);
        if (convIdx !== -1) {
          const updatedConvs = [...conversations];
          updatedConvs[convIdx] = {
            ...updatedConvs[convIdx],
            messages: updated,
            updatedAt: Date.now(),
          };
          saveConversations(updatedConvs);
          return { messages: updated, conversations: updatedConvs };
        }
      }

      return { messages: updated };
    });
  },

  // ---- Conversation actions ----

  createConversation: () => {
    const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    const newConv: Conversation = {
      id,
      title: `New Chat ${now}`,
      messages: [],
      language: get().language,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const updatedConvs = [newConv, ...state.conversations];
      saveConversations(updatedConvs);
      saveCurrentConvId(id);
      return {
        conversations: updatedConvs,
        currentConversationId: id,
        messages: [],
        error: null,
      };
    });
    clearStorage(); // Clear standalone messages since we're in a conversation now
    return id;
  },

  switchConversation: (id: string) => {
    const { conversations } = get();
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;

    // Save current messages to current conversation first
    set((state) => {
      let updatedConvs = [...state.conversations];
      if (state.currentConversationId) {
        const curIdx = updatedConvs.findIndex((c) => c.id === state.currentConversationId);
        if (curIdx !== -1) {
          updatedConvs[curIdx] = {
            ...updatedConvs[curIdx],
            messages: state.messages,
            updatedAt: Date.now(),
          };
        }
      }
      saveConversations(updatedConvs);
      saveCurrentConvId(id);
      saveMessages(conv.messages);
      return {
        conversations: updatedConvs,
        currentConversationId: id,
        messages: conv.messages,
        error: null,
      };
    });
  },

  deleteConversation: (id: string) => {
    set((state) => {
      const updatedConvs = state.conversations.filter((c) => c.id !== id);
      saveConversations(updatedConvs);

      // If deleting current conversation, switch to another or clear
      if (state.currentConversationId === id) {
        if (updatedConvs.length > 0) {
          const nextConv = updatedConvs[0];
          saveCurrentConvId(nextConv.id);
          saveMessages(nextConv.messages);
          return {
            conversations: updatedConvs,
            currentConversationId: nextConv.id,
            messages: nextConv.messages,
          };
        } else {
          saveCurrentConvId(null);
          saveMessages([]);
          return {
            conversations: updatedConvs,
            currentConversationId: null,
            messages: [],
          };
        }
      }

      return { conversations: updatedConvs };
    });
  },

  updateConversationTitle: (id: string, title: string) => {
    set((state) => {
      const updatedConvs = state.conversations.map((c) =>
        c.id === id ? { ...c, title, updatedAt: Date.now() } : c
      );
      saveConversations(updatedConvs);
      return { conversations: updatedConvs };
    });
  },
}));
