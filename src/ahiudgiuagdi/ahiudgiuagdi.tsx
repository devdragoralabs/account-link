import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Maximize2,
  Minimize2,
  Clock,
  Volume2,
  VolumeX,
  Timer,
  Palette,
  Sparkles,
  Type,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  EyeOff,
  Sun
} from 'lucide-react';
import { soundEngine } from './qwhbdznbvxz';

type ColorOption = {
  id: string;
  name: string;
  hex: string;
  textDark?: boolean;
};

const COLOR_OPTIONS: ColorOption[] = [
  { id: 'pure-black', name: 'OLED Black', hex: '#000000' },
  { id: 'charcoal', name: 'Charcoal', hex: '#0a0a0c' },
  { id: 'deep-navy', name: 'Deep Midnight', hex: '#050711' },
  { id: 'warm-amber', name: 'Night Amber', hex: '#1c1308' },
  { id: 'pure-white', name: 'White Light', hex: '#ffffff', textDark: true },
  { id: 'red', name: 'Red Test', hex: '#ff0000' },
  { id: 'green', name: 'Green Test', hex: '#00ff00', textDark: true },
  { id: 'blue', name: 'Blue Test', hex: '#0000ff' },
];

export function BlackScreenMain() {
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isLockedPure, setIsLockedPure] = useState<boolean>(false);

  // Active modal panels
  const [activeTab, setActiveTab] = useState<'colors' | 'clock' | 'timer' | 'sound' | 'pixel' | 'text' | 'help' | null>(null);

  // Clock state
  const [showClock, setShowClock] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [clockFormat24, setClockFormat24] = useState<boolean>(true);
  const [showSeconds, setShowSeconds] = useState<boolean>(true);
  const [clockBrightness, setClockBrightness] = useState<number>(20); // 5% to 100%
  const [clockPosition, setClockPosition] = useState<'center' | 'top-right' | 'bottom-center'>('center');

  // Sleep Timer state
  const [timerDuration, setTimerDuration] = useState<number>(15 * 60); // seconds
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerCompleted, setTimerCompleted] = useState<boolean>(false);

  // Ambient sound state
  const [ambientSound, setAmbientSound] = useState<'brown' | 'rain' | 'waves' | 'cosmic' | null>(null);
  const [soundVolume, setSoundVolume] = useState<number>(0.5);

  // Pixel cleaner state
  const [isPixelCycle, setIsPixelCycle] = useState<boolean>(false);
  const [cycleSpeed, setCycleSpeed] = useState<number>(1500); // ms

  // Custom text note
  const [customText, setCustomText] = useState<string>('');
  const [showCustomText, setShowCustomText] = useState<boolean>(false);
  const [textBrightness, setTextBrightness] = useState<number>(30);

  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Pixel cleaner cycle
  useEffect(() => {
    if (!isPixelCycle) return;
    const colors = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % colors.length;
      setCurrentColor(colors[idx]);
    }, cycleSpeed);
    return () => clearInterval(interval);
  }, [isPixelCycle, cycleSpeed]);

  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          setTimerCompleted(true);
          soundEngine.playChime();
          setShowControls(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Reset hide controls timer on user activity
  const resetHideTimer = useCallback(() => {
    if (isLockedPure) return;
    setShowControls(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    // Fade out after 2.8 seconds of mouse inactivity if no dialog is actively open
    if (!activeTab) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2800);
    }
  }, [activeTab, isLockedPure]);

  useEffect(() => {
    const handleMouseMove = () => {
      if (isLockedPure) {
        setIsLockedPure(false);
      }
      resetHideTimer();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      resetHideTimer();

      // Keyboard shortcuts
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'c' || e.key === 'C') {
        setShowClock(prev => !prev);
      } else if (e.key === 'b' || e.key === 'B') {
        setCurrentColor('#000000');
        setIsPixelCycle(false);
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setShowControls(prev => !prev);
      } else if (e.key === 'Escape') {
        setActiveTab(null);
        setShowControls(true);
        setIsLockedPure(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleMouseMove);

    resetHideTimer();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleMouseMove);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [resetHideTimer, isLockedPure]);

  // Fullscreen handling
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        setIsFullscreen(true);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Ambient sound handler
  const handleSoundToggle = (type: 'brown' | 'rain' | 'waves' | 'cosmic') => {
    if (ambientSound === type) {
      soundEngine.stop();
      setAmbientSound(null);
    } else {
      soundEngine.play(type, soundVolume);
      setAmbientSound(type);
    }
  };

  const handleVolumeChange = (v: number) => {
    setSoundVolume(v);
    soundEngine.setVolume(v);
  };

  // Timer controls
  const startTimer = (seconds: number) => {
    setTimerDuration(seconds);
    setTimerRemaining(seconds);
    setIsTimerRunning(true);
    setTimerCompleted(false);
    setActiveTab(null);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setTimerRemaining(0);
  };

  // Format time remaining
  const formatTimerDisplay = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Format clock time
  const formatClockTime = () => {
    let hours = currentTime.getHours();
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const seconds = currentTime.getSeconds().toString().padStart(2, '0');
    let ampm = '';

    if (!clockFormat24) {
      ampm = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12 || 12;
    }
    const hrStr = hours.toString().padStart(clockFormat24 ? 2 : 1, '0');

    return {
      time: `${hrStr}:${minutes}${showSeconds ? `:${seconds}` : ''}`,
      ampm,
      date: currentTime.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    };
  };

  const clockData = formatClockTime();

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: currentColor,
        cursor: showControls ? 'default' : 'none',
      }}
      className="relative w-screen h-screen overflow-hidden select-none transition-colors duration-500 ease-out flex items-center justify-center font-sans"
      onClick={(e) => {
        // If clicking directly on background, lock controls or reveal
        if (e.target === containerRef.current) {
          if (showControls) {
            setShowControls(false);
            setActiveTab(null);
          } else {
            setShowControls(true);
          }
        }
      }}
    >
      {/* Dim / subtle custom text */}
      {showCustomText && customText.trim() && (
        <div
          style={{ opacity: textBrightness / 100 }}
          className="absolute z-10 text-center max-w-2xl px-6 pointer-events-none transition-opacity duration-300"
        >
          <p className="text-2xl md:text-4xl font-light tracking-widest text-neutral-200 uppercase leading-relaxed">
            {customText}
          </p>
        </div>
      )}

      {/* Dim Clock Display */}
      {showClock && (
        <div
          style={{ opacity: clockBrightness / 100 }}
          className={`absolute z-10 text-neutral-100 font-mono transition-opacity duration-300 pointer-events-none text-center ${
            clockPosition === 'top-right'
              ? 'top-8 right-8 text-right'
              : clockPosition === 'bottom-center'
              ? 'bottom-12 text-center'
              : 'text-center'
          }`}
        >
          <div className="text-5xl md:text-8xl font-extralight tracking-tight flex items-baseline justify-center gap-2">
            <span>{clockData.time}</span>
            {clockData.ampm && <span className="text-xl md:text-3xl font-light opacity-75">{clockData.ampm}</span>}
          </div>
          <div className="text-sm md:text-lg tracking-widest uppercase opacity-60 mt-1">
            {clockData.date}
          </div>
        </div>
      )}

      {/* Active Timer Pill Badge in corner */}
      {isTimerRunning && (
        <div
          onClick={() => setActiveTab('timer')}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 text-white/70 backdrop-blur-md text-xs font-mono cursor-pointer hover:text-white transition-opacity duration-300"
          style={{ opacity: showControls ? 0.9 : 0.2 }}
        >
          <Timer className="w-3.5 h-3.5 animate-spin text-amber-400" style={{ animationDuration: '3s' }} />
          <span>{formatTimerDisplay(timerRemaining)}</span>
        </div>
      )}

      {/* Timer completed notification banner */}
      {timerCompleted && (
        <div className="absolute top-12 z-30 px-6 py-3 rounded-2xl bg-neutral-900/90 border border-amber-500/30 text-amber-200 text-sm flex items-center gap-3 shadow-2xl backdrop-blur-lg animate-bounce">
          <Timer className="w-4 h-4 text-amber-400" />
          <span>Sleep timer reached! Display is ready.</span>
          <button
            onClick={() => setTimerCompleted(false)}
            className="ml-2 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 px-2.5 py-1 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Floating Bottom Toolbar HUD */}
      <div
        className={`fixed bottom-6 z-30 max-w-[95vw] transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-neutral-950/80 border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/80 text-neutral-300">
          {/* Quick Pure Black shortcut */}
          <button
            onClick={() => {
              setCurrentColor('#000000');
              setIsPixelCycle(false);
              setActiveTab(null);
            }}
            title="OLED Pure Black (#000000)"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              currentColor === '#000000' && !isPixelCycle
                ? 'bg-white/15 text-white shadow-inner'
                : 'hover:bg-white/10 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-full border border-white/30 bg-black" />
            <span className="hidden sm:inline">Pure Black</span>
          </button>

          {/* Color Switcher */}
          <button
            onClick={() => setActiveTab(activeTab === 'colors' ? null : 'colors')}
            title="Color Palette"
            className={`p-2 rounded-xl text-xs transition-all ${
              activeTab === 'colors' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Clock Toggle */}
          <button
            onClick={() => setActiveTab(activeTab === 'clock' ? null : 'clock')}
            title="Clock & Display Options"
            className={`p-2 rounded-xl text-xs transition-all ${
              showClock || activeTab === 'clock'
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Sleep Timer */}
          <button
            onClick={() => setActiveTab(activeTab === 'timer' ? null : 'timer')}
            title="Sleep & Countdown Timer"
            className={`p-2 rounded-xl text-xs transition-all relative ${
              isTimerRunning || activeTab === 'timer'
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Timer className="w-4 h-4" />
            {isTimerRunning && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          {/* Ambient Sound */}
          <button
            onClick={() => setActiveTab(activeTab === 'sound' ? null : 'sound')}
            title="Soothing Soundscapes (Brown Noise, Rain)"
            className={`p-2 rounded-xl text-xs transition-all relative ${
              ambientSound || activeTab === 'sound'
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {ambientSound ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Pixel Fixer / Screen Test */}
          <button
            onClick={() => setActiveTab(activeTab === 'pixel' ? null : 'pixel')}
            title="Display Uniformity & Pixel Exercise"
            className={`p-2 rounded-xl text-xs transition-all ${
              isPixelCycle || activeTab === 'pixel'
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Custom Note */}
          <button
            onClick={() => setActiveTab(activeTab === 'text' ? null : 'text')}
            title="Custom Screen Note"
            className={`p-2 rounded-xl text-xs transition-all ${
              showCustomText || activeTab === 'text'
                ? 'bg-white/20 text-white'
                : 'hover:bg-white/10 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Type className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
            className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Stealth instant black out */}
          <button
            onClick={() => {
              setShowControls(false);
              setActiveTab(null);
              setIsLockedPure(true);
            }}
            title="Blackout Now (Click anywhere or move mouse to reveal)"
            className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
          >
            <EyeOff className="w-4 h-4" />
          </button>

          {/* Help & shortcuts */}
          <button
            onClick={() => setActiveTab(activeTab === 'help' ? null : 'help')}
            title="Keyboard Shortcuts & Info"
            className={`p-2 rounded-xl transition-all ${
              activeTab === 'help' ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-neutral-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Options Panel Container */}
      {showControls && activeTab && (
        <div className="fixed bottom-24 z-30 w-80 sm:w-96 max-h-[70vh] overflow-y-auto p-4 rounded-3xl bg-neutral-950/90 border border-white/15 backdrop-blur-2xl shadow-2xl shadow-black text-neutral-200 text-sm animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* COLOR TAB */}
          {activeTab === 'colors' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-medium text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-neutral-400" /> Screen Tint & Modes
                </span>
                <span className="text-xs text-neutral-400 font-mono">{currentColor}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_OPTIONS.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => {
                      setCurrentColor(col.hex);
                      setIsPixelCycle(false);
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                      currentColor.toLowerCase() === col.hex.toLowerCase() && !isPixelCycle
                        ? 'border-white bg-white/15 shadow-md'
                        : 'border-white/10 hover:border-white/30 bg-white/5'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg border border-white/20 shadow-sm"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span className="text-[11px] text-neutral-300 truncate w-full text-center">
                      {col.name}
                    </span>
                  </button>
                ))}
              </div>
              <div className="pt-2">
                <label className="text-xs text-neutral-400 block mb-1.5">Custom Hex Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => {
                      setCurrentColor(e.target.value);
                      setIsPixelCycle(false);
                    }}
                    className="w-9 h-9 rounded-lg border border-white/20 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentColor}
                    onChange={(e) => {
                      setCurrentColor(e.target.value);
                      setIsPixelCycle(false);
                    }}
                    className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl font-mono text-xs text-white uppercase focus:outline-none focus:border-white/40"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CLOCK TAB */}
          {activeTab === 'clock' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-medium text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-400" /> Minimalist Clock
                </span>
                <button
                  onClick={() => setShowClock(!showClock)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    showClock ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {showClock ? 'Visible' : 'Hidden'}
                </button>
              </div>

              {showClock && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span className="flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5" /> Brightness (OLED Safe)
                      </span>
                      <span>{clockBrightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={clockBrightness}
                      onChange={(e) => setClockBrightness(Number(e.target.value))}
                      className="w-full accent-white h-1.5 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setClockFormat24(!clockFormat24)}
                      className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex justify-between items-center"
                    >
                      <span>Time Format</span>
                      <span className="font-mono text-white/70">{clockFormat24 ? '24h' : '12h'}</span>
                    </button>
                    <button
                      onClick={() => setShowSeconds(!showSeconds)}
                      className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex justify-between items-center"
                    >
                      <span>Seconds</span>
                      <span className="font-mono text-white/70">{showSeconds ? 'On' : 'Off'}</span>
                    </button>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5">Placement</label>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {(['center', 'top-right', 'bottom-center'] as const).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setClockPosition(pos)}
                          className={`py-1.5 px-2 rounded-xl border capitalize ${
                            clockPosition === pos
                              ? 'border-white bg-white/20 text-white'
                              : 'border-white/10 bg-white/5 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {pos.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TIMER TAB */}
          {activeTab === 'timer' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-medium text-white flex items-center gap-2">
                  <Timer className="w-4 h-4 text-amber-400" /> Display Sleep Timer
                </span>
                {isTimerRunning && (
                  <span className="font-mono text-amber-400 text-xs font-semibold">
                    {formatTimerDisplay(timerRemaining)}
                  </span>
                )}
              </div>

              <p className="text-xs text-neutral-400">
                Count down to rest your eyes, take a break, or let your screen run in stealth mode.
              </p>

              <div className="grid grid-cols-4 gap-2 text-xs">
                {[5, 15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => startTimer(mins * 60)}
                    className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 text-neutral-200 hover:text-white flex flex-col items-center gap-0.5"
                  >
                    <span className="font-mono font-medium text-sm">{mins}</span>
                    <span className="text-[10px] text-neutral-400">min</span>
                  </button>
                ))}
              </div>

              {isTimerRunning ? (
                <div className="flex gap-2">
                  <button
                    onClick={stopTimer}
                    className="flex-1 py-2 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 text-xs font-medium flex items-center justify-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5" /> Stop Timer
                  </button>
                  <button
                    onClick={() => startTimer(timerDuration)}
                    className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs"
                    title="Restart"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    placeholder="Custom mins"
                    id="custom-min-input"
                    className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white/40"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('custom-min-input') as HTMLInputElement;
                      const val = parseInt(input?.value || '20', 10);
                      if (val > 0) startTimer(val * 60);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-white text-black font-medium text-xs hover:bg-neutral-200 flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" /> Start
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SOUND TAB */}
          {activeTab === 'sound' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-medium text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-400" /> Synthesized Soundscapes
                </span>
                {ambientSound && (
                  <button
                    onClick={() => {
                      soundEngine.stop();
                      setAmbientSound(null);
                    }}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Turn Off
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'brown', name: 'Brown Noise', desc: 'Warm deep frequency' },
                  { id: 'rain', name: 'Gentle Rain', desc: 'Soothing rainfall' },
                  { id: 'waves', name: 'Ocean Waves', desc: 'Rhythmic surf' },
                  { id: 'cosmic', name: 'Cosmic Drone', desc: '432Hz meditative' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSoundToggle(s.id as 'brown' | 'rain' | 'waves' | 'cosmic')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-1 transition-all ${
                      ambientSound === s.id
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200 shadow-lg'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{s.name}</span>
                      {ambientSound === s.id && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                    </div>
                    <span className="text-[10px] text-neutral-400">{s.desc}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Volume</span>
                  <span>{Math.round(soundVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={soundVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* PIXEL CLEANER & TEST TAB */}
          {activeTab === 'pixel' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-medium text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-neutral-400" /> Pixel Clean & Display Test
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isPixelCycle ? 'bg-amber-400/20 text-amber-300' : 'text-neutral-500'}`}>
                  {isPixelCycle ? 'Cycling' : 'Idle'}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Cycles pure primary colors (RGBW) to help exercise stuck subpixels or inspect monitor backlights and uniformity.
              </p>

              <button
                onClick={() => {
                  setIsPixelCycle(!isPixelCycle);
                  if (!isPixelCycle) {
                    setActiveTab(null);
                  }
                }}
                className={`w-full py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all ${
                  isPixelCycle
                    ? 'bg-red-500/20 text-red-200 border border-red-500/30 hover:bg-red-500/30'
                    : 'bg-white text-black hover:bg-neutral-200'
                }`}
              >
                {isPixelCycle ? 'Stop Color Cycle' : 'Start Color Cycle Test'}
              </button>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Cycle Interval</span>
                  <span>{(cycleSpeed / 1000).toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="4000"
                  step="100"
                  value={cycleSpeed}
                  onChange={(e) => setCycleSpeed(Number(e.target.value))}
                  className="w-full accent-white h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* CUSTOM TEXT TAB */}
          {activeTab === 'text' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-medium text-white flex items-center gap-2">
                  <Type className="w-4 h-4 text-neutral-400" /> Custom Screen Note
                </span>
                <button
                  onClick={() => setShowCustomText(!showCustomText)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    showCustomText ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {showCustomText ? 'Active' : 'Off'}
                </button>
              </div>

              <input
                type="text"
                value={customText}
                onChange={(e) => {
                  setCustomText(e.target.value);
                  if (!showCustomText && e.target.value.trim()) {
                    setShowCustomText(true);
                  }
                }}
                placeholder="e.g. Cleaning Display / Be Right Back"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/40"
              />

              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {['Cleaning Screen', 'Do Not Disturb', 'Be Right Back', 'Focus Mode'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setCustomText(preset);
                      setShowCustomText(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/5 text-neutral-300"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Note Opacity</span>
                  <span>{textBrightness}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={textBrightness}
                  onChange={(e) => setTextBrightness(Number(e.target.value))}
                  className="w-full accent-white h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* HELP TAB */}
          {activeTab === 'help' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-medium text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-neutral-400" /> Hotkeys & Features
                </span>
                <span className="text-[11px] text-neutral-400">Press Esc to close</span>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { key: 'F', desc: 'Toggle Fullscreen Mode' },
                  { key: 'Space', desc: 'Hide / Show Toolbar' },
                  { key: 'C', desc: 'Toggle Dim Clock Display' },
                  { key: 'B', desc: 'Instant OLED Pure Black' },
                  { key: 'Esc', desc: 'Exit fullscreen / Show menus' },
                  { key: 'Mouse idle', desc: 'Toolbar hides automatically in 2.8s' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-1 border-b border-white/5">
                    <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-[11px] text-white">
                      {item.key}
                    </kbd>
                    <span className="text-neutral-300">{item.desc}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 text-[11px] text-neutral-400 leading-relaxed border-t border-white/10">
                Tip: Perfect for resting eyes, monitor dusting, dual screen darkening during video viewing, or deep focus.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BlackScreenMain;
