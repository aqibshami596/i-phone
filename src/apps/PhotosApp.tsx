import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  FolderOpen,
  Heart,
  Image as ImageIcon,
  Play,
  RotateCcw,
  Sliders,
  Trash2,
  Upload,
  Video,
  Wallpaper,
  X,
  ZoomIn,
} from 'lucide-react';
import { useOS } from '../os/OSContext';
import { MediaItem } from '../os/types';

type PhotosTab = 'library' | 'favorites' | 'albums' | 'deleted';

export const PhotosApp: React.FC = () => {
  const { media, addMedia, updateMedia, removeMediaPermanent, updateSettings, pushNotification, openApp } = useOS();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [tab, setTab] = useState<PhotosTab>('library');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [albumFilter, setAlbumFilter] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [slideshow, setSlideshow] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);

  const visibleList = useMemo(() => {
    if (tab === 'deleted') return media.filter((m) => m.deleted);
    if (tab === 'favorites') return media.filter((m) => !m.deleted && m.favorite);
    if (albumFilter) return media.filter((m) => !m.deleted && m.album === albumFilter);
    return media.filter((m) => !m.deleted);
  }, [media, tab, albumFilter]);

  const selectedItem = media.find((m) => m.id === selectedId) || null;

  useEffect(() => {
    if (!slideshow || visibleList.length === 0) return;
    const id = window.setInterval(() => {
      setSelectedId((cur) => {
        const idx = visibleList.findIndex((m) => m.id === cur);
        const next = visibleList[(idx + 1) % visibleList.length];
        return next?.id || null;
      });
    }, 2800);
    return () => clearInterval(id);
  }, [slideshow, visibleList]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const isVideo = file.type.startsWith('video/');
        const item: MediaItem = {
          id: `up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: isVideo ? 'video' : 'photo',
          src: reader.result as string,
          name: file.name,
          createdAt: Date.now(),
          favorite: false,
          deleted: false,
          album: isVideo ? 'Videos' : 'Imports',
        };
        await addMedia(item);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const saveInlineEdits = async () => {
    if (!selectedItem) return;
    await updateMedia(selectedItem.id, {
      edits: {
        brightness,
        contrast,
        saturate,
        warmth: 0,
        filter: 'custom',
      },
    });
    setEditing(false);
    pushNotification('photos', 'Edits Saved', `Saved adjustments to ${selectedItem.name}`);
  };

  if (selectedItem) {
    const b = editing ? brightness : selectedItem.edits?.brightness ?? 100;
    const c = editing ? contrast : selectedItem.edits?.contrast ?? 100;
    const sat = editing ? saturate : selectedItem.edits?.saturate ?? 100;

    return (
      <div className="h-full flex flex-col bg-black text-white">
        {/* Viewer Header */}
        <div className="px-3 pt-2 pb-2 flex items-center justify-between border-b border-zinc-900">
          <button
            onClick={() => {
              setSelectedId(null);
              setSlideshow(false);
              setEditing(false);
              setZoomScale(1);
            }}
            className="flex items-center gap-0.5 text-xs font-medium text-sky-400"
          >
            <ChevronLeft className="w-4 h-4" />
            Photos
          </button>
          <span className="text-xs font-semibold truncate max-w-[140px]">{selectedItem.name}</span>
          <div className="flex items-center gap-2">
            {selectedItem.type === 'photo' && (
              <button
                onClick={() => {
                  setBrightness(selectedItem.edits?.brightness ?? 100);
                  setContrast(selectedItem.edits?.contrast ?? 100);
                  setSaturate(selectedItem.edits?.saturate ?? 100);
                  setEditing(!editing);
                }}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  editing ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-200'
                }`}
              >
                Edit
              </button>
            )}
            <button
              onClick={() => setSlideshow(!slideshow)}
              className={`p-1.5 rounded-full ${slideshow ? 'bg-sky-500 text-white' : 'bg-zinc-800 text-zinc-300'}`}
              title="Slideshow"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Media Viewport */}
        <div className="flex-1 overflow-hidden flex items-center justify-center bg-black relative">
          {selectedItem.type === 'video' ? (
            <video src={selectedItem.src} controls autoPlay className="max-w-full max-h-full" />
          ) : (
            <img
              src={selectedItem.src}
              alt={selectedItem.name}
              referrerPolicy="no-referrer"
              style={{
                transform: `scale(${zoomScale})`,
                filter: `brightness(${b}%) contrast(${c}%) saturate(${sat}%)`,
              }}
              className="max-w-full max-h-full object-contain transition-transform duration-150"
            />
          )}
        </div>

        {/* Inline Editor or Zoom Controls */}
        {editing ? (
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-20 text-zinc-400">Brightness</span>
              <input type="range" min={50} max={150} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="flex-1 accent-amber-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 text-zinc-400">Contrast</span>
              <input type="range" min={50} max={150} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="flex-1 accent-amber-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 text-zinc-400">Saturation</span>
              <input type="range" min={0} max={200} value={saturate} onChange={(e) => setSaturate(Number(e.target.value))} className="flex-1 accent-amber-400" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setEditing(false)} className="px-3 py-1 rounded-full bg-zinc-800">Cancel</button>
              <button onClick={saveInlineEdits} className="px-4 py-1 rounded-full bg-amber-400 text-black font-semibold">Done</button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-900 space-y-2">
            {selectedItem.type === 'photo' && (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <ZoomIn className="w-3.5 h-3.5" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoomScale}
                  onChange={(e) => setZoomScale(Number(e.target.value))}
                  className="flex-1 accent-sky-400"
                />
                <span className="font-mono-num w-8 text-right">{zoomScale.toFixed(1)}x</span>
              </div>
            )}

            <div className="flex items-center justify-around pt-1">
              <button
                onClick={() => updateMedia(selectedItem.id, { favorite: !selectedItem.favorite })}
                className="flex flex-col items-center gap-0.5 text-[10px]"
              >
                <Heart className={`w-5 h-5 ${selectedItem.favorite ? 'text-rose-500 fill-rose-500' : 'text-zinc-300'}`} />
                <span>Favorite</span>
              </button>

              {selectedItem.type === 'photo' && (
                <button
                  onClick={() => {
                    updateSettings({ wallpaper: 'custom', customWallpaperSrc: selectedItem.src });
                    pushNotification('settings', 'Wallpaper Updated', 'Applied photo as Lock & Home wallpaper.');
                  }}
                  className="flex flex-col items-center gap-0.5 text-[10px] text-zinc-300"
                >
                  <Wallpaper className="w-5 h-5" />
                  <span>Wallpaper</span>
                </button>
              )}

              {selectedItem.deleted ? (
                <>
                  <button
                    onClick={() => {
                      updateMedia(selectedItem.id, { deleted: false });
                      setSelectedId(null);
                    }}
                    className="flex flex-col items-center gap-0.5 text-[10px] text-emerald-400"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Recover</span>
                  </button>
                  <button
                    onClick={() => {
                      removeMediaPermanent(selectedItem.id);
                      setSelectedId(null);
                    }}
                    className="flex flex-col items-center gap-0.5 text-[10px] text-rose-500"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Delete Forever</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    updateMedia(selectedItem.id, { deleted: true });
                    setSelectedId(null);
                  }}
                  className="flex flex-col items-center gap-0.5 text-[10px] text-rose-400"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const albums = Array.from(new Set(media.filter((m) => !m.deleted).map((m) => m.album)));

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-extrabold">{albumFilter || (tab === 'deleted' ? 'Recently Deleted' : tab === 'favorites' ? 'Favorites' : tab === 'albums' ? 'Albums' : 'Photos')}</h1>
          <p className="text-[11px] text-zinc-500">{visibleList.length} items</p>
        </div>
        <div className="flex items-center gap-2">
          {albumFilter && (
            <button onClick={() => setAlbumFilter(null)} className="text-xs font-semibold text-blue-500">
              All
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={handleUpload} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-2">
        {tab === 'albums' && !albumFilter ? (
          <div className="grid grid-cols-2 gap-3 p-2">
            {albums.map((alb) => {
              const items = media.filter((m) => !m.deleted && m.album === alb);
              const cover = items[0];
              return (
                <button
                  key={alb}
                  onClick={() => setAlbumFilter(alb)}
                  className="text-left space-y-1.5"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800">
                    {cover ? (
                      <img src={cover.src} alt={alb} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FolderOpen className="w-8 h-8 text-zinc-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold">{alb}</p>
                  <p className="text-[10px] text-zinc-500">{items.length} items</p>
                </button>
              );
            })}
          </div>
        ) : visibleList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm font-semibold">No Photos or Videos</p>
            <p className="text-xs mt-1">Take a shot in Camera or tap Import to upload from your device.</p>
            <button
              onClick={() => openApp('camera')}
              className="mt-3 px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold"
            >
              Open Camera
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {visibleList.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className="relative aspect-square bg-zinc-900 overflow-hidden rounded-sm group"
              >
                {item.type === 'video' ? (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <img
                    src={item.src}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    style={{
                      filter: item.edits
                        ? `brightness(${item.edits.brightness}%) contrast(${item.edits.contrast}%) saturate(${item.edits.saturate}%)`
                        : undefined,
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                )}
                {item.favorite && (
                  <Heart className="w-3.5 h-3.5 text-white fill-white absolute bottom-1 left-1 drop-shadow" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/85 grid grid-cols-4 py-1.5 text-[10px] font-medium">
        {(
          [
            ['library', 'Library', ImageIcon],
            ['favorites', 'Favorites', Heart],
            ['albums', 'Albums', Sliders],
            ['deleted', 'Deleted', Trash2],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              setAlbumFilter(null);
            }}
            className={`flex flex-col items-center gap-0.5 py-1 ${
              tab === id ? 'text-blue-500' : 'text-zinc-500'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
