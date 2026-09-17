import React, { useState } from 'react';
import { Disc3, Wand2, Music, Sparkles, Play, Pause, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SongArtifact } from '../types';
import { PRESET_SONGS } from '../data/presets';
import { stripChordsFromAbc } from '../services/abcParser';

interface CoverStudioProps {
  currentSong: SongArtifact;
  onGenerateCover: (params: { sourceAbc: string; targetStyle: string; title: string }) => Promise<void>;
  isGenerating: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSelectSong: (song: SongArtifact) => void;
}

const COVER_STYLES = [
  {
    title: 'Acoustic Bossa Nova',
    style: 'Bossa nova, Brazilian acoustic nylon guitar, soft flute lead, brushed percussion, relaxed 80 BPM',
    tags: 'Latin, Acoustic'
  },
  {
    title: '1980s Retro Synthwave',
    style: 'Driving 80s synthwave, analog synth arpeggios, gated reverb drums, lush vocoder pads, 122 BPM',
    tags: 'Electronic, 80s'
  },
  {
    title: 'Epic Orchestral Fantasy',
    style: 'Cinematic orchestral soundtrack, soaring French horns, lush string section, timpani drums, 78 BPM',
    tags: 'Cinematic, Symphony'
  },
  {
    title: 'Modern R&B / Soul',
    style: 'Contemporary R&B, warm Fender Rhodes, deep 808 sub bass, smooth falsetto backing, 86 BPM',
    tags: 'R&B, Groove'
  },
  {
    title: 'Celtic Acoustic Folk',
    style: 'Traditional Celtic folk, acoustic bouzouki, tin whistle melody, bodhran drum, 94 BPM',
    tags: 'Folk, Acoustic'
  }
];

export const CoverStudio: React.FC<CoverStudioProps> = ({
  currentSong,
  onGenerateCover,
  isGenerating,
  isPlaying,
  onTogglePlay,
  onSelectSong,
}) => {
  const [selectedMelodyId, setSelectedMelodyId] = useState(currentSong.id);
  const [targetStyle, setTargetStyle] = useState(COVER_STYLES[0].style);
  const [customTitle, setCustomTitle] = useState(`${currentSong.title} (Cover)`);

  const currentPreset = PRESET_SONGS.find((p) => p.id === selectedMelodyId) || PRESET_SONGS[0];
  const strippedMelodyAbc = stripChordsFromAbc(currentPreset.abc);

  const handleSelectMelody = (presetId: string) => {
    setSelectedMelodyId(presetId);
    const chosen = PRESET_SONGS.find((p) => p.id === presetId);
    if (chosen) {
      setCustomTitle(`${chosen.title} (${COVER_STYLES[0].title} Cover)`);
    }
  };

  const handleSelectCoverStyle = (styleObj: typeof COVER_STYLES[0]) => {
    setTargetStyle(styleObj.style);
    setCustomTitle(`${currentPreset.title} (${styleObj.title} Cover)`);
  };

  const handleGenerateCover = async () => {
    await onGenerateCover({
      sourceAbc: strippedMelodyAbc,
      targetStyle,
      title: customTitle,
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Zero-Shot Symbolic Cover Workflow
            </span>
            <span className="text-xs text-neutral-400">SheetSage2 → Melody Plan → YuE2 Generation</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">
            Reimagine Melodies in Any Style
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Retain the exact vocal melodic contour while instructing YuE2 to produce an entirely new accompaniment, genre arrangement, and vocal persona.
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
        {/* Step 1: Pick Source Melody */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="text-sm font-semibold text-white">Select Source Melody</h3>
            </div>

            <div className="space-y-2">
              {PRESET_SONGS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectMelody(preset.id)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                    selectedMelodyId === preset.id
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm text-neutral-200">{preset.title}</div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      {preset.genre} · {preset.bpm} BPM · Key {preset.key}
                    </div>
                  </div>
                  {selectedMelodyId === preset.id && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </button>
              ))}
            </div>

            {/* Melody preview */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Extracted Vocal Melody (Chord-free ABC)</span>
                <span className="text-amber-400 font-mono">cot="melody"</span>
              </div>
              <pre className="text-xs font-mono text-neutral-300 bg-neutral-900/60 p-2.5 rounded-lg overflow-x-auto max-h-28">
                {strippedMelodyAbc}
              </pre>
            </div>
          </div>
        </div>

        {/* Step 2: Target Style & Rendering */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="text-sm font-semibold text-white">Target Style & Re-imagining</h3>
            </div>

            {/* Quick target styles */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 font-medium">Arrangement Presets:</label>
              <div className="grid grid-cols-2 gap-2">
                {COVER_STYLES.map((cs, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectCoverStyle(cs)}
                    className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-left transition"
                  >
                    <div className="font-semibold text-xs text-amber-300">{cs.title}</div>
                    <div className="text-[11px] text-neutral-400 truncate mt-0.5">{cs.tags}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom target style prompt */}
            <div>
              <label className="text-xs text-neutral-400 font-medium block mb-1">
                Target Style Prompt:
              </label>
              <textarea
                rows={3}
                value={targetStyle}
                onChange={(e) => setTargetStyle(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 font-medium block mb-1">
                Cover Version Title:
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Render Button */}
            <button
              onClick={handleGenerateCover}
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
                  <span>Generating Zero-Shot Cover...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Synthesize Cover with YuE2</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
