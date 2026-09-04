const META = {
  pm1: ['Developing and Using Models', 'Energy and Matter', 'selected-response', 'dissolving-sugar', 'none'],
  pm2: ['Analyzing and Interpreting Data', 'Scale, Proportion, and Quantity', 'evidence-choice', 'balloon-air-mass', 'none'],
  pm3: ['Developing and Using Models', 'Cause and Effect', 'particle-model', 'compressed-syringe', 'none'],
  mc1: ['Using Mathematics and Computational Thinking', 'Energy and Matter', 'quantitative-choice', 'sealed-ice-melt', 'none'],
  mc2: ['Constructing Explanations and Designing Solutions', 'Energy and Matter', 'system-evidence', 'open-reaction-gas', 'none'],
  mc3: ['Analyzing and Interpreting Data', 'Energy and Matter', 'bar-graph', 'sealed-reaction-mass', 'none'],
  mp1: ['Planning and Carrying Out Investigations', 'Patterns', 'multi-select', 'metal-vs-plastic', 'none'],
  mp2: ['Analyzing and Interpreting Data', 'Patterns', 'data-table', 'unknown-powder', 'none'],
  mp3: ['Constructing Explanations and Designing Solutions', 'Patterns', 'selected-response', 'multiple-properties', 'none'],
  ns1: ['Engaging in Argument from Evidence', 'Cause and Effect', 'multi-select', 'reaction-evidence', 'none'],
  ns2: ['Constructing Explanations and Designing Solutions', 'Cause and Effect', 'selected-response', 'recover-dissolved-salt', 'none'],
  ns3: ['Analyzing and Interpreting Data', 'Cause and Effect', 'experimental-evidence', 'new-solid-formation', 'none']
};

export const M6_MATTER_METADATA = Object.fromEntries(Object.entries(META).map(([id, [sep, ccc, representationType, sourceFamily, transferLevel]]) => [id, {
  sep,
  ccc,
  representationType,
  sourceFamily: `matter:${sourceFamily}`,
  transferLevel,
  transfer: transferLevel !== 'none'
}]));

const remediation = entries => Object.fromEntries(entries.map(([index, tag, hint]) => [index, { tag, hint }]));
const table = (label, headers, rows) => ({ label, table: { headers, rows } });

function item({ id, skill, standard, prompt, choices, answer, explanation, sep, ccc, representationType = 'selected-response', sourceFamily, transferLevel = 'none', stimulus, type, responseType, graphBuild, remediation: repair }) {
  return {
    id,
    unit: 'matter',
    skill,
    standard,
    prompt,
    choices,
    answer,
    explanation,
    sep,
    ccc,
    representationType,
    sourceFamily: `matter:${sourceFamily}`,
    transferLevel,
    transfer: transferLevel !== 'none',
    ...(stimulus ? { stimulus } : {}),
    ...(type ? { type } : {}),
    ...(responseType ? { responseType } : {}),
    ...(graphBuild ? { graphBuild } : {}),
    ...(repair ? { remediation: repair } : {})
  };
}

export const M6_MATTER_ITEMS = [
  item({
    id: 'pm4', skill: 'particle-models', standard: '5-PS1-1',
    prompt: 'A drop of blue food coloring is placed in still water. After several minutes, the color is spread throughout the cup. Which particle explanation best fits the observation?',
    choices: ['Color particles were destroyed and replaced by blue water', 'Color particles moved among water particles and spread through the cup', 'Water particles turned into color particles', 'The color left the cup and returned in a new form'], answer: 1,
    explanation: 'The coloring remains matter. Its tiny particles spread among the water particles even without being individually visible.',
    sep: 'Developing and Using Models', ccc: 'Patterns', representationType: 'selected-response', sourceFamily: 'food-coloring-diffusion',
    remediation: remediation([
      [0, 'spread-means-destroyed', 'The blue color is still present throughout the cup. Choose a model that keeps the coloring matter in the system.'],
      [2, 'water-turns-into-solute', 'The water did not need to become coloring. Track the two kinds of matter separately.'],
      [3, 'particles-leave-and-return', 'Nothing in the observation shows matter leaving the cup. Explain the spreading inside the cup.']
    ])
  }),
  item({
    id: 'pm5', skill: 'particle-models', standard: '5-PS1-1',
    prompt: 'Someone peels an orange on one side of a room. A few moments later, a student across the room can smell it. What does this best support?',
    choices: ['Tiny odor particles can move through the air even though they cannot be seen', 'Smell travels without any matter', 'The orange instantly becomes air', 'Only visible particles can move through a room'], answer: 0,
    explanation: 'Odor molecules are matter. They can spread through air as particles too small to see.',
    sep: 'Constructing Explanations and Designing Solutions', ccc: 'Scale, Proportion, and Quantity', sourceFamily: 'orange-odor-air', transferLevel: 'near',
    remediation: remediation([
      [1, 'smell-is-not-matter', 'The odor came from the orange. Which explanation allows matter from the orange to reach the other side of the room?'],
      [2, 'substance-becomes-air', 'The orange does not turn into the room air. Think about tiny particles from the orange mixing with air.'],
      [3, 'invisible-means-immobile', 'Particles can be too small to see and still move. Use the fact that the smell reaches a distant student.']
    ])
  }),
  item({
    id: 'pm6', skill: 'particle-models', standard: '5-PS1-1',
    prompt: 'Salt is stirred into water until no crystals are visible. Which evidence most strongly supports the idea that the salt particles are still present?',
    choices: ['The saltwater has nearly the combined mass of the original water and salt', 'The cup is transparent', 'The spoon is wet', 'The water level looks smooth'], answer: 0,
    explanation: 'The measured mass remains consistent with the salt matter still being present after its particles spread through the water.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Energy and Matter', representationType: 'data-table', sourceFamily: 'saltwater-mass-evidence',
    stimulus: table('Mass measurements', ['System', 'Mass'], [['Water before', '200 g'], ['Salt before', '10 g'], ['Saltwater after mixing', '210 g']]),
    remediation: remediation([
      [1, 'appearance-is-conservation-evidence', 'Transparency does not measure whether the salt matter remains. Look for a before-and-after measurement.'],
      [2, 'wet-spoon-is-particle-evidence', 'A wet spoon does not track the missing-looking salt. Use evidence about the whole mixture.'],
      [3, 'surface-shape-is-particle-evidence', 'A smooth surface does not show where the salt matter went. Use the quantitative evidence.']
    ])
  }),
  item({
    id: 'pm7', skill: 'particle-models', standard: '5-PS1-1',
    prompt: 'A sugar cube is crushed into fine powder. Which model best describes the sugar before and after crushing?',
    choices: ['The powder is no longer made of matter', 'The same kind of sugar particles are present, arranged in smaller visible pieces', 'Each sugar particle is crushed out of existence', 'The sugar particles change into air particles'], answer: 1,
    explanation: 'Crushing changes the size of the visible pieces, not the identity or existence of the tiny particles that make up the sugar.',
    sep: 'Developing and Using Models', ccc: 'Scale, Proportion, and Quantity', sourceFamily: 'crushed-sugar-solid', transferLevel: 'near',
    remediation: remediation([
      [0, 'powder-is-not-matter', 'Powder still has mass and takes up space. Choose a model that keeps the sugar matter present.'],
      [2, 'crushing-destroys-particles', 'Crushing changes visible pieces. The particle model should not make the matter disappear.'],
      [3, 'crushing-turns-solid-to-gas', 'Nothing indicates a gas formed. Track the same substance before and after crushing.']
    ])
  }),
  item({
    id: 'pm8', skill: 'particle-models', standard: '5-PS1-1',
    prompt: 'A sealed clear container has a small amount of liquid water at the bottom. Later, droplets appear on the inside of the lid. Which particle model best explains the droplets?',
    choices: ['Some water particles moved through the gas space and later joined into liquid droplets', 'New water matter appeared from empty space', 'The lid changed into water', 'Water particles stopped existing at the bottom and unrelated droplets formed'], answer: 0,
    explanation: 'Water can exist as particles in the gas phase and later condense. The sealed-system context requires tracking the same matter through a change of state.',
    sep: 'Developing and Using Models', ccc: 'Energy and Matter', sourceFamily: 'sealed-water-condensation', transferLevel: 'far',
    remediation: remediation([
      [1, 'matter-created-from-empty-space', 'The container is sealed. Choose a model that accounts for the droplets using matter already inside.'],
      [2, 'container-becomes-substance', 'The lid remains the lid. Track the water particles through the system instead.'],
      [3, 'phase-change-replaces-matter', 'A change of state does not require old particles to vanish and new matter to appear. Track the same water.']
    ])
  }),

  item({
    id: 'mc4', skill: 'matter-conservation', standard: '5-PS1-2',
    prompt: 'A sealed bottle contains 240 g of water and 10 g of salt. The salt dissolves completely without opening the bottle. What total mass should the sealed bottle contents have afterward?',
    choices: ['10 g', '230 g', '250 g', 'More than 250 g because dissolving creates matter'], answer: 2,
    explanation: 'Dissolving rearranges and spreads matter. In a closed system, the total mass of the materials remains 250 g.',
    sep: 'Using Mathematics and Computational Thinking', ccc: 'Energy and Matter', representationType: 'quantitative-choice', sourceFamily: 'sealed-salt-dissolving',
    remediation: remediation([
      [0, 'counts-only-solute-mass', 'The system contains both water and salt. Track all of the matter in the sealed bottle.'],
      [1, 'dissolving-removes-mass', 'Dissolving does not subtract salt matter. Add the starting masses in the closed system.'],
      [3, 'dissolving-creates-matter', 'No matter entered the sealed bottle. Dissolving changes distribution, not total amount.']
    ])
  }),
  item({
    id: 'mc5', skill: 'matter-conservation', standard: '5-PS1-2',
    prompt: 'An opened bottle of sparkling water has a mass of 532 g. After it sits open and stops fizzing, its mass is 529 g. Which explanation is strongest?',
    choices: ['Matter was destroyed by the bubbles', 'Gas particles left the open bottle, so the measured system lost mass', 'The bottle stopped being matter', 'Fizzing changed 3 g of matter into nothing'], answer: 1,
    explanation: 'In an open system, carbon dioxide gas can leave. Conservation is not violated; some matter is simply no longer inside the measured system.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Energy and Matter', representationType: 'before-after-data', sourceFamily: 'sparkling-water-open-system', transferLevel: 'near',
    remediation: remediation([
      [0, 'bubbles-destroy-matter', 'Bubbles are gas, and gas is matter. Ask where the gas can go when the bottle is open.'],
      [2, 'container-stops-being-matter', 'The bottle remains matter. Focus on the material that visibly leaves as fizzing gas.'],
      [3, 'mass-loss-means-annihilation', 'A lower open-system measurement does not mean matter vanished. Identify what crossed the system boundary.']
    ])
  }),
  item({
    id: 'mc6', skill: 'matter-conservation', standard: '5-PS1-2',
    prompt: 'A 75 g ball of modeling clay is flattened into a wide disk without adding or removing clay. What mass should the disk have?',
    choices: ['About 75 g', 'About 38 g because it is flatter', 'About 150 g because it is wider', '0 g because its shape changed'], answer: 0,
    explanation: 'Changing shape does not create or destroy matter. With no clay added or removed, mass stays the same.',
    sep: 'Constructing Explanations and Designing Solutions', ccc: 'Scale, Proportion, and Quantity', sourceFamily: 'clay-shape-change',
    remediation: remediation([
      [1, 'flattening-halves-mass', 'Shape and mass are different properties. No clay was removed when the ball was flattened.'],
      [2, 'larger-area-means-more-mass', 'A wider shape does not mean more matter was added. Track the amount of clay.'],
      [3, 'shape-change-destroys-matter', 'The clay is still present after reshaping. A physical shape change does not erase its mass.']
    ])
  }),
  item({
    id: 'mc7', skill: 'matter-conservation', standard: '5-PS1-2',
    prompt: 'A wet towel has less mass after drying on a clothesline. Which system explanation best preserves conservation of matter?',
    choices: ['Some liquid water became water vapor and moved into the surrounding air', 'The missing water matter was destroyed by sunlight', 'Dry cloth cannot have mass', 'The scale removes water from the towel'], answer: 0,
    explanation: 'Drying is an open-system process. Water particles leave the towel and enter the air as water vapor.',
    sep: 'Constructing Explanations and Designing Solutions', ccc: 'Systems and System Models', sourceFamily: 'drying-towel-open-system', transferLevel: 'near',
    remediation: remediation([
      [1, 'evaporation-destroys-matter', 'Sunlight can help evaporation, but it does not destroy water matter. Track where the water goes.'],
      [2, 'dry-material-has-no-mass', 'The cloth remains matter after drying. The question is why the wet system loses mass.'],
      [3, 'measurement-removes-matter', 'A scale measures mass; it does not remove the water. Follow the water across the system boundary.']
    ])
  }),
  item({
    id: 'mc8', skill: 'matter-conservation', standard: '5-PS1-2',
    prompt: 'Plot the total mass measured at each stage of this sealed-system investigation.',
    explanation: 'The graph should stay level at 104 g because no matter enters or leaves the sealed system while the materials change and mix.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Energy and Matter', representationType: 'graph-construction', sourceFamily: 'sealed-system-mass-series', transferLevel: 'far',
    responseType: 'graph-build', choices: undefined, answer: undefined,
    stimulus: table('Sealed-system measurements', ['Stage', 'Total mass'], [['Before mixing', '104 g'], ['Just after mixing', '104 g'], ['After 2 minutes', '104 g'], ['After 5 minutes', '104 g']]),
    graphBuild: {
      xName: 'stage', xLabels: ['Before', 'Mixed', '2 min', '5 min'],
      yLabel: 'Total mass (g)', yMin: 100, yMax: 106, yTicks: [100, 102, 104, 106],
      allowedValues: [100, 102, 104, 106], expected: [104, 104, 104, 104], unit: 'g',
      graphLabel: 'Total mass during a sealed-system investigation',
      ariaLabel: 'Learner-built line graph with total mass of 104 grams at all four stages'
    }
  }),

  item({
    id: 'mp4', skill: 'material-properties', standard: '5-PS1-3',
    prompt: 'Three black objects look similar. Which test would give the best new evidence for distinguishing a steel object from a black plastic object?',
    choices: ['Test whether a magnet attracts it', 'Record which shelf it was on', 'Measure the time of day', 'Ask whether both objects look black'], answer: 0,
    explanation: 'Magnetic attraction is a measurable material property that can distinguish many steels from plastic; shelf location, time, and shared color do not.',
    sep: 'Planning and Carrying Out Investigations', ccc: 'Patterns', sourceFamily: 'steel-vs-plastic-magnetism',
    remediation: remediation([
      [1, 'location-is-material-property', 'Moving an object to a different shelf does not change what material it is made from. Choose a repeatable property test.'],
      [2, 'time-is-material-property', 'Time of day is not a property of the sample. Choose a measurement that belongs to the material.'],
      [3, 'shared-color-identifies-material', 'Both samples are already black, so color does not distinguish them. Choose a different measurable property.']
    ])
  }),
  item({
    id: 'mp5', skill: 'material-properties', standard: '5-PS1-3',
    prompt: 'An unknown solid scratches Sample B, is scratched by Sample C, and is not magnetic. Which known sample is the best match?',
    choices: ['Sample A', 'Sample B', 'Sample C', 'None of the samples match the evidence'], answer: 0,
    explanation: 'The unknown has the same pattern as Sample A: medium hardness and no magnetic attraction.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Patterns', representationType: 'data-table', sourceFamily: 'hardness-magnetism-identification',
    stimulus: table('Known samples', ['Sample', 'Relative hardness', 'Magnetic?'], [['A', 'medium', 'No'], ['B', 'soft', 'No'], ['C', 'hard', 'Yes']]),
    remediation: remediation([
      [1, 'uses-one-property-only', 'Sample B matches the nonmagnetic result but is too soft. Use both hardness and magnetism.'],
      [2, 'ignores-magnetism-property', 'Sample C is hard and magnetic. The unknown is specifically not magnetic.'],
      [3, 'rejects-combined-property-match', 'One sample matches both observations. Compare the full pattern rather than one property at a time.']
    ])
  }),
  item({
    id: 'mp6', skill: 'material-properties', standard: '5-PS1-3',
    prompt: 'Two unknown powders are both white. Why is color alone weak evidence that they are the same substance?',
    choices: ['Different substances can share the same color', 'Every white powder is the same substance', 'Color is never observable', 'A substance changes identity whenever its color is measured'], answer: 0,
    explanation: 'A single property can be shared by many substances. Identification is stronger when several characteristic properties agree.',
    sep: 'Engaging in Argument from Evidence', ccc: 'Patterns', sourceFamily: 'shared-color-weak-evidence',
    remediation: remediation([
      [1, 'same-color-means-same-substance', 'Many different materials can look white. Think about why scientists test more than one property.'],
      [2, 'color-is-not-observable', 'Color can be observed; the problem is that it is not unique enough by itself.'],
      [3, 'measurement-changes-identity', 'Observing a property does not automatically change the substance. Focus on evidence strength.']
    ])
  }),
  item({
    id: 'mp7', skill: 'material-properties', standard: '5-PS1-3',
    prompt: 'A student must distinguish steel foil, aluminum foil, and plastic film. Which plan uses properties efficiently?',
    choices: ['Test magnetism first, then electrical conductivity on the nonmagnetic samples', 'Sort only by which sample is shinier', 'Use only the sample names printed on the bags', 'Cut each sample into a different shape and identify it by shape'], answer: 0,
    explanation: 'A magnet can separate steel from the other two, and conductivity can then distinguish conductive aluminum from insulating plastic.',
    sep: 'Planning and Carrying Out Investigations', ccc: 'Patterns', sourceFamily: 'foil-property-test-plan', transferLevel: 'near',
    remediation: remediation([
      [1, 'single-appearance-property-is-enough', 'Shininess can overlap among materials. Choose tests that produce a more diagnostic pattern.'],
      [2, 'label-is-material-evidence', 'A printed label is not measured evidence about the material itself. Plan property tests.'],
      [3, 'shape-identifies-material', 'Shape can be changed without changing the material. Choose characteristic properties instead.']
    ])
  }),
  item({
    id: 'mp8', skill: 'material-properties', standard: '5-PS1-3',
    prompt: 'A recycling sorter has three unknown pieces. Piece X is magnetic and conducts electricity. Piece Y is not magnetic but conducts electricity. Piece Z is not magnetic and does not conduct electricity. Which identification is best supported?',
    choices: ['X steel, Y aluminum, Z plastic', 'X plastic, Y steel, Z aluminum', 'X aluminum, Y plastic, Z steel', 'All three must be the same material'], answer: 0,
    explanation: 'The combined property pattern supports steel for X, aluminum for Y, and plastic for Z. This applies property-based identification in a new engineering context.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Patterns', representationType: 'property-pattern', sourceFamily: 'recycling-sorter-properties', transferLevel: 'far',
    remediation: remediation([
      [1, 'misreads-magnetic-conductive-pattern', 'Plastic is not expected to match both magnetic attraction and electrical conduction. Match each piece to both properties.'],
      [2, 'swaps-property-patterns', 'Aluminum is conductive but not magnetic in this comparison, while plastic is neither. Use the full pattern.'],
      [3, 'different-properties-same-material', 'The three pieces show different property combinations. Use those differences as identification evidence.']
    ])
  }),

  item({
    id: 'ns4', skill: 'new-substances', standard: '5-PS1-4',
    prompt: 'A clean iron nail is left outdoors. Later it has an orange-brown coating with different properties from the original shiny iron. What is the strongest conclusion?',
    choices: ['The evidence supports formation of a new substance', 'Only the nail shape changed', 'The iron was dissolved in water and disappeared', 'Color can never be evidence in a reaction'], answer: 0,
    explanation: 'A new coating with properties different from the starting iron is evidence that a reaction produced a new substance.',
    sep: 'Constructing Explanations and Designing Solutions', ccc: 'Cause and Effect', sourceFamily: 'iron-rusting',
    remediation: remediation([
      [1, 'reaction-is-only-shape-change', 'The observation includes a new coating with different properties, not merely a new shape.'],
      [2, 'rusting-is-dissolving', 'The orange-brown material remains on the nail. Focus on the appearance of a material with new properties.'],
      [3, 'color-never-reaction-evidence', 'Color change alone can be ambiguous, but here it accompanies a new coating with different properties.']
    ])
  }),
  item({
    id: 'ns5', skill: 'new-substances', standard: '5-PS1-4',
    prompt: 'Candle wax melts, is poured into a new mold, and later becomes solid wax again. Which evidence best argues that this alone did not make a new substance?',
    choices: ['The wax can return to a solid with the same characteristic properties', 'The wax changed shape', 'The liquid was warmer', 'The mold had a different color'], answer: 0,
    explanation: 'A reversible change of state that preserves the material’s characteristic properties is not strong evidence that a new substance formed.',
    sep: 'Engaging in Argument from Evidence', ccc: 'Cause and Effect', sourceFamily: 'wax-phase-change', transferLevel: 'near',
    remediation: remediation([
      [1, 'shape-change-means-new-substance', 'A material can change shape without changing its identity. Look for evidence about properties before and after.'],
      [2, 'temperature-change-means-new-substance', 'Being warmer is not enough to show a new substance formed. Look for persistent new properties.'],
      [3, 'container-color-means-reaction', 'The mold color is not evidence about the wax substance. Compare the wax itself.']
    ])
  }),
  item({
    id: 'ns6', skill: 'new-substances', standard: '5-PS1-4',
    prompt: 'Two clear liquids are mixed. Within seconds, a cloudy solid forms and settles to the bottom. Which observation is the strongest evidence that new substances formed?',
    choices: ['A solid with new properties appeared from two liquids', 'The liquids were poured into the same cup', 'The cup was transparent', 'The mixture was observed for one minute'], answer: 0,
    explanation: 'Formation of a new solid from starting liquids is strong evidence of a chemical reaction producing substances with new properties.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Cause and Effect', representationType: 'experimental-observation', sourceFamily: 'precipitate-from-liquids',
    remediation: remediation([
      [1, 'mixing-alone-means-reaction', 'Putting substances together does not by itself prove a reaction. Identify the new observation after mixing.'],
      [2, 'container-feature-is-reaction-evidence', 'Cup transparency is not a change in the substances. Focus on what formed in the mixture.'],
      [3, 'observation-time-means-reaction', 'Waiting one minute is a procedure, not evidence that a new material formed.']
    ])
  }),
  item({
    id: 'ns7', skill: 'new-substances', standard: '5-PS1-4',
    prompt: 'A tablet is dropped into water. Bubbles form, and a gas is collected that was not present as a gas before mixing. What claim is best supported?',
    choices: ['The observations support that new substances formed', 'The bubbles prove all matter was destroyed', 'Water always becomes a gas whenever a solid is added', 'The tablet only changed location'], answer: 0,
    explanation: 'Formation of a gas with new observable properties after substances are mixed is evidence that a reaction may have produced new substances.',
    sep: 'Engaging in Argument from Evidence', ccc: 'Cause and Effect', sourceFamily: 'effervescent-tablet-gas', transferLevel: 'near',
    remediation: remediation([
      [1, 'reaction-destroys-matter', 'Gas is matter, so bubbles do not show that matter was destroyed. Ask what new material may have formed.'],
      [2, 'all-bubbles-are-water-vapor', 'A collected gas after mixing is not automatically water vapor. Use the evidence about when the gas appeared.'],
      [3, 'reaction-is-location-change', 'The key observation is a gas forming after mixing, not the tablet’s new location.']
    ])
  }),
  item({
    id: 'ns8', skill: 'new-substances', standard: '5-PS1-4',
    prompt: 'A copper roof slowly develops a green coating that behaves differently from the original copper surface. Which reasoning best transfers the reaction rule to this new context?',
    choices: ['A material with new properties forming on the copper is evidence of new substances', 'Any color seen outdoors proves matter was destroyed', 'The roof must have melted because its appearance changed', 'Weather can only move substances and can never cause reactions'], answer: 0,
    explanation: 'The same evidence rule applies in a slow, real-world context: appearance of material with new properties supports formation of new substances.',
    sep: 'Constructing Explanations and Designing Solutions', ccc: 'Cause and Effect', sourceFamily: 'copper-patina-weathering', transferLevel: 'far',
    remediation: remediation([
      [1, 'color-change-means-destruction', 'A color change does not mean matter disappeared. Focus on the new material and its properties.'],
      [2, 'appearance-change-means-melting', 'A changed surface does not imply melting. Use the evidence about a new coating with different properties.'],
      [3, 'weather-cannot-cause-reaction', 'Environmental exposure can provide conditions or reactants for chemical change. Use the observed new material as evidence.']
    ])
  })
];

export const M6_MATTER_PHENOMENON_METADATA = {
  'sugar-disappears': {
    sep: ['Developing and Using Models', 'Analyzing and Interpreting Data', 'Constructing Explanations and Designing Solutions'],
    ccc: ['Energy and Matter', 'Patterns'],
    representationTypes: ['prediction', 'particle-model', 'bar-graph', 'evidence-reasoning', 'revision'],
    transferLevel: 'investigation',
    steps: {
      notice: { sep: 'Asking Questions and Defining Problems', ccc: 'Patterns', representationType: 'phenomenon-notice', transferLevel: 'none' },
      predict: { sep: 'Developing and Using Models', ccc: 'Energy and Matter', representationType: 'prediction', transferLevel: 'none' },
      'particle-evidence': { sep: 'Developing and Using Models', ccc: 'Scale, Proportion, and Quantity', representationType: 'particle-model', transferLevel: 'none' },
      'mass-evidence': { sep: 'Analyzing and Interpreting Data', ccc: 'Energy and Matter', representationType: 'bar-graph', transferLevel: 'none' },
      revise: { sep: 'Constructing Explanations and Designing Solutions', ccc: 'Energy and Matter', representationType: 'model-revision', transferLevel: 'near' }
    }
  },
  'open-system-mass': {
    sep: ['Analyzing and Interpreting Data', 'Engaging in Argument from Evidence', 'Constructing Explanations and Designing Solutions'],
    ccc: ['Energy and Matter', 'Systems and System Models', 'Cause and Effect'],
    representationTypes: ['prediction', 'bar-graph', 'experimental-observation', 'CER'],
    transferLevel: 'investigation',
    steps: {
      notice: { sep: 'Asking Questions and Defining Problems', ccc: 'Systems and System Models', representationType: 'phenomenon-notice', transferLevel: 'none' },
      predict: { sep: 'Constructing Explanations and Designing Solutions', ccc: 'Energy and Matter', representationType: 'prediction', transferLevel: 'none' },
      'mass-pattern': { sep: 'Analyzing and Interpreting Data', ccc: 'Systems and System Models', representationType: 'bar-graph', transferLevel: 'none' },
      'gas-evidence': { sep: 'Engaging in Argument from Evidence', ccc: 'Cause and Effect', representationType: 'experimental-observation', transferLevel: 'none' },
      cer: { sep: 'Constructing Explanations and Designing Solutions', ccc: 'Energy and Matter', representationType: 'CER', transferLevel: 'near' }
    }
  }
};
