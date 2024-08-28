/**
 * TODO: move to mvlib
 * @type {Map<string,number>}
 */
export const NOTE_TO_CHROMA_MAP = new Map([
  ['A', 9],
  ['A#', 10],
  ['A##', 11],
  ['Ab', 8],
  ['Abb', 7],
  ['B', 11],
  ['B#', 0],
  ['B##', 1],
  ['Bb', 10],
  ['Bbb', 9],
  ['C', 0],
  ['C#', 1],
  ['C##', 2],
  ['Cb', 11],
  ['D', 2],
  ['D#', 3],
  ['D##', 4],
  ['Db', 1],
  ['Dbb', 0],
  ['E', 4],
  ['E#', 5],
  ['E##', 6],
  ['Eb', 3],
  ['Ebb', 2],
  ['F', 5],
  ['F#', 6],
  ['F##', 7],
  ['Fb', 4],
  ['Fbb', 3],
  ['G', 7],
  ['G#', 8],
  ['G##', 9],
  ['Gb', 6],
  ['Gbb', 5],
])

/**
 * Musical grids for sub-division
 * TODO: move to mvlib
 *
 * @type {string[]}
 */
export const GRIDS = [
  '4:2',
  '4:3',
  '4:4',
  '4:5',
  '4:6',
  '3:2',
  '3:3',
  '3:4',
  '3:5',
  '3:6',
  '2:2',
  '2:3',
  '2:4',
  '2:5',
  '2:6'
]

/**
 * Note values to bin by
 *
 * @type {number[]}
 */
export const BIN_NOTES = [8, 16, 32, 64, 128, 24, 48, 96, 192]

export const FILTER_NOTES = [4, 8, 16, 32, 64, 128]

// see https://en.wikipedia.org/wiki/Dynamics_(music)
// TODO: move to mvlib
/**
 * @type {Map<number,string>}
 */
export const VELOCITIES_LOGIC = new Map([
  [0, 'silent'],
  [16, 'ppp'],
  [32, 'pp'],
  [48, 'p'],
  [64, 'mp'],
  [80, 'mf'],
  [96, 'f'],
  [112, 'ff'],
  [127, 'fff']
])
/**
 * @type {Map<number,string>}
 */
export const VELOCITIES_FINALE = new Map([
  [0, 'silent'],
  [10, 'pppp'],
  [23, 'ppp'],
  [36, 'pp'],
  [49, 'p'],
  [62, 'mp'],
  [75, 'mf'],
  [88, 'f'],
  [101, 'ff'],
  [114, 'fff'],
  [127, 'ffff']
])
/**
 * @type {Map<number,string>}
 */
export const VELOCITIES_MUSESCORE = new Map([
  [0, 'silent'],
  [5, 'ppppp'],
  [10, 'pppp'],
  [16, 'ppp'],
  [33, 'pp'],
  [49, 'p'],
  [64, 'mp'],
  [80, 'mf'],
  [96, 'f'],
  [112, 'ff'],
  [126, 'fff'],
  [127, 'ffff']
])

/**
 * @see https://en.wikipedia.org/wiki/Dynamics_(music)
 * TODO: move to mvlib
 * @type {Map<string,string>}
*/
export const VELOCITIES_MEANING = new Map([
  ['silent', 'silent'],
  ['ppppp', 'almost silent'],
  ['pppp', 'soft whispering'],
  ['ppp', 'whispering'],
  ['pp', 'almost a whisper'],
  ['p', 'softer than speaking'],
  ['mp', 'speaking voice'],
  ['mf', 'speaking voice'],
  ['f', 'louder than speaking'],
  ['ff', 'loud speaking'],
  ['fff', 'yelling'],
  ['ffff', 'loud yelling']
])

/**
// @see https://en.wikipedia.org/wiki/Tempo
 * Each given as upper end of the BPM range
 * TODO: move to mvlib
 * @type {Map<string,number>}
 */
export const TEMPO_NAMES = new Map([
  ['Larghissimo', 24],
  ['Adagissimo', 40],
  ['Largo', 66],
  ['Marcia moderato', 80],
  ['Andante moderato', 108],
  ['Moderato', 120],
  ['Allegro', 156],
  ['Vivace', 176],
  ['Presto', 200],
  ['Prestissimo', 400]
])
