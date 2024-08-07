/**
 * Musical grids for sub-division
 * TODO: move to mvlib
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
 */
export const BIN_NOTES = [16, 32, 64, 128, 24, 48, 96, 192]

export const FILTER_NOTES = [4, 8, 16, 32, 64, 128]

// see https://en.wikipedia.org/wiki/Dynamics_(music)
// TODO: move to mvlib
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
