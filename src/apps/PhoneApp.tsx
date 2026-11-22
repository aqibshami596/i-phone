import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Delete,
  Edit3,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Plus,
  Radio,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useOS } from '../os/OSContext';
import { soundEngine } from '../os/soundEngine';
import { Contact } from '../os/types';

type PhoneTab = 'favorites' | 'recents' | 'contacts' | 'keypad';

const DIAL_KEYS = [
  ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
  ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
  ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
  ['*', ''], ['0', '+'], ['#', ''],
];

const AVATAR_GRADIENTS = [
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-indigo-500 to-violet-600',
];

function formatShortTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatSecShort(sec: number): string {
  if (sec <= 0) return '0s';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export const PhoneApp: React.FC = () => {
  const {
    state,
    setPersisted,
    voiceConfig,
    wsVoipConnected,
    onlineVoipPeers,
    pendingCallChoice,
    dismissPendingCallChoice,
    startCall,
    triggerSimulatedIncomingCall,
    clearCallHistory,
    deleteCallRecord,
    pushNotification,
  } = useOS();

  const [tab, setTab] = useState<PhoneTab>('keypad');
  const [dial, setDial] = useState('');
  const [recentsFilter, setRecentsFilter] = useState<'all' | 'missed'>('all');
  const [contactSearch, setContactSearch] = useState('');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [creatingContact, setCreatingContact] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formFav, setFormFav] = useState(false);
  const [copiedExt, setCopiedExt] = useState(false);

  const matchedContact = useMemo(() => {
    const clean = dial.replace(/\D/g, '');
    if (clean.length < 3) return null;
    return (
      state.contacts.find((c) => c.phone.replace(/\D/g, '').includes(clean)) || null
    );
  }, [dial, state.contacts]);

  const openCreateForm = (prefillPhone = '') => {
    setEditingContact(null);
    setCreatingContact(true);
    setFormName('');
    setFormPhone(prefillPhone);
    setFormEmail('');
    setFormCompany('');
    setFormFav(false);
  };

  const openEditForm = (c: Contact) => {
    setCreatingContact(false);
    setEditingContact(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormEmail(c.email);
    setFormCompany(c.company || '');
    setFormFav(Boolean(c.favorite));
  };

  const saveContactForm = () => {
    if (!formName.trim()) return;
    if (editingContact) {
      setPersisted((os) => ({
        ...os,
        contacts: os.contacts.map((c) =>
          c.id === editingContact.id
            ? {
                ...c,
                name: formName.trim(),
                phone: formPhone.trim() || c.phone,
                email: formEmail.trim() || c.email,
                company: formCompany.trim(),
                favorite: formFav,
              }
            : c
        ),
      }));
      setEditingContact(null);
    } else {
      const next: Contact = {
        id: `c-${Date.now()}`,
        name: formName.trim(),
        phone: formPhone.trim() || '+1 (555) 010-0000',
        email: formEmail.trim() || 'contact@icloud.com',
        company: formCompany.trim(),
        avatarColor: AVATAR_GRADIENTS[state.contacts.length % AVATAR_GRADIENTS.length],
        favorite: formFav,
      };
      setPersisted((os) => ({
        ...os,
        contacts: [next, ...os.contacts],
      }));
      setCreatingContact(false);
    }
  };

  const copyMyExtension = () => {
    navigator.clipboard?.writeText(state.voipExtension).catch(() => {});
    setCopiedExt(true);
    pushNotification('phone', 'VoIP Line Copied', `Share extension ${state.voipExtension} to receive free WebRTC calls.`);
    window.setTimeout(() => setCopiedExt(false), 1800);
  };

  const handleDialCall = () => {
    const target = dial.trim();
    if (!target) {
      if (state.callHistory.length > 0) {
        setDial(state.callHistory[0].phoneNumber);
      }
      return;
    }
    startCall(matchedContact?.name || target, target);
  };

  // Contact Create / Edit Modal View
  if (creatingContact || editingContact) {
    return (
      <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setCreatingContact(false);
              setEditingContact(null);
            }}
            className="text-xs text-blue-500 font-semibold"
          >
            Cancel
          </button>
          <h2 className="text-sm font-bold">{editingContact ? 'Edit Contact' : 'New Contact'}</h2>
          <button onClick={saveContactForm} className="text-xs text-blue-500 font-bold">
            Save
          </button>
        </div>

        <div className="space-y-2.5">
          <input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Full Name"
            className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none"
          />
          <input
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            placeholder="Phone Number or VoIP Ext (e.g. 180-4210)"
            className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none font-mono-num"
          />
          <input
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none"
          />
          <input
            value={formCompany}
            onChange={(e) => setFormCompany(e.target.value)}
            placeholder="Company / Note (optional)"
            className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs outline-none"
          />
          <button
            type="button"
            onClick={() => setFormFav((f) => !f)}
            className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs"
          >
            <span className="font-medium">Add to Favorites</span>
            <Star className={`w-4 h-4 ${formFav ? 'text-amber-400 fill-amber-400' : 'text-zinc-400'}`} />
          </button>

          {editingContact && (
            <button
              type="button"
              onClick={() => {
                setPersisted((os) => ({
                  ...os,
                  contacts: os.contacts.filter((c) => c.id !== editingContact.id),
                }));
                setEditingContact(null);
              }}
              className="w-full p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold flex items-center justify-center gap-1.5 mt-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Contact
            </button>
          )}
        </div>
      </div>
    );
  }

  const visibleHistory = (state.callHistory || []).filter((r) =>
    recentsFilter === 'missed' ? r.outcome === 'missed' || r.direction === 'missed' : true
  );

  const visibleContacts = state.contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const favoriteContacts = state.contacts.filter((c) => c.favorite);

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white relative">
      {/* Honest Transport Choice Modal when dialing a number without Twilio & without online WebRTC peer */}
      {pendingCallChoice && (
        <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-end p-3">
          <div className="w-full rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
                  Choose Call Method · Free
                </p>
                <h3 className="text-sm font-bold mt-0.5">{pendingCallChoice.contactName}</h3>
                <p className="text-[11px] text-zinc-500 font-mono-num">{pendingCallChoice.handle}</p>
              </div>
              <button onClick={dismissPendingCallChoice} className="p-1 text-zinc-400 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
              This number is not currently registered on the free WebRTC VoIP network, and paid carrier PSTN trunks are not configured. Choose an honest free option:
            </p>

            <div className="space-y-2">
              {onlineVoipPeers.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-emerald-500">
                    Online Free WebRTC VoIP Peers ({onlineVoipPeers.length})
                  </p>
                  {onlineVoipPeers.map((peer) => (
                    <button
                      key={peer.extension}
                      onClick={() => startCall(peer.name, peer.extension, pendingCallChoice.isVideo)}
                      className="w-full p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-left"
                    >
                      <div>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{peer.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono-num">Ext {peer.extension} · Real WebRTC Audio</p>
                      </div>
                      <Phone className="w-4 h-4 text-emerald-500" />
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() =>
                  startCall(pendingCallChoice.contactName, pendingCallChoice.handle, pendingCallChoice.isVideo, {
                    forceSimulated: true,
                  })
                }
                className="w-full p-3 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-left flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    Start Simulated Call (Local Mic Test)
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    Explicitly labeled Simulated · Tests real microphone, DTMF, Hold &amp; Dynamic Island
                  </p>
                </div>
                <Radio className="w-4 h-4 text-amber-500 shrink-0" />
              </button>

              <button
                onClick={() => {
                  dismissPendingCallChoice();
                  copyMyExtension();
                }}
                className="w-full p-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy My Free VoIP Extension ({state.voipExtension}) for 2nd Tab
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        {tab === 'keypad' && (
          <div className="h-full flex flex-col justify-between gap-2">
            {/* Free VoIP Status + My Extension Pill */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    wsVoipConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold truncate flex items-center gap-1">
                    {voiceConfig.twilioConfigured ? 'Twilio PSTN + WebRTC Ready' : 'Free WebRTC VoIP Line'}
                    <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono-num truncate">
                    My Ext: {state.voipExtension} · {onlineVoipPeers.length} peer{onlineVoipPeers.length === 1 ? '' : 's'} online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={copyMyExtension}
                  className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-semibold flex items-center gap-1"
                  title="Copy your free WebRTC VoIP extension"
                >
                  {copiedExt ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copiedExt ? 'Copied' : 'Ext'}
                </button>
                <button
                  onClick={() => triggerSimulatedIncomingCall()}
                  className="px-2 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 text-[10px] font-semibold"
                  title="Test Incoming Call Screen & Ringtone (Simulated)"
                >
                  Test Ring
                </button>
              </div>
            </div>

            {/* Online Free WebRTC Peers Quick Strip */}
            {onlineVoipPeers.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {onlineVoipPeers.map((peer) => (
                  <button
                    key={peer.extension}
                    onClick={() => startCall(peer.name, peer.extension)}
                    className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 shrink-0"
                  >
                    <Phone className="w-2.5 h-2.5" />
                    Call {peer.name} ({peer.extension})
                  </button>
                ))}
              </div>
            )}

            {/* Dial Display + Matched Contact */}
            <div className="min-h-[54px] flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-semibold font-mono-num tracking-wider truncate max-w-full px-2">
                {dial || <span className="text-zinc-400 text-lg font-sans font-normal">Enter Number or VoIP Ext</span>}
              </p>
              {matchedContact ? (
                <p className="text-xs text-blue-500 font-semibold mt-0.5">{matchedContact.name}</p>
              ) : dial.length >= 3 ? (
                <button
                  onClick={() => openCreateForm(dial)}
                  className="text-[11px] text-blue-500 font-semibold mt-0.5"
                >
                  + Add Number to Contacts
                </button>
              ) : null}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[244px] mx-auto">
              {DIAL_KEYS.map(([num, sub]) => (
                <button
                  key={num}
                  onClick={() => {
                    soundEngine.dtmf(num);
                    setDial((d) => (d + num).slice(0, 18));
                  }}
                  className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 flex flex-col items-center justify-center active:scale-95 transition-transform"
                >
                  <span className="text-xl font-medium leading-none">{num}</span>
                  {sub && <span className="text-[8px] text-zinc-500 tracking-widest mt-0.5">{sub}</span>}
                </button>
              ))}
            </div>

            {/* Call + Backspace */}
            <div className="flex items-center justify-center gap-8 pt-1">
              <div className="w-12" />
              <button
                onClick={handleDialCall}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                aria-label="Place Call"
              >
                <Phone className="w-7 h-7 fill-white" />
              </button>
              <button
                onClick={() => setDial((d) => d.slice(0, -1))}
                className="w-12 h-12 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                aria-label="Backspace"
              >
                {dial && <Delete className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}

        {tab === 'favorites' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-extrabold">Favorites</h1>
              <button
                onClick={() => openCreateForm()}
                className="p-1.5 rounded-full bg-blue-600 text-white"
                title="Add Favorite Contact"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {favoriteContacts.length === 0 ? (
              <p className="text-xs text-zinc-500 py-10 text-center">No favorites yet. Star any contact to add.</p>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {favoriteContacts.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => startCall(c.name, c.phone)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left"
                    >
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.avatarColor} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                        {c.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{c.name}</p>
                        <p className="text-[11px] text-zinc-500 font-mono-num truncate">{c.phone}</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEditForm(c)} className="p-2 text-zinc-400 hover:text-blue-500" title="Edit Contact">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => startCall(c.name, c.phone)} className="p-2 rounded-full bg-emerald-500/15 text-emerald-500">
                        <PhoneCall className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'recents' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-zinc-200 dark:bg-zinc-900 p-0.5 rounded-xl text-[11px] font-semibold">
                <button
                  onClick={() => setRecentsFilter('all')}
                  className={`px-3 py-1 rounded-lg ${recentsFilter === 'all' ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'text-zinc-500'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setRecentsFilter('missed')}
                  className={`px-3 py-1 rounded-lg ${recentsFilter === 'missed' ? 'bg-white dark:bg-zinc-800 shadow-sm' : 'text-zinc-500'}`}
                >
                  Missed
                </button>
              </div>
              {state.callHistory.length > 0 && (
                <button onClick={clearCallHistory} className="text-xs text-rose-500 font-semibold">
                  Clear
                </button>
              )}
            </div>

            <h1 className="text-2xl font-extrabold">Recents</h1>

            {visibleHistory.length === 0 ? (
              <div className="py-12 text-center space-y-1.5 text-zinc-500">
                <PhoneCall className="w-7 h-7 mx-auto opacity-40" />
                <p className="text-xs font-semibold text-zinc-400">No Call History Yet</p>
                <p className="text-[11px]">Real WebRTC, Twilio, and simulated calls appear here with exact status.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {visibleHistory.map((r) => {
                  const isMissed = r.outcome === 'missed' || r.outcome === 'failed' || r.outcome === 'declined';
                  return (
                    <div key={r.id} className="py-2.5 flex items-center justify-between gap-2">
                      <button
                        onClick={() => startCall(r.contactName, r.phoneNumber)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                      >
                        <div className="w-6 flex justify-center shrink-0">
                          {isMissed ? (
                            <PhoneMissed className="w-4 h-4 text-rose-500" />
                          ) : r.direction === 'incoming' ? (
                            <PhoneIncoming className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <PhoneOutgoing className="w-4 h-4 text-sky-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-xs font-bold truncate ${isMissed ? 'text-rose-500' : ''}`}>
                              {r.contactName}
                            </p>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                r.transport === 'simulated-local'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                                  : r.transport === 'twilio-pstn'
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                    : 'bg-sky-500/15 text-sky-600 dark:text-sky-300'
                              }`}
                            >
                              {r.transport === 'simulated-local'
                                ? 'Simulated'
                                : r.transport === 'twilio-pstn'
                                  ? 'PSTN'
                                  : 'VoIP'}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-mono-num truncate">
                            {r.phoneNumber} · {r.outcome === 'connected' ? formatSecShort(r.durationSec) : r.outcome}
                          </p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-zinc-400">{formatShortTime(r.startedAt)}</span>
                        <button
                          onClick={() => deleteCallRecord(r.id)}
                          className="p-1 text-zinc-400 hover:text-rose-500"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'contacts' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-extrabold">Contacts</h1>
              <button
                onClick={() => openCreateForm()}
                className="p-1.5 rounded-full bg-blue-600 text-white"
                title="Create Contact"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-zinc-200/80 dark:bg-zinc-900 px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-zinc-500" />
              <input
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search contacts..."
                className="flex-1 bg-transparent text-xs outline-none"
              />
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {visibleContacts.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => startCall(c.name, c.phone)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  >
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${c.avatarColor} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                      {c.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{c.name}</p>
                      <p className="text-[11px] text-zinc-500 font-mono-num truncate">{c.phone}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        setPersisted((os) => ({
                          ...os,
                          contacts: os.contacts.map((item) =>
                            item.id === c.id ? { ...item, favorite: !item.favorite } : item
                          ),
                        }))
                      }
                      className="p-1.5 text-zinc-400"
                      title="Toggle Favorite"
                    >
                      <Star className={`w-3.5 h-3.5 ${c.favorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                    </button>
                    <button onClick={() => openEditForm(c)} className="p-1.5 text-zinc-400 hover:text-blue-500" title="Edit">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => startCall(c.name, c.phone)} className="p-1.5 text-emerald-500" title="Call">
                      <PhoneCall className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-4 py-1.5 text-[10px] font-medium">
        {(
          [
            ['favorites', 'Favorites', Star],
            ['recents', 'Recents', PhoneCall],
            ['contacts', 'Contacts', Users],
            ['keypad', 'Keypad', Phone],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-0.5 py-1 ${tab === id ? 'text-blue-500' : 'text-zinc-500'}`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
