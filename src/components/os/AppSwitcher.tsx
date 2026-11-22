import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useOS } from '../../os/OSContext';
import { APP_MAP, renderAppIcon } from '../../os/appRegistry';

export const AppSwitcher: React.FC = () => {
  const { state, recentAppIds, openApp, closeBackgroundApp, setAppSwitcherOpen } = useOS();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black/75 backdrop-blur-2xl text-white flex flex-col justify-between p-5 pt-14 pb-8"
      onClick={() => setAppSwitcherOpen(false)}
    >
      <div className="flex items-center justify-between px-1" onClick={(e) => e.stopPropagation()}>
        <div>
          <h2 className="text-lg font-bold">App Switcher</h2>
          <p className="text-xs text-zinc-400">{recentAppIds.length} active background apps</p>
        </div>
        <button
          onClick={() => setAppSwitcherOpen(false)}
          className="px-3 py-1.5 rounded-full bg-white/15 text-xs font-medium"
        >
          Done
        </button>
      </div>

      {recentAppIds.length === 0 ? (
        <div className="text-center text-zinc-400 text-sm">No recently opened apps</div>
      ) : (
        <div
          className="flex items-center gap-4 overflow-x-auto no-scrollbar py-8 px-2"
          onClick={(e) => e.stopPropagation()}
        >
          {recentAppIds.map((appId) => {
            const builtIn = APP_MAP[appId];
            const play = state.installedPlayApps?.[appId];
            const def = builtIn
              ? { name: builtIn.name, subtitle: builtIn.subtitle, icon: undefined as string | undefined }
              : play
              ? { name: play.name, subtitle: play.developer, icon: play.icon }
              : null;
            if (!def) return null;
            return (
              <motion.div
                key={appId}
                drag="y"
                dragConstraints={{ top: -220, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={(_e, info) => {
                  if (info.offset.y < -70 || info.velocity.y < -300) {
                    closeBackgroundApp(appId);
                  }
                }}
                whileHover={{ y: -6 }}
                className="w-[210px] h-[380px] shrink-0 rounded-[34px] liquid-glass-dark border border-white/20 flex flex-col justify-between p-4 shadow-2xl relative overflow-hidden cursor-grab active:cursor-grabbing"
                onClick={() => openApp(appId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
                      {renderAppIcon(appId, 'xs', def.icon)}
                    </div>
                    <span className="text-xs font-semibold truncate">{def.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeBackgroundApp(appId);
                    }}
                    className="w-6 h-6 rounded-full bg-white/15 hover:bg-rose-500 flex items-center justify-center transition-colors"
                    aria-label={`Close ${def.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 my-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl mb-3">
                    {renderAppIcon(appId, 'lg', def.icon)}
                  </div>
                  <p className="text-sm font-semibold">{def.name}</p>
                  <p className="text-[11px] text-zinc-400 mt-1">{def.subtitle}</p>
                </div>

                <p className="text-[11px] text-center text-sky-400 font-medium">Tap to Resume</p>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="flex justify-center">
        <div className="w-32 h-1 rounded-full bg-white/60" />
      </div>
    </motion.div>
  );
};
