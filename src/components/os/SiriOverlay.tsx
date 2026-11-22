import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mic, Send, Sparkles, Volume2, X } from 'lucide-react';
import { useOS } from '../../os/OSContext';

export const SiriOverlay: React.FC = () => {
  const {
    setSiriOpen,
    openApp,
    updateSettings,
    toggleFlashlight,
    startTimer,
    toggleMusic,
    musicPlaying,
    state,
  } = useOS();

  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'siri'; text: string }>>([
    { role: 'siri', text: 'Hi! Ask me anything, or say "Open YouTube", "Set a 2 minute timer", or "Turn on Dark Mode".' },
  ]);

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !state.settings.soundEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.04;
      window.speechSynthesis.speak(utter);
    } catch {
      // ignore TTS errors
    }
  };

  const executeAction = (actionType: string, actionTarget: string) => {
    switch (actionType) {
      case 'open_app':
        if (actionTarget) {
          setTimeout(() => {
            setSiriOpen(false);
            openApp(actionTarget);
          }, 900);
        }
        break;
      case 'set_dark_mode':
        updateSettings({ darkMode: actionTarget === 'true' });
        break;
      case 'set_flashlight':
        if (actionTarget === 'true' || actionTarget === 'false') {
          toggleFlashlight();
        }
        break;
      case 'start_timer': {
        const secs = Math.max(5, Number(actionTarget) || 60);
        startTimer(secs);
        break;
      }
      case 'play_music':
        if (!musicPlaying) toggleMusic();
        break;
      case 'search_web':
        setTimeout(() => {
          setSiriOpen(false);
          openApp('google', actionTarget);
        }, 900);
        break;
      default:
        break;
    }
  };

  const submitQuery = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/siri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          context: `Battery ${state.batteryLevel}%, DarkMode ${state.settings.darkMode}, Time ${new Date().toLocaleTimeString()}`,
        }),
      });
      const data = await res.json();
      const replyText = data.reply || "I've handled that for you.";
      setMessages((prev) => [...prev, { role: 'siri', text: replyText }]);
      speak(replyText);
      if (data.actionType && data.actionType !== 'none') {
        executeAction(data.actionType, data.actionTarget || '');
      }
    } catch {
      const fallback = 'Unable to reach assistant right now, but you can launch any app directly.';
      setMessages((prev) => [...prev, { role: 'siri', text: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceRecognition = () => {
    const Win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
    };
    const SR = Win.SpeechRecognition || Win.webkitSpeechRecognition;
    if (!SR) {
      setMessages((prev) => [
        ...prev,
        { role: 'siri', text: 'Voice recognition is unavailable in this browser. Type your request below!' },
      ]);
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript || '';
      setListening(false);
      if (transcript) submitQuery(transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black/55 backdrop-blur-xl flex flex-col justify-between p-5 pt-14 pb-7 text-white"
      onClick={() => setSiriOpen(false)}
    >
      {/* Apple Intelligence Edge Halo */}
      <div className="pointer-events-none absolute inset-0 rounded-[46px] border-2 border-sky-400/50 shadow-[inset_0_0_40px_rgba(56,189,248,0.32)] animate-siri-glow" />

      <div className="relative z-10 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold">Siri AI</span>
        </div>
        <button
          onClick={() => setSiriOpen(false)}
          className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center"
          aria-label="Close Siri"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Thread */}
      <div
        className="relative z-10 flex-1 overflow-y-auto no-scrollbar space-y-2.5 my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
              m.role === 'user'
                ? 'ml-auto bg-blue-600 text-white'
                : 'mr-auto liquid-glass-dark text-zinc-100'
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="mr-auto liquid-glass-dark rounded-2xl px-4 py-2.5 text-xs text-zinc-300">
            Thinking...
          </div>
        )}
      </div>

      {/* Quick Prompts + Input */}
      <div className="relative z-10 space-y-2.5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {['Open Camera', 'Set 1 min timer', 'What time is it?', 'Open YouTube'].map((chip) => (
            <button
              key={chip}
              onClick={() => submitQuery(chip)}
              className="px-3 py-1.5 rounded-full bg-white/12 hover:bg-white/20 text-[11px] font-medium whitespace-nowrap shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitQuery(input);
          }}
          className="flex items-center gap-2 liquid-glass-dark rounded-full p-1.5 pl-3.5"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? 'Listening...' : 'Ask Siri...'}
            className="flex-1 bg-transparent text-xs text-white placeholder-zinc-400 outline-none"
          />
          <button
            type="button"
            onClick={startVoiceRecognition}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              listening ? 'bg-rose-500 animate-pulse text-white' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title="Voice Input"
          >
            {listening ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            type="submit"
            className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </motion.div>
  );
};
