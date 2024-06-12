import Accents from './demos/accents.svelte'
import ChordArpeggioTiming from './demos/chord-arpeggio-timing.svelte'
import ChordDiagrams from './demos/chord-diagrams.svelte'
import Dynamics from './demos/dynamics.svelte'
import FretboardHeatmap from './demos/fretboard-heatmap.svelte'
import FretboardImprovisationIntervals from './demos/fretboard-improvisation-intervals.svelte'
import FretboardJitter from './demos/fretboard-jitter.svelte'
import FretboardSpacetimeCube from './demos/fretboard-spacetime-cube.svelte'
import ImprovisationIntervals from './demos/improvisation-intervals.svelte'
import ImprovisationNoteColors from './demos/improvisation-note-colors.svelte'
import ImprovisationScaleDegrees from './demos/improvisation-scale-degrees.svelte'
import ImprovisationScaleDegreesBar from './demos/improvisation-scale-degrees-bar.svelte'
import KeyboardHistogram from './demos/keyboard-histogram.svelte'
import PitchBend from './demos/pitch-bend.svelte'
import PitchBendAudio from './demos/pitch-bend-audio.svelte'
import PitchOffsetCents from './demos/pitch-offset-cents.svelte'
import RhythmSheetMusic from './demos/rhythm-sheet-music.svelte'
import SpeedUp from './demos/speed-up.svelte'
import SpeedUpTab from './demos/speed-up-tab.svelte'
import StrummingPattern from './demos/strumming-pattern.svelte'
import SubDivision from './demos/sub-division.svelte'
import SubDivisionBar from './demos/sub-division-bar.svelte'
import SubDivisionLinear from './demos/sub-division-linear.svelte'
import TempoDrift from './demos/tempo-drift.svelte'
import TwoHandedTiming from './demos/two-handed-timing.svelte'
import SubDivisionDrums from './demos/sub-division-drums.svelte'

/**
 * All demos defined here
 */
export const DEMOS = [
  {
    id: 'accents',
    title: '[new] Accents',
    description: 'See if you accent the right notes.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard'],
    skills: ['accents'],
    component: Accents
  },
  {
    id: 'chord-arpeggio-timing',
    title: 'Chord and Arpeggio Timing',
    description:
      'See how spaced out the notes in a chord or arpeggio are, and how much time lies between these.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard'],
    skills: ['chord-timing', 'arpeggio-timing'],
    component: ChordArpeggioTiming
  },
  {
    id: 'chord-diagrams',
    title: 'Chord Diagrams',
    description:
      'See what chords you play on a guitar/bass as chord diagrams.',
    input: 'MIDI',
    instruments: ['guitar/bass'],
    skills: ['chord-notes'],
    component: ChordDiagrams
  },
  {
    id: 'dynamics',
    title: 'Dynamics',
    description: 'Check how well you control the loudness of notes.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard'],
    skills: ['constant-dynamics', '(de)crescendo', 'accents'],
    component: Dynamics
  },
  {
    id: 'fretboard-heatmap',
    title: 'Fretboard Heatmap',
    description: 'See how often you play different fretboard positions.',
    input: 'MIDI',
    instruments: ['guitar/bass'],
    skills: ['instrument-layout'],
    component: FretboardHeatmap
  },
  {
    id: 'fretboard-improvisation-intervals',
    title: 'Fretboard Improvisation Intervals',
    description:
      'Once you play a note, see where on the fretboard you can reach different intervals to the last played note.',
    input: 'MIDI',
    instruments: ['guitar/bass'],
    skills: ['instrument-layout', 'pitch-intervals'],
    component: FretboardImprovisationIntervals
  },
  {
    id: 'fretboard-jitter',
    title: 'Fretboard Jitter',
    description: 'See how you play different fretboard positions over time.',
    input: 'MIDI',
    instruments: ['guitar/bass'],
    skills: ['instrument-layout'],
    component: FretboardJitter
  },
  {
    id: 'fretboard-spacetmime-cube',
    title: 'Fretboard Spacetime Cube',
    description: 'See how you play different fretboard positions over time.',
    input: 'MIDI',
    instruments: ['guitar/bass'],
    skills: ['instrument-layout'],
    component: FretboardSpacetimeCube
  },
  {
    id: 'improvisation-intervals',
    title: 'Improvisation Intervals',
    description:
      'See how often you use different intervals in improvisation.',
    input: 'MIDI',
    instruments: ['guitar/bass', 'keyboard'],
    skills: ['pitch-intervals'],
    component: ImprovisationIntervals
  },
  {
    id: 'improvisation-note-colors',
    title: 'Improvisation Note Colors',
    description:
      'See how often you use different kinds of notes in improvisation.',
    input: 'MIDI',
    instruments: ['guitar/bass', 'keyboard'],
    skills: ['pitch-intervals', 'scale-degrees'],
    component: ImprovisationNoteColors
  },
  {
    id: 'improvisation-scale-degrees',
    title: 'Improvisation Scale Degrees',
    description:
      'See how often you use different scale degrees in improvisation.',
    input: 'MIDI',
    instruments: ['guitar/bass', 'keyboard'],
    skills: ['pitch-intervals', 'scale-degrees'],
    component: ImprovisationScaleDegrees
  },
  {
    id: 'improvisation-scale-degrees-bar',
    title: 'Improvisation Scale Degrees (Bar)',
    description:
      'See how often you use different scale degrees in improvisation, for each played bar.',
    input: 'MIDI',
    instruments: ['guitar/bass', 'keyboard'],
    skills: ['pitch-intervals', 'scale-degrees'],
    component: ImprovisationScaleDegreesBar
  },
  {
    id: 'keyboard-histogram',
    title: 'Keyboard Histogram',
    description: 'See how often you play different keyboard keys.',
    input: 'MIDI',
    instruments: ['keyboard'],
    skills: ['instrument-layout'],
    component: KeyboardHistogram
  },
  {
    id: 'pitch-bend',
    title: 'Pitch Bend',
    description: 'Practice different kinds of pitch bends.',
    input: 'MIDI',
    instruments: ['guitar/bass', 'keyboard'],
    skills: ['bending', 'vibrato'],
    component: PitchBend
  },
  {
    id: 'pitch-bend-audio',
    title: 'Pitch Bend (Audio)',
    description: 'Practice different kinds of pitch bends.',
    input: 'audio',
    instruments: ['guitar/bass', 'keyboard', 'singing'],
    skills: ['bending', 'vibrato'],
    component: PitchBendAudio
  },
  {
    id: 'pitch-offset-cents',
    title: '[new] Pitch Offset in Cents',
    description: 'See how well you are on pitch.',
    input: 'audio',
    instruments: ['guitar/bass', 'keyboard', 'singing'],
    skills: ['pitch-keeping', 'bending', 'vibrato'],
    component: PitchOffsetCents
  },
  {
    id: 'rhythm-sheet-music',
    title: 'Rhythm Sheet Music',
    description:
      'This demo displays the notes you play as staff notation (𝅝, 𝅗𝅥, 𝅘𝅥, 𝅘𝅥𝅮, 𝅘𝅥𝅯) and offset in percent.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard', 'pc-key'],
    skills: ['sub-division'],
    component: RhythmSheetMusic
  },
  {
    id: 'speed-up',
    title: 'Speed-Up',
    description:
      'Record a short exercise at a slow tempo, then practice it with steadily increasing tempo.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard', 'pc-key'],
    skills: ['sub-division', 'timing-consistency'],
    component: SpeedUp
  },
  {
    id: 'speed-up-tab',
    title: ' Speed-Up Tab',
    description:
      'Record a short guitar exercise at a slow tempo, then practice it with steadily increasing tempo.',
    input: 'MIDI',
    instruments: ['guitar/bass'],
    skills: ['sub-division', 'timing-consistency'],
    component: SpeedUpTab
  },
  {
    id: 'sub-division',
    title: 'Sub-Division',
    description: 'Learn rhythmic playing in different sub-divisions.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard', 'pc-key'],
    skills: ['sub-division', 'timing-consistency'],
    component: SubDivision
  },
  {
    id: 'sub-division-bar',
    title: 'Sub-Division (Per Bar)',
    description: 'Learn rhythmic playing in different sub-divisions.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard', 'pc-key'],
    skills: ['sub-division', 'timing-consistency'],
    component: SubDivisionBar
  },
  {
    id: 'sub-division-drums',
    title: '[new] Sub-Division (Drums)',
    description: 'Learn rhythmic playing in different sub-divisions.',
    input: 'MIDI',
    instruments: ['drum', 'pc-key'],
    skills: ['sub-division', 'timing-consistency'],
    component: SubDivisionDrums
  },
  {
    id: 'sub-division-linear',
    title: 'Sub-Division (Linear)',
    description: 'Learn rhythmic playing in different sub-divisions.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard', 'pc-key'],
    skills: ['sub-division', 'timing-consistency'],
    component: SubDivisionLinear
  },
  {
    id: 'strumming-pattern',
    title: '[new] Strumming Pattern',
    description: 'Practice up/down strumming patterns.',
    input: 'MIDI',
    instruments: ['guitar/bass'],
    skills: ['strumming-direction', 'strumming-strings'],
    component: StrummingPattern
  },
  {
    id: 'tempo-drift',
    title: 'Tempo Drift',
    description: 'Keep your tempo constant over a longer stretch of playing.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard', 'pc-key'],
    skills: ['tempo-keeping'],
    component: TempoDrift
  },
  {
    id: 'two-handed-timing',
    title: '[new] Two-Handed Timing',
    description:
      'Play the same or a different rhythm with each hand and see your timing seperately.',
    input: 'MIDI',
    instruments: ['keyboard', 'pc-key'],
    skills: ['sub-division', 'timing-consistency', 'syncopation'],
    component: TwoHandedTiming
  }
]
