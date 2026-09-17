import React, { useState, useMemo } from 'react';
import { Play, Pause, Music, Sliders, RefreshCw, Scissors, Sparkles, Download, Volume2, Check } from 'lucide-react';
import { SongArtifact } from '../types';
import { parseAbc, transposeAbc, stripChordsFromAbc } from '../services/abcParser';

interface ScoreInspectorProps {
  currentSong: SongArtifact;
  onUpdateAbc: (newAbc: string) => Promise<void>;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onDownloadAbc: () => void;
  onDownloadWav: () => void;
}

export const ScoreInspector: React.FC<ScoreInspectorProps> = ({
  currentSong,
  onUpdateAbc,
  isPlaying,
  onTogglePlay,
  onDownloadAbc,
  onDownloadWav,
}) => {
  const [abcText, setAbcText] = useState(currentSong.abc);
  const [isApplying, setIsApplying] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const parsed = useMemo(() => parseAbc(abcText), [abcText]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleApplyChanges = async () => {
    setIsApplying(true);
    await onUpdateAbc(abcText);
    setIsApplying(false);
    showToast('Score updated and audio re-synthesized successfully!');
  };

  const handleTranspose = (semitones: number) => {
    const transposed = transposeAbc(abcText, semitones);
    setAbcText(transposed);
    showToast(`Transposed ${semitones > 0 ? `+${semitones}` : semitones} semitone(s)`);
  };

  const handleStripChords = () => {
    const stripped = stripChordsFromAbc(abcText);
    setAbcText(stripped);
    showToast('Chords stripped. Now in melody-only cover plan mode.');
  };

  const handleReharmonize = (scheme: 'jazz' | 'pop' | 'minor') => {
    let replaced = abcText;
    if (scheme === 'jazz') {
      replaced = replaced
        .replace(/"C"/g, '"Cmaj7"')
        .replace(/"G"/g, '"G7"')
        .replace(/"Am"/g, '"Am7"')
        .replace(/"F"/g, '"Fmaj7"');
      showToast('Applied modern jazz 7th chord reharmonization (Cmaj7, G7, Am7, Fmaj7)');
    } else if (scheme === 'pop') {
      replaced = replaced
        .replace(/"Cmaj7"/g, '"C"')
        .replace(/"G7"/g, '"G"')
        .replace(/"Am7"/g, '"Am"')
        .replace(/"Fmaj7"/g, '"F"');
      showToast('Restored standard pop triad chords (C, G, Am, F)');
    } else if (scheme === 'minor') {
      replaced = replaced
        .replace(/"C"/g, '"Am"')
        .replace(/"G"/g, '"Em"')
        .replace(/"F"/g, '"Dm"');
      showToast('Applied melancholy minor progression');
    }
    setAbcText(replaced);
  };

  // Group notes into visual measures/bars
  const measures = useMemo(() => {
    const map = new Map<number, typeof parsed.notes>();
    parsed.notes.forEach((n) => {
      if (!map.has(n.barIndex)) {
        map.set(n.barIndex, []);
      }
      map.get(n.barIndex)?.push(n);
    });
    return Array.from(map.entries());
  }, [parsed]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-medium shadow-xl text-sm animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Symbolic CoT Inspector
            </span>
            <span className="text-xs text-neutral-400">Tempo: {parsed.tempo} BPM · Meter: {parsed.meter} · Key: {parsed.key}</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">
            Interactive ABC Score & Harmonic Plan
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            In YuE2, melody and chords are explicit symbolic tokens that can be read, played, and altered before neural synthesis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-semibold hover:bg-amber-400 transition text-sm shadow-md shadow-amber-500/20"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Pause Playback' : 'Audition Score'}</span>
          </button>
          <button
            onClick={onDownloadAbc}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
            title="Download ABC"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visual Measure Staves */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Visual Note & Chord Staves</h3>
          </div>
          <span className="text-xs text-neutral-500">
            {parsed.notes.length} notes parsed across {measures.length} measures
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {measures.map(([barIdx, barNotes]) => {
            const chord = barNotes.find((n) => n.chord)?.chord;
            return (
              <div
                key={barIdx}
                className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 transition space-y-2 relative"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-neutral-500">Bar {barIdx + 1}</span>
                  {chord && (
                    <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-xs">
                      {chord}
                    </span>
                  )}
                </div>

                {/* Notes in bar */}
                <div className="flex items-center gap-1.5 h-12 border-b border-neutral-800/50 pb-2">
                  {barNotes
                    .filter((n) => n.voice === 'Vocal')
                    .map((n, nIdx) => {
                      // Normalize pitch for vertical display
                      const pitchScale = Math.min(100, Math.max(10, ((n.pitchHz - 240) / 400) * 100));
                      return (
                        <div
                          key={nIdx}
                          className="flex-1 flex flex-col items-center justify-end h-full relative group"
                        >
                          <div
                            className="w-2.5 rounded-full bg-amber-400 group-hover:bg-amber-300 transition-all shadow-sm shadow-amber-500/50"
                            style={{ height: '8px', marginBottom: `${(pitchScale / 100) * 28}px` }}
                          />
                          <span className="text-[10px] font-mono text-neutral-400">{n.note}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor & Musical Transformation Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: ABC Code Editor */}
        <div className="lg:col-span-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>ABC Notation Editor</span>
            </span>
            <button
              onClick={handleApplyChanges}
              disabled={isApplying}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isApplying ? 'animate-spin' : ''}`} />
              <span>Apply & Re-Synthesize Audio</span>
            </button>
          </div>

          <textarea
            id="abc-editor-input"
            rows={12}
            value={abcText}
            onChange={(e) => setAbcText(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xs sm:text-sm font-mono text-amber-200/90 leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Right: Quick Musical Transforms */}
        <div className="lg:col-span-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Harmonic Transformations</span>
          </h3>

          {/* Transpose */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400">Transpose Key</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleTranspose(-2)}
                className="py-1.5 px-2 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
              >
                -2 Semi
              </button>
              <button
                onClick={() => handleTranspose(-1)}
                className="py-1.5 px-2 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
              >
                -1 Semi
              </button>
              <button
                onClick={() => handleTranspose(1)}
                className="py-1.5 px-2 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
              >
                +1 Semi
              </button>
              <button
                onClick={() => handleTranspose(2)}
                className="py-1.5 px-2 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
              >
                +2 Semi
              </button>
            </div>
          </div>

          {/* Reharmonization */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400">Reharmonize Chords</label>
            <div className="space-y-2">
              <button
                onClick={() => handleReharmonize('jazz')}
                className="w-full text-left p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-amber-400">Modern Jazz 7ths</div>
                  <div className="text-[11px] text-neutral-400">Cmaj7, G7, Am7, Fmaj7</div>
                </div>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </button>

              <button
                onClick={() => handleReharmonize('minor')}
                className="w-full text-left p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-neutral-200">Minor Mood Progression</div>
                  <div className="text-[11px] text-neutral-400">Am, Em, Dm emotional shift</div>
                </div>
              </button>

              <button
                onClick={() => handleReharmonize('pop')}
                className="w-full text-left p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-neutral-200">Standard Pop Triads</div>
                  <div className="text-[11px] text-neutral-400">Clean C, G, Am, F triads</div>
                </div>
              </button>
            </div>
          </div>

          {/* Strip Chords (Cover mode) */}
          <div className="pt-2 border-t border-neutral-800">
            <button
              onClick={handleStripChords}
              className="w-full py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 flex items-center justify-center gap-2 transition"
            >
              <Scissors className="w-4 h-4 text-neutral-400" />
              <span>Strip Chords (Melody-Only Mode)</span>
            </button>
            <p className="text-[11px] text-neutral-500 mt-1.5 leading-normal">
              Prepares the score for zero-shot covers by retaining vocal notes and removing existing accompaniment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
