
export const SKILL_TREE = [
  {
    title: 'timing',
    children: [
      {
        id: 'sub-division',
        title: 'playing to grid',
        description: 'Note onsets should follow a sub-division of beats consistently, for example playing straight eighth notes or quarter triplets'
      },
      {
        id: 'tempo-keeping',
        title: 'tempo keeping',
        description: 'The tempo should be kept same over a longer stretch of time without the help of a metronome'
      },
      {
        id: 'chord-timing',
        title: 'chord timing',
        description: 'Notes in a chord should start at the same time and the time between chords should be consistent'
      },
      {
        id: 'arpeggio-timing',
        title: 'arpeggio timing',
        description: 'Notes in an arpeggio should be spaced out evenly and the time between arpeggios should be consistent'
      },
      {
        id: 'swing-feel',
        title: 'swing feel',
        description: 'Playing a swing feel, meaning that every even (sub)beat is shifted in time consistently by the intended amount'
      },
      {
        id: 'timing-consistency',
        title: 'timing consistency',
        description: 'When playing the same musical pattern multiple times, the timing should be similar'
      },
      {
        id: 'rests',
        title: 'rests',
        description: 'Notes should stop in time for a rest'
      },
      {
        id: 'syncopation',
        title: 'syncopation',
        description: 'When playing different rhythms together, the timing should be on grid'
      }
      // {
      //   id: 'polyrhythm',
      //   title: 'polyrhythm',
      //   description: 'When playing different rhythmic divisions at the same time, the timing should be on grid'
      // }
    ]
  },
  {
    title: 'pitch',
    children: [
      {
        id: 'on-pitch',
        title: 'on pitch',
        description: 'When playing a melody, the notes\' pitches should be hit correctly'
      },
      {
        id: 'pitch-intervals',
        title: 'intervals',
        description: 'In improvisation, the intervals between consecutive notes should match the intended harmony or dissonance'
      },
      {
        id: 'scale-degrees',
        title: 'scale degrees',
        description: 'In improvisation, scale degrees should be used to appropriate amounts'
      },
      {
        id: 'chord-notes',
        title: 'chord notes',
        description: 'The notes in a chord should be played as planned or chosen to match the intended harmony or dissonance'
      },
      {
        id: 'pitch-keeping',
        title: 'pitch keeping',
        description: 'The pitch should start and stay at the intended note'
      },
      {
        id: 'bending',
        title: 'bending',
        description: 'Bends should reach and stay at the intended semitone, the bend should start and end as quickly as intended'
      },
      {
        id: 'vibrato',
        title: 'vibrato',
        description: 'Vibratos should have the intended shift in pitch and the intended frequency of modulation'
      }
    ]
  },
  {
    title: 'dynamics',
    children: [
      {
        id: 'constant-dynamics',
        title: 'constant dynamics',
        description: 'Notes should have the same loudness'
      },
      {
        id: 'accents',
        title: 'accents',
        description: 'Important notes should be louder than others, for example to higlight the first of a group of 3 or 4 notes'
      },
      {
        id: '(de)crescendo',
        title: '(de-) crescendo',
        description: 'When getting louder/quiter, the loudness should in- or decrease smoothly'
      }
    ]
  },
  {
    title: 'instrument',
    children: [
      {
        id: 'instrument-layout',
        title: 'instrument layout',
        description: 'The musician should know where notes are played on the instrument and use different parts of it appropriately'
      },
      {
        id: 'strumming-direction',
        title: 'strumming direction',
        description: 'Chords should be strummed in the intended direction'
      },
      {
        id: 'strumming-strings',
        title: 'strumming strings',
        description: 'Only the intended strings should be strummed'
      }
    ]
  }
]

function getLeafs(children) {
  let leafs = []
  for (const child of children) {
    if (child.id) {
      // is leaf
      leafs.push(child)
    } else {
      // is inner node
      leafs = [...leafs, ...getLeafs(child.children)]
    }
  }
  return leafs
}

export const SKILL_TREE_LEAFS = getLeafs(SKILL_TREE)
