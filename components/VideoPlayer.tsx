"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { PlayIcon } from "./icons";

export type StreamOption = { url: string; label: string; id?: string };
export type SubtitleOption = { file: string; label: string; language: string };
export type AudioOption = { id: string; label: string };

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const PROGRESS_SAVE_INTERVAL_MS = 5000;

function formatTime(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

type SettingsView = null | "root" | "audio" | "quality" | "subtitles" | "speed";

// Plain monochrome SVGs instead of Unicode symbols (⏸ 🔊 ⚙ etc. render as
// full-color platform emoji on most systems/browsers, not clean icons).
function PauseIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  );
}
function VolumeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" stroke="none" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a9 9 0 0 1 0 12" />
    </svg>
  );
}
function MuteIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" stroke="none" />
      <path d="M23 9l-6 6M17 9l6 6" />
    </svg>
  );
}
function GearIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function FullscreenIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
    </svg>
  );
}
function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function ChevronLeftIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function ChevronRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function VideoPlayer({
  streams,
  subtitles = [],
  audioOptions = [],
  currentAudioId,
  onSelectAudio,
  startAt = 0,
  onProgress,
  onClose,
}: {
  streams: StreamOption[];
  subtitles?: SubtitleOption[];
  audioOptions?: AudioOption[];
  currentAudioId?: string;
  /** Switching audio means resolving a whole new stream server-side (each
   * dub is a separate MovieBox subject) — this hands control back to the
   * parent, which re-fetches and passes new `streams`/`subtitles` down. */
  onSelectAudio?: (id: string) => Promise<void> | void;
  /** Resume position in seconds, applied once on first load only. */
  startAt?: number;
  onProgress?: (currentTime: number, duration: number) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasResumedOnceRef = useRef(false);
  const lastProgressSaveRef = useRef(0);

  const [qualityIndex, setQualityIndex] = useState(0);
  const [subtitleIndex, setSubtitleIndex] = useState(-1); // -1 = off
  const [playbackRate, setPlaybackRate] = useState(1);
  const [settingsView, setSettingsView] = useState<SettingsView>(null);
  const [switchingAudio, setSwitchingAudio] = useState(false);

  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [scrubbing, setScrubbing] = useState(false);

  const seekBarRef = useRef<HTMLDivElement>(null);

  const src = streams[qualityIndex]?.url;

  // Reset quality/subtitle selection whenever the underlying stream set
  // itself changes (a fresh audio-dub resolve) — a different subject's
  // resolution ladder and caption list don't correspond index-for-index.
  useEffect(() => {
    setQualityIndex(0);
    setSubtitleIndex(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streams]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: import("hls.js").default | undefined;
    let cancelled = false;
    const useStartAt = !hasResumedOnceRef.current && startAt > 0;
    const resumeAt = useStartAt ? startAt : video.currentTime;
    const wasPlaying = playing;

    setLoading(true);

    function onLoaded() {
      if (cancelled || !video) return;
      if (resumeAt > 0) video.currentTime = resumeAt;
      video.playbackRate = playbackRate;
      if (wasPlaying) video.play().catch(() => {});
      setLoading(false);
      hasResumedOnceRef.current = true;
    }
    video.addEventListener("loadedmetadata", onLoaded);

    if (src.includes(".m3u8")) {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (Hls.isSupported()) {
          hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
        }
      });
    } else {
      video.src = src;
    }

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", onLoaded);
      hls?.destroy();
    };
    // Deliberately only re-run when the source itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
      const now = Date.now();
      if (now - lastProgressSaveRef.current > PROGRESS_SAVE_INTERVAL_MS) {
        lastProgressSaveRef.current = now;
        onProgress?.(video.currentTime, video.duration);
      }
    };
    const onDuration = () => setDuration(video.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    // Seeking/buffering feedback: `seeking` fires the instant a seek is
    // requested (before the browser has the data), `waiting` fires whenever
    // playback stalls for lack of buffered data (the same thing happens
    // after a seek on a network stream) — either means "show the spinner
    // until playback actually resumes" (`playing`/`canplay`).
    const onSeekingOrWaiting = () => setLoading(true);
    const onReadyToPlay = () => setLoading(false);

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("durationchange", onDuration);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("seeking", onSeekingOrWaiting);
    video.addEventListener("waiting", onSeekingOrWaiting);
    video.addEventListener("playing", onReadyToPlay);
    video.addEventListener("canplay", onReadyToPlay);
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("durationchange", onDuration);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeking", onSeekingOrWaiting);
      video.removeEventListener("waiting", onSeekingOrWaiting);
      video.removeEventListener("playing", onReadyToPlay);
      video.removeEventListener("canplay", onReadyToPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply the selected subtitle track (or turn all off).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    Array.from(video.textTracks).forEach((track, i) => {
      track.mode = i === subtitleIndex ? "showing" : "disabled";
    });
  }, [subtitleIndex, subtitles.length]);

  function scheduleHideControls() {
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (!settingsView) setControlsVisible(false);
    }, 3500);
  }

  function handleActivity() {
    setControlsVisible(true);
    scheduleHideControls();
  }

  useEffect(() => {
    scheduleHideControls();
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveFinalProgress() {
    const video = videoRef.current;
    if (video) onProgress?.(video.currentTime, video.duration);
  }

  function handleClose() {
    saveFinalProgress();
    onClose();
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  // Dragging the handle from position A to B is the normal way to use a
  // slider — this used to only handle a plain click, so a drag did nothing
  // until release, and even then didn't reliably land on the released
  // point. Now: mousedown/touchstart begins tracking, every move updates
  // `currentTime` instantly (the bar fills live as you drag, no waiting for
  // the video itself), and only the final release actually commits
  // `video.currentTime` — which is what triggers the real
  // seeking/waiting -> spinner -> playing/canplay sequence above.
  function fractionFromClientX(clientX: number) {
    const rect = seekBarRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }

  function beginScrub(clientX: number) {
    if (!duration) return;
    setScrubbing(true);
    setCurrentTime(fractionFromClientX(clientX) * duration);
  }

  function updateScrub(clientX: number) {
    if (!duration) return;
    setCurrentTime(fractionFromClientX(clientX) * duration);
  }

  function endScrub(clientX: number) {
    const video = videoRef.current;
    if (video && duration) {
      const target = fractionFromClientX(clientX) * duration;
      setCurrentTime(target);
      video.currentTime = target;
    }
    setScrubbing(false);
  }

  useEffect(() => {
    if (!scrubbing) return;
    const onMouseMove = (e: MouseEvent) => updateScrub(e.clientX);
    const onMouseUp = (e: MouseEvent) => endScrub(e.clientX);
    const onTouchMove = (e: TouchEvent) => updateScrub(e.touches[0].clientX);
    const onTouchEnd = (e: TouchEvent) => endScrub(e.changedTouches[0].clientX);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrubbing, duration]);

  function skip(deltaSeconds: number) {
    const video = videoRef.current;
    if (!video) return;
    const target = Math.min(Math.max(video.currentTime + deltaSeconds, 0), duration || Infinity);
    video.currentTime = target;
    setCurrentTime(target);
  }

  // Keyboard shortcuts: space/K play-pause, F fullscreen, arrows skip ±10s —
  // ignored while typing wasn't a concern here since the player is a
  // full-screen overlay with no text inputs of its own.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" || e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        skip(10);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        skip(-10);
      } else {
        return;
      }
      handleActivity();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function changeVolume(v: number) {
    const video = videoRef.current;
    if (!video) return;
    video.volume = v;
    setVolume(v);
    if (v > 0 && video.muted) {
      video.muted = false;
      setMuted(false);
    }
  }

  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen().catch(() => {});
  }

  function changeSpeed(rate: number) {
    const video = videoRef.current;
    if (video) video.playbackRate = rate;
    setPlaybackRate(rate);
    setSettingsView(null);
  }

  async function selectAudio(id: string) {
    if (id === currentAudioId) {
      setSettingsView(null);
      return;
    }
    setSwitchingAudio(true);
    try {
      await onSelectAudio?.(id);
    } finally {
      setSwitchingAudio(false);
      setSettingsView(null);
    }
  }

  const progressFraction = duration > 0 ? currentTime / duration : 0;
  const bufferedFraction = duration > 0 ? buffered / duration : 0;
  const currentAudioLabel = audioOptions.find((a) => a.id === currentAudioId)?.label ?? "Default";
  const currentQualityLabel = streams[qualityIndex]?.label ?? "Auto";
  const currentSubtitleLabel = subtitleIndex === -1 ? "Off" : (subtitles[subtitleIndex]?.label ?? "Off");

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      onMouseMove={handleActivity}
      onClick={handleActivity}
    >
      <video
        ref={videoRef}
        autoPlay
        className="h-full w-full object-contain"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      >
        {subtitles.map((s, i) => (
          <track
            key={s.file}
            kind="subtitles"
            src={s.file}
            srcLang={s.language}
            label={s.label}
            default={i === subtitleIndex}
          />
        ))}
      </video>

      {(loading || switchingAudio) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-white" />
        </div>
      )}

      {/* Big centered play button when paused */}
      {!playing && !loading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="absolute flex h-20 w-20 items-center justify-center rounded-full bg-black/50 text-white transition-transform hover:scale-105"
        >
          <PlayIcon className="h-10 w-10" />
        </button>
      )}

      {/* Top bar */}
      <div
        className={`absolute inset-x-0 top-0 flex justify-end bg-linear-to-b from-black/70 to-transparent p-5 transition-opacity duration-200 ${
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-base text-white hover:bg-white/20"
        >
          Close
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Bottom controls */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 to-transparent px-5 pt-16 pb-5 transition-opacity duration-200 ${
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Seek bar */}
        <div
          ref={seekBarRef}
          className="group relative -my-2 flex h-6 w-full cursor-pointer items-center"
          onMouseDown={(e) => beginScrub(e.clientX)}
          onTouchStart={(e) => beginScrub(e.touches[0].clientX)}
        >
          <div className="relative h-2 w-full rounded-full bg-white/20">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/30"
              style={{ width: `${bufferedFraction * 100}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-accent"
              style={{ width: `${progressFraction * 100}%` }}
            />
            <div
              className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-accent shadow transition-opacity ${
                scrubbing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
              style={{ left: `calc(${progressFraction * 100}% - 8px)` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-5 text-white">
          <button onClick={togglePlay} className="text-white">
            {playing ? <PauseIcon className="h-8 w-8" /> : <PlayIcon className="h-8 w-8" />}
          </button>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-white">
              {muted || volume === 0 ? <MuteIcon className="h-6 w-6" /> : <VolumeIcon className="h-6 w-6" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              className="h-1.5 w-24"
              style={{ accentColor: "var(--accent)" }}
            />
          </div>

          <span className="text-sm text-white/80 tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="relative ml-auto flex items-center gap-4">
            {(audioOptions.length > 1 || streams.length > 1 || subtitles.length > 0) && (
              <button
                onClick={() => setSettingsView(settingsView ? null : "root")}
                className="flex items-center gap-2 rounded-md bg-white/10 px-4 py-2.5 text-sm font-medium hover:bg-white/20"
              >
                <GearIcon className="h-5 w-5" /> Settings
              </button>
            )}
            <button onClick={toggleFullscreen} className="text-white">
              <FullscreenIcon className="h-6 w-6" />
            </button>

            {settingsView && (
              <div className="absolute bottom-full right-0 mb-3 w-72 overflow-hidden rounded-lg bg-surface text-base shadow-2xl">
                {settingsView === "root" && (
                  <div className="py-2">
                    {audioOptions.length > 1 && (
                      <SettingsRow
                        label="Audio"
                        value={currentAudioLabel}
                        onClick={() => setSettingsView("audio")}
                      />
                    )}
                    {streams.length > 1 && (
                      <SettingsRow
                        label="Quality"
                        value={currentQualityLabel}
                        onClick={() => setSettingsView("quality")}
                      />
                    )}
                    {subtitles.length > 0 && (
                      <SettingsRow
                        label="Subtitles"
                        value={currentSubtitleLabel}
                        onClick={() => setSettingsView("subtitles")}
                      />
                    )}
                    <SettingsRow
                      label="Speed"
                      value={playbackRate === 1 ? "Normal" : `${playbackRate}x`}
                      onClick={() => setSettingsView("speed")}
                    />
                  </div>
                )}

                {settingsView === "audio" && (
                  <SettingsList title="Audio" onBack={() => setSettingsView("root")}>
                    {audioOptions.map((a) => (
                      <SettingsOption
                        key={a.id}
                        label={a.label}
                        active={a.id === currentAudioId}
                        onClick={() => selectAudio(a.id)}
                      />
                    ))}
                  </SettingsList>
                )}

                {settingsView === "quality" && (
                  <SettingsList title="Quality" onBack={() => setSettingsView("root")}>
                    {streams.map((s, i) => (
                      <SettingsOption
                        key={s.label + i}
                        label={s.label}
                        active={i === qualityIndex}
                        onClick={() => {
                          setQualityIndex(i);
                          setSettingsView(null);
                        }}
                      />
                    ))}
                  </SettingsList>
                )}

                {settingsView === "subtitles" && (
                  <SettingsList title="Subtitles" onBack={() => setSettingsView("root")}>
                    <SettingsOption
                      label="Off"
                      active={subtitleIndex === -1}
                      onClick={() => {
                        setSubtitleIndex(-1);
                        setSettingsView(null);
                      }}
                    />
                    {subtitles.map((s, i) => (
                      <SettingsOption
                        key={s.file}
                        label={s.label}
                        active={i === subtitleIndex}
                        onClick={() => {
                          setSubtitleIndex(i);
                          setSettingsView(null);
                        }}
                      />
                    ))}
                  </SettingsList>
                )}

                {settingsView === "speed" && (
                  <SettingsList title="Speed" onBack={() => setSettingsView("root")}>
                    {SPEED_OPTIONS.map((rate) => (
                      <SettingsOption
                        key={rate}
                        label={rate === 1 ? "Normal" : `${rate}x`}
                        active={rate === playbackRate}
                        onClick={() => changeSpeed(rate)}
                      />
                    ))}
                  </SettingsList>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/10"
    >
      <span>{label}</span>
      <span className="flex items-center gap-1 text-white/50">
        {value}
        <ChevronRightIcon className="h-4 w-4" />
      </span>
    </button>
  );
}

function SettingsList({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div className="max-h-80 overflow-y-auto py-2">
      <button
        onClick={onBack}
        className="mb-1 flex w-full items-center gap-2 px-4 py-2 text-left text-white/60 hover:bg-white/10"
      >
        <ChevronLeftIcon className="h-4 w-4" /> {title}
      </button>
      {children}
    </div>
  );
}

function SettingsOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-white/10 ${
        active ? "text-accent" : "text-white"
      }`}
    >
      {active ? <CheckIcon className="h-4 w-4 shrink-0" /> : <span className="w-4 shrink-0" />}
      {label}
    </button>
  );
}
