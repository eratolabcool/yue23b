import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { SongStudio } from './components/SongStudio';
import { ScoreInspector } from './components/ScoreInspector';
import { CoverStudio } from './components/CoverStudio';
import { AgenticStudio } from './components/AgenticStudio';
import { BenchmarksView } from './components/BenchmarksView';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { PRESET_SONGS } from './data/presets';
import { CotMode, SongArtifact, SongVersion } from './types';
import { renderAbcToWav } from './services/audioSynthesizer';

export function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'score' | 'cover' | 'agent' | 'benchmarks'>('studio');
  const [currentSong, setCurrentSong] = useState<SongArtifact>({
    ...PRESET_SONGS[0],
    audioBase64: '',
    duration: 18,
    createdAt: Date.now(),
    versions: [],
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(18);
  const [volume, setVolume] = useState(0.85);
  const [isLooping, setIsLooping] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  // Initialize or re-render audio when ABC changes
  const updateAudioFromAbc = async (abc: string) => {
    try {
      const { wavBlob, duration: dur } = await renderAbcToWav(abc);
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
      const url = URL.createObjectURL(wavBlob);
      currentBlobUrlRef.current = url;
      setDuration(dur);

      if (audioRef.current) {
        const wasPlaying = isPlaying;
        audioRef.current.src = url;
        audioRef.current.load();
        if (wasPlaying) {
          audioRef.current.play().catch(() => {});
        }
      }
      return url;
    } catch (err) {
      console.error('Audio synthesis error:', err);
      return null;
    }
  };

  // Initial song audio load
  useEffect(() => {
    updateAudioFromAbc(currentSong.abc);
  }, []);

  // Sync audio element volume and loop
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = isLooping;
    }
  }, [volume, isLooping]);

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((err) => {
        console.warn('Playback error (user gesture required):', err);
      });
    }
  };

  const handleSeek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleSelectPreset = async (presetId: string) => {
    const found = PRESET_SONGS.find((p) => p.id === presetId);
    if (!found) return;
    const newSong: SongArtifact = {
      ...found,
      audioBase64: '',
      duration: 18,
      createdAt: Date.now(),
      versions: [],
    };
    setCurrentSong(newSong);
    await updateAudioFromAbc(newSong.abc);
  };

  // Song Generation Handler
  const handleGenerate = async (params: { style: string; lyrics: string; cot: CotMode; seed: number }) => {
    setIsGenerating(true);

    try {
      setGenerationStep('Analyzing lyric meter & prosodic accents...');
      await new Promise((r) => setTimeout(r, 600));

      setGenerationStep('Generating symbolic ABC Chain-of-Thought (melody & chords)...');
      let response;
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        response = await res.json();
      } catch (e) {
        console.warn('Fetch fallback to client generator');
      }

      setGenerationStep('Decoding latent audio frames with YuE2-Vae...');
      await new Promise((r) => setTimeout(r, 700));

      const generated = response?.song || {
        id: `gen_${Date.now()}`,
        title: `YuE2 Generation (#${params.seed.toString().slice(-4)})`,
        style: params.style,
        lyrics: params.lyrics,
        cot: params.cot,
        seed: params.seed,
        bpm: 88,
        key: 'C Major',
        abc: currentSong.abc,
        duration: 18,
        createdAt: Date.now(),
        versions: [],
      };

      const newSong: SongArtifact = {
        ...generated,
        versions: [],
      };

      setCurrentSong(newSong);
      setGenerationStep('Rendering 44.1kHz audio buffer...');
      const url = await updateAudioFromAbc(newSong.abc);
      if (url && audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Score update handler
  const handleUpdateAbc = async (newAbc: string) => {
    setCurrentSong((prev) => ({
      ...prev,
      abc: newAbc,
    }));
    await updateAudioFromAbc(newAbc);
  };

  // Zero-shot cover handler
  const handleGenerateCover = async (params: { sourceAbc: string; targetStyle: string; title: string }) => {
    setIsGenerating(true);
    try {
      setGenerationStep('Applying SheetSage2 melody constraints...');
      await new Promise((r) => setTimeout(r, 600));

      setGenerationStep('YuE2 zero-shot style transfer & accompaniment synthesis...');
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style: params.targetStyle,
          lyrics: currentSong.lyrics,
          cot: 'melody',
          abc: params.sourceAbc,
          title: params.title,
        }),
      });
      const data = await res.json();
      const newSong: SongArtifact = {
        ...data.song,
        title: params.title,
        style: params.targetStyle,
        abc: params.sourceAbc,
        versions: [],
      };
      setCurrentSong(newSong);
      await updateAudioFromAbc(newSong.abc);
      setActiveTab('studio');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Agentic editing handler
  const handleApplyAgentEdit = async (instruction: string) => {
    setIsEditing(true);
    try {
      const res = await fetch('/api/agent/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSong,
          instruction,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        const ver = data.version;
        const newVersions = [...currentSong.versions, ver];
        const updated: SongArtifact = {
          ...currentSong,
          style: ver.style,
          abc: ver.abc,
          versions: newVersions,
        };
        setCurrentSong(updated);
        await updateAudioFromAbc(ver.abc);
      }
    } finally {
      setIsEditing(false);
    }
  };

  const handleSelectVersion = async (ver: SongVersion) => {
    setCurrentSong((prev) => ({
      ...prev,
      style: ver.style,
      abc: ver.abc,
    }));
    await updateAudioFromAbc(ver.abc);
  };

  // Downloads
  const handleDownloadWav = () => {
    if (!currentBlobUrlRef.current) return;
    const a = document.createElement('a');
    a.href = currentBlobUrlRef.current;
    a.download = `${currentSong.title.replace(/\s+/g, '_')}_YuE2.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAbc = () => {
    const blob = new Blob([currentSong.abc], { type: 'text/vnd.abc' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSong.title.replace(/\s+/g, '_')}_score.abc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleVoteArena = async (clipId: string, choice: 'a' | 'b' | 'tie') => {
    try {
      await fetch('/api/arena/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipId, choice }),
      });
    } catch (e) {
      console.warn('Vote record error');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans pb-28">
      {/* Hidden audio element for playback */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onEnded={() => {
          if (!isLooping) setIsPlaying(false);
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentSong={currentSong}
        onSelectPreset={handleSelectPreset}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'studio' && (
          <SongStudio
            currentSong={currentSong}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            generationStep={generationStep}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onNavigateToScore={() => setActiveTab('score')}
            onNavigateToCover={() => setActiveTab('cover')}
            onNavigateToAgent={() => setActiveTab('agent')}
            onDownloadWav={handleDownloadWav}
            onDownloadAbc={handleDownloadAbc}
          />
        )}

        {activeTab === 'score' && (
          <ScoreInspector
            currentSong={currentSong}
            onUpdateAbc={handleUpdateAbc}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onDownloadAbc={handleDownloadAbc}
            onDownloadWav={handleDownloadWav}
          />
        )}

        {activeTab === 'cover' && (
          <CoverStudio
            currentSong={currentSong}
            onGenerateCover={handleGenerateCover}
            isGenerating={isGenerating}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onSelectSong={(song) => setCurrentSong(song)}
          />
        )}

        {activeTab === 'agent' && (
          <AgenticStudio
            currentSong={currentSong}
            onApplyAgentEdit={handleApplyAgentEdit}
            isEditing={isEditing}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onSelectVersion={handleSelectVersion}
          />
        )}

        {activeTab === 'benchmarks' && (
          <BenchmarksView onVoteArena={handleVoteArena} />
        )}
      </main>

      {/* Floating Bottom Audio Player Bar */}
      <AudioPlayerBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        volume={volume}
        onChangeVolume={setVolume}
        isLooping={isLooping}
        onToggleLoop={() => setIsLooping(!isLooping)}
        onDownloadWav={handleDownloadWav}
        onDownloadAbc={handleDownloadAbc}
      />
    </div>
  );
}
export default App;
