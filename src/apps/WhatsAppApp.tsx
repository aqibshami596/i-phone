import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Lock,
  MessageCircle,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useOS } from '../os/OSContext';

export const WhatsAppApp: React.FC = () => {
  const { state, pushNotification } = useOS();
  const [tab, setTab] = useState<'official' | 'business'>('official');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [businessConfigured, setBusinessConfigured] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/whatsapp/config')
      .then((r) => r.json())
      .then((d) => setBusinessConfigured(Boolean(d?.businessApiConfigured)))
      .catch(() => setBusinessConfigured(false));
  }, []);

  const digits = phone.replace(/[^\d]/g, '');
  const waMeHref = digits
    ? `https://wa.me/${digits}${message.trim() ? `?text=${encodeURIComponent(message.trim())}` : ''}`
    : 'https://web.whatsapp.com';

  const handleSendBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendResult(null);
    if (!digits || !message.trim()) {
      setSendResult({ ok: false, text: 'Enter a valid international phone number and message.' });
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: digits, text: message.trim() }),
      });
      const data = await res.json();
      if (res.ok && data?.sent) {
        setSendResult({
          ok: true,
          text: `Delivered via WhatsApp Business Cloud API (${data.messageId || 'accepted'})`,
        });
        pushNotification('whatsapp', 'WhatsApp Business', `Message accepted for +${digits}`);
        setMessage('');
      } else {
        setSendResult({ ok: false, text: data?.error || 'Business Cloud API unavailable.' });
      }
    } catch {
      setSendResult({ ok: false, text: 'Network error reaching server WhatsApp gateway.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <div className="px-4 pt-3 pb-2.5 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-none">WhatsApp</h1>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Official Service &amp; Business Platform
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
            End-to-End Encrypted
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 bg-zinc-200/70 dark:bg-zinc-900 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTab('official')}
            className={`py-1.5 rounded-lg transition-colors ${
              tab === 'official' ? 'bg-white dark:bg-zinc-800 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'
            }`}
          >
            Official Links
          </button>
          <button
            onClick={() => setTab('business')}
            className={`py-1.5 rounded-lg transition-colors ${
              tab === 'business' ? 'bg-white dark:bg-zinc-800 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'
            }`}
          >
            Business API
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-start gap-2.5 text-[11px] text-emerald-800 dark:text-emerald-200 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            Personal WhatsApp chats cannot be accessed from third-party browsers without official WhatsApp auth. No fake accounts or simulated message deliveries are shown.
          </span>
        </div>

        {tab === 'official' ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-3">
              <p className="text-xs font-bold">Official Click-to-Chat (wa.me)</p>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="International number (e.g. +1 408 555 0142)"
                className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs outline-none"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Pre-fill message for official WhatsApp..."
                className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs outline-none resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={waMeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  Open wa.me Chat <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://web.whatsapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  WhatsApp Web <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-500 uppercase">Select Contact to Fill Number</p>
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                {state.contacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setPhone(c.phone)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <div>
                      <p className="text-xs font-semibold">{c.name}</p>
                      <p className="text-[11px] text-zinc-500">{c.phone}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Select</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendBusiness} className="space-y-3">
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-500" /> Meta Cloud API Status
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    businessConfigured
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-amber-500/15 text-amber-500'
                  }`}
                >
                  {businessConfigured ? 'Server Connected' : 'Not Configured'}
                </span>
              </div>
              {!businessConfigured && (
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Server-side WhatsApp Business Cloud credentials are not set. Official delivery cannot succeed until configured on the backend; no fake messages will be simulated.
                </p>
              )}
            </div>

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Recipient Phone (with country code)"
              className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-xs outline-none"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Business template / session message..."
              className="w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-xs outline-none resize-none"
            />

            {sendResult && (
              <div
                className={`rounded-xl p-2.5 text-xs flex items-start gap-2 ${
                  sendResult.ok
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                }`}
              >
                {sendResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{sendResult.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? 'Sending via Cloud API...' : 'Send via WhatsApp Business API'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
