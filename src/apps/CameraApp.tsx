import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  FlipHorizontal,
  Grid,
  Moon,
  RefreshCw,
  Settings2,
  Sparkles,
  Timer,
  Video,
  Zap,
  ZapOff,
} from 'lucide-react';
import { useOS } from '../os/OSContext';
import { soundEngine } from '../os/soundEngine';

type CamMode = 'PHOTO' | 'VIDEO' | 'PORTRAIT' | 'NIGHT' | 'PANO';

export const CameraApp: React.FC = () => {
  const { media, addMedia, openApp, pushNotification } = useOS();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [camMode, setCamMode] = useState<CamMode>('PHOTO');
  const [zoom, setZoom] = useState<number>(1);
  const [flash, setFlash] = useState<'auto' | 'on' | 'off'>('auto');
  const [timerSec, setTimerSec] = useState<0 | 3 | 10>(0);
  const [countdown, setCountdown] = useState<number>(0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [flashPulse, setFlashPulse] = useState<boolean>(false);
  const [camStatus, setCamStatus] = useState<'loading' | 'live' | 'denied'>('loading');

  const startCamera = async (facing: 'environment' | 'user') => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCamStatus('loading');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCamStatus('denied');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: camMode === 'VIDEO',
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCamStatus('live');
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCamStatus('live');
      } catch {
        setCamStatus('denied');
      }
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  useEffect(() => {
    if (!isRecording) return;
    const id = window.setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  const capturePhoto = async () => {
    soundEngine.shutter();
    if (flash === 'on' || (flash === 'auto' && camMode === 'NIGHT')) {
      setFlashPulse(true);
      setTimeout(() => setFlashPulse(false), 180);
    }

    const canvas = document.createElement('canvas');
    const w = camMode === 'PANO' ? 1440 : 1080;
    const h = camMode === 'PANO' ? 600 : 1350;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const v = videoRef.current;
    if (camStatus === 'live' && v && v.videoWidth > 0) {
      const vw = v.videoWidth;
      const vh = v.videoHeight;
      const cropW = vw / zoom;
      const cropH = vh / zoom;
      const sx = (vw - cropW) / 2;
      const sy = (vh - cropH) / 2;

      if (camMode === 'NIGHT') ctx.filter = 'brightness(1.25) contrast(1.1)';
      if (camMode === 'PORTRAIT') ctx.filter = 'contrast(1.06) saturate(1.12)';
      ctx.drawImage(v, sx, sy, cropW, cropH, 0, 0, w, h);
    } else {
      // Camera hardware unavailable: render camera sensor metadata frame clearly labeled
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 42px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Camera Permission Required', w / 2, h / 2 - 20);
      ctx.font = '26px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Mode: ${camMode} · ${zoom}x · ${new Date().toLocaleTimeString()}`, w / 2, h / 2 + 30);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    await addMedia({
      id: `cam-${Date.now()}`,
      type: 'photo',
      src: dataUrl,
      name: `IMG_${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.jpg`,
      createdAt: Date.now(),
      favorite: false,
      deleted: false,
      album: camMode === 'PORTRAIT' ? 'Portrait' : 'Recents',
    });
    pushNotification('photos', 'Photo Saved', `Saved ${camMode.toLowerCase()} capture (${zoom}x) to Photos.`);
  };

  const handleShutterPress = () => {
    if (camMode === 'VIDEO') {
      if (isRecording) {
        recorderRef.current?.stop();
        setIsRecording(false);
        setRecordSeconds(0);
        soundEngine.lock();
      } else if (streamRef.current && typeof MediaRecorder !== 'undefined') {
        chunksRef.current = [];
        try {
          const rec = new MediaRecorder(streamRef.current);
          rec.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };
          rec.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const reader = new FileReader();
            reader.onloadend = async () => {
              await addMedia({
                id: `vid-${Date.now()}`,
                type: 'video',
                src: reader.result as string,
                name: `VID_${Date.now().toString().slice(-5)}.webm`,
                createdAt: Date.now(),
                favorite: false,
                deleted: false,
                album: 'Videos',
                durationSec: recordSeconds || 3,
              });
              pushNotification('photos', 'Video Saved', 'Recorded video saved to Photos.');
            };
            reader.readAsDataURL(blob);
          };
          rec.start();
          recorderRef.current = rec;
          setIsRecording(true);
          soundEngine.shutter();
        } catch {
          pushNotification('camera', 'Video Unavailable', 'MediaRecorder unavailable on this camera stream.');
        }
      } else {
        pushNotification('camera', 'Camera Access Needed', 'Allow browser camera access to record live video.');
      }
      return;
    }

    if (timerSec > 0) {
      setCountdown(timerSec);
      let rem = timerSec;
      const t = window.setInterval(() => {
        rem -= 1;
        setCountdown(rem);
        soundEngine.tap();
        if (rem <= 0) {
          clearInterval(t);
          capturePhoto();
        }
      }, 1000);
    } else {
      capturePhoto();
    }
  };

  const latestThumb = media.find((m) => !m.deleted);

  return (
    <div className="h-full flex flex-col bg-black text-white select-none relative">
      {/* Screen Flash Effect */}
      {flashPulse && <div className="absolute inset-0 z-50 bg-white pointer-events-none" />}

      {/* Top Controls */}
      <div className="px-4 pt-2 pb-2 flex items-center justify-between text-xs z-20">
        <button
          onClick={() => setFlash(flash === 'auto' ? 'on' : flash === 'on' ? 'off' : 'auto')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${
            flash === 'on' ? 'bg-amber-400 text-black font-semibold' : 'bg-zinc-900 text-zinc-200'
          }`}
        >
          {flash === 'off' ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
          <span className="capitalize">{flash}</span>
        </button>

        {isRecording ? (
          <div className="px-3 py-1 rounded-full bg-red-600 text-white font-mono-num font-bold animate-pulse">
            00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds}
          </div>
        ) : (
          <button
            onClick={() => setTimerSec(timerSec === 0 ? 3 : timerSec === 3 ? 10 : 0)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${
              timerSec > 0 ? 'bg-amber-400 text-black font-semibold' : 'bg-zinc-900 text-zinc-200'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>{timerSec > 0 ? `${timerSec}s` : 'Timer'}</span>
          </button>
        )}

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 rounded-full bg-zinc-900 text-zinc-200"
          title="Camera Settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Drawer */}
      {showSettings && (
        <div className="mx-4 mb-2 p-2.5 rounded-2xl bg-zinc-900/95 border border-zinc-800 flex items-center justify-between text-xs z-20">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${showGrid ? 'bg-amber-400 text-black font-semibold' : 'bg-zinc-800'}`}
          >
            <Grid className="w-3.5 h-3.5" />
            Grid {showGrid ? 'On' : 'Off'}
          </button>
          <span className="text-[11px] text-zinc-400">48MP ProRAW · HEIF</span>
          <button onClick={() => setShowSettings(false)} className="text-amber-400 font-semibold">
            <Check className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Viewfinder */}
      <div className="relative flex-1 mx-2 rounded-3xl overflow-hidden bg-zinc-950 flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-transform duration-200 ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          }`}
          style={{
            transform: `${facingMode === 'user' ? 'scaleX(-1) ' : ''}scale(${zoom < 1 ? 1 : zoom})`,
            filter:
              camMode === 'NIGHT'
                ? 'brightness(1.3) contrast(1.08)'
                : camMode === 'PORTRAIT'
                ? 'contrast(1.06) saturate(1.12)'
                : 'none',
          }}
        />

        {/* Permission Fallback Overlay (never fakes live webcam) */}
        {camStatus === 'denied' && (
          <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <Camera className="w-10 h-10 text-amber-400" />
            <p className="text-sm font-bold">Camera Access Required</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Grant camera permission in your browser to see a live camera feed. You can still tap the shutter to capture a diagnostic frame.
            </p>
            <button
              onClick={() => startCamera(facingMode)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-400 text-black text-xs font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Camera
            </button>
          </div>
        )}

        {/* Rule of Thirds Grid */}
        {showGrid && camStatus === 'live' && (
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/15" />
            ))}
          </div>
        )}

        {/* Countdown Overlay */}
        {countdown > 0 && (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
            <span className="text-6xl font-bold font-mono-num text-amber-400">{countdown}</span>
          </div>
        )}

        {/* Mode Indicator Pill */}
        {(camMode === 'NIGHT' || camMode === 'PORTRAIT' || camMode === 'PANO') && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-[11px] font-semibold flex items-center gap-1 text-amber-300">
            {camMode === 'NIGHT' && <Moon className="w-3 h-3" />}
            {camMode === 'PORTRAIT' && <Sparkles className="w-3 h-3" />}
            {camMode}
          </div>
        )}

        {/* Zoom Selector */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full p-1">
          {[0.5, 1, 2, 4, 8].map((z) => (
            <button
              key={z}
              onClick={() => {
                soundEngine.tap();
                setZoom(z);
              }}
              className={`w-8 h-7 rounded-full text-[11px] font-bold font-mono-num transition-all ${
                zoom === z ? 'bg-amber-400 text-black scale-105' : 'text-white/90 hover:bg-white/15'
              }`}
            >
              {z}x
            </button>
          ))}
        </div>
      </div>

      {/* Mode Scroller */}
      <div className="flex items-center justify-center gap-4 py-2.5 text-[11px] font-bold tracking-wider">
        {(['PANO', 'NIGHT', 'PHOTO', 'VIDEO', 'PORTRAIT'] as CamMode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              soundEngine.tap();
              setCamMode(m);
            }}
            className={`transition-colors ${camMode === m ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Bottom Shutter Bar */}
      <div className="px-6 pb-5 pt-1 flex items-center justify-between">
        <button
          onClick={() => openApp('photos')}
          className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700 overflow-hidden"
          title="Open Photos"
        >
          {latestThumb ? (
            <img src={latestThumb.src} alt="Latest capture" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-zinc-800" />
          )}
        </button>

        <button
          onClick={handleShutterPress}
          className="w-[70px] h-[70px] rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-90 transition-transform"
          aria-label="Shutter"
        >
          <div
            className={`w-full h-full transition-all ${
              camMode === 'VIDEO'
                ? isRecording
                  ? 'bg-red-500 rounded-lg scale-50'
                  : 'bg-red-500 rounded-full'
                : 'bg-white rounded-full'
            }`}
          />
        </button>

        <button
          onClick={() => {
            soundEngine.tap();
            setFacingMode((f) => (f === 'environment' ? 'user' : 'environment'));
          }}
          className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800"
          aria-label="Flip Camera"
        >
          <FlipHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
