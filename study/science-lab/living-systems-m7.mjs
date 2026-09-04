const remediation = entries => Object.fromEntries(entries.map(([index, tag, hint]) => [index, { tag, hint }]));
const table = (label, headers, rows) => ({ label, table: { headers, rows } });
const flow = (label, steps) => ({ label, flow: steps });

const meta = ({ sep, ccc, representationType = 'selected-response', sourceFamily, transferLevel = 'none', repair, ...extra }) => ({
  sep,
  ccc,
  representationType,
  sourceFamily: `ecosystems:${sourceFamily}`,
  transferLevel,
  transfer: transferLevel === 'far',
  ...(repair ? { remediation: repair } : {}),
  ...extra
});

export const M7_LIVING_SYSTEMS_OVERRIDES = {
  fe1: meta({
    sep: 'Developing and Using Models', ccc: 'Energy and Matter', representationType: 'sequence-model', sourceFamily: 'sun-plant-rabbit',
    repair: remediation([
      [0, 'soil-before-sun-energy', 'Soil supplies matter and minerals, but the energy stored in the plant food begins with light from the Sun.'],
      [2, 'energy-path-reversed', 'Trace the energy in the direction it was transferred: from the original source into the producer, then the consumer.'],
      [3, 'water-is-food-energy-source', 'Water is matter plants need, but it is not the original energy source for the rabbit’s food.']
    ])
  }),
  fe2: meta({
    sep: 'Developing and Using Models', ccc: 'Energy and Matter', representationType: 'food-chain-reasoning', sourceFamily: 'seed-mouse-snake-hawk',
    repair: remediation([
      [0, 'top-consumer-originates-energy', 'The hawk receives energy; it does not create the original food energy. Trace the chain backward to the producer’s energy source.'],
      [1, 'soil-originates-food-energy', 'Soil contributes materials, but the energy stored in seeds was captured from light.'],
      [3, 'intermediate-consumer-originates-energy', 'The snake transfers food energy to the hawk, but that energy entered the food chain earlier.']
    ])
  }),
  fe3: meta({
    sep: 'Developing and Using Models', ccc: 'Energy and Matter', representationType: 'flow-model', sourceFamily: 'grass-grasshopper-frog-fox',
    repair: remediation([
      [0, 'producer-creates-energy', 'The grass stores energy captured from light; it does not create energy from nothing.'],
      [2, 'energy-flows-backward-to-sun', 'Energy is transferred through the food chain; the arrows should not send the fox’s energy back into the Sun.'],
      [3, 'soil-is-only-energy-source', 'Soil supplies matter and minerals. The energy pathway in this model begins with the Sun.']
    ])
  }),
  pg1: meta({
    sep: 'Engaging in Argument from Evidence', ccc: 'Energy and Matter', representationType: 'multi-select-evidence', sourceFamily: 'tree-growth-inputs',
    repair: remediation([
      [2, 'light-is-plant-matter', 'Light supplies energy, not matter. Select the material inputs plants use to build new growth.'],
      [3, 'soil-supplies-most-plant-mass', 'Plants need minerals from soil, but most new plant material is built chiefly from carbon dioxide from air and water.']
    ])
  }),
  pg2: meta({
    sep: 'Engaging in Argument from Evidence', ccc: 'Scale, Proportion, and Quantity', representationType: 'data-table', sourceFamily: 'plant-vs-soil-mass',
    repair: remediation([
      [1, 'scale-creates-plant-matter', 'A scale measures mass; it does not create the plant’s new material. Use the before-and-after measurements as evidence.'],
      [2, 'plant-growth-does-not-need-water', 'The soil-mass evidence does not show that water is unnecessary. It only challenges the claim that most new mass came from soil.'],
      [3, 'sunlight-is-plant-matter', 'Light supplies energy. The performance expectation asks about the material sources used to build plant tissues.']
    ])
  }),
  pg3: meta({
    sep: 'Developing and Using Models', ccc: 'Energy and Matter', representationType: 'input-output-model', sourceFamily: 'photosynthesis-input-model',
    repair: remediation([
      [1, 'plants-eat-soil-for-mass', 'Plants take some minerals from soil, but they do not build most new tissue by eating soil. Track air and water as major material inputs.'],
      [2, 'sunlight-turns-directly-into-matter', 'Light supplies energy; it is not itself converted into the plant’s material mass.'],
      [3, 'growth-without-matter-inputs', 'New plant tissue contains matter. A valid model must include matter entering the plant system.']
    ])
  }),
  cy1: meta({
    sep: 'Developing and Using Models', ccc: 'Energy and Matter', representationType: 'matter-pathway', sourceFamily: 'fallen-leaf-decomposer',
    repair: remediation([
      [0, 'decomposition-destroys-matter', 'Decomposition changes and transfers matter; it does not make the leaf matter cease to exist.'],
      [2, 'matter-becomes-only-energy', 'Matter and energy are tracked differently. The leaf’s atoms remain matter as they move through the ecosystem.'],
      [3, 'ecosystem-matter-leaves-earth', 'The task is to model cycling within Earth’s systems. Look for matter returning to air, soil, water, or organisms.']
    ])
  }),
  cy2: meta({
    sep: 'Developing and Using Models', ccc: 'Energy and Matter', representationType: 'comparison-model', sourceFamily: 'matter-vs-energy-ecosystem',
    repair: remediation([
      [0, 'energy-cycles-like-matter', 'Matter can be reused in ecosystems, while energy is transferred through the system and much eventually leaves as heat.'],
      [2, 'matter-disappears-energy-cycles', 'This reverses the two ideas. Matter cycles among components; energy flows through them.'],
      [3, 'matter-and-energy-do-not-move', 'Food, decomposition, gas exchange, and heat transfer all show movement through ecosystem components.']
    ])
  }),
  cy3: meta({
    sep: 'Developing and Using Models', ccc: 'Systems and System Models', representationType: 'system-model', sourceFamily: 'rabbit-decomposition-cycle',
    repair: remediation([
      [0, 'dead-organism-matter-vanishes', 'Death does not erase matter. Model where the rabbit’s material can move next.'],
      [2, 'matter-returns-as-sunlight', 'Sunlight is energy, not a destination for the rabbit’s matter.'],
      [3, 'dead-matter-only-becomes-rock', 'Decomposers and the surrounding soil, air, water, and organisms provide more immediate matter pathways.']
    ])
  })
};

function item({ id, skill, standard, prompt, choices, answer, explanation, sep, ccc, representationType = 'selected-response', sourceFamily, transferLevel = 'none', stimulus, repair }) {
  return {
    id,
    unit: 'ecosystems',
    skill,
    standard,
    prompt,
    choices,
    answer,
    explanation,
    sep,
    ccc,
    representationType,
    sourceFamily: `ecosystems:${sourceFamily}`,
    transferLevel,
    transfer: transferLevel === 'far',
    ...(stimulus ? { stimulus } : {}),
    ...(repair ? { remediation: repair } : {})
  };
}

export const M7_LIVING_SYSTEMS_ITEMS = [
  item({
    id: 'fe4', skill: 'food-energy', standard: '5-PS3-1',
    prompt: 'A student eats oatmeal made from oats. Which model best traces the original source of the food energy available to the student?',
    choices: ['Sun → oat plant → oatmeal → student', 'Soil → Sun → oatmeal → student', 'Student → oat plant → Sun', 'Water → oatmeal → Sun'], answer: 0,
    explanation: 'The oat plant captured light energy from the Sun and stored some of that energy in food molecules that later became oatmeal.',
    sep: 'Developing and Using Models', ccc: 'Energy and Matter', representationType: 'sequence-model', sourceFamily: 'oatmeal-breakfast',
    repair: remediation([
      [1, 'soil-precedes-sun-energy', 'Soil supplies materials and minerals, but the original energy stored by the oat plant came from sunlight.'],
      [2, 'consumer-before-producer', 'Trace energy from its source into the producer, then into the food and consumer.'],
      [3, 'water-originates-food-energy', 'Water is a plant material input, not the original energy source stored in the oats.']
    ])
  }),
  item({
    id: 'fe5', skill: 'food-energy', standard: '5-PS3-1',
    prompt: 'In a pond, algae are eaten by small fish, and small fish are eaten by a heron. Where did the heron’s food energy originally enter this food chain?',
    choices: ['As sunlight captured by algae', 'As mud eaten by the fish', 'Inside the heron before it ate', 'As water changing into energy'], answer: 0,
    explanation: 'Algae are producers that capture light energy. That stored energy can then be transferred through consumers.',
    sep: 'Developing and Using Models', ccc: 'Energy and Matter', representationType: 'food-web-transfer', sourceFamily: 'algae-fish-heron', transferLevel: 'near',
    repair: remediation([
      [1, 'mud-originates-food-energy', 'Mud can contain matter, but the model asks where the food-chain energy entered. Identify the producer’s energy source.'],
      [2, 'consumer-creates-food-energy', 'The heron receives stored energy by eating; it does not originate the energy in the chain.'],
      [3, 'water-turns-into-energy', 'Water is matter. Trace energy separately from matter in the pond system.']
    ])
  }),
  item({
    id: 'fe6', skill: 'food-energy', standard: '5-PS3-1',
    prompt: 'Which conclusion is best supported by this model of a chicken’s food energy?',
    choices: ['The energy in the chicken’s food can be traced back to sunlight captured by corn plants', 'Corn creates energy from nothing', 'The chicken gets its original food energy from soil', 'Sunlight is matter that becomes chicken tissue'], answer: 0,
    explanation: 'Corn plants capture light energy and store it in food molecules. The chicken receives some of that stored energy by eating corn.',
    sep: 'Developing and Using Models', ccc: 'Energy and Matter', representationType: 'flow-model', sourceFamily: 'corn-chicken',
    stimulus: flow('Energy pathway', ['Sunlight', 'corn plant', 'corn kernels', 'chicken']),
    repair: remediation([
      [1, 'producer-creates-energy-from-nothing', 'The producer captures energy from an external source; it does not create energy from nothing.'],
      [2, 'soil-is-original-food-energy', 'Soil supplies matter and minerals to the plant. The model identifies a different original energy source.'],
      [3, 'light-is-matter', 'Light supplies energy, not the material atoms that make up chicken tissue.']
    ])
  }),
  item({
    id: 'fe7', skill: 'food-energy', standard: '5-PS3-1',
    prompt: 'A fox eats a rabbit that ate clover. Which statement correctly separates matter from energy in this pathway?',
    choices: ['Matter and stored food energy are transferred from clover to rabbit to fox, while the original food energy entered when clover captured sunlight', 'Only matter moves; food contains no energy', 'Only energy moves; the organisms transfer no matter when eaten', 'The fox sends both matter and energy back into the Sun'], answer: 0,
    explanation: 'Eating transfers both matter and stored chemical energy. The food energy in this chain ultimately traces back to sunlight captured by the producer.',
    sep: 'Constructing Explanations and Designing Solutions', ccc: 'Energy and Matter', representationType: 'matter-energy-comparison', sourceFamily: 'clover-rabbit-fox', transferLevel: 'near',
    repair: remediation([
      [1, 'food-has-no-energy', 'Food supplies stored chemical energy as well as matter. Track both quantities separately.'],
      [2, 'eating-transfers-no-matter', 'When one organism eats another, physical matter is transferred along with stored energy.'],
      [3, 'food-path-reverses-to-sun', 'The Sun is the earlier energy source, not the destination of the fox’s food matter and energy.']
    ])
  }),
  item({
    id: 'fe8', skill: 'food-energy', standard: '5-PS3-1',
    prompt: 'A whale eats krill that ate microscopic ocean producers called phytoplankton. The whale never eats a land plant. Which explanation best transfers the food-energy model to this unfamiliar chain?',
    choices: ['The whale’s food energy can still trace back to sunlight captured by phytoplankton', 'Ocean food chains do not depend on light energy', 'Krill create the whale’s energy from seawater', 'The whale’s energy begins only when it swims'], answer: 0,
    explanation: 'Phytoplankton are producers. Even in a marine food chain, they capture sunlight and store energy that can be transferred through consumers.',
    sep: 'Developing and Using Models', ccc: 'Energy and Matter', representationType: 'far-transfer-model', sourceFamily: 'phytoplankton-krill-whale', transferLevel: 'far',
    repair: remediation([
      [1, 'marine-food-energy-excludes-sun', 'The producer is different from a land plant, but it can still capture sunlight. Transfer the producer-consumer energy model.'],
      [2, 'consumer-creates-energy-from-water', 'Seawater supplies matter, not newly created food energy. Trace the chain back to its producer.'],
      [3, 'movement-originates-food-energy', 'Swimming uses stored energy; it does not create the original energy in the whale’s food.']
    ])
  }),

  item({
    id: 'pg4', skill: 'plant-growth', standard: '5-LS1-1',
    prompt: 'Two identical seedlings grow for several weeks. One receives water and normal air; the other receives almost no water. The watered plant gains much more mass. What claim is supported?',
    choices: ['Water is one important material source for plant growth', 'Plants make all new matter from light alone', 'Soil is the only material a plant needs', 'A plant can gain mass without matter entering it'], answer: 0,
    explanation: 'Water provides matter that plants use during growth. Plant material is built chiefly from water and carbon dioxide from air.',
    sep: 'Engaging in Argument from Evidence', ccc: 'Cause and Effect', representationType: 'controlled-investigation', sourceFamily: 'seedling-water-comparison',
    repair: remediation([
      [1, 'light-alone-builds-plant-matter', 'Light supplies energy. The experiment changes a material input: water.'],
      [2, 'soil-only-material-source', 'Both plants can have the same soil while differing in growth because water is also a major material input.'],
      [3, 'growth-without-matter-entry', 'An increase in plant mass means matter was added to the plant system.']
    ])
  }),
  item({
    id: 'pg5', skill: 'plant-growth', standard: '5-LS1-1',
    prompt: 'A class grows bean plants in pots. Total plant mass increases by 480 g while dry soil mass decreases by only 18 g. Which argument best uses the evidence?',
    choices: ['Most of the new plant material must come from sources other than the lost soil mass, chiefly air and water', 'The 18 g of lost soil created all 480 g of plant matter', 'Sunlight turned directly into 480 g of matter', 'The measurements prove plants do not need soil minerals'], answer: 0,
    explanation: 'The large plant-mass gain compared with the small soil-mass change argues against soil as the chief source of new plant material.',
    sep: 'Engaging in Argument from Evidence', ccc: 'Scale, Proportion, and Quantity', representationType: 'quantitative-evidence', sourceFamily: 'bean-plant-mass-balance', transferLevel: 'near',
    stimulus: table('Class growth study', ['Measurement', 'Change'], [['Plant mass', '+480 g'], ['Dry soil mass', '-18 g']]),
    repair: remediation([
      [1, 'small-soil-loss-explains-large-growth', 'Compare the magnitudes. Eighteen grams of lost soil cannot account for a 480-gram increase by itself.'],
      [2, 'sunlight-converts-to-mass', 'Light provides energy, not the material atoms measured as plant mass.'],
      [3, 'evidence-proves-minerals-unneeded', 'The evidence addresses the chief source of plant mass, not whether small amounts of minerals are needed.']
    ])
  }),
  item({
    id: 'pg6', skill: 'plant-growth', standard: '5-LS1-1',
    prompt: 'A student summarizes a plant-growth experiment with this graph. Which conclusion is most defensible?',
    choices: ['Large plant growth with little soil-mass change is evidence that soil is not the chief source of new plant material', 'The plant gained mass because the scale added matter', 'All plant matter must have come from the small soil change', 'The graph shows that air and water contain no matter'], answer: 0,
    explanation: 'The contrast between large plant-mass gain and very small soil-mass loss supports the argument that most new plant material comes chiefly from air and water.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Scale, Proportion, and Quantity', representationType: 'bar-graph', sourceFamily: 'plant-soil-change-graph',
    stimulus: { graph: { type: 'bar', label: 'Magnitude of mass change during plant growth', ariaLabel: 'Bar graph showing plant mass increased 300 grams while dry soil mass decreased 12 grams', xLabels: ['Plant mass gained', 'Soil mass lost'], values: [300, 12], yLabel: 'Mass change (g)', yMin: 0, yMax: 300, yTicks: [0, 75, 150, 225, 300] } },
    repair: remediation([
      [1, 'measurement-creates-growth', 'A graph records measurements; it does not supply matter to the plant.'],
      [2, 'small-soil-loss-is-chief-source', 'Compare the bar heights. The soil change is far too small to be the chief measured source of the plant’s added mass.'],
      [3, 'air-water-have-no-matter', 'Air contains gases such as carbon dioxide, and water is matter. The graph does not support this claim.']
    ])
  }),
  item({
    id: 'pg7', skill: 'plant-growth', standard: '5-LS1-1',
    prompt: 'Which system model best represents the main material inputs used to build new plant tissue?',
    choices: ['Carbon dioxide from air + water → plant material', 'Sunlight + empty space → plant material', 'Soil only → all plant material', 'Plant material → carbon dioxide + water only, with no inputs'], answer: 0,
    explanation: 'At this grade level, the key material claim is that plants get the materials they need for growth chiefly from air and water; light provides energy.',
    sep: 'Developing and Using Models', ccc: 'Systems and System Models', representationType: 'system-input-model', sourceFamily: 'plant-material-input-boundary', transferLevel: 'near',
    repair: remediation([
      [1, 'energy-treated-as-material-input', 'Sunlight crosses the system boundary as energy, not as the material atoms that become plant tissue.'],
      [2, 'soil-only-growth-model', 'Soil contributes minerals, but it is not the chief source of the plant’s new material mass.'],
      [3, 'growth-model-has-only-outputs', 'A growing plant gains matter. A valid model needs material inputs crossing into the plant system.']
    ])
  }),
  item({
    id: 'pg8', skill: 'plant-growth', standard: '5-LS1-1',
    prompt: 'Lettuce grows successfully in a hydroponic setup with its roots in nutrient water and no soil. Which conclusion best transfers the plant-growth evidence to this new situation?',
    choices: ['Soil is not the chief source of plant material; water and carbon dioxide from air can supply most of the matter used for growth', 'Plants need no matter because the lettuce has no soil', 'All lettuce mass must be made directly from light', 'Carbon dioxide cannot contribute to plant material because it is a gas'], answer: 0,
    explanation: 'Hydroponic growth is strong transfer evidence that soil is not the chief source of plant mass. Plants still use water, carbon dioxide, and small amounts of dissolved minerals.',
    sep: 'Engaging in Argument from Evidence', ccc: 'Energy and Matter', representationType: 'far-transfer-argument', sourceFamily: 'hydroponic-lettuce', transferLevel: 'far',
    repair: remediation([
      [1, 'no-soil-means-no-matter-input', 'The roots are in water and the leaves exchange gases with air. Matter still enters the plant system.'],
      [2, 'light-becomes-plant-mass', 'Light is an energy input, not the material source of the lettuce’s atoms.'],
      [3, 'gas-cannot-be-material', 'Gases are matter. Carbon dioxide from air contains atoms plants can incorporate into new materials.']
    ])
  }),

  item({
    id: 'cy4', skill: 'matter-cycle', standard: '5-LS2-1',
    prompt: 'Leaves are added to a compost pile and later become dark compost. Which model best tracks the leaf matter?',
    choices: ['Leaf matter is rearranged and transferred among decomposers, air, water, and compost material', 'The leaf matter is destroyed when decomposition begins', 'All leaf matter becomes energy and stops being matter', 'The leaves leave Earth when they rot'], answer: 0,
    explanation: 'Decomposition transfers and rearranges matter. Atoms from the leaves can move into decomposers, gases, water, and remaining organic material.',
    sep: 'Developing and Using Models', ccc: 'Energy and Matter', representationType: 'decomposition-model', sourceFamily: 'compost-leaf-cycle',
    repair: remediation([
      [1, 'rotting-destroys-matter', 'Decomposition changes substances and transfers matter; it does not erase the atoms.'],
      [2, 'matter-converts-entirely-to-energy', 'Energy changes are involved, but the leaf atoms remain matter as they move through the system.'],
      [3, 'decomposition-removes-matter-from-earth', 'Track matter among ecosystem components rather than sending it out of Earth’s system.']
    ])
  }),
  item({
    id: 'cy5', skill: 'matter-cycle', standard: '5-LS2-1',
    prompt: 'In an aquarium, fish waste is broken down, plants use dissolved materials, and fish eat some plant material. What pattern is represented?',
    choices: ['Matter can move repeatedly among organisms and the nonliving environment', 'Matter moves only from plants to fish and then disappears', 'Energy and matter both cycle forever in exactly the same way', 'The aquarium creates new atoms whenever fish eat'], answer: 0,
    explanation: 'The aquarium is a system model in which matter is transferred among organisms, water, waste, and decomposers and can be reused.',
    sep: 'Developing and Using Models', ccc: 'Systems and System Models', representationType: 'system-cycle', sourceFamily: 'aquarium-matter-cycle', transferLevel: 'near',
    repair: remediation([
      [1, 'matter-path-ends-at-consumer', 'Fish waste and decomposition create additional pathways. Matter does not disappear after consumption.'],
      [2, 'energy-cycles-identically-to-matter', 'Matter can be reused; energy is transferred through the system and eventually leaves as heat.'],
      [3, 'eating-creates-new-atoms', 'Eating transfers existing matter. It does not create new atoms.']
    ])
  }),
  item({
    id: 'cy6', skill: 'matter-cycle', standard: '5-LS2-1',
    prompt: 'Which conclusion is best supported by the model?',
    choices: ['Matter from a plant can pass through an animal, decomposers, and the environment and later become available to plants again', 'Matter stops moving after an animal dies', 'Decomposers turn all matter into sunlight', 'Only living organisms are part of matter cycles'], answer: 0,
    explanation: 'Matter cycles connect living organisms with nonliving parts of the environment such as soil, water, and air.',
    sep: 'Developing and Using Models', ccc: 'Systems and System Models', representationType: 'flow-model', sourceFamily: 'plant-deer-decomposer-environment',
    stimulus: flow('Matter pathway', ['plant', 'deer', 'decomposer', 'soil + air + water', 'plant']),
    repair: remediation([
      [1, 'death-ends-matter-movement', 'Death creates new matter pathways through decomposers and the environment.'],
      [2, 'decomposers-create-sunlight', 'Decomposers transfer matter; they do not convert atoms into sunlight.'],
      [3, 'nonliving-environment-excluded', 'The model explicitly includes soil, air, and water as parts of the matter cycle.']
    ])
  }),
  item({
    id: 'cy7', skill: 'matter-cycle', standard: '5-LS2-1',
    prompt: 'A mushroom grows on a rotting log. Which explanation best fits an ecosystem matter model?',
    choices: ['Matter from the log can be transferred into decomposers such as the mushroom and later into the surrounding environment', 'The mushroom creates its atoms from nothing', 'The log’s matter becomes only heat', 'Decomposition prevents matter from returning to soil or air'], answer: 0,
    explanation: 'Decomposers obtain and transform matter from dead material, helping return matter to other ecosystem components.',
    sep: 'Constructing Explanations and Designing Solutions', ccc: 'Energy and Matter', representationType: 'transfer-explanation', sourceFamily: 'mushroom-rotting-log', transferLevel: 'near',
    repair: remediation([
      [1, 'decomposer-creates-atoms', 'Growth requires matter inputs. The mushroom obtains matter from its surroundings and food source.'],
      [2, 'dead-matter-becomes-only-heat', 'Energy can leave as heat, but the log’s atoms remain matter and are transferred.'],
      [3, 'decomposition-blocks-cycling', 'Decomposition is one of the processes that returns matter to the environment.']
    ])
  }),
  item({
    id: 'cy8', skill: 'matter-cycle', standard: '5-LS2-1',
    prompt: 'In a coastal marsh, dead cordgrass is eaten by tiny detritivores, which are eaten by shrimp; decomposers also break down the dead material, returning matter to water and sediment. Which model principle transfers from a forest food web?',
    choices: ['Matter moves among producers, consumers, decomposers, and the nonliving environment even when the organisms and habitat are different', 'Matter cycles occur only on land', 'Dead plant matter disappears before consumers can use it', 'Water prevents matter from being reused'], answer: 0,
    explanation: 'The same ecosystem matter-cycling principle applies in a marsh: matter is transferred among organisms and nonliving reservoirs and can be reused.',
    sep: 'Developing and Using Models', ccc: 'Systems and System Models', representationType: 'far-transfer-system-model', sourceFamily: 'coastal-marsh-detrital-web', transferLevel: 'far',
    repair: remediation([
      [1, 'matter-cycles-only-on-land', 'The components differ, but marine and marsh ecosystems still contain producers, consumers, decomposers, water, and sediment reservoirs.'],
      [2, 'dead-matter-disappears', 'The prompt explicitly traces dead cordgrass into detritivores and decomposers. Track that matter rather than erasing it.'],
      [3, 'water-prevents-reuse', 'Water can be a reservoir and pathway for matter; it does not stop cycling.']
    ])
  })
];
