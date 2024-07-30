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
import SubDivisionHistory from './demos/sub-division-history.svelte'
import PitchOffsetCentsNeedle from './demos/pitch-offset-cents-needle.svelte'
import DurationPies from './demos/duration-pies.svelte'

/**
 * All apps defined here
 */
export const APPS = [
  {
    id: 'accents',
    title: 'Accents',
    description: 'See if you accent the right notes.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard'],
    data: ['order', 'ioi', 'velocity'],
    skills: ['accents'],
    patterns: ['duration/ioi as symbol', 'dynamics as font-size', 'time is linear', 'time encoded non-linearly', 'update after note'],
    component: Accents
  },
  {
    id: 'chord-arpeggio-timing',
    title: 'Chord and Arpeggio Timing',
    description:
      'See how spaced out the notes in a chord or arpeggio are, and how much time lies between these.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard'],
    data: ['order', 'onset/time', 'ioi', 'pitch'],
    skills: ['chord-timing', 'arpeggio-timing'],
    patterns: ['onset as tick', 'compressed pitches', 'chord detection', 'time is linear', 'time encoded linearly', 'update on note'],
    component: ChordArpeggioTiming
  },
  {
    id: 'chord-diagrams',
    title: 'Chord Diagrams',
    description:
      'See what chords you play on a guitar/bass as chord diagrams.',
    input: 'MIDI',
    instruments: ['guitar/bass'],
    data: ['order', 'onset/time', 'pitch', 'velocity', 'instrument'],
    skills: ['chord-notes'],
    patterns: ['instrument layout', 'chord detection', 'time is linear', 'time is collapsed', 'update on note'],
    component: ChordDiagrams
  },
  {
    id: 'dynamics',
    title: 'Dynamics',
    description: 'Check how well you control the loudness of notes.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard'],
    data: ['order', 'dynamics'],
    skills: ['constant-dynamics', '(de)crescendo', 'accents'],
    patterns: ['dynamics as bar', 'baselines as grid', 'time is linear', 'time encoded linearly', 'update on note', 'musical units'],
    component: Dynamics
  },
  {
    id: 'duration-pies',
    title: 'Duration Pies',
    description: 'Check how well you control the duration of notes.',
    input: 'MIDI',
    instruments: ['keyboard'],
    data: ['order', 'duration'],
    skills: ['duration'],
    patterns: ['duration as pie', 'baselines as angle', 'time is circular', 'time encoded ciruclar', 'update on note', 'musical units'],
    component: DurationPies
  },
  {
    id: 'fretboard-heatmap',
    title: 'Fretboard Heatmap',
    description: 'See how often you play different fretboard positions.',
    input: 'MIDI',
    instruments: ['guitar/bass'],
    data: ['instrument'],
    skills: ['instrument-layout'],
    patterns: ['distribution as heatmap', 'instrument layout', 'time is collapsed', 'update on note'],
    component: FretboardHeatmap
  },
  {
    id: 'fretboard-improvisation-intervals',
    title: 'Fretboard Improvisation Intervals',
    description:
      'Once you play a note, see where on the fretboard you can reach different intervals to the last played note.',
    input: 'MIDI',
    instruments: ['guitar/bass'],
    data: ['order', 'pitch', 'instrument', 'pitch-interval'],
    skills: ['instrument-layout', 'pitch-intervals'],
    patterns: ['instrument layout', 'time is instant', 'update on note'],
    component: FretboardImprovisationIntervals
  },
  {
    id: 'fretboard-jitter',
    title: 'Fretboard Jitter',
    description: 'See how you play different fretboard positions over time.',
    input: 'MIDI',
    instruments: ['guitar/bass'],
    data: ['order', 'instrument'],
    skills: ['instrument-layout'],
    patterns: ['distribution as jitter', 'instrument layout', 'time is linear', 'time encoded non-linearly', 'update on note'],
    component: FretboardJitter
  },
  {
    id: 'fretboard-spacetime-cube',
    title: 'Fretboard Spacetime Cube',
    description: 'See how you play different fretboard positions over time.',
    input: 'MIDI',
    instruments: ['guitar/bass'],
    data: ['onset/time', 'instrument'],
    skills: ['instrument-layout'],
    patterns: ['spacetime cube', 'instrument layout', 'time is linear', 'time encoded linearly', 'update on note'],
    component: FretboardSpacetimeCube
  },
  {
    id: 'improvisation-intervals',
    title: 'Improvisation Intervals',
    description:
      'See how often you use different intervals in improvisation.',
    input: 'MIDI',
    instruments: ['guitar/bass', 'keyboard'],
    data: ['order', 'pitch', 'pitch-interval'],
    skills: ['pitch-intervals'],
    patterns: ['distribution as histogram', 'time is collapsed', 'update on note'],
    component: ImprovisationIntervals
  },
  {
    id: 'improvisation-note-colors',
    title: 'Improvisation Note Colors',
    description:
      'See how often you use different kinds of notes in improvisation.',
    input: 'MIDI',
    instruments: ['guitar/bass', 'keyboard'],
    data: ['order', 'duration', 'pitch'],
    skills: ['pitch-intervals', 'scale-degrees'],
    patterns: ['note role as color', 'duration/ioi as bar', 'time is linear', 'time encoded non-linearly', 'update on note'],
    component: ImprovisationNoteColors
  },
  {
    id: 'improvisation-scale-degrees',
    title: 'Improvisation Scale Degrees',
    description:
      'See how often you use different scale degrees in improvisation.',
    input: 'MIDI',
    instruments: ['guitar/bass', 'keyboard'],
    data: ['pitch'],
    skills: ['pitch-intervals', 'scale-degrees'],
    patterns: ['note role as color', 'distribution as histogram', 'time is collapsed', 'update on note'],
    component: ImprovisationScaleDegrees
  },
  {
    id: 'improvisation-scale-degrees-bar',
    title: 'Improvisation Scale Degrees (Bar)',
    description:
      'See how often you use different scale degrees in improvisation, for each played bar.',
    input: 'MIDI',
    instruments: ['guitar/bass', 'keyboard'],
    data: ['pitch', 'onset/time'],
    skills: ['pitch-intervals', 'scale-degrees'],
    patterns: ['note role as color', 'distribution as histogram', 'facets', 'time segments', 'time is linear', 'time is collapsed', 'time encoded linearly', 'update on note'],
    component: ImprovisationScaleDegreesBar
  },
  {
    id: 'keyboard-histogram',
    title: 'Keyboard Histogram',
    description: 'See how often you play different keyboard keys.',
    input: 'MIDI',
    instruments: ['keyboard'],
    data: ['pitch', 'instrument'],
    skills: ['instrument-layout'],
    patterns: ['distribution as histogram', 'instrument layout', 'time is collapsed', 'update on note'],
    component: KeyboardHistogram
  },
  {
    id: 'pitch-bend',
    title: 'Pitch Bend',
    description: 'Practice different kinds of pitch bends.',
    input: 'MIDI',
    instruments: ['guitar/bass', 'keyboard'],
    data: ['onset/time', 'pitch'],
    skills: ['pitch-keeping', 'bending', 'vibrato'],
    patterns: ['pitch as line', 'baselines as grid', 'time is linear', 'time encoded linearly', 'update on note'],
    component: PitchBend
  },
  {
    id: 'pitch-bend-audio',
    title: 'Pitch Bend (Audio)',
    description: 'Practice different kinds of pitch bends.',
    input: 'audio',
    instruments: ['guitar/bass', 'keyboard', 'singing'],
    data: ['onset/time', 'pitch'],
    skills: ['pitch-keeping', 'bending', 'vibrato'],
    patterns: ['pitch as line', 'baselines as grid', 'time is linear', 'time encoded linearly', 'update real-time'],
    component: PitchBendAudio
  },
  {
    id: 'pitch-offset-cents',
    title: 'Pitch Offset in Cents',
    description: 'See how well you are on pitch.',
    input: 'audio',
    instruments: ['guitar/bass', 'keyboard', 'singing'],
    data: ['onset/time', 'pitch'],
    skills: ['pitch-keeping', 'bending', 'vibrato'],
    patterns: ['pitch as line', 'baselines as grid', 'explicit difference', 'difference as color', 'time is linear', 'time encoded linearly', 'update real-time', 'dual encoding'],
    component: PitchOffsetCents
  },
  {
    id: 'pitch-offset-cents-needle',
    title: 'Pitch Offset in Cents (Needle)',
    description: 'See how well you are on pitch.',
    input: 'audio',
    instruments: ['guitar/bass', 'keyboard', 'singing'],
    data: ['onset/time', 'pitch'],
    skills: ['pitch-keeping'],
    patterns: ['pitch as angle', 'baselines as grid', 'explicit difference', 'time is instant', 'update real-time'],
    component: PitchOffsetCentsNeedle
  },
  {
    id: 'rhythm-sheet-music',
    title: 'Rhythm Sheet Music',
    description:
      'This demo displays the notes you play as staff notation (𝅝, 𝅗𝅥, 𝅘𝅥, 𝅘𝅥𝅮, 𝅘𝅥𝅯) and offset in percent.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard', 'pc-key'],
    data: ['order', 'duration/ioi'],
    skills: ['sub-division', 'tempo-keeping'],
    patterns: ['duration/ioi as symbol', 'time is linear', 'time encoded non-linearly', 'update after note'],
    component: RhythmSheetMusic
  },
  {
    id: 'speed-up',
    title: 'Speed-Up',
    description:
      'Record a short exercise at a slow tempo, then practice it with steadily increasing tempo.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard', 'pc-key'],
    data: ['onset/time', 'exercise', 'baselines as grid'],
    skills: ['sub-division', 'timing-consistency', 'swing-feel'],
    patterns: ['phrase repetition', 'facets', 'increasing difficulty', 'comparison between takes', 'time is linear', 'time encoded linearly', 'update on note'],
    component: SpeedUp
  },
  {
    id: 'speed-up-tab',
    title: 'Speed-Up Tab',
    description:
      'Record a short guitar exercise at a slow tempo, then practice it with steadily increasing tempo.',
    input: 'MIDI',
    instruments: ['guitar/bass'],
    data: ['onset/time', 'exercise', 'baselines as grid', 'instrument'],
    skills: ['sub-division', 'timing-consistency', 'swing-feel'],
    patterns: ['phrase repetition', 'facets', 'increasing difficulty', 'comparison between takes', 'time is linear', 'time encoded linearly', 'update on note'],
    component: SpeedUpTab
  },
  {
    id: 'sub-division',
    title: 'Sub-Division',
    description: 'Learn rhythmic playing in different sub-divisions.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard', 'pc-key'],
    data: ['onset/time'],
    skills: ['sub-division', 'timing-consistency'],
    patterns: ['time is cyclic', 'time encoded circular', 'baselines as grid', 'distribution as histogram', 'distribution as density', 'update on note'],
    component: SubDivision
  },
  {
    id: 'sub-division-bar',
    title: 'Sub-Division (Per Bar)',
    description: 'Learn rhythmic playing in different sub-divisions.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard', 'pc-key'],
    data: ['onset/time'],
    skills: ['sub-division', 'timing-consistency'],
    patterns: ['time is cyclic', 'time encoded circular', 'baselines as grid', 'distribution as histogram', 'distribution as density', 'target areas', 'update on note'],
    component: SubDivisionBar
  },
  {
    id: 'sub-division-drums',
    title: 'Sub-Division (Drums)',
    description: 'Learn rhythmic playing in different sub-divisions.',
    input: 'MIDI',
    instruments: ['drum', 'pc-key'],
    data: ['onset/time', 'instrument'],
    skills: ['sub-division', 'timing-consistency', 'synchronized-body-parts'],
    patterns: ['time is cyclic', 'time encoded linearly', 'baselines as grid', 'distribution as histogram', 'distribution as density', 'facets', 'update on note'],
    component: SubDivisionDrums
  },
  {
    id: 'sub-division-linear',
    title: 'Sub-Division (Linear)',
    description: 'Learn rhythmic playing in different sub-divisions.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard', 'pc-key'],
    data: ['onset/time'],
    skills: ['sub-division', 'timing-consistency'],
    patterns: ['time is cyclic', 'time encoded linearly', 'baselines as grid', 'distribution as histogram', 'distribution as density', 'update on note'],
    component: SubDivisionLinear
  },
  {
    id: 'sub-division-history',
    title: 'Sub-Division (History)',
    description: 'Learn rhythmic playing in different sub-divisions.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard', 'pc-key'],
    data: ['onset/time'],
    skills: ['sub-division', 'timing-consistency'],
    patterns: ['time is cyclic', 'time encoded circular', 'baselines as grid', 'distribution as histogram', 'distribution as density', 'facets', 'comparison between takes', 'update on note'],
    component: SubDivisionHistory
  },
  {
    id: 'strumming-pattern',
    title: 'Strumming Pattern',
    description: 'Practice up/down strumming patterns.',
    input: 'MIDI',
    instruments: ['guitar/bass'],
    data: ['onset/time', 'instrument'],
    skills: ['strumming-direction', 'strumming-strings'],
    patterns: ['direction as arrow', 'direction as color', 'chord detection', 'time is linear', 'time encoded linearly', 'update on note'],
    component: StrummingPattern
  },
  {
    id: 'tempo-drift',
    title: 'Tempo Drift',
    description: 'Keep your tempo constant over a longer stretch of playing.',
    input: 'MIDI',
    instruments: ['drum', 'guitar/bass', 'keyboard', 'pc-key'],
    data: ['order', 'duration/ioi'],
    skills: ['tempo-keeping'],
    patterns: ['duration/ioi as bar', 'baselines as grid', 'time is linear', 'time encoded non-linearly', 'update on note'],
    component: TempoDrift
  },
  {
    id: 'two-handed-timing',
    title: 'Two-Handed Timing',
    description:
      'Play the same or a different rhythm with each hand and see your timing seperately.',
    input: 'MIDI',
    instruments: ['keyboard', 'pc-key'],
    data: ['onset/time', 'instrument'],
    skills: ['sub-division', 'timing-consistency', 'syncopation', 'synchronized-timing', 'synchronized-body-parts'],
    patterns: ['time is cyclic', 'time encoded linearly', 'baselines as grid', 'distribution as histogram', 'distribution as density', 'facets', 'update on note'],
    component: TwoHandedTiming
  }
]
