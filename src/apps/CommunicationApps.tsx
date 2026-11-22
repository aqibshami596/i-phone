import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  Edit3,
  Image as ImageIcon,
  Lock,
  Mail as MailIcon,
  Mic,
  MicOff,
  PenSquare,
  Phone,
  Plus,
  Search,
  Send,
  Star,
  Trash2,
  UserPlus,
  Video,
} from 'lucide-react';
import { useOS } from '../os/OSContext';
import { soundEngine } from '../os/soundEngine';

export { PhoneApp } from './PhoneApp';

/* ==================== CONTACTS APP ==================== */
export const ContactsApp: React.FC = () => {
  const { state, setPersisted, startCall, openApp } = useOS();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCompany, setNewCompany] = useState('');

  const selected = state.contacts.find((c) => c.id === selectedId);
  const list = state.contacts.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  if (adding) {
    return (
      <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setAdding(false);
              setNewName('');
              setNewPhone('');
              setNewEmail('');
              setNewCompany('');
            }}
            className="text-xs text-blue-500 font-semibold"
          >
            Cancel
          </button>
          <h2 className="text-sm font-bold">New Contact</h2>
          <button
            onClick={() => {
              if (!newName.trim()) return;
              setPersisted((os) => ({
                ...os,
                contacts: [
                  {
                    id: `c-${Date.now()}`,
                    name: newName.trim(),
                    phone: newPhone.trim() || '+1 (555) 010-0000',
                    email: newEmail.trim() || 'contact@icloud.com',
                    company: newCompany.trim() || undefined,
                    avatarColor: 'from-blue-500 to-indigo-600',
                  },
                  ...os.contacts,
                ],
              }));
              setNewName('');
              setNewPhone('');
              setNewEmail('');
              setNewCompany('');
              setAdding(false);
            }}
            className="text-xs text-blue-500 font-bold"
          >
            Save
          </button>
        </div>
        <div className="space-y-3">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full Name" className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none" />
          <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone Number or 180-XXXX" className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none" />
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email Address" className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none" />
          <input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Company (optional)" className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none" />
        </div>
      </div>
    );
  }

  if (selected && editing) {
    return (
      <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setEditing(false)} className="text-xs text-blue-500 font-semibold">
            Cancel
          </button>
          <h2 className="text-sm font-bold">Edit Contact</h2>
          <button
            onClick={() => {
              if (!newName.trim()) return;
              setPersisted((os) => ({
                ...os,
                contacts: os.contacts.map((c) =>
                  c.id === selected.id
                    ? {
                        ...c,
                        name: newName.trim(),
                        phone: newPhone.trim() || c.phone,
                        email: newEmail.trim() || c.email,
                        company: newCompany.trim() || undefined,
                      }
                    : c
                ),
              }));
              setEditing(false);
            }}
            className="text-xs text-blue-500 font-bold"
          >
            Done
          </button>
        </div>
        <div className="space-y-3">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full Name" className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none" />
          <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone Number" className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none" />
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email Address" className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none" />
          <input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Company" className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none" />
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <div className="px-3 pt-3 pb-2 flex items-center justify-between">
          <button onClick={() => setSelectedId(null)} className="flex items-center text-xs text-blue-500 font-semibold">
            <ChevronLeft className="w-4 h-4" /> Contacts
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setPersisted((os) => ({
                  ...os,
                  contacts: os.contacts.map((c) => (c.id === selected.id ? { ...c, favorite: !c.favorite } : c)),
                }))
              }
              className="p-1 text-amber-500"
              title="Toggle Favorite"
            >
              <Star className={`w-4 h-4 ${selected.favorite ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'}`} />
            </button>
            <button
              onClick={() => {
                setNewName(selected.name);
                setNewPhone(selected.phone);
                setNewEmail(selected.email);
                setNewCompany(selected.company || '');
                setEditing(true);
              }}
              className="p-1 text-blue-500"
              title="Edit Contact"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setPersisted((os) => ({ ...os, contacts: os.contacts.filter((c) => c.id !== selected.id) }));
                setSelectedId(null);
              }}
              className="text-rose-500 p-1"
              title="Delete Contact"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-5 text-center space-y-3">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${selected.avatarColor} text-white text-2xl font-bold flex items-center justify-center mx-auto shadow-lg`}>
            {selected.name[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold">{selected.name}</h2>
            {selected.company && <p className="text-xs text-zinc-500">{selected.company}</p>}
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2">
            <button onClick={() => openApp('messages')} className="p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-1 text-[10px] text-blue-500">
              <Send className="w-4 h-4" /> Message
            </button>
            <button onClick={() => startCall(selected.name, selected.phone)} className="p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-1 text-[10px] text-emerald-500">
              <Phone className="w-4 h-4" /> Call
            </button>
            <button onClick={() => openApp('facetime')} className="p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-1 text-[10px] text-teal-500">
              <Video className="w-4 h-4" /> FaceTime
            </button>
            <button onClick={() => openApp('mail')} className="p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-1 text-[10px] text-sky-500">
              <MailIcon className="w-4 h-4" /> Mail
            </button>
          </div>

          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 text-left space-y-2 text-xs mt-4">
            <div>
              <p className="text-[10px] text-zinc-500">mobile</p>
              <p className="font-medium text-blue-500">{selected.phone}</p>
            </div>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] text-zinc-500">email</p>
              <p className="font-medium text-blue-500">{selected.email}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <div className="px-4 pt-3 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">Contacts</h1>
          <button
            onClick={() => {
              setNewName('');
              setNewPhone('');
              setNewEmail('');
              setNewCompany('');
              setAdding(true);
            }}
            className="p-1.5 rounded-full bg-blue-600 text-white"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-zinc-200/80 dark:bg-zinc-900 px-3 py-1.5">
          <Search className="w-4 h-4 text-zinc-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Contacts" className="flex-1 bg-transparent text-xs outline-none" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 divide-y divide-zinc-200 dark:divide-zinc-800">
        {list.map((c) => (
          <button key={c.id} onClick={() => setSelectedId(c.id)} className="w-full py-3 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${c.avatarColor} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                {c.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{c.name}</p>
                <p className="text-[11px] text-zinc-500 truncate">{c.phone}</p>
              </div>
            </div>
            {c.favorite && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ==================== MESSAGES / WHATSAPP / TELEGRAM ==================== */
export const MessagingApp: React.FC<{ platform: 'imessage' | 'whatsapp' | 'telegram' }> = ({ platform }) => {
  const { state, setPersisted, media, startCall } = useOS();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [tgFolder, setTgFolder] = useState<'all' | 'channels'>('all');
  const [secretChat, setSecretChat] = useState(false);

  const threads = state.threads.filter((t) => t.platform === platform);
  const activeThread = threads.find((t) => t.id === selectedThreadId) || null;

  const brand =
    platform === 'whatsapp'
      ? { title: 'WhatsApp', bubbleMe: 'bg-emerald-600 text-white', accent: 'text-emerald-500' }
      : platform === 'telegram'
      ? { title: 'Telegram', bubbleMe: 'bg-sky-600 text-white', accent: 'text-sky-500' }
      : { title: 'Messages', bubbleMe: 'bg-blue-600 text-white', accent: 'text-blue-500' };

  const sendMessage = (text: string, mediaSrc?: string) => {
    if (!activeThread || (!text.trim() && !mediaSrc)) return;
    soundEngine.messageSent();
    const msgId = `msg-${Date.now()}`;
    setPersisted((os) => ({
      ...os,
      threads: os.threads.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              unread: 0,
              messages: [...t.messages, { id: msgId, sender: 'me', text: text.trim(), timestamp: Date.now(), mediaSrc }],
            }
          : t
      ),
    }));
    setInput('');

    // Simulated contextual auto-reply
    window.setTimeout(() => {
      soundEngine.notification();
      const replies = [
        'Got it! Looks super crisp on the 18 Pro Max.',
        'Awesome — let me check that right now.',
        'Sounds great! Catch up shortly.',
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      setPersisted((os) => ({
        ...os,
        threads: os.threads.map((t) =>
          t.id === activeThread.id
            ? {
                ...t,
                messages: [...t.messages, { id: `rep-${Date.now()}`, sender: 'them', text: reply, timestamp: Date.now() }],
              }
            : t
        ),
      }));
    }, 1100);
  };

  if (activeThread) {
    const latestPhoto = media.find((m) => !m.deleted && m.type === 'photo');
    return (
      <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <div className="px-3 pt-2.5 pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <button onClick={() => setSelectedThreadId(null)} className={`flex items-center text-xs font-semibold ${brand.accent}`}>
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-center">
            <p className="text-xs font-bold flex items-center justify-center gap-1">
              {secretChat && platform === 'telegram' && <Lock className="w-3 h-3 text-emerald-400" />}
              {activeThread.contactName}
            </p>
            <p className="text-[10px] text-zinc-500">{activeThread.handle}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {platform === 'telegram' && (
              <button
                onClick={() => setSecretChat(!secretChat)}
                className={`p-1.5 rounded-full ${secretChat ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400'}`}
                title="Secret Chat"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => startCall(activeThread.contactName, activeThread.handle)} className={`p-1.5 ${brand.accent}`}>
              <Phone className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2.5">
          {activeThread.messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs space-y-1.5 ${
                  m.sender === 'me'
                    ? brand.bubbleMe
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                }`}
              >
                {m.mediaSrc && <img src={m.mediaSrc} alt="Shared" className="rounded-xl max-h-36 object-cover" />}
                {m.text && <p className="leading-relaxed">{m.text}</p>}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="p-2.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2"
        >
          {latestPhoto && (
            <button
              type="button"
              onClick={() => sendMessage('Shared a photo', latestPhoto.src)}
              className="p-2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              title="Send latest photo"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message on ${brand.title}...`}
            className="flex-1 rounded-full bg-zinc-200 dark:bg-zinc-800 px-3.5 py-2 text-xs outline-none"
          />
          <button type="submit" className={`w-8 h-8 rounded-full ${brand.bubbleMe} flex items-center justify-center`}>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    );
  }

  const visibleThreads =
    platform === 'telegram' && tgFolder === 'channels'
      ? threads.filter((t) => t.handle.includes('_ch'))
      : threads;

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <div className="px-4 pt-3 pb-2 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">{brand.title}</h1>
          <button
            onClick={() => {
              const id = `th-${Date.now()}`;
              setPersisted((os) => ({
                ...os,
                threads: [
                  {
                    id,
                    platform,
                    contactName: 'New Contact',
                    handle: '@guest',
                    avatarColor: 'from-indigo-500 to-blue-600',
                    unread: 0,
                    messages: [],
                  },
                  ...os.threads,
                ],
              }));
              setSelectedThreadId(id);
            }}
            className={`p-1.5 rounded-full ${brand.accent}`}
            title="New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {platform === 'telegram' && (
          <div className="flex gap-2 text-xs font-semibold">
            <button
              onClick={() => setTgFolder('all')}
              className={`px-3 py-1 rounded-full ${tgFolder === 'all' ? 'bg-sky-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}
            >
              All Chats
            </button>
            <button
              onClick={() => setTgFolder('channels')}
              className={`px-3 py-1 rounded-full ${tgFolder === 'channels' ? 'bg-sky-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}
            >
              Channels
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-zinc-200 dark:divide-zinc-800 px-4">
        {visibleThreads.map((t) => {
          const last = t.messages[t.messages.length - 1];
          return (
            <button
              key={t.id}
              onClick={() => {
                setSelectedThreadId(t.id);
                setPersisted((os) => ({
                  ...os,
                  threads: os.threads.map((item) => (item.id === t.id ? { ...item, unread: 0 } : item)),
                }));
              }}
              className="w-full py-3 flex items-center gap-3 text-left"
            >
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.avatarColor} text-white font-bold text-sm flex items-center justify-center shrink-0`}>
                {t.contactName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold truncate">{t.contactName}</p>
                  {t.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {t.unread}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">{last?.text || 'No messages yet'}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ==================== FACETIME APP ==================== */
export const FaceTimeApp: React.FC = () => {
  const { state, startCall, endCall, activeCall } = useOS();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (camOn && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then((s) => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => {});
    }
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [camOn]);

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-white relative">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between z-10">
        <h1 className="text-xl font-extrabold">FaceTime</h1>
        {activeCall?.isVideo && (
          <button onClick={endCall} className="px-3 py-1 rounded-full bg-red-600 text-xs font-semibold">
            End Call
          </button>
        )}
      </div>

      {/* Live Self Preview */}
      <div className="mx-4 h-56 rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden relative flex items-center justify-center">
        {camOn ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
        ) : (
          <Camera className="w-8 h-8 text-zinc-500" />
        )}
        <div className="absolute bottom-3 flex items-center gap-2">
          <button onClick={() => setMuted(!muted)} className={`p-2.5 rounded-full ${muted ? 'bg-white text-black' : 'bg-black/60 text-white'}`}>
            {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button onClick={() => setCamOn(!camOn)} className={`p-2.5 rounded-full ${!camOn ? 'bg-white text-black' : 'bg-black/60 text-white'}`}>
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contacts to Video Call */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
        <p className="text-xs font-bold text-zinc-400">Tap a contact to start FaceTime</p>
        {state.contacts.map((c) => (
          <button
            key={c.id}
            onClick={() => startCall(c.name, c.phone, true)}
            className="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${c.avatarColor} flex items-center justify-center text-xs font-bold`}>
                {c.name[0]}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold">{c.name}</p>
                <p className="text-[10px] text-zinc-400">{c.phone}</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ==================== MAIL APP ==================== */
export const MailApp: React.FC = () => {
  const { state, setPersisted } = useOS();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const selected = state.emails.find((e) => e.id === selectedId);

  if (composing) {
    return (
      <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setComposing(false)} className="text-xs text-blue-500 font-semibold">Cancel</button>
          <h2 className="text-sm font-bold">New Message</h2>
          <button
            onClick={() => {
              if (!subject.trim() && !body.trim()) return;
              setPersisted((os) => ({
                ...os,
                emails: [
                  {
                    id: `e-${Date.now()}`,
                    from: state.settings.appleIdName,
                    fromEmail: to || 'recipient@icloud.com',
                    subject: subject || '(No Subject)',
                    preview: body.slice(0, 70),
                    body,
                    timestamp: Date.now(),
                    unread: false,
                    flagged: false,
                    folder: 'sent',
                  },
                  ...os.emails,
                ],
              }));
              setTo('');
              setSubject('');
              setBody('');
              setComposing(false);
            }}
            className="text-xs text-blue-500 font-bold"
          >
            Send
          </button>
        </div>
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="To:" className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject:" className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your email..." className="flex-1 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none resize-none" />
      </div>
    );
  }

  if (selected) {
    return (
      <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
        <div className="px-3 pt-3 pb-2 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <button onClick={() => setSelectedId(null)} className="flex items-center text-xs text-blue-500 font-semibold">
            <ChevronLeft className="w-4 h-4" /> Inbox
          </button>
          <button
            onClick={() => {
              setPersisted((os) => ({ ...os, emails: os.emails.filter((e) => e.id !== selected.id) }));
              setSelectedId(null);
            }}
            className="text-rose-500 p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto no-scrollbar">
          <h2 className="text-base font-bold">{selected.subject}</h2>
          <div className="text-xs text-zinc-500">
            <span className="font-semibold text-zinc-900 dark:text-white">{selected.from}</span> · {selected.fromEmail}
          </div>
          <p className="text-xs leading-relaxed whitespace-pre-line pt-2 border-t border-zinc-200 dark:border-zinc-800">
            {selected.body}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl font-extrabold">Inbox</h1>
        <button onClick={() => setComposing(true)} className="p-2 rounded-full bg-blue-600 text-white">
          <PenSquare className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-zinc-200 dark:divide-zinc-800 px-4">
        {state.emails.map((mail) => (
          <button
            key={mail.id}
            onClick={() => {
              setSelectedId(mail.id);
              setPersisted((os) => ({
                ...os,
                emails: os.emails.map((e) => (e.id === mail.id ? { ...e, unread: false } : e)),
              }));
            }}
            className="w-full py-3 text-left space-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                {mail.unread && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                {mail.from}
              </span>
              <span className="text-[10px] text-zinc-500">
                {new Date(mail.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-xs font-semibold truncate">{mail.subject}</p>
            <p className="text-[11px] text-zinc-500 line-clamp-1">{mail.preview}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
