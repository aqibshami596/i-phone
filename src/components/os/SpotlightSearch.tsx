import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Search, Users, X } from 'lucide-react';
import { useOS } from '../../os/OSContext';
import { APP_REGISTRY, renderAppIcon } from '../../os/appRegistry';

export const SpotlightSearch: React.FC = () => {
  const { state, setSpotlightOpen, openApp } = useOS();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  const matchingApps = useMemo(() => {
    const installed = APP_REGISTRY.filter((a) => state.installedAppIds.includes(a.id)).map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      subtitle: a.subtitle,
      customIcon: undefined as string | undefined,
    }));
    const playApps = Object.entries(state.installedPlayApps || {})
      .filter(([id]) => state.installedAppIds.includes(id))
      .map(([id, item]) => ({
        id,
        name: item.name,
        category: item.category,
        subtitle: item.developer,
        customIcon: item.icon,
      }));
    const merged = [...installed, ...playApps];
    if (!q) return merged.slice(0, 8);
    return merged.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q)
    );
  }, [q, state.installedAppIds, state.installedPlayApps]);

  const matchingContacts = useMemo(() => {
    if (!q) return [];
    return state.contacts.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 4);
  }, [q, state.contacts]);

  const matchingNotes = useMemo(() => {
    if (!q) return [];
    return state.notes.filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)).slice(0, 4);
  }, [q, state.notes]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black/70 backdrop-blur-2xl text-white p-5 pt-14 flex flex-col"
      onClick={() => setSpotlightOpen(false)}
    >
      <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div className="flex items-center gap-2.5 liquid-glass-dark rounded-2xl px-3.5 py-2.5">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps, contacts, notes..."
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setSpotlightOpen(false)}
            className="text-xs font-medium text-sky-400 pl-1"
          >
            Cancel
          </button>
        </div>

        {/* Apps Grid */}
        <div>
          <p className="text-xs font-semibold text-zinc-400 mb-2.5 px-1">
            {q ? 'Applications' : 'Siri Suggestions'}
          </p>
          <div className="grid grid-cols-4 gap-3">
            {matchingApps.map((app) => (
              <button
                key={app.id}
                onClick={() => openApp(app.id)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="w-14 h-14 rounded-[16px] overflow-hidden shadow-lg group-active:scale-90 transition-transform">
                  {renderAppIcon(app.id, 'md', app.customIcon)}
                </div>
                <span className="text-[11px] text-white/90 truncate w-full text-center">{app.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contacts */}
        {matchingContacts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-zinc-400 px-1">Contacts</p>
            {matchingContacts.map((c) => (
              <button
                key={c.id}
                onClick={() => openApp('contacts')}
                className="w-full liquid-glass-dark rounded-2xl p-3 flex items-center gap-3 text-left"
              >
                <Users className="w-4 h-4 text-sky-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{c.phone}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Notes */}
        {matchingNotes.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-zinc-400 px-1">Notes</p>
            {matchingNotes.map((n) => (
              <button
                key={n.id}
                onClick={() => openApp('notes')}
                className="w-full liquid-glass-dark rounded-2xl p-3 flex items-center gap-3 text-left"
              >
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{n.title}</p>
                  <p className="text-xs text-zinc-400 truncate">{n.body}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Google Web Search */}
        {query.trim().length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-zinc-400 px-1">Search the Web</p>
            <button
              onClick={() => openApp('google', query.trim())}
              className="w-full liquid-glass-dark rounded-2xl p-3 flex items-center gap-3 text-left"
            >
              <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center shrink-0">
                <Search className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">Search Google for &ldquo;{query.trim()}&rdquo;</p>
                <p className="text-[11px] text-zinc-400">Open Web Results · Outside Wikipedia</p>
              </div>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
