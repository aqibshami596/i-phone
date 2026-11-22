import React from 'react';
import { motion } from 'motion/react';
import { BellOff, Trash2, X } from 'lucide-react';
import { useOS } from '../../os/OSContext';
import { renderAppIcon } from '../../os/appRegistry';

export const NotificationCenter: React.FC = () => {
  const { notifications, clearNotifications, setNotificationCenterOpen, openApp } = useOS();

  const grouped = notifications.reduce<Record<string, typeof notifications>>((acc, item) => {
    if (!acc[item.appName]) acc[item.appName] = [];
    acc[item.appName].push(item);
    return acc;
  }, {});

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: -220, bottom: 0 }}
      dragElastic={0.12}
      onDragEnd={(_e, info) => {
        if (info.offset.y < -55 || info.velocity.y < -250) {
          setNotificationCenterOpen(false);
        }
      }}
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="absolute inset-0 z-50 bg-black/65 backdrop-blur-2xl text-white p-5 pt-12 flex flex-col select-none"
      onClick={() => setNotificationCenterOpen(false)}
    >
      <div className="flex items-center justify-between mb-4" onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 className="text-xl font-bold">Notification Center</h2>
          <p className="text-xs text-zinc-400">{notifications.length} total alerts</p>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}
          <button
            onClick={() => setNotificationCenterOpen(false)}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
            aria-label="Close Notification Center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4" onClick={(e) => e.stopPropagation()}>
        {notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400">
            <BellOff className="w-10 h-10 mb-3 opacity-60" />
            <p className="text-sm font-medium text-zinc-300">No Older Notifications</p>
            <p className="text-xs mt-1">New messages, timers, and App Store alerts appear here.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([appName, list]) => (
            <div key={appName} className="space-y-2">
              <p className="text-xs font-semibold text-zinc-400 px-1">{appName}</p>
              {list.map((n) => (
                <div
                  key={n.id}
                  onClick={() => openApp(n.appId)}
                  className="liquid-glass-dark rounded-3xl p-3.5 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                    {renderAppIcon(n.appId, 'sm')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold truncate">{n.title}</p>
                      <span className="text-[10px] text-zinc-400 shrink-0">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-0.5 line-clamp-2">{n.body}</p>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
