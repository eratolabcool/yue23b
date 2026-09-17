import React, { useState } from 'react';
import { Bot, Send, Sparkles, History, Play, Pause, ArrowRight, CheckCircle2, Sliders } from 'lucide-react';
import { SongArtifact, SongVersion } from '../types';

interface AgenticStudioProps {
  currentSong: SongArtifact;
  onApplyAgentEdit: (instruction: string) => Promise<void>;
  isEditing: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSelectVersion: (version: SongVersion) => void;
}

const QUICK_INSTRUCTIONS = [
  'Reharmonize the chords into modern jazz 7ths (Cmaj7, G7, Am7, Fmaj7) and add saxophone lead',
  'Adapt into retro 80s synthwave with analog arpeggios at 120 BPM',
  'Slow down tempo to 78 BPM and shift to an acoustic folk arrangement',
  'Transpose to a melancholic minor mood progression'
];

export const AgenticStudio: React.FC<AgenticStudioProps> = ({
  currentSong,
  onApplyAgentEdit,
  isEditing,
  isPlaying,
  onTogglePlay,
  onSelectVersion,
}) => {
  const [instruction, setInstruction] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isEditing) return;
    await onApplyAgentEdit(instruction.trim());
    setInstruction('');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Agentic Music Editing Demo
            </span>
            <span className="text-xs text-neutral-400">
              Inspired by The Last Train (9 steps · 14 versions)
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">
            Iterative Symbolic & Sound Revisions
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Have a continuous musical conversation with YuE2. Modify chords, lyrics, tempo, and instrumental arrangement while maintaining score consistency and musical invariants.
          </p>
        </div>

        <button
          onClick={onTogglePlay}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-semibold hover:bg-amber-400 transition text-sm shadow-md shadow-amber-500/20"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isPlaying ? 'Pause Playback' : 'Audition Active Song'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Chat / Instruction Box */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Give Musical Revision Instructions</h3>
            </div>

            <p className="text-xs text-neutral-400">
              Direct the agent to modify specific aspects of the song plan (harmony, arrangement, instruments, lyrics, or tempo).
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                rows={3}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g. Reharmonize with lush 7th chords, add a mellow saxophone lead, and set tempo to 88 BPM..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Quick prompts:</span>
                <button
                  type="submit"
                  disabled={!instruction.trim() || isEditing}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Applying...' : 'Execute Revision'}</span>
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                {QUICK_INSTRUCTIONS.map((qi, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInstruction(qi)}
                    className="w-full text-left p-2 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800/80 text-xs text-neutral-300 transition"
                  >
                    ↳ {qi}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Current Active Plan Status */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Current Revision State</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-500 block">Style / Orchestration:</span>
                <span className="text-neutral-200 font-medium line-clamp-2 mt-1">{currentSong.style}</span>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-500 block">Tempo & Key:</span>
                <span className="text-amber-400 font-medium block mt-1">
                  {currentSong.bpm} BPM · {currentSong.key}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Version History Timeline */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Revision Timeline</h3>
              </div>
              <span className="text-xs text-neutral-500">
                {currentSong.versions.length + 1} version(s)
              </span>
            </div>

            <div className="space-y-3">
              {/* Baseline / Version 1 */}
              <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-400">Baseline Plan (v1.0)</span>
                  <span className="text-neutral-500">Initial Genesis</span>
                </div>
                <p className="text-xs text-neutral-300">
                  {currentSong.title}
                </p>
                <div className="text-[11px] text-neutral-400 truncate">
                  {currentSong.style}
                </div>
              </div>

              {/* Subsequent versions */}
              {currentSong.versions.map((ver, idx) => (
                <div
                  key={ver.versionId}
                  className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-neutral-700 transition space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-200">
                      Version {idx + 2}.0
                    </span>
                    <span className="text-amber-400 text-[11px]">
                      {new Date(ver.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-amber-300/90 font-medium">
                    "{ver.instruction}"
                  </p>
                  <div className="text-[11px] text-neutral-400 truncate">
                    {ver.style}
                  </div>
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      onClick={() => onSelectVersion(ver)}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <span>Audition this version</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
