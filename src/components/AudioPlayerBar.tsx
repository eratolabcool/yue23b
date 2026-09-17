import React from 'react';
import { Play, Pause, Volume2, Download, Music, Repeat } from 'lucide-react';
import { SongArtifact } from '../types';

interface AudioPlayerBarProps {
  currentSong: SongArtifact;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onChangeVolume: (vol: number) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  onDownloadWav: () => void;
  onDownloadAbc: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  currentSong,
  isPlaying,
  onTogglePlay,
  currentTime,
  duration,
  onSeek,
  volume,
  onChangeVolume,
  isLooping,
  onToggleLoop,
  onDownloadWav,
  onDownloadAbc,
}) => {
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/95 border-t border-neutral-800 backdrop-blur-lg px-4 py-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
        {/* Left: Song Info */}
        <div className="flex items-center gap-3 w-full sm:w-1/4">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0">
            <Music className="w-5 h-5 text-amber-400" />
          </div>
          <div className="truncate">
            <div className="font-semibold text-xs text-white truncate">{currentSong.title}</div>
            <div className="text-[11px] text-neutral-400 truncate">
              {currentSong.bpm} BPM · {currentSong.key} · {currentSong.cot.toUpperCase()} CoT
            </div>
          </div>
        </div>

        {/* Center: Controls & Seekbar */}
        <div className="flex flex-col items-center gap-1.5 w-full sm:w-1/2">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleLoop}
              className={`p-1.5 rounded-lg transition ${
                isLooping ? 'text-amber-400 bg-amber-500/10' : 'text-neutral-400 hover:text-white'
              }`}
              title="Toggle loop"
            >
              <Repeat className="w-4 h-4" />
            </button>

            <button
              id="player-play-btn"
              onClick={onTogglePlay}
              className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center justify-center transition shadow-md shadow-amber-500/20"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
          </div>

          {/* Time & Slider */}
          <div className="flex items-center gap-2 w-full text-[11px] font-mono text-neutral-400">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 18}
              step="0.1"
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span>{formatTime(duration || 18)}</span>
          </div>
        </div>

        {/* Right: Volume & Export */}
        <div className="hidden sm:flex items-center justify-end gap-3 w-1/4">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-neutral-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div className="h-4 w-px bg-neutral-700" />

          <button
            onClick={onDownloadWav}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition text-xs flex items-center gap-1"
            title="Download WAV Audio"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">WAV</span>
          </button>

          <button
            onClick={onDownloadAbc}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition text-xs flex items-center gap-1"
            title="Download ABC Score"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">ABC</span>
          </button>
        </div>
      </div>
    </div>
  );
};
