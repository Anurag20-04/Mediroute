import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, RotateCcw, Bot, User, Mic, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WELCOME_MSG = {
  id: 'init',
  sender: 'bot',
  text: "Welcome to MediRoute Triage Intelligence.\n\nI am your AI diagnostic assistant. Please describe your symptoms in detail so I can determine the appropriate care pathway.",
  timestamp: new Date(),
};

// ── Typewriter Effect Component ─────────────────────────────
function TypewriterText({ text, speed = 15, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[index]);
        setIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, speed, onComplete]);

  return <p className="whitespace-pre-wrap font-medium">{displayedText}</p>;
}

const STEPS = ['Symptoms', 'Identity', 'Clinical Data', 'Routing'];

const STEP_PLACEHOLDERS = {
  0: 'Describe your symptoms in detail...',
  1: 'Enter your full name...',
  2: 'Enter your age...',
  3: 'Enter your email for confirmation...',
  4: 'Processing neural routing...',
};

// ── Message Bubble ─────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.sender === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 16 : -16, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
        isUser
          ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-teal-500/20'
          : 'bg-white/70 text-slate-500 backdrop-blur-md border border-white/50'
      }`}>
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      <div className={`relative max-w-[78%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
        isUser
          ? 'bg-gradient-to-br from-teal-500/85 to-teal-600/90 backdrop-blur-md text-white border border-teal-400/30 rounded-tr-md shadow-lg shadow-teal-500/10'
          : 'bg-white/50 backdrop-blur-xl text-slate-700 border border-white/50 rounded-tl-md shadow-sm'
      }`}>
        {!isUser && msg.type === 'result' ? (
          <TypewriterText text={msg.text} />
        ) : (
          <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
        )}
        <div className={`flex items-center gap-1.5 mt-2 ${isUser ? 'justify-end text-teal-100/70' : 'text-slate-400'}`}>
          <p className="text-[9px] font-bold uppercase tracking-widest">
            {msg.timestamp?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {!isUser && <Sparkles size={8} className="text-teal-500/60" />}
        </div>
      </div>
    </motion.div>
  );
}

// ── Typing Indicator ───────────────────────────────────────────
function TypingDots() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
      <div className="w-9 h-9 rounded-xl bg-white/60 backdrop-blur-md border border-white/40 flex items-center justify-center shrink-0">
        <Bot size={15} className="text-teal-500" />
      </div>
      <div className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-2xl rounded-tl-md px-5 py-4 flex items-center gap-1.5 shadow-sm">
        {[0, 0.12, 0.24].map((d, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: d }}
            className="w-2 h-2 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(13,148,136,0.4)]"
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Auto-Resize Textarea ───────────────────────────────────────
function AutoResizeTextarea({ value, onChange, placeholder, disabled, onSubmit, inputRef }) {
  const textareaRef = useRef(null);

  // Merge refs
  useEffect(() => {
    if (inputRef) inputRef.current = textareaRef.current;
  }, [inputRef]);

  // Auto-resize height
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      rows={1}
      className="w-full resize-none overflow-hidden bg-transparent outline-none
        text-[14px] font-medium text-slate-700 placeholder:text-slate-400
        py-3 px-4 leading-relaxed"
      style={{ minHeight: '48px', maxHeight: '120px' }}
    />
  );
}

// ── Main Chat Interface ────────────────────────────────────────
export default function ChatInterface({ onSummaryUpdate }) {
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({});
  const [sessionId] = useState(() => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom whenever messages change
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  useEffect(() => {
    // Small delay to let DOM update
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, loading, scrollToBottom]);

  const handleSend = async (e) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || loading || done) return;

    setMessages(p => [...p, { id: Date.now(), text, sender: 'user', timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId, context }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      await new Promise(r => setTimeout(r, 500));

      setMessages(p => [...p, {
        id: Date.now() + 1,
        text: data.reply,
        sender: 'bot',
        type: data.is_complete ? 'result' : 'chat',
        timestamp: new Date(),
      }]);
      setContext(data.context || {});

      const newStep = !data.context?.symptoms ? 0
        : !data.context?.name ? 1
        : !data.context?.age ? 2
        : !data.context?.email ? 3
        : 4;
      setStep(newStep);

      if (data.is_complete && data.summary) {
        setDone(true);
        onSummaryUpdate(data.summary);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(p => [...p, {
        id: Date.now() + 1,
        text: 'Connection error. The medical core is taking longer than expected to respond (it may be waking up). Please try again in 30 seconds.',
        sender: 'bot',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  return (
    <div className="glass-panel flex flex-col overflow-hidden relative group
      h-[560px] lg:h-[600px] max-h-[calc(100vh-160px)]">

      {/* Decorative top glow */}
      <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-teal-500/4 to-transparent pointer-events-none z-0" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3.5 border-b border-white/15 shrink-0 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600
            flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-[13px] font-black text-slate-800 tracking-tight">Triage Intelligence</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
              <span className="text-[9px] text-teal-600 font-bold uppercase tracking-[0.12em]">Neural Link Active</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-8 h-8 flex items-center justify-center rounded-lg
            bg-white/20 hover:bg-white/40 border border-white/30
            transition-all text-slate-500 hover:text-slate-700"
          title="Reset conversation"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* ── Progress Stepper ── */}
      <div className="px-4 lg:px-6 py-2.5 border-b border-white/10 shrink-0 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-0.5">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black
                  transition-all duration-500 ${
                    i < step
                      ? 'bg-teal-500 text-white shadow-md shadow-teal-500/25'
                      : i === step
                        ? 'bg-white border-2 border-teal-500 text-teal-600 scale-110'
                        : 'bg-white/25 text-slate-400'
                  }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-tight hidden sm:inline ${
                  i <= step ? 'text-slate-700' : 'text-slate-400'
                }`}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-[2px] mx-1.5 rounded-full transition-all duration-700 ${
                  i < step
                    ? 'bg-teal-500 shadow-[0_0_4px_rgba(20,184,166,0.4)]'
                    : 'bg-white/15'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Messages (SCROLLABLE CONTAINER) ── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-4 relative"
        style={{ minHeight: 0 }}
      >
        <AnimatePresence initial={false}>
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          {loading && <TypingDots key="typing" />}
        </AnimatePresence>
        <div ref={messagesEndRef} style={{ height: 1 }} />
      </div>

      {/* ── Input Area ── */}
      <div className="px-4 lg:px-5 py-3 lg:py-4 border-t border-white/15 shrink-0 bg-white/15 backdrop-blur-xl">
        {done ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between bg-teal-500/8 border border-teal-500/20 rounded-xl px-5 py-3"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="text-teal-600" size={16} />
              <span className="text-teal-800 text-[13px] font-bold tracking-tight">
                Triage Complete — Patient Routed
              </span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-[11px] text-teal-600 font-bold flex items-center gap-1.5
                hover:scale-105 transition-transform uppercase tracking-widest"
            >
              <RotateCcw size={12} /> New Triage
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSend} className="flex items-end gap-3">
            <div className="relative flex-1 bg-white/50 backdrop-blur-md border border-white/40
              rounded-xl shadow-sm focus-within:border-teal-400/40 focus-within:shadow-[0_0_0_3px_rgba(13,148,136,0.08)]
              transition-all overflow-hidden">
              <AutoResizeTextarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={STEP_PLACEHOLDERS[step] || 'Type your response...'}
                disabled={loading}
                onSubmit={() => handleSend()}
                inputRef={inputRef}
              />
              <div className="absolute right-3 bottom-3">
                <Mic size={16} className="text-slate-300 hover:text-teal-500 cursor-pointer transition-colors" />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary !p-0 !w-11 !h-11 !rounded-xl flex items-center justify-center shadow-lg
                hover:scale-105 transition-transform shrink-0"
            >
              <Send size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
