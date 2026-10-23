import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, Sprout, Dice5, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { ChatMessage } from '../types/yuki';

interface GeminiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'km' | 'en';
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-0',
    role: 'model',
    text: `Hello! I am FloraBot & Yuki Master. I can help you with two key areas:\n\n1. 🌿 **Gardening & Plant Care**: Identify plants, diagnose yellow leaves, fix pests, and create optimal watering schedules.\n2. 🎲 **Yuki 12 Game**: Understand odds, why single numbers pay 11x (e.g. bet 10,000៛ pays back 110,000៛), Small (1-6) vs Big (7-12), and bead road analysis.\n\nHow can I help you today?`,
    timestamp: 'Just now',
  },
];

const SUGGESTIONS = [
  'How often should I water my indoor plants?',
  'Why does Yuki 12 pay back 11 times on numbers 1-12?',
  'What are the winning rules for Small (1-6) & Big (7-12)?',
  'Which plants bring the best luck and prosperity?',
  'My plant leaves are turning yellow, what should I do?',
];

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({ isOpen, onClose, lang }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [roleMode, setRoleMode] = useState<'gardener' | 'yuki' | 'combined'>('combined');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const getSystemInstruction = () => {
    if (roleMode === 'gardener') {
      return 'You are an experienced master botanist and plant doctor. Provide actionable, concise, friendly, and practical plant care advice covering watering schedules, sunlight needs, soil, and diagnosing leaf problems.';
    }
    if (roleMode === 'yuki') {
      return 'You are the official mathematical analyst for the Yuki 12 Khmer lottery game. Explain that 1-6 is Small (pays 1.95x), 7-12 is Big (pays 1.95x), Red/Green/Blue pay 2.95x, and single numbers 1-12 pay 11 times payback (e.g. betting 10,000 Riel pays 110,000 Riel). Advise on responsible play and statistical patterns.';
    }
    return 'You are FloraBot & Yuki Master, an expert bilingual assistant who bridges botanical science with Yuki 12 lottery probabilities, lucky plants, and detailed plant care instructions. Be encouraging, clear, and structured.';
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, text: m.text })),
          systemInstruction: getSystemInstruction(),
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: data.text || data.fallbackText || 'Sorry, I could not generate a response.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: 'Sorry, there was an error communicating with Gemini. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[86vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/20 shadow-inner">
              <Bot className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm leading-none">FloraBot & Yuki Assistant</h3>
                <span className="bg-emerald-400 text-blue-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                  Multi-Turn AI
                </span>
              </div>
              <p className="text-[11px] text-blue-200 mt-0.5">
                {lang === 'km'
                  ? 'ជំនួយការឆ្លាតវៃសម្រាប់រុក្ខជាតិ និងស្ថិតិឆ្នោតយូគី'
                  : 'Botanical diagnostics & Yuki 12 odds intelligence'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMessages(INITIAL_MESSAGES)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-blue-200 hover:text-white transition"
              title="Clear chat history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Persona & Model Selection Subbar */}
        <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Role selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Role:</span>
            <button
              onClick={() => setRoleMode('combined')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                roleMode === 'combined'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              🌟 Dual Expert
            </button>
            <button
              onClick={() => setRoleMode('gardener')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                roleMode === 'gardener'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              🌿 Plant Doctor
            </button>
            <button
              onClick={() => setRoleMode('yuki')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                roleMode === 'yuki'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              🎲 Yuki Analyst
            </button>
          </div>

          {/* Model selection pill */}
          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-slate-500 font-bold">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-mono text-[10px] text-slate-700 font-bold focus:outline-none"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (General)</option>
              <option value="gemini-4-argon">gemini-4-argon (Complex)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
            </select>
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 max-w-[85%] ${
                m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs shadow-xs ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-gradient-to-tr from-amber-400 to-yellow-200 text-blue-950 font-black border border-yellow-300'
                }`}
              >
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`p-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}
              >
                {m.text}
                <div
                  className={`text-[9px] mt-1 text-right ${
                    m.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs mr-auto bg-white border border-slate-200 px-3 py-2 rounded-2xl">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>FloraBot is thinking with {selectedModel}...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Pills */}
        <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={`sug-${idx}`}
              onClick={() => handleSendMessage(s)}
              disabled={loading}
              className="text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-2.5 py-1 rounded-full whitespace-nowrap transition border border-slate-200 shrink-0"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={
              lang === 'km'
                ? 'សួរសំណួរអំពីការថែទាំរុក្ខជាតិ ឬច្បាប់ឆ្នោតយូគី...'
                : 'Ask about plant care, yellow leaves, or Yuki 12 odds...'
            }
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white p-2.5 rounded-xl shadow-xs transition flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
