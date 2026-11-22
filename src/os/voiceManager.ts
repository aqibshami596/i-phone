import { Call as TwilioCall, Device as TwilioDevice } from '@twilio/voice-sdk';
import { soundEngine } from './soundEngine';
import { CallStatus, CallTransport } from './types';

export interface OnlineVoipPeer {
  extension: string;
  name: string;
}

export interface VoiceConfigInfo {
  twilioConfigured: boolean;
  callerId: string | null;
  webrtcSignalingReady: boolean;
  onlinePeersCount: number;
  stunServers: RTCIceServer[];
}

export interface VoiceCallEventCallbacks {
  onConfigUpdate: (cfg: VoiceConfigInfo) => void;
  onPeersUpdate: (peers: OnlineVoipPeer[]) => void;
  onWsStatusUpdate: (connected: boolean) => void;
  onIncomingSignal: (payload: {
    callId: string;
    fromExtension: string;
    callerName: string;
    transport: CallTransport;
    twilioCall?: TwilioCall;
  }) => void;
  onCallStatusChange: (
    callId: string,
    status: CallStatus,
    extra?: { errorMessage?: string; connectedAt?: number }
  ) => void;
  onMicLevel: (level: number) => void;
  onRemoteHold: (callId: string, onHold: boolean) => void;
}

class VoiceManager {
  private ws: WebSocket | null = null;
  private myExtension = '';
  private myName = 'iPhone 18 Pro Max';
  private callbacks: VoiceCallEventCallbacks | null = null;
  private reconnectTimer: number | null = null;

  private pc: RTCPeerConnection | null = null;
  private activePeerExt = '';
  private activeCallId = '';
  private pendingIce: RTCIceCandidateInit[] = [];

  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private remoteAudioEl: HTMLAudioElement | null = null;
  private micAudioCtx: AudioContext | null = null;
  private micLevelTimer: number | null = null;
  private hardwareTestStream: MediaStream | null = null;

  private hardwareEnabled = true;
  private preferredDeviceId = '';
  private micGain = 100;

  private twilioDevice: TwilioDevice | null = null;
  private activeTwilioCall: TwilioCall | null = null;

  private stunServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  public init(extension: string, name: string, callbacks: VoiceCallEventCallbacks) {
    this.myExtension = extension;
    this.myName = name;
    this.callbacks = callbacks;
    this.fetchConfig();
    this.connectWs();
  }

  public destroy() {
    this.cleanupMediaAndPeer();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    try {
      this.ws?.close();
    } catch {
      // ignore
    }
    this.ws = null;
    try {
      this.twilioDevice?.destroy();
    } catch {
      // ignore
    }
    this.twilioDevice = null;
  }

  public async fetchConfig(): Promise<VoiceConfigInfo> {
    try {
      const res = await fetch('/api/voice/config');
      if (res.ok) {
        const cfg = (await res.json()) as VoiceConfigInfo;
        if (Array.isArray(cfg.stunServers) && cfg.stunServers.length > 0) {
          this.stunServers = cfg.stunServers;
        }
        this.callbacks?.onConfigUpdate(cfg);
        if (cfg.twilioConfigured && !this.twilioDevice) {
          this.initTwilioDevice();
        }
        return cfg;
      }
    } catch {
      // ignore offline
    }
    const fallback: VoiceConfigInfo = {
      twilioConfigured: false,
      callerId: null,
      webrtcSignalingReady: false,
      onlinePeersCount: 0,
      stunServers: this.stunServers,
    };
    this.callbacks?.onConfigUpdate(fallback);
    return fallback;
  }

  private async initTwilioDevice() {
    try {
      const res = await fetch('/api/voice/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: this.myExtension || 'iphone_18_user' }),
      });
      const data = await res.json();
      if (!res.ok || !data?.token) return;

      const device = new TwilioDevice(data.token, {
        closeProtection: false,
      });
      device.on('incoming', (call: TwilioCall) => {
        this.activeTwilioCall = call;
        const callId = `tw-${Date.now()}`;
        const from = String(call.parameters?.From || 'Twilio Caller');
        this.callbacks?.onIncomingSignal({
          callId,
          fromExtension: from,
          callerName: from,
          transport: 'twilio-pstn',
          twilioCall: call,
        });
      });
      await device.register();
      this.twilioDevice = device;
    } catch {
      // ignore Twilio initialization if credentials aren't valid yet
    }
  }

  private connectWs() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws/voice`);
    this.ws = ws;

    ws.onopen = () => {
      this.callbacks?.onWsStatusUpdate(true);
      ws.send(
        JSON.stringify({
          type: 'register',
          extension: this.myExtension,
          name: this.myName,
        })
      );
    };

    ws.onclose = () => {
      this.callbacks?.onWsStatusUpdate(false);
      this.ws = null;
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = window.setTimeout(() => this.connectWs(), 1200);
    };

    ws.onerror = () => {
      this.callbacks?.onWsStatusUpdate(false);
    };

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data as string) as Record<string, any>;
        switch (msg.type) {
          case 'peers:list': {
            const peers = Array.isArray(msg.peers) ? (msg.peers as OnlineVoipPeer[]) : [];
            this.callbacks?.onPeersUpdate(peers.filter((p) => p.extension !== this.myExtension));
            break;
          }
          case 'call:invite': {
            if (!msg.callId || !msg.from) break;
            this.callbacks?.onIncomingSignal({
              callId: String(msg.callId),
              fromExtension: String(msg.from),
              callerName: String(msg.callerName || msg.from),
              transport: 'webrtc-p2p',
            });
            break;
          }
          case 'call:unavailable': {
            if (msg.callId === this.activeCallId) {
              soundEngine.playCallEnded();
              this.callbacks?.onCallStatusChange(String(msg.callId), 'failed', {
                errorMessage: String(msg.reason || 'Recipient unavailable.'),
              });
              this.cleanupMediaAndPeer();
            }
            break;
          }
          case 'call:accept': {
            if (msg.callId !== this.activeCallId || !this.pc) break;
            this.callbacks?.onCallStatusChange(String(msg.callId), 'connecting');
            const offer = await this.pc.createOffer();
            await this.pc.setLocalDescription(offer);
            this.sendWs({
              type: 'webrtc:offer',
              to: this.activePeerExt,
              callId: this.activeCallId,
              sdp: offer,
            });
            break;
          }
          case 'call:decline': {
            if (msg.callId === this.activeCallId) {
              soundEngine.playCallEnded();
              this.callbacks?.onCallStatusChange(String(msg.callId), 'declined', {
                errorMessage: 'Call declined by recipient.',
              });
              this.cleanupMediaAndPeer();
            }
            break;
          }
          case 'call:hangup': {
            if (msg.callId === this.activeCallId) {
              soundEngine.playCallEnded();
              this.callbacks?.onCallStatusChange(String(msg.callId), 'ended');
              this.cleanupMediaAndPeer();
            }
            break;
          }
          case 'call:hold': {
            if (msg.callId === this.activeCallId) {
              this.callbacks?.onRemoteHold(String(msg.callId), Boolean(msg.onHold));
            }
            break;
          }
          case 'webrtc:offer': {
            if (!this.pc || msg.callId !== this.activeCallId || !msg.sdp) break;
            await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            for (const c of this.pendingIce) {
              await this.pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
            }
            this.pendingIce = [];
            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);
            this.sendWs({
              type: 'webrtc:answer',
              to: String(msg.from),
              callId: this.activeCallId,
              sdp: answer,
            });
            break;
          }
          case 'webrtc:answer': {
            if (!this.pc || msg.callId !== this.activeCallId || !msg.sdp) break;
            await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            for (const c of this.pendingIce) {
              await this.pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
            }
            this.pendingIce = [];
            break;
          }
          case 'webrtc:ice': {
            if (!msg.candidate || msg.callId !== this.activeCallId) break;
            if (this.pc?.remoteDescription) {
              await this.pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {});
            } else {
              this.pendingIce.push(msg.candidate as RTCIceCandidateInit);
            }
            break;
          }
          default:
            break;
        }
      } catch {
        // ignore parse/signaling error
      }
    };
  }

  private sendWs(payload: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  public setMicrophonePreferences(enabled: boolean, deviceId?: string, gain?: number) {
    this.hardwareEnabled = enabled;
    this.preferredDeviceId = deviceId || '';
    if (typeof gain === 'number') {
      this.micGain = Math.max(0, Math.min(100, gain));
    }
    if (!enabled) {
      this.setMuted(true);
      this.stopHardwareMicTest();
    }
  }

  public async enumerateMicrophones(requestPermission = false): Promise<{
    devices: MediaDeviceInfo[];
    error?: string;
  }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return { devices: [], error: 'Browser media device enumeration is unavailable.' };
    }
    try {
      if (requestPermission && navigator.mediaDevices.getUserMedia) {
        const temp = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        temp.getTracks().forEach((t) => t.stop());
      }
      const all = await navigator.mediaDevices.enumerateDevices();
      return { devices: all.filter((d) => d.kind === 'audioinput') };
    } catch (err) {
      return {
        devices: [],
        error: err instanceof Error ? err.message : 'Microphone permission denied.',
      };
    }
  }

  public async startHardwareMicTest(): Promise<{ ok: boolean; error?: string; stream?: MediaStream }> {
    this.stopHardwareMicTest();
    const { stream, error } = await this.requestMicrophone();
    if (!stream) {
      return { ok: false, error: error || 'Unable to open hardware microphone.' };
    }
    this.hardwareTestStream = stream;
    this.localStream = null;
    return { ok: true, stream };
  }

  public stopHardwareMicTest() {
    if (this.hardwareTestStream) {
      this.hardwareTestStream.getTracks().forEach((t) => t.stop());
      this.hardwareTestStream = null;
      if (!this.localStream) {
        this.stopMicMeter();
      }
    }
  }

  public async requestMicrophone(): Promise<{ stream: MediaStream | null; error?: string }> {
    if (!this.hardwareEnabled) {
      return {
        stream: null,
        error: 'iPhone Hardware Microphone is switched OFF. Turn it on in Settings, Control Center, or the bezel switch.',
      };
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return { stream: null, error: 'Browser microphone API (getUserMedia) is unavailable in this environment.' };
    }
    try {
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...(this.preferredDeviceId ? { deviceId: { ideal: this.preferredDeviceId } } : {}),
      };
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false,
      });
      this.localStream = stream;
      this.startMicMeter(stream);
      return { stream };
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access to use voice hardware.'
          : err instanceof DOMException && err.name === 'NotFoundError'
            ? 'No physical microphone hardware found on this device.'
            : err instanceof Error
              ? err.message
              : 'Unable to access microphone.';
      return { stream: null, error: msg };
    }
  }

  private startMicMeter(stream: MediaStream) {
    this.stopMicMeter();
    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      this.micAudioCtx = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      this.micLevelTimer = window.setInterval(() => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / Math.max(1, data.length);
        const scaled = avg * Math.max(0.2, this.micGain / 100);
        const pct = Math.min(100, Math.round((scaled / 85) * 100));
        this.callbacks?.onMicLevel(pct);
      }, 90);
    } catch {
      // ignore AudioContext error
    }
  }

  private stopMicMeter() {
    if (this.micLevelTimer) {
      clearInterval(this.micLevelTimer);
      this.micLevelTimer = null;
    }
    try {
      this.micAudioCtx?.close();
    } catch {
      // ignore
    }
    this.micAudioCtx = null;
    this.callbacks?.onMicLevel(0);
  }

  private ensureRemoteAudioElement(): HTMLAudioElement {
    if (!this.remoteAudioEl) {
      const audio = document.createElement('audio');
      audio.autoplay = true;
      audio.setAttribute('playsinline', 'true');
      this.remoteAudioEl = audio;
    }
    return this.remoteAudioEl;
  }

  private createPeerConnection(callId: string, targetExt: string, stream: MediaStream) {
    const pc = new RTCPeerConnection({ iceServers: this.stunServers });
    this.pc = pc;
    this.pendingIce = [];

    stream.getAudioTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (e) => {
      const [remStream] = e.streams;
      if (remStream) {
        this.remoteStream = remStream;
        const el = this.ensureRemoteAudioElement();
        el.srcObject = remStream;
        el.play().catch(() => {});
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.sendWs({
          type: 'webrtc:ice',
          to: targetExt,
          callId,
          candidate: e.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === 'connected') {
        soundEngine.stopCallTones();
        this.callbacks?.onCallStatusChange(callId, 'connected', { connectedAt: Date.now() });
      } else if (st === 'failed' || st === 'disconnected') {
        soundEngine.playCallEnded();
        this.callbacks?.onCallStatusChange(callId, 'failed', {
          errorMessage: `WebRTC audio connection ${st}.`,
        });
        this.cleanupMediaAndPeer();
      }
    };

    return pc;
  }

  public async startWebRtcCall(callId: string, toExtension: string): Promise<{ ok: boolean; error?: string }> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return { ok: false, error: 'VoIP signaling server is not connected.' };
    }
    const { stream, error } = await this.requestMicrophone();
    if (!stream) {
      return { ok: false, error };
    }
    this.activeCallId = callId;
    this.activePeerExt = toExtension;
    this.createPeerConnection(callId, toExtension, stream);
    soundEngine.startRingback();
    this.sendWs({
      type: 'call:invite',
      callId,
      to: toExtension,
      from: this.myExtension,
      callerName: this.myName,
    });
    return { ok: true };
  }

  public async acceptWebRtcCall(callId: string, peerExtension: string): Promise<{ ok: boolean; error?: string }> {
    soundEngine.stopCallTones();
    const { stream, error } = await this.requestMicrophone();
    if (!stream) {
      this.sendWs({ type: 'call:decline', callId, to: peerExtension });
      return { ok: false, error };
    }
    this.activeCallId = callId;
    this.activePeerExt = peerExtension;
    this.createPeerConnection(callId, peerExtension, stream);
    this.callbacks?.onCallStatusChange(callId, 'connecting');
    this.sendWs({
      type: 'call:accept',
      callId,
      to: peerExtension,
    });
    return { ok: true };
  }

  public declineWebRtcCall(callId: string, peerExtension: string) {
    soundEngine.stopCallTones();
    this.sendWs({ type: 'call:decline', callId, to: peerExtension });
    this.cleanupMediaAndPeer();
  }

  public async startTwilioPstnCall(callId: string, phoneNumber: string): Promise<{ ok: boolean; error?: string }> {
    const { stream, error } = await this.requestMicrophone();
    if (!stream) {
      return { ok: false, error };
    }
    if (!this.twilioDevice) {
      await this.initTwilioDevice();
    }
    if (!this.twilioDevice) {
      this.cleanupMediaAndPeer();
      return {
        ok: false,
        error: 'Twilio Voice Device could not be initialized. Verify TWILIO_* credentials on server.',
      };
    }

    this.activeCallId = callId;
    soundEngine.startRingback();
    try {
      const sanitizedTo = phoneNumber.replace(/[^\d+]/g, '') || phoneNumber;
      const call = await this.twilioDevice.connect({
        params: { To: sanitizedTo },
      });
      this.activeTwilioCall = call;

      call.on('ringing', () => {
        this.callbacks?.onCallStatusChange(callId, 'ringing');
      });
      call.on('accept', () => {
        soundEngine.stopCallTones();
        this.callbacks?.onCallStatusChange(callId, 'connected', { connectedAt: Date.now() });
      });
      call.on('disconnect', () => {
        soundEngine.playCallEnded();
        this.callbacks?.onCallStatusChange(callId, 'ended');
        this.cleanupMediaAndPeer();
      });
      call.on('cancel', () => {
        soundEngine.playCallEnded();
        this.callbacks?.onCallStatusChange(callId, 'ended');
        this.cleanupMediaAndPeer();
      });
      call.on('reject', () => {
        soundEngine.playCallEnded();
        this.callbacks?.onCallStatusChange(callId, 'declined', { errorMessage: 'Call rejected.' });
        this.cleanupMediaAndPeer();
      });
      call.on('error', (twErr: { message?: string }) => {
        soundEngine.playCallEnded();
        this.callbacks?.onCallStatusChange(callId, 'failed', {
          errorMessage: twErr?.message || 'Twilio carrier call failed.',
        });
        this.cleanupMediaAndPeer();
      });
      return { ok: true };
    } catch (err) {
      soundEngine.playCallEnded();
      this.cleanupMediaAndPeer();
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Twilio call initiation failed.',
      };
    }
  }

  public async acceptTwilioIncoming(callId: string, twCall: TwilioCall): Promise<{ ok: boolean; error?: string }> {
    soundEngine.stopCallTones();
    const { stream, error } = await this.requestMicrophone();
    if (!stream) {
      try {
        twCall.reject();
      } catch {
        // ignore
      }
      return { ok: false, error };
    }
    this.activeCallId = callId;
    this.activeTwilioCall = twCall;
    twCall.on('disconnect', () => {
      soundEngine.playCallEnded();
      this.callbacks?.onCallStatusChange(callId, 'ended');
      this.cleanupMediaAndPeer();
    });
    twCall.on('error', (twErr: { message?: string }) => {
      soundEngine.playCallEnded();
      this.callbacks?.onCallStatusChange(callId, 'failed', { errorMessage: twErr?.message });
      this.cleanupMediaAndPeer();
    });
    twCall.accept();
    this.callbacks?.onCallStatusChange(callId, 'connected', { connectedAt: Date.now() });
    return { ok: true };
  }

  public setMuted(muted: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
    try {
      this.activeTwilioCall?.mute(muted);
    } catch {
      // ignore
    }
  }

  public async setSpeaker(speakerOn: boolean) {
    const el = this.remoteAudioEl as (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }) | null;
    if (el) {
      el.volume = speakerOn ? 1.0 : 0.65;
      if (typeof el.setSinkId === 'function' && navigator.mediaDevices?.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const outputs = devices.filter((d) => d.kind === 'audiooutput');
          const speakerDev = outputs.find((d) => /speaker/i.test(d.label));
          if (speakerOn && speakerDev) {
            await el.setSinkId(speakerDev.deviceId);
          } else if (outputs[0]) {
            await el.setSinkId(outputs[0].deviceId);
          }
        } catch {
          // ignore sink selection restriction
        }
      }
    }
  }

  public setHold(callId: string, onHold: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !onHold;
    });
    this.remoteStream?.getAudioTracks().forEach((t) => {
      t.enabled = !onHold;
    });
    if (this.activePeerExt) {
      this.sendWs({
        type: 'call:hold',
        callId,
        to: this.activePeerExt,
        onHold,
      });
    }
  }

  public sendDtmf(digit: string) {
    soundEngine.dtmf(digit);
    try {
      this.activeTwilioCall?.sendDigits(digit);
    } catch {
      // ignore
    }
    if (this.pc) {
      for (const sender of this.pc.getSenders()) {
        if (sender.track?.kind === 'audio' && sender.dtmf) {
          try {
            sender.dtmf.insertDTMF(digit, 140, 70);
          } catch {
            // ignore
          }
        }
      }
    }
  }

  public hangup(callId?: string) {
    soundEngine.stopCallTones();
    if (this.activePeerExt && (callId || this.activeCallId)) {
      this.sendWs({
        type: 'call:hangup',
        callId: callId || this.activeCallId,
        to: this.activePeerExt,
      });
    }
    if (this.activeTwilioCall) {
      try {
        this.activeTwilioCall.disconnect();
      } catch {
        // ignore
      }
    }
    this.cleanupMediaAndPeer();
  }

  public cleanupMediaAndPeer() {
    soundEngine.stopCallTones();
    this.stopMicMeter();
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.remoteStream = null;
    if (this.remoteAudioEl) {
      this.remoteAudioEl.srcObject = null;
    }
    if (this.pc) {
      try {
        this.pc.close();
      } catch {
        // ignore
      }
      this.pc = null;
    }
    this.activeTwilioCall = null;
    this.activePeerExt = '';
    this.activeCallId = '';
    this.pendingIce = [];
  }
}

export const voiceManager = new VoiceManager();
