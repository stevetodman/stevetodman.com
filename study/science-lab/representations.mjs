const airParticlesBefore = [
  [0.10,0.18],[0.34,0.16],[0.60,0.20],[0.84,0.17],
  [0.18,0.48],[0.47,0.46],[0.76,0.50],
  [0.10,0.78],[0.38,0.77],[0.67,0.80],[0.88,0.74]
].map(([x,y]) => ({ x, y, kind: 'gas', label: 'air particle' }));

const airParticlesCompressed = [
  [0.18,0.22],[0.40,0.20],[0.62,0.24],[0.80,0.20],
  [0.24,0.48],[0.48,0.46],[0.70,0.50],
  [0.18,0.72],[0.40,0.70],[0.62,0.74],[0.80,0.68]
].map(([x,y]) => ({ x, y, kind: 'gas', label: 'air particle' }));

export const M3_ITEM_OVERRIDES = {
  sp2: {
    responseType: 'graph-build',
    prompt: 'Use the measurements to build the line graph of noon shadow length.',
    choices: undefined,
    answer: undefined,
    stimulus: {
      label: 'Flagpole observations',
      table: {
        headers: ['Month', 'Noon shadow length'],
        rows: [['December', '8 m'], ['March', '6 m'], ['June', '4 m'], ['September', '6 m']]
      }
    },
    graphBuild: {
      xName: 'month',
      xLabels: ['Dec', 'Mar', 'Jun', 'Sep'],
      yLabel: 'Shadow length (m)',
      yMin: 0,
      yMax: 8,
      yTicks: [0, 2, 4, 6, 8],
      allowedValues: [2, 4, 6, 8],
      expected: [8, 6, 4, 6],
      unit: 'm',
      graphLabel: 'Noon shadow length by month',
      ariaLabel: 'Learner-built line graph of noon shadow length in December, March, June, and September'
    },
    explanation: 'The plotted points show a seasonal pattern: the noon shadow is longest in December and shortest in June.'
  },
  sp3: {
    stimulus: {
      graph: {
        type: 'line',
        label: 'Daylight in one Louisiana city',
        ariaLabel: 'Line graph showing about 10 hours of daylight in December, 12 in March, 14 in June, and 12 in September',
        xLabels: ['Dec', 'Mar', 'Jun', 'Sep'],
        values: [10, 12, 14, 12],
        yLabel: 'Daylight (hours)',
        yMin: 8,
        yMax: 16,
        yTicks: [8, 10, 12, 14, 16]
      }
    }
  },
  pm3: {
    stimulus: {
      particleModel: {
        label: 'Air in the same sealed syringe before and after compression',
        ariaLabel: 'Two particle models with the same number of air particles; particles are closer together after compression',
        panels: [
          { label: 'Before compression', particles: airParticlesBefore },
          { label: 'After compression', particles: airParticlesCompressed }
        ],
        legend: [{ kind: 'gas', label: 'air particle' }]
      }
    }
  },
  mc3: {
    stimulus: {
      graph: {
        type: 'bar',
        label: 'Mass of a sealed reaction system',
        ariaLabel: 'Bar graph showing 156 grams before the reaction and 156 grams after the reaction',
        xLabels: ['Before', 'After'],
        values: [156, 156],
        yLabel: 'Mass (g)',
        yMin: 150,
        yMax: 158,
        yTicks: [150, 152, 154, 156, 158]
      }
    }
  },
  cy3: {
    stimulus: {
      systemModel: {
        label: 'Matter moving through an ecosystem',
        ariaLabel: 'System model showing matter moving from plant to rabbit to decomposer to soil and air and back to plant',
        nodes: [
          { id: 'plant', label: 'Plant', x: 0.15, y: 0.32 },
          { id: 'rabbit', label: 'Rabbit', x: 0.50, y: 0.20 },
          { id: 'decomposer', label: 'Decomposer', x: 0.82, y: 0.48 },
          { id: 'environment', label: 'Soil + air', x: 0.46, y: 0.78 }
        ],
        arrows: [
          { from: 'plant', to: 'rabbit', label: 'eaten' },
          { from: 'rabbit', to: 'decomposer', label: 'after death' },
          { from: 'decomposer', to: 'environment', label: 'matter returned' },
          { from: 'environment', to: 'plant', label: 'matter reused' }
        ]
      }
    }
  }
};
