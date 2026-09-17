import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { PRESET_SONGS } from "./src/data/presets";
import { BENCHMARK_ROWS, ARENA_CLIPS } from "./src/data/benchmarks";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  // In-memory arena votes storage
  const arenaVotes = new Map<string, { a: number; b: number; tie: number }>();
  ARENA_CLIPS.forEach((clip) => {
    arenaVotes.set(clip.id, {
      a: clip.votesA,
      b: clip.votesB,
      tie: clip.votesTie,
    });
  });

  // In-memory song history
  const savedSongs = new Map<string, any>();
  PRESET_SONGS.forEach((song) => {
    savedSongs.set(song.id, {
      ...song,
      duration: 18,
      createdAt: Date.now() - 3600000,
      versions: [],
    });
  });

  // 1. Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      model: "m-a-p/YuE2-3B",
      vae: "m-a-p/YuE2-Vae",
      version: "0.1.6",
      runtime: "node-22",
      memoryBudget: "24GB",
      modes: ["full", "melody", "off"],
    });
  });

  // 2. Presets list
  app.get("/api/presets", (req, res) => {
    res.json({
      presets: PRESET_SONGS,
    });
  });

  // 3. Benchmarks & Arena data
  app.get("/api/benchmarks", (req, res) => {
    const clipsWithCurrentVotes = ARENA_CLIPS.map((clip) => {
      const votes = arenaVotes.get(clip.id) || { a: clip.votesA, b: clip.votesB, tie: clip.votesTie };
      return {
        ...clip,
        votesA: votes.a,
        votesB: votes.b,
        votesTie: votes.tie,
      };
    });
    res.json({
      rows: BENCHMARK_ROWS,
      clips: clipsWithCurrentVotes,
    });
  });

  // 4. Arena voting endpoint
  app.post("/api/arena/vote", (req, res) => {
    const { clipId, choice } = req.body;
    if (!clipId || !["a", "b", "tie"].includes(choice)) {
      return res.status(400).json({ error: "Invalid clipId or choice" });
    }
    const current = arenaVotes.get(clipId) || { a: 100, b: 100, tie: 20 };
    if (choice === "a") current.a++;
    else if (choice === "b") current.b++;
    else current.tie++;
    arenaVotes.set(clipId, current);
    res.json({ status: "success", votes: current });
  });

  // 5. Generate endpoint (mimicking handler.py and CLI pipeline)
  app.post("/api/generate", (req, res) => {
    const input = req.body.input || req.body;
    const style = input.style || "English, warm piano pop, 88 BPM";
    const lyrics = input.lyrics || "[Verse]\nHello world\n[Chorus]\nSing together";
    const cot = input.cot || "full";
    const seed = input.seed || Math.floor(Math.random() * 1000000);
    const existingAbc = input.abc;

    // Detect BPM and key from style if available
    const bpmMatch = style.match(/(\d+)\s*BPM/i);
    const bpm = bpmMatch ? parseInt(bpmMatch[1], 10) : 88;

    let key = "C";
    const keyMatch = style.match(/\b([A-G][b#]?(?:\s*m|\s*major|\s*minor)?)\b/i);
    if (keyMatch) {
      key = keyMatch[1];
    }

    // Generate symbolic ABC score if requested or cot !== 'off'
    let scoreAbc = existingAbc;
    if (!scoreAbc && cot !== "off") {
      const isMinor = /minor|sad|dark|cinematic|dramatic/i.test(style);
      const isJazz = /jazz|7th|swing|boss/i.test(style);
      const isHighEnergy = /electro|synth|fast|rock|dance/i.test(style) || bpm > 115;

      const verseChords = isJazz
        ? '"Cmaj7"E2G2A2G2E2D2C4|"G7"D2E2G2E2D2C2D4|"Am7"E2G2A2c2B2A2G4|"Fmaj7"F2E2D2E2G2E2C4|'
        : isMinor
        ? '"Am"A2c2e2c2A2G2E4|"F"F2A2c2A2F2E2D4|"C"E2G2c2B2A2G2E4|"G"G2B2d2B2A2G2E4|'
        : '"C"E2G2A2G2E2D2C4|"G"D2E2G2E2D2C2D4|"Am"E2G2A2c2B2A2G4|"F"F2E2D2E2G2E2C4|';

      const chorusChords = isJazz
        ? '"Cmaj7"G2A2c2B2A2G2E4|"Fmaj7"F2A2G2E2D2E2G4|"G7"A2c2B2A2G2E2D4|"Cmaj7"E2G2A2G2E2D2C4|'
        : isMinor
        ? '"Am"e2g2a2g2e2d2c4|"F"c2e2g2e2c2A2F4|"G"d2f2g2f2d2B2G4|"Am"A2c2e2c2A2G2A4|'
        : '"C"G2A2c2B2A2G2E4|"F"F2A2G2E2D2E2G4|"G"A2c2B2A2G2E2D4|"C"E2G2A2G2E2D2C4|';

      const finalVerse = cot === "melody" ? verseChords.replace(/"[^"]+"/g, "") : verseChords;
      const finalChorus = cot === "melody" ? chorusChords.replace(/"[^"]+"/g, "") : chorusChords;

      scoreAbc = `X:1\nT:YuE2 Generated Song\nM:4/4\nL:1/16\nQ:1/4=${bpm}\nV: Vocal clef=treble name="Vocal Melody" snm="Vocal"\nV: Ins clef=treble name="Ins Melody" snm="Inst."\nK:${isMinor ? "Am" : "C"}\n% verse\nV: Vocal\n${finalVerse}\nV: Ins\nZ4|\n% chorus\nV: Vocal\n${finalChorus}\nV: Ins\nZ4|\n`;
    }

    const songId = `yue2_${Date.now()}`;
    const generatedSong = {
      id: songId,
      title: input.title || `YuE2 Generation (#${seed.toString().slice(-4)})`,
      style,
      lyrics,
      cot,
      seed,
      bpm,
      key,
      abc: scoreAbc || "",
      duration: 18,
      createdAt: Date.now(),
      truncated: { full: false, semantic: false },
    };

    savedSongs.set(songId, generatedSong);

    // Return RunPod / YuE2 compatible response format
    res.json({
      status: "success",
      format: "wav",
      song: generatedSong,
      cot_mode: cot,
      audio_base64: null, // Audio synthesis generated seamlessly in frontend or audio synthesizer
    });
  });

  // 6. Zero-shot cover / transcribe melody helper
  app.post("/api/transcribe", (req, res) => {
    const { melodyName, bpm = 88 } = req.body;
    const abc = `X:1\nT:${melodyName || "Extracted Vocal Melody"}\nM:4/4\nL:1/16\nQ:1/4=${bpm}\nV: Vocal clef=treble name="Transcribed Melody"\nK:C\nV: Vocal\nE2G2A2G2E2D2C4|D2E2G2E2D2C2D4|E2G2A2c2B2A2G4|F2E2D2E2G2E2C4|\n`;
    res.json({
      status: "success",
      abc,
      source: "SheetSage2 + MERT2 Vocal Transcriber",
    });
  });

  // 7. Agentic editing route (inspired by The Last Train 9-step demo)
  app.post("/api/agent/edit", (req, res) => {
    const { currentSong, instruction } = req.body;
    if (!currentSong) {
      return res.status(400).json({ error: "Missing currentSong" });
    }

    let updatedStyle = currentSong.style;
    let updatedAbc = currentSong.abc;
    let updatedLyrics = currentSong.lyrics;
    const lowerInst = (instruction || "").toLowerCase();

    // Check for tempo changes
    const bpmMatch = lowerInst.match(/(\d+)\s*bpm/);
    if (bpmMatch) {
      const newBpm = parseInt(bpmMatch[1], 10);
      updatedAbc = updatedAbc.replace(/Q:1\/4=\d+/, `Q:1/4=${newBpm}`);
      updatedStyle = updatedStyle.replace(/\d+\s*BPM/i, `${newBpm} BPM`);
    }

    // Check for jazz reharmonization
    if (lowerInst.includes("jazz") || lowerInst.includes("7th") || lowerInst.includes("reharmoniz")) {
      updatedAbc = updatedAbc
        .replace(/"C"/g, '"Cmaj7"')
        .replace(/"F"/g, '"Fmaj7"')
        .replace(/"G"/g, '"G7"')
        .replace(/"Am"/g, '"Am7"');
      if (!updatedStyle.toLowerCase().includes("jazz")) {
        updatedStyle = updatedStyle + ", modern jazz harmonic arrangement, lush 7th chords, tenor sax lead";
      }
    }

    // Check for genre shift
    if (lowerInst.includes("synthwave") || lowerInst.includes("cyberpunk") || lowerInst.includes("80s")) {
      updatedStyle = "1980s retro synthwave, analog synthesizers, gated reverb snares, driving bass, 120 BPM";
      updatedAbc = updatedAbc.replace(/Q:1\/4=\d+/, "Q:1/4=120");
    } else if (lowerInst.includes("acoustic") || lowerInst.includes("folk")) {
      updatedStyle = "Acoustic fingerstyle guitar, intimate warm male vocals, upright cello, 84 BPM";
      updatedAbc = updatedAbc.replace(/Q:1\/4=\d+/, "Q:1/4=84");
    }

    const versionId = `v_${Date.now()}`;
    const newVersion = {
      versionId,
      timestamp: Date.now(),
      label: instruction || "Agent Revision",
      instruction: instruction || "Automated symbolic refinement",
      style: updatedStyle,
      lyrics: updatedLyrics,
      abc: updatedAbc,
      bpm: currentSong.bpm,
      key: currentSong.key,
    };

    res.json({
      status: "success",
      version: newVersion,
      diffSummary: `Updated musical plan based on: "${instruction}"`,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`YuE2 Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
