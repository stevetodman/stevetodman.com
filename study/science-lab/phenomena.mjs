const waterParticles = [
  [0.08,0.18],[0.26,0.12],[0.46,0.20],[0.68,0.13],[0.88,0.20],
  [0.14,0.43],[0.36,0.39],[0.58,0.46],[0.82,0.40],
  [0.08,0.72],[0.30,0.68],[0.52,0.76],[0.74,0.70],[0.92,0.76]
].map(([x,y]) => ({ x, y, kind: 'water', label: 'water particle' }));

const sugarCluster = [
  [0.40,0.77],[0.48,0.80],[0.56,0.76],[0.44,0.67],[0.53,0.66]
].map(([x,y]) => ({ x, y, kind: 'solute', label: 'sugar particle' }));

const sugarDispersed = [
  [0.18,0.30],[0.72,0.27],[0.42,0.51],[0.84,0.60],[0.28,0.78]
].map(([x,y]) => ({ x, y, kind: 'solute', label: 'sugar particle' }));

export const SCIENCE_PHENOMENA = [
  {
    id: 'sugar-disappears',
    unit: 'matter',
    title: 'Where did the sugar go?',
    summary: 'Sugar crystals disappear in water, but the sealed system keeps the same mass.',
    standards: ['5-PS1-1', '5-PS1-2'],
    skills: ['particle-models', 'matter-conservation'],
    context: 'A student places water and 10 g of sugar in a clear sealed container. The total sealed system has a mass of 210 g. After stirring, the sugar crystals can no longer be seen.',
    evidence: {
      particles: {
        particleModel: {
          label: 'Particle model before and after stirring',
          ariaLabel: 'Before stirring, sugar particles are clustered at the bottom among water particles. After stirring, the same sugar particles are spread throughout the water.',
          panels: [
            { label: 'Before stirring', particles: [...waterParticles, ...sugarCluster] },
            { label: 'After stirring', particles: [...waterParticles, ...sugarDispersed] }
          ],
          legend: [
            { kind: 'water', label: 'water particle' },
            { kind: 'solute', label: 'sugar particle' }
          ]
        }
      },
      mass: {
        graph: {
          type: 'bar',
          label: 'Mass of the sealed system',
          ariaLabel: 'Bar graph showing 210 grams before stirring and 210 grams after the sugar dissolves',
          xLabels: ['Before', 'After'],
          values: [210, 210],
          yLabel: 'Mass (g)',
          yMin: 0,
          yMax: 220,
          yTicks: [0, 55, 110, 165, 220]
        }
      }
    },
    steps: [
      {
        id: 'notice',
        type: 'notice',
        eyebrow: 'Notice',
        prompt: 'The sugar crystals are no longer visible. Do not explain it yet—notice what changed and what did not.',
        note: 'The container stayed sealed. Nothing was poured out.'
      },
      {
        id: 'predict',
        type: 'choice',
        role: 'prediction',
        eyebrow: 'Predict',
        prompt: 'Before seeing a particle model, what do you think happened to the sugar matter?',
        choices: [
          'The sugar matter stopped existing',
          'The sugar particles are still present but spread through the water',
          'The sugar matter turned into light energy',
          'The sugar particles escaped through the sealed container'
        ],
        answer: 1
      },
      {
        id: 'particle-evidence',
        type: 'choice',
        role: 'evidence',
        eyebrow: 'Investigate',
        evidenceIds: ['particles'],
        prompt: 'Which feature of the model best supports the idea that the sugar is still present?',
        choices: [
          'The same sugar particles appear before and after, but they are spread out after stirring',
          'All sugar particles disappear from the after model',
          'New sugar particles enter the sealed container',
          'The water particles turn into sugar particles'
        ],
        answer: 0,
        recordEvidence: true,
        skill: 'particle-models',
        standard: '5-PS1-1',
        explanation: 'The model conserves the sugar particles. Dissolving changes their spacing and distribution, not whether the matter exists.'
      },
      {
        id: 'mass-evidence',
        type: 'choice',
        role: 'evidence',
        eyebrow: 'Use another kind of evidence',
        evidenceIds: ['mass'],
        prompt: 'What does the mass evidence add to the particle model?',
        choices: [
          'The unchanged mass supports that matter was not destroyed or lost from the sealed system',
          'The unchanged mass proves the sugar became energy',
          'The graph shows the water lost all of its mass',
          'The graph proves particles cannot move'
        ],
        answer: 0,
        recordEvidence: true,
        skill: 'matter-conservation',
        standard: '5-PS1-2',
        explanation: 'The sealed system has the same total mass before and after dissolving, consistent with matter remaining in the system.'
      },
      {
        id: 'revise',
        type: 'choice',
        role: 'revision',
        eyebrow: 'Revise your model',
        prompt: 'After using both kinds of evidence, which final model is best supported?',
        choices: [
          'Sugar matter was destroyed because the crystals disappeared',
          'Sugar particles remained matter and became dispersed among the water particles',
          'Sugar changed into energy, which kept the mass the same',
          'Sugar left the container even though it was sealed'
        ],
        answer: 1,
        explanation: 'The particle model and unchanged system mass support the same explanation: the sugar remains present as matter, dispersed through the water.'
      }
    ],
    retrievalDelayDays: 1,
    transferSkill: 'particle-models'
  },
  {
    id: 'open-system-mass',
    unit: 'matter',
    title: 'Why did the measured mass drop?',
    summary: 'The same bubbling reaction gives different measured results in an open cup and a sealed container.',
    standards: ['5-PS1-2', '5-PS1-4'],
    skills: ['matter-conservation', 'new-substances'],
    context: 'Students run the same reaction twice. Both trials begin at 156 g and both produce many bubbles. One reaction is sealed; the other is in an open cup. After the reaction, the sealed system is still 156 g, but the open cup and its contents measure 151 g.',
    evidence: {
      masses: {
        graph: {
          type: 'bar',
          label: 'Measured mass before and after the reaction',
          ariaLabel: 'Bar graph showing sealed before 156 grams, sealed after 156 grams, open before 156 grams, and open after 151 grams',
          xLabels: ['Sealed before', 'Sealed after', 'Open before', 'Open after'],
          values: [156, 156, 156, 151],
          yLabel: 'Mass (g)',
          yMin: 0,
          yMax: 160,
          yTicks: [0, 40, 80, 120, 160]
        }
      },
      gas: {
        text: 'In both trials, bubbles form. In the sealed trial, the gas remains inside the system. In the open trial, bubbles rise out of the cup and enter the room.'
      }
    },
    steps: [
      {
        id: 'notice',
        type: 'notice',
        eyebrow: 'Notice',
        prompt: 'The same reaction bubbles in both setups, but only the open setup has a lower measured mass afterward.',
        note: 'The key difference is whether matter can cross the boundary of the measured system.'
      },
      {
        id: 'predict',
        type: 'choice',
        role: 'prediction',
        eyebrow: 'Predict',
        prompt: 'Before comparing all the evidence, why do you think the open setup measures less afterward?',
        choices: [
          'Some matter was destroyed during the reaction',
          'Gas matter formed and left the measured open system',
          'The balance removed 5 g of matter',
          'The materials stopped being matter when bubbles appeared'
        ],
        answer: 1
      },
      {
        id: 'mass-pattern',
        type: 'choice',
        role: 'evidence',
        eyebrow: 'Analyze the data',
        evidenceIds: ['masses'],
        prompt: 'Which pattern in the graph matters most for explaining the results?',
        choices: [
          'The sealed system keeps the same mass while the open measured system is lower after the reaction',
          'Both systems begin with different masses',
          'The sealed system loses more mass than the open system',
          'Neither system has measurable mass'
        ],
        answer: 0,
        recordEvidence: true,
        skill: 'matter-conservation',
        standard: '5-PS1-2',
        explanation: 'The closed system keeps all reaction products inside its measured boundary, while the open measured system can lose matter to the surroundings.'
      },
      {
        id: 'gas-evidence',
        type: 'choice',
        role: 'evidence',
        eyebrow: 'Connect another observation',
        evidenceIds: ['gas'],
        prompt: 'Which observation is also evidence that the reaction produced a new substance?',
        choices: [
          'A gas forms during the reaction',
          'The cup is sitting on a table',
          'The starting mass is written in grams',
          'The students used two containers'
        ],
        answer: 0,
        recordEvidence: true,
        skill: 'new-substances',
        standard: '5-PS1-4',
        explanation: 'Formation of a gas with new properties can be evidence that new substances formed during a reaction.'
      },
      {
        id: 'revise',
        type: 'choice',
        role: 'revision',
        eyebrow: 'Revise your explanation',
        evidenceIds: ['masses', 'gas'],
        prompt: 'Which final explanation uses both the mass data and the bubbling observation?',
        choices: [
          'Matter was destroyed only in the open cup',
          'The reaction formed gas; the sealed system retained it, while gas left the open measured system',
          'Bubbles have no mass, so they cannot affect the measurement',
          'The balance created the difference between the trials'
        ],
        answer: 1,
        explanation: 'Matter is conserved. The reaction forms gas, and an open-system measurement can fall when that gas leaves the measured boundary.'
      },
      {
        id: 'cer',
        type: 'cer',
        role: 'cer',
        eyebrow: 'Build your explanation',
        evidenceIds: ['masses', 'gas'],
        prompt: 'Build a Claim–Evidence–Reasoning explanation for why the open setup measured less after the reaction.',
        cer: {
          scaffoldLevel: 'C',
          claim: {
            choices: [
              'Matter was destroyed in the open cup.',
              'The reaction formed gas, and gas matter left the measured open system.',
              'The balance caused the mass change.'
            ],
            answer: 1,
            repairHint: 'Focus on what crossed the boundary of the measured system.'
          },
          evidence: {
            choices: [
              'The sealed system stayed at 156 g before and after.',
              'The open setup dropped from 156 g to 151 g while bubbles left the cup.',
              'Both containers were used by students.',
              'The measurements were written in grams.'
            ],
            answers: [0, 1],
            repairHint: 'Choose observations that directly distinguish the sealed and open systems.'
          },
          reasoning: {
            choices: [
              'Matter is conserved; an open measured system can lose mass when matter crosses its boundary.',
              'Gas has no mass, so bubbles do not count.',
              'Chemical reactions can destroy matter.'
            ],
            answer: 0,
            repairHint: 'Use conservation of matter and the system boundary.'
          },
          explanation: 'The reaction formed gas. In the sealed system that gas stayed inside, so total measured mass remained 156 g. In the open system gas crossed the measured boundary, so the cup and contents measured less even though matter was not destroyed.'
        }
      }
    ],
    retrievalDelayDays: 1,
    transferSkill: 'matter-conservation'
  }
];
