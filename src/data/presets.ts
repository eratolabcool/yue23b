export interface PresetSong {
  id: string;
  title: string;
  style: string;
  lyrics: string;
  cot: 'full' | 'melody' | 'off';
  seed: number;
  bpm: number;
  key: string;
  genre: string;
  abc: string;
  description: string;
}

export const PRESET_SONGS: PresetSong[] = [
  {
    id: 'city_lights',
    title: 'City Lights (Original Pop)',
    genre: 'Piano Pop',
    bpm: 88,
    key: 'C Major',
    style: 'English, warm piano pop, expressive female voice, acoustic piano, rounded bass and light drums, lyrical memorable melody, unhurried phrasing, 88 BPM',
    lyrics: `[Verse]
Neon fades along the lane
Footsteps keep the time of rain
Fold the night and leave it here
Morning has a sky to clear

[Chorus]
Let the day come into view
Every road begins with you
Hold a little room for light
We will sing beyond the night`,
    cot: 'full',
    seed: 831001,
    description: 'The canonical YuE2 benchmark and demonstration track with full symbolic planning.',
    abc: `X:1
T:City Lights
M:4/4
L:1/16
Q:1/4=88
V: Vocal clef=treble name="Vocal Melody" snm="Vocal"
V: Ins clef=treble name="Ins Melody" snm="Inst."
K:C
% verse
V: Vocal
"C"E2G2A2G2E2D2C4|"G"D2E2G2E2D2C2D4|"Am"E2G2A2c2B2A2G4|"F"F2E2D2E2G2E2C4|
V: Ins
Z4|
% chorus
V: Vocal
"C"G2A2c2B2A2G2E4|"F"F2A2G2E2D2E2G4|"G"A2c2B2A2G2E2D4|"C"E2G2A2G2E2D2C4|
V: Ins
Z4|`
  },
  {
    id: 'city_lights_jazz',
    title: 'City Lights (Jazz Reharmonization)',
    genre: 'Modern Jazz',
    bpm: 88,
    key: 'C Major',
    style: 'English, modern jazz ballad, mellow saxophone lead, Rhodes electric piano, upright bass, brushed drums, rich 7th chords, 88 BPM',
    lyrics: `[Verse]
Neon fades along the lane
Footsteps keep the time of rain
Fold the night and leave it here
Morning has a sky to clear

[Chorus]
Let the day come into view
Every road begins with you
Hold a little room for light
We will sing beyond the night`,
    cot: 'full',
    seed: 831002,
    description: 'YuE2 agentic reharmonization substituting standard triads with lush Cmaj7, G7, Am7, and Fmaj7 chords.',
    abc: `X:1
T:City Lights (Jazz)
M:4/4
L:1/16
Q:1/4=88
V: Vocal clef=treble name="Vocal Melody" snm="Vocal"
V: Ins clef=treble name="Ins Melody" snm="Inst."
K:C
% verse
V: Vocal
"Cmaj7"E2G2A2G2E2D2C4|"G7"D2E2G2E2D2C2D4|"Am7"E2G2A2c2B2A2G4|"Fmaj7"F2E2D2E2G2E2C4|
V: Ins
Z4|
% chorus
V: Vocal
"Cmaj7"G2A2c2B2A2G2E4|"Fmaj7"F2A2G2E2D2E2G4|"G7"A2c2B2A2G2E2D4|"Cmaj7"E2G2A2G2E2D2C4|
V: Ins
Z4|`
  },
  {
    id: 'last_train',
    title: 'The Last Train (Agentic Multi-Step)',
    genre: 'Indie Folk',
    bpm: 92,
    key: 'G Major',
    style: 'English, indie folk acoustic guitar, intimate male vocals, gentle cello, unhurried tempo, 92 BPM',
    lyrics: `[Verse]
Platform shadows stretch and lean
Tickets clutched to what has been
Steam arises through the cold
Every story left untold

[Chorus]
Take the last train out of town
Watch the headlights slowly drown
Silver tracks beneath the blue
Leading nowhere without you`,
    cot: 'full',
    seed: 521943,
    description: 'From the documented 9-step, 14-version editing conversation showing symbolic melody retention.',
    abc: `X:1
T:The Last Train
M:4/4
L:1/16
Q:1/4=92
V: Vocal clef=treble name="Vocal Melody" snm="Vocal"
V: Ins clef=treble name="Ins Melody" snm="Inst."
K:G
% verse
V: Vocal
"G"D2G2A2B2A2G2D4|"Em"E2G2A2G2E2D2E4|"C"E2G2c2B2A2G2E4|"D"F2A2G2E2D2E2D4|
V: Ins
Z4|
% chorus
V: Vocal
"G"B2d2e2d2B2A2G4|"C"c2e2d2B2A2G2E4|"D"D2F2A2c2B2A2G4|"G"G2B2d2B2A2G2G4|
V: Ins
Z4|`
  },
  {
    id: 'solar_wind',
    title: 'Solar Wind (Cyberpunk Electro)',
    genre: 'Synthwave',
    bpm: 124,
    key: 'A Minor',
    style: 'Retro 80s synthwave, driving analog arpeggios, gated reverb drums, lush chorus pads, 124 BPM',
    lyrics: `[Verse]
Circuit dreams ignite the dark
Speeding past the neon spark
Data streams across the night
Fading into chrome and light

[Chorus]
Feel the solar wind arise
Underneath synthetic skies
Take my hand and never fall
Dancing past the firewall`,
    cot: 'full',
    seed: 948123,
    description: 'High-energy electronic production showing YuE2 zero-shot arrangement diversity.',
    abc: `X:1
T:Solar Wind
M:4/4
L:1/16
Q:1/4=124
V: Vocal clef=treble name="Vocal Melody" snm="Vocal"
V: Ins clef=treble name="Ins Melody" snm="Inst."
K:Am
% verse
V: Vocal
"Am"A2c2e2c2A2G2E4|"F"F2A2c2A2F2E2D4|"C"E2G2c2B2A2G2E4|"G"G2B2d2B2A2G2E4|
V: Ins
Z4|
% chorus
V: Vocal
"Am"e2g2a2g2e2d2c4|"F"c2e2g2e2c2A2F4|"G"d2f2g2f2d2B2G4|"Am"A2c2e2c2A2G2A4|
V: Ins
Z4|`
  }
];
