import React, { useState } from 'react';
import { Play, Pause, Sparkles, Wand2, Music, CheckCircle2, RotateCw, Download, ArrowRight, Settings2 } from 'lucide-react';
import { CotMode, SongArtifact } from '../types';

interface SongStudioProps {
  currentSong: SongArtifact;
  onGenerate: (params: { style: string; lyrics: string; cot: CotMode; seed: number }) => Promise<void>;
  isGenerating: boolean;
  generationStep: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNavigateToScore: () => void;
  onNavigateToCover: () => void;
  onNavigateToAgent: () => void;
  onDownloadWav: () => void;
  onDownloadAbc: () => void;
}

const STYLE_PRESETS = [
  'English, warm piano pop, female vocals, acoustic piano, rounded bass, light drums, 88 BPM',
  'English, modern jazz ballad, saxophone lead, Rhodes electric piano, upright bass, 88 BPM',
  'Retro 80s synthwave, driving analog arpeggios, gated reverb drums, lush chorus pads, 124 BPM',
  'Acoustic indie folk, fingerstyle guitar, intimate male vocals, gentle cello, 92 BPM',
  'Cinematic orchestral, soaring strings, French horns, dramatic percussion, C minor, 76 BPM',
  'Lo-fi hip hop, dusty Rhodes chords, vinyl crackle, mellow vocal chops, relaxed groove, 84 BPM'
];

export const SongStudio: React.FC<SongStudioProps> = ({
  currentSong,
  onGenerate,
  isGenerating,
  generationStep,
  isPlaying,
  onTogglePlay,
  onNavigateToScore,
  onNavigateToCover,
  onNavigateToAgent,
  onDownloadWav,
  onDownloadAbc,
}) => {
  const [style, setStyle] = useState(currentSong.style);
  const [lyrics, setLyrics] = useState(currentSong.lyrics);
  const [cot, setCot] = useState<CotMode>(currentSong.cot);
  const [seed, setSeed] = useState(currentSong.seed);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 900000) + 100000);
  };

  const insertSectionTag = (tag: string) => {
    setLyrics((prev) => (prev ? `${prev}\n\n[${tag}]\n` : `[${tag}]\n`));
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;
    await onGenerate({ style, lyrics, cot, seed });
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Frontier Symbolic Planning
              </span>
              <span className="text-xs text-neutral-400">WildSongBench 6.9632 #1 Quality</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
              Compose in Symbols. Create in Sound.
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl mt-1">
              YuE2 unifies symbolic music composition (ABC melody & chords) with end-to-end neural audio synthesis.
              Inspect and edit the score before or after rendering.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="header-play-btn"
              onClick={onTogglePlay}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-semibold hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 text-sm"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause Audio' : 'Play Current Song'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Prompting Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleGenerateSubmit} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-5">
            {/* Style Prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-amber-400" />
                  <span>Style & Instrumentation Prompt</span>
                </label>
                <span className="text-xs text-neutral-500">Genre, tempo, instruments, vocals</span>
              </div>
              <textarea
                id="style-input"
                rows={3}
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="e.g. English, warm piano pop, expressive female voice, acoustic piano, rounded bass, 88 BPM"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
              />
              {/* Quick style pills */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-xs text-neutral-500 py-1">Quick:</span>
                {STYLE_PRESETS.slice(0, 3).map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setStyle(preset)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                  >
                    {preset.split(',')[1]?.trim() || 'Style'}
                  </button>
                ))}
              </div>
            </div>

            {/* Symbolic Planning Mode (CoT) */}
            <div>
              <label className="text-sm font-semibold text-neutral-200 block mb-2">
                Symbolic CoT (Chain-of-Thought) Mode
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  id="cot-full"
                  onClick={() => setCot('full')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    cot === 'full'
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-semibold text-sm flex items-center justify-between">
                    <span>Full CoT</span>
                    {cot === 'full' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Melody + Chord ABC plan. Highly editable and inspectable.
                  </p>
                </button>

                <button
                  type="button"
                  id="cot-melody"
                  onClick={() => setCot('melody')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    cot === 'melody'
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-semibold text-sm flex items-center justify-between">
                    <span>Melody CoT</span>
                    {cot === 'melody' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Chord-free ABC melody plan with free harmonic accompaniment.
                  </p>
                </button>

                <button
                  type="button"
                  id="cot-off"
                  onClick={() => setCot('off')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    cot === 'off'
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-semibold text-sm flex items-center justify-between">
                    <span>Off (Audio Only)</span>
                    {cot === 'off' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Direct neural audio synthesis without symbolic plan tokens.
                  </p>
                </button>
              </div>
            </div>

            {/* Lyrics Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-neutral-200">Lyrics & Structure</label>
                <div className="flex gap-1.5">
                  {['Verse', 'Chorus', 'Bridge', 'Outro'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertSectionTag(tag)}
                      className="text-xs px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                    >
                      +[{tag}]
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                id="lyrics-input"
                rows={6}
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="[Verse]&#10;Words to sing...&#10;&#10;[Chorus]&#10;Catchy refrain..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>

            {/* Advanced Settings Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>{showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options (Seed, Sampling)'}</span>
              </button>
              {showAdvanced && (
                <div className="mt-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-300">Seed:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={seed}
                        onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
                        className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200 w-28 text-right"
                      />
                      <button
                        type="button"
                        onClick={handleRandomSeed}
                        className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
                        title="Randomize seed"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              id="generate-button"
              type="submit"
              disabled={isGenerating}
              className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition shadow-lg ${
                isGenerating
                  ? 'bg-amber-500/50 text-neutral-900 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/20'
              }`}
            >
              {isGenerating ? (
                <>
                  <Wand2 className="w-5 h-5 animate-spin" />
                  <span>{generationStep || 'Generating Song with YuE2...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Full Song (YuE2-3B)</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Active Song Artifact & Interactive Player */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {currentSong.cot.toUpperCase()} CoT Plan
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">{currentSong.title}</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  BPM: {currentSong.bpm} · Key: {currentSong.key} · Seed: {currentSong.seed}
                </p>
              </div>
              <button
                onClick={onTogglePlay}
                className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center justify-center transition shadow-md shadow-amber-500/20"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>
            </div>

            {/* Waveform representation */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Audio Waveform & Arrangement</span>
                <span className="text-amber-400">{isPlaying ? 'Playing 44.1kHz PCM' : 'Ready'}</span>
              </div>
              <div className="h-16 flex items-center gap-1 overflow-hidden px-1">
                {Array.from({ length: 42 }).map((_, i) => {
                  const heightPercent = 20 + Math.abs(Math.sin(i * 0.4 + (isPlaying ? Date.now() / 200 : 0)) * 75);
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        isPlaying ? 'bg-amber-500' : 'bg-neutral-700'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Quick ABC score snippet */}
            {currentSong.abc && (
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300">Generated ABC Score</span>
                  <button
                    onClick={onNavigateToScore}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                  >
                    <span>Inspect in Score Editor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <pre className="text-xs font-mono text-neutral-400 bg-neutral-900/60 p-2.5 rounded-lg overflow-x-auto max-h-32">
                  {currentSong.abc}
                </pre>
              </div>
            )}

            {/* Workflows quick actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={onNavigateToCover}
                className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition text-left"
              >
                <div className="text-amber-400 font-semibold">Zero-Shot Cover</div>
                <div className="text-neutral-400 text-[11px] mt-0.5">Keep melody, change style</div>
              </button>

              <button
                onClick={onNavigateToAgent}
                className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition text-left"
              >
                <div className="text-amber-400 font-semibold">Agentic Edit</div>
                <div className="text-neutral-400 text-[11px] mt-0.5">Multi-step conversation</div>
              </button>
            </div>

            {/* Export buttons */}
            <div className="flex gap-2 pt-1 border-t border-neutral-800">
              <button
                onClick={onDownloadWav}
                className="flex-1 py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Audio (WAV)</span>
              </button>
              <button
                onClick={onDownloadAbc}
                className="py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Score (.abc)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
