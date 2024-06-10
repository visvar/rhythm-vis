
export let SKILL_TREE = [
  {
    title: 'timing',
    children: [
      {
        title: 'playing to grid',
        skill: 'sub-division',
      },
      {
        title: 'tempo keeping',
        skill: 'tempo-keeping',
      },
      {
        title: 'chord timing',
        skill: 'chord-timing',
      },
      {
        title: 'arpeggio timing',
        skill: 'arpeggio-timing',
      },
      {
        title: 'timing consistency',
        skill: 'timing-consistency',
      },
    ],
  },
  {
    title: 'dynamics',
    children: [
      {
        title: 'constant dynamics',
        skill: 'constant-dynamics',
      },
      {
        title: 'accents',
        skill: 'accents',
      },
      {
        title: '(de-) crescendo',
        skill: '(de)crescendo',
      },
    ],
  },
  {
    title: 'pitch',
    children: [
      {
        title: 'intervals',
        skill: 'pitch-intervals',
      },
      {
        title: 'scale degrees',
        skill: 'scale-degrees',
      },
      {
        title: 'chord notes',
        skill: 'chord-notes',
      },
      {
        title: 'pitch keeping',
        skill: 'pitch-keeping',
      },
      {
        title: 'bending',
        skill: 'bending',
      },
      {
        title: 'vibrato',
        skill: 'vibrato',
      },
    ],
  },
  {
    title: 'instrument',
    children: [
      {
        title: 'instrument layout',
        skill: 'instrument-layout',
      },
      {
        title: 'strumming direction',
        skill: 'strumming-direction',
      },
    ],
  },
]


function getLeafs(children) {
  let leafs = []
  for (const child of children) {
    if (child.skill) {
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
