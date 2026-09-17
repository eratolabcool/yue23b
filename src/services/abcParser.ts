import { ParsedAbcNote, ParsedAbcScore } from '../types';

// Standard pitch frequencies
const NOTE_BASE_FREQS: Record<string, number> = {
  'C': 261.63, // C4
  '^C': 277.18,
  '_D': 277.18,
  'D': 293.66,
  '^D': 311.13,
  '_E': 311.13,
  'E': 329.63,
  'F': 349.23,
  '^F': 369.99,
  '_G': 369.99,
  'G': 392.00,
  '^G': 415.30,
  '_A': 415.30,
  'A': 440.00,
  '^A': 466.16,
  '_B': 466.16,
  'B': 493.88,
  // lower octave (uppercase with comma or default C3..B3)
  // higher octave (lowercase c = C5, d = D5, etc.)
  'c': 523.25,
  '^c': 554.37,
  'd': 587.33,
  '^d': 622.25,
  'e': 659.25,
  'f': 698.46,
  '^f': 739.99,
  'g': 783.99,
  '^g': 830.61,
  'a': 880.00,
  '^a': 932.33,
  'b': 987.77,
};

export function parseAbc(raw: string): ParsedAbcScore {
  const lines = raw.split(/\r?\n/);
  let title = 'Untitled YuE2 Song';
  let meter = '4/4';
  let unitLength = '1/16';
  let tempo = 88;
  let key = 'C';
  const voices: string[] = [];
  let currentVoice: 'Vocal' | 'Ins' = 'Vocal';
  const notes: ParsedAbcNote[] = [];

  // Parse header
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('T:')) {
      title = trimmed.slice(2).trim() || title;
    } else if (trimmed.startsWith('M:')) {
      meter = trimmed.slice(2).trim();
    } else if (trimmed.startsWith('L:')) {
      unitLength = trimmed.slice(2).trim();
    } else if (trimmed.startsWith('Q:')) {
      const match = trimmed.match(/(\d+)/);
      if (match) tempo = parseInt(match[1], 10);
    } else if (trimmed.startsWith('K:')) {
      key = trimmed.slice(2).trim();
    } else if (trimmed.startsWith('V:')) {
      const vName = trimmed.slice(2).trim().split(/\s+/)[0];
      if (!voices.includes(vName)) voices.push(vName);
    }
  }

  // Parse body notes
  let barIndex = 0;
  let currentChord = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('%') || !trimmed) continue;
    if (/^[A-Z]:/.test(trimmed)) {
      if (trimmed.startsWith('V:')) {
        const vPart = trimmed.slice(2).trim().split(/\s+/)[0];
        if (vPart.toLowerCase().includes('ins')) {
          currentVoice = 'Ins';
        } else {
          currentVoice = 'Vocal';
        }
      }
      continue;
    }

    // Process measure tokens
    let i = 0;
    while (i < trimmed.length) {
      const char = trimmed[i];

      if (char === '|') {
        barIndex++;
        i++;
        continue;
      }

      // Chord symbol in quotes "C" or "Am7"
      if (char === '"') {
        const endQuote = trimmed.indexOf('"', i + 1);
        if (endQuote !== -1) {
          currentChord = trimmed.substring(i + 1, endQuote);
          i = endQuote + 1;
          continue;
        }
      }

      // Rest Z or z
      if (char === 'Z' || char === 'z') {
        i++;
        let countStr = '';
        while (i < trimmed.length && /\d/.test(trimmed[i])) {
          countStr += trimmed[i];
          i++;
        }
        const count = countStr ? parseInt(countStr, 10) : 1;
        if (char === 'Z') {
          barIndex += count;
        } else {
          notes.push({
            note: 'rest',
            durationBeats: (count * 1) / 4,
            pitchHz: 0,
            voice: currentVoice,
            barIndex,
          });
        }
        continue;
      }

      // Note detection [A-Ga-g] with optional accidental ^, _, = and length numbers
      let accidental = '';
      if (char === '^' || char === '_' || char === '=') {
        accidental = char;
        i++;
      }

      if (i < trimmed.length && /[A-Ga-g]/.test(trimmed[i])) {
        const noteLetter = accidental + trimmed[i];
        i++;

        // Octave modifiers: ' or ,
        let octaveMod = 1;
        while (i < trimmed.length && (trimmed[i] === "'" || trimmed[i] === ',')) {
          if (trimmed[i] === "'") octaveMod *= 2;
          if (trimmed[i] === ',') octaveMod *= 0.5;
          i++;
        }

        // Length multiplier
        let lengthStr = '';
        while (i < trimmed.length && /\d/.test(trimmed[i])) {
          lengthStr += trimmed[i];
          i++;
        }

        const multiplier = lengthStr ? parseInt(lengthStr, 10) : 1;
        // If L:1/16, note length 2 = 1/8 note = 0.5 beats (in 4/4)
        const beats = (multiplier / 16) * 4;

        const baseHz = NOTE_BASE_FREQS[noteLetter] || 440;
        const finalHz = baseHz * octaveMod;

        notes.push({
          note: noteLetter,
          chord: currentChord || undefined,
          durationBeats: beats,
          pitchHz: finalHz,
          voice: currentVoice,
          barIndex,
        });

        currentChord = ''; // used for this note
        continue;
      }

      i++;
    }
  }

  return {
    title,
    meter,
    unitLength,
    tempo,
    key,
    voices: voices.length > 0 ? voices : ['Vocal', 'Ins'],
    notes,
    raw,
  };
}

export function transposeAbc(abc: string, semitones: number): string {
  if (semitones === 0) return abc;
  const notesOrder = ['C', '^C', 'D', '^D', 'E', 'F', '^F', 'G', '^G', 'A', '^A', 'B'];
  // Transpose chords in quotes and notes
  return abc.replace(/"([A-G][b#]?[a-zA-Z0-9]*)"/g, (match, chord) => {
    const rootMatch = chord.match(/^([A-G][b#]?)(.*)$/);
    if (!rootMatch) return match;
    const root = rootMatch[1];
    const rest = rootMatch[2];
    let idx = notesOrder.indexOf(root.replace('b', 'b').replace('#', '^'));
    if (idx === -1) {
      if (root === 'Db') idx = 1;
      else if (root === 'Eb') idx = 3;
      else if (root === 'Gb') idx = 6;
      else if (root === 'Ab') idx = 8;
      else if (root === 'Bb') idx = 10;
      else idx = 0;
    }
    const newIdx = (idx + semitones + 120) % 12;
    return `"${notesOrder[newIdx]}${rest}"`;
  });
}

export function stripChordsFromAbc(abc: string): string {
  // Strips "C", "Am" quotes from ABC for melody-only CoT cover mode
  return abc.replace(/"[^"]+"/g, '');
}
