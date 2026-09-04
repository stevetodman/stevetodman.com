const remediation = entries => Object.fromEntries(entries.map(([index, tag, hint]) => [index, { tag, hint }]));
const table = (label, headers, rows) => ({ label, table: { headers, rows } });
const flow = (label, steps) => ({ label, flow: steps });

const meta = ({ sep, ccc, representationType = 'selected-response', sourceFamily, transferLevel = 'none', repair, ...extra }) => ({
  sep,
  ccc,
  representationType,
  sourceFamily: `earth-systems:${sourceFamily}`,
  transferLevel,
  transfer: transferLevel === 'far',
  ...(repair ? { remediation: repair } : {}),
  ...extra
});

export const M7_EARTH_SYSTEMS_OVERRIDES = {
  ei1: meta({
    sep: 'Developing and Using Models', ccc: 'Systems and System Models', representationType: 'causal-system-model', sourceFamily: 'rain-hillside-stream',
    repair: remediation([
      [1, 'living-system-only', 'The observation includes rainwater and soil even if no organism is named. Identify the water, air, and land components.'],
      [2, 'atmosphere-only', 'Rain begins in the atmosphere, but the prompt also describes flowing water and moved soil.'],
      [3, 'space-objects-as-earth-systems', 'The event occurs among parts of Earth. Use atmosphere, hydrosphere, geosphere, and biosphere as the system categories.']
    ])
  }),
  ei2: meta({
    sep: 'Developing and Using Models', ccc: 'Systems and System Models', representationType: 'multi-select-system-model', sourceFamily: 'riverbank-roots',
    repair: remediation([
      [2, 'stars-drive-root-soil-interaction', 'The described interactions occur at the riverbank. A distant star is not removing the soil in this model.'],
      [3, 'moon-directly-supplies-river-water', 'The Moon can influence tides, but it is not the material source of river water in this example.']
    ])
  }),
  ei3: meta({
    sep: 'Constructing Explanations and Designing Solutions', ccc: 'Cause and Effect', representationType: 'cause-effect-explanation', sourceFamily: 'volcanic-eruption',
    repair: remediation([
      [1, 'event-affects-one-object-only', 'Ash and lava move beyond the volcanic opening. Track where that material goes.'],
      [2, 'hydrosphere-leaves-earth', 'Water may heat or carry ash, but it does not turn into outer space.'],
      [3, 'earth-systems-never-interact', 'The same event moves matter among land, air, water, and living things. Use those connections.']
    ])
  }),
  wd1: meta({
    sep: 'Analyzing and Interpreting Data', ccc: 'Scale, Proportion, and Quantity', representationType: 'proportion-reasoning', sourceFamily: 'saltwater-share',
    repair: remediation([
      [1, 'freshwater-is-unlimited', 'If about 97 of every 100 parts are salt water, the freshwater share is small rather than unlimited.'],
      [2, 'oceans-contain-no-water', 'The 97% figure refers chiefly to ocean salt water.'],
      [3, 'all-water-is-groundwater', 'Groundwater is one freshwater reservoir; it does not contain all of Earth’s water.']
    ])
  }),
  wd2: meta({
    sep: 'Analyzing and Interpreting Data', ccc: 'Scale, Proportion, and Quantity', representationType: 'reservoir-comparison', sourceFamily: 'largest-water-reservoir',
    repair: remediation([
      [0, 'rivers-hold-most-water', 'Rivers are important locally but contain only a tiny fraction of Earth’s total water.'],
      [1, 'lakes-hold-most-water', 'Lakes hold more accessible freshwater than rivers, but far less total water than oceans.'],
      [3, 'clouds-hold-most-water', 'Atmospheric water is visible and important to weather, but its stored amount is very small compared with oceans.']
    ])
  }),
  wd3: meta({
    sep: 'Analyzing and Interpreting Data', ccc: 'Scale, Proportion, and Quantity', representationType: 'data-table', sourceFamily: 'whole-earth-water-table',
    repair: remediation([
      [1, 'rivers-hold-half-earth-water', 'The table places rivers within the category that totals much less than 1%, not near half.'],
      [2, 'saltwater-is-rare', 'The ocean row is about 97%, so salt water is the dominant category.'],
      [3, 'all-freshwater-accessible', 'Much freshwater is frozen or underground. The table does not show that all of it is easy to reach.']
    ])
  }),
  rp1: meta({
    sep: 'Constructing Explanations and Designing Solutions', ccc: 'Cause and Effect', representationType: 'solution-selection', sourceFamily: 'bayou-fertilizer-buffer',
    repair: remediation([
      [1, 'pavement-reduces-runoff', 'More pavement usually increases rapid surface runoff. Choose an action that slows or captures nutrient-carrying water.'],
      [2, 'removing-plants-protects-water', 'Streamside plants can slow runoff and take up nutrients; removing them removes that protection.'],
      [3, 'more-fertilizer-before-rain-protects-water', 'Applying more fertilizer before rain increases the amount available to wash into the bayou.']
    ])
  }),
  rp2: meta({
    sep: 'Planning and Carrying Out Investigations', ccc: 'Cause and Effect', representationType: 'before-after-evidence', sourceFamily: 'school-recycling-evaluation',
    repair: remediation([
      [1, 'bin-color-measures-conservation', 'Bin color does not measure whether the program changed resource use or landfill waste.'],
      [2, 'one-opinion-is-program-evidence', 'One aesthetic opinion does not measure the program’s effect. Compare outcome data.'],
      [3, 'hallway-size-measures-conservation', 'Hallway dimensions are unrelated to how much material enters the landfill.']
    ])
  }),
  rp3: meta({
    sep: 'Obtaining, Evaluating, and Communicating Information', ccc: 'Systems and System Models', representationType: 'multi-select-benefit-model', sourceFamily: 'coastal-wetland-restoration',
    repair: remediation([
      [2, 'wetlands-stop-every-storm', 'Wetlands can reduce some impacts, but no restoration can stop every storm. Avoid an absolute claim.'],
      [3, 'wetlands-create-unlimited-freshwater', 'Wetlands store and filter water, but they do not create an unlimited freshwater supply.']
    ])
  })
};

function item({ id, skill, standard, prompt, choices, answer, explanation, sep, ccc, representationType = 'selected-response', sourceFamily, transferLevel = 'none', stimulus, repair }) {
  return {
    id,
    unit: 'earth-systems',
    skill,
    standard,
    prompt,
    choices,
    answer,
    explanation,
    sep,
    ccc,
    representationType,
    sourceFamily: `earth-systems:${sourceFamily}`,
    transferLevel,
    transfer: transferLevel === 'far',
    ...(stimulus ? { stimulus } : {}),
    ...(repair ? { remediation: repair } : {})
  };
}

export const M7_EARTH_SYSTEMS_ITEMS = [
  item({
    id: 'ei4', skill: 'sphere-interactions', standard: '5-ESS2-1',
    prompt: 'After a hurricane, salt water covers part of a coastal marsh and some plants die. Which model best represents the interactions?',
    choices: ['Hydrosphere water changes conditions for organisms in the biosphere', 'Only the atmosphere is involved because hurricanes have wind', 'The biosphere creates the salt water', 'No Earth systems interact in a marsh'], answer: 0,
    explanation: 'Storm-driven water from the hydrosphere changes conditions in a marsh ecosystem, linking water and living systems; the storm also involves the atmosphere.',
    sep: 'Developing and Using Models', ccc: 'Systems and System Models', representationType: 'interaction-model', sourceFamily: 'hurricane-marsh-saltwater', transferLevel: 'near',
    repair: remediation([
      [1, 'single-sphere-hurricane-model', 'Wind is part of the event, but the evidence also names salt water and marsh plants. Include the systems those belong to.'],
      [2, 'organisms-create-storm-saltwater', 'The plants respond to the salt water; they are not its source. Follow the direction of the interaction.'],
      [3, 'marsh-systems-are-isolated', 'A marsh contains water, sediment, air, and organisms that affect one another.']
    ])
  }),
  item({
    id: 'ei5', skill: 'sphere-interactions', standard: '5-ESS2-1',
    prompt: 'A long dry period leaves forest plants brittle. A fire then releases smoke and exposes soil to erosion. Which statement best explains the system interactions?',
    choices: ['Changes in water availability affected organisms, and the fire moved matter into air and exposed land', 'Only the biosphere changed', 'Smoke belongs to the hydrosphere', 'Erosion cannot follow a change in vegetation'], answer: 0,
    explanation: 'Reduced water affects the biosphere; fire transfers matter to the atmosphere and changes land cover, which can affect erosion in the geosphere.',
    sep: 'Constructing Explanations and Designing Solutions', ccc: 'Cause and Effect', representationType: 'causal-chain', sourceFamily: 'drought-fire-erosion',
    stimulus: flow('Connected changes', ['less available water', 'dry vegetation', 'fire and smoke', 'exposed soil']),
    repair: remediation([
      [1, 'drought-fire-one-sphere-only', 'The chain includes water, plants, smoke, and soil. Classify each component before deciding.'],
      [2, 'smoke-is-hydrosphere', 'Smoke is suspended in air, so it directly involves the atmosphere.'],
      [3, 'vegetation-never-affects-erosion', 'Plant cover and roots can protect soil. Removing that cover can change how easily soil moves.']
    ])
  }),
  item({
    id: 'ei6', skill: 'sphere-interactions', standard: '5-ESS2-1',
    prompt: 'Meltwater from a mountain snowfield enters cracks in rock, freezes, and widens the cracks. Which two systems interact most directly in this process?',
    choices: ['Hydrosphere and geosphere', 'Atmosphere and distant stars', 'Biosphere only', 'Geosphere only because rock is present'], answer: 0,
    explanation: 'Water changes state and exerts force in rock cracks, an interaction between the hydrosphere and geosphere.',
    sep: 'Developing and Using Models', ccc: 'Cause and Effect', representationType: 'process-model', sourceFamily: 'freeze-thaw-rock',
    repair: remediation([
      [1, 'stars-drive-freeze-thaw', 'The process describes local water and rock. Distant stars are not a component of this model.'],
      [2, 'freeze-thaw-is-living-only', 'No organism is required for water to enter and widen a rock crack.'],
      [3, 'one-sphere-despite-water', 'The rock is geosphere, but the meltwater and ice are hydrosphere. The change requires both.']
    ])
  }),
  item({
    id: 'ei7', skill: 'sphere-interactions', standard: '5-ESS2-1',
    prompt: 'Students compare two schoolyards on the same sunny afternoon. What interaction is best supported by the data?',
    choices: ['More tree cover in the biosphere is associated with cooler nearby air', 'Trees make sunlight stop existing', 'Pavement is part of the hydrosphere', 'Air temperature cannot be affected by surface conditions'], answer: 0,
    explanation: 'The comparison supports an interaction in which vegetation and surface cover influence the temperature of the nearby atmosphere.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Cause and Effect', representationType: 'comparative-data-table', sourceFamily: 'schoolyard-tree-temperature',
    stimulus: table('Schoolyard observations', ['Site', 'Tree cover', 'Air temperature'], [['Tree courtyard', '70%', '29°C'], ['Paved lot', '5%', '35°C']]),
    repair: remediation([
      [1, 'trees-eliminate-sunlight', 'Both sites were measured on the same sunny afternoon. The evidence concerns temperature, not the existence of sunlight.'],
      [2, 'pavement-is-water-system', 'Pavement is a land surface, not a water reservoir.'],
      [3, 'surface-cannot-affect-air', 'The two sites differ in cover and measured temperature. Use the observed association without claiming more than the comparison shows.']
    ])
  }),
  item({
    id: 'ei8', skill: 'sphere-interactions', standard: '5-ESS2-1',
    prompt: 'Dark wildfire ash settles on a distant snowfield. The darker surface absorbs more sunlight and melts sooner, sending extra water downslope. Which model best transfers Earth-system thinking to this unfamiliar event?',
    choices: ['Matter from the atmosphere changes a frozen-water surface, which then changes water flow over land', 'Ash affects only the fire site and cannot influence another system', 'The snowfield becomes part of the biosphere because it changes color', 'Extra meltwater proves that matter was created'], answer: 0,
    explanation: 'The event links atmospheric transport, frozen water in the hydrosphere, and downslope effects on the geosphere. Matter moves and system interactions alter the outcome.',
    sep: 'Developing and Using Models', ccc: 'Systems and System Models', representationType: 'far-transfer-system-model', sourceFamily: 'ash-snowfield-melt', transferLevel: 'far',
    repair: remediation([
      [1, 'transported-matter-cannot-couple-systems', 'The prompt states that airborne ash reaches the snowfield. Track what happens after that transfer.'],
      [2, 'color-change-makes-biosphere', 'A darker surface is not automatically living. Classify the snow and ash by what they are.'],
      [3, 'increased-flow-creates-matter', 'Earlier melting changes when and where water moves; it does not create new water matter.']
    ])
  }),

  item({
    id: 'wd4', skill: 'water-distribution', standard: '5-ESS2-2',
    prompt: 'A class uses 1,000 mL of water to model all of Earth’s water. Which setup best represents the approximate distribution?',
    choices: ['About 970 mL ocean salt water; about 30 mL in all freshwater reservoirs combined', '500 mL rivers; 500 mL oceans', '970 mL lakes; 30 mL oceans', 'All 1,000 mL groundwater'], answer: 0,
    explanation: 'About 97% of Earth’s water is salt water in oceans. Only about 3% is freshwater, much of it frozen or underground.',
    sep: 'Using Mathematics and Computational Thinking', ccc: 'Scale, Proportion, and Quantity', representationType: 'scaled-volume-model', sourceFamily: 'thousand-milliliter-earth-model', transferLevel: 'near',
    repair: remediation([
      [1, 'rivers-equal-oceans', 'Rivers contain far less than half of Earth’s water. Scale 97% of 1,000 mL first.'],
      [2, 'lakes-hold-ocean-share', 'The largest share is salt water in oceans, not freshwater in lakes.'],
      [3, 'all-water-is-groundwater', 'Groundwater is important, but oceans contain nearly all of Earth’s water.']
    ])
  }),
  item({
    id: 'wd5', skill: 'water-distribution', standard: '5-ESS2-2',
    prompt: 'The graph shows the approximate distribution within Earth’s freshwater. Which conclusion is supported?',
    choices: ['Most freshwater is frozen or underground rather than in surface water', 'Most freshwater is in rivers and lakes', 'Ice contains salt water only', 'Every freshwater reservoir contains equal amounts'], answer: 0,
    explanation: 'The largest freshwater reservoirs are ice/glaciers and groundwater; lakes and rivers hold a much smaller share.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Scale, Proportion, and Quantity', representationType: 'bar-graph', sourceFamily: 'freshwater-reservoir-graph',
    stimulus: { graph: { type: 'bar', label: 'Approximate share of Earth’s freshwater', ariaLabel: 'Bar graph with about 69 percent in ice and glaciers, 30 percent in groundwater, and 1 percent in surface and other freshwater', xLabels: ['Ice & glaciers', 'Groundwater', 'Surface & other'], values: [69, 30, 1], yLabel: 'Percent of freshwater', yMin: 0, yMax: 70, yTicks: [0, 10, 20, 30, 40, 50, 60, 70] } },
    repair: remediation([
      [1, 'surface-water-holds-most-freshwater', 'Compare the height of the surface-water bar with the ice and groundwater bars.'],
      [2, 'freshwater-ice-is-saltwater', 'The graph is explicitly about freshwater reservoirs; frozen freshwater remains freshwater.'],
      [3, 'reservoirs-have-equal-shares', 'The bars differ greatly in height. Use their relative sizes.']
    ])
  }),
  item({
    id: 'wd6', skill: 'water-distribution', standard: '5-ESS2-2',
    prompt: 'If 100 squares represent all of Earth’s water, how many should be shaded to show ocean salt water?',
    choices: ['About 97 squares', 'About 3 squares', 'Exactly 50 squares', 'Less than 1 square'], answer: 0,
    explanation: 'About 97 of every 100 equal parts represent ocean salt water.',
    sep: 'Using Mathematics and Computational Thinking', ccc: 'Scale, Proportion, and Quantity', representationType: 'hundred-grid-model', sourceFamily: 'hundred-square-ocean-model',
    repair: remediation([
      [1, 'freshwater-share-used-for-ocean', 'About 3 squares model freshwater. The question asks for the much larger ocean share.'],
      [2, 'water-split-evenly', 'Earth’s water is not divided equally between oceans and freshwater reservoirs.'],
      [3, 'ocean-share-is-tiny', 'Less than one square would represent a very small reservoir, not oceans.']
    ])
  }),
  item({
    id: 'wd7', skill: 'water-distribution', standard: '5-ESS2-2',
    prompt: 'Two planets have the same total amount of water. Planet A stores most freshwater in deep ice; Planet B stores more in shallow lakes. What can be concluded from the distribution alone?',
    choices: ['Planet B has a larger share of freshwater in an easily observed surface reservoir', 'Planet A has no water', 'Both planets must have identical access to liquid freshwater', 'Deep ice is salt water by definition'], answer: 0,
    explanation: 'The location and state of water matter. Equal total water does not imply equal amounts in accessible liquid surface reservoirs.',
    sep: 'Engaging in Argument from Evidence', ccc: 'Scale, Proportion, and Quantity', representationType: 'comparative-distribution-model', sourceFamily: 'two-planet-reservoir-comparison', transferLevel: 'near',
    repair: remediation([
      [1, 'frozen-water-is-no-water', 'Ice is water in a solid state, so Planet A still has water.'],
      [2, 'equal-total-means-equal-access', 'The totals are equal, but the prompt gives different storage locations and states.'],
      [3, 'all-deep-ice-is-saltwater', 'Being frozen or deep does not determine whether water is fresh or salty.']
    ])
  }),
  item({
    id: 'wd8', skill: 'water-distribution', standard: '5-ESS2-2',
    prompt: 'A museum jar contains 100 beads representing Earth’s water: 97 blue beads for ocean salt water and 3 white beads for freshwater. Only a small part of one white bead represents lakes and rivers. Which claim best transfers the model?',
    choices: ['Visible lakes and rivers are important but hold only a tiny fraction of Earth’s total water', 'Lakes and rivers contain nearly all Earth’s water', 'Salt water is rare because oceans look flat on maps', 'The model proves every freshwater source is easy to use'], answer: 0,
    explanation: 'The scaled model shows that familiar surface freshwater is a very small portion of the total, even though it is important to communities and ecosystems.',
    sep: 'Developing and Using Models', ccc: 'Scale, Proportion, and Quantity', representationType: 'analogical-transfer', sourceFamily: 'museum-bead-water-model', transferLevel: 'far',
    repair: remediation([
      [1, 'visible-water-means-largest-share', 'Visibility and familiarity do not determine quantity. Use the bead proportions.'],
      [2, 'map-appearance-measures-volume', 'A map’s appearance does not replace the quantitative model showing 97 of 100 parts as ocean water.'],
      [3, 'freshwater-share-equals-accessibility', 'The three freshwater beads include frozen and underground reservoirs; the model does not show all are easy to use.']
    ])
  }),

  item({
    id: 'rp4', skill: 'resource-protection', standard: '5-ESS3-1',
    prompt: 'A town replaces part of a parking lot with permeable pavement and rain gardens. Which science idea explains how this can protect a nearby stream?',
    choices: ['Slowing and soaking in stormwater can reduce rapid runoff and the pollutants it carries', 'Harder rainfall will be created above the parking lot', 'All water pollution will end immediately', 'The stream will no longer need a watershed'], answer: 0,
    explanation: 'Permeable surfaces and rain gardens can increase infiltration and slow runoff, reducing some pollutant transport to streams.',
    sep: 'Constructing Explanations and Designing Solutions', ccc: 'Cause and Effect', representationType: 'solution-mechanism', sourceFamily: 'permeable-pavement-rain-garden',
    repair: remediation([
      [1, 'stormwater-design-creates-rain', 'The design changes what happens after rain reaches the ground; it does not create rainfall.'],
      [2, 'one-solution-ends-all-pollution', 'The measures can reduce some runoff and pollution, not guarantee that all pollution ends.'],
      [3, 'protection-removes-watershed', 'The stream remains part of a watershed. The solution changes water movement within it.']
    ])
  }),
  item({
    id: 'rp5', skill: 'resource-protection', standard: '5-ESS3-1',
    prompt: 'A school installs low-flow faucets. Which evidence best evaluates whether the change conserves water?',
    choices: ['Compare water-meter use during similar school weeks before and after installation', 'Count how many faucets are silver', 'Ask whether the faucets sound quieter', 'Measure the length of each sink'], answer: 0,
    explanation: 'Comparable before-and-after water-use measurements directly test whether the solution reduces resource use.',
    sep: 'Planning and Carrying Out Investigations', ccc: 'Cause and Effect', representationType: 'evaluation-plan', sourceFamily: 'low-flow-faucet-meter', transferLevel: 'near',
    repair: remediation([
      [1, 'fixture-color-measures-water-use', 'Color does not measure water consumption. Choose evidence tied to the conservation goal.'],
      [2, 'sound-measures-conservation', 'Sound is not the target outcome. Measure the amount of water used.'],
      [3, 'sink-length-measures-conservation', 'Sink length does not reveal whether the new faucets changed water use.']
    ])
  }),
  item({
    id: 'rp6', skill: 'resource-protection', standard: '5-ESS3-1',
    prompt: 'After a community begins collecting food scraps for compost, the data change as shown. Which conclusion is best supported?',
    choices: ['The program reduced food waste sent to the landfill while producing compost', 'The program created matter from nothing', 'Landfill waste increased because compost has mass', 'The data prove the program has no tradeoffs'], answer: 0,
    explanation: 'The measured landfill-bound food waste decreased while collected material was redirected into compost. Matter was transferred, not created.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Energy and Matter', representationType: 'before-after-data-table', sourceFamily: 'community-compost-data',
    stimulus: table('Monthly food-scrap outcomes', ['Measure', 'Before program', 'After program'], [['Food waste sent to landfill', '12 tons', '4 tons'], ['Food scraps composted', '0 tons', '7 tons']]),
    repair: remediation([
      [1, 'composting-creates-matter', 'The scraps already existed. The program changes where the material goes.'],
      [2, 'compost-mass-means-more-landfill', 'Composted material is diverted from the landfill; use the landfill row in the table.'],
      [3, 'one-data-table-proves-no-tradeoffs', 'The table supports an outcome claim, but it does not measure every possible cost or tradeoff.']
    ])
  }),
  item({
    id: 'rp7', skill: 'resource-protection', standard: '5-ESS3-1',
    prompt: 'A community compares two ways to reduce summer water use. Which decision best uses the evidence?',
    choices: ['Choose based on the community’s priorities because both options save water but differ in cost and habitat benefit', 'Choose Option A because the first option is always best', 'Choose Option B because cost never matters', 'Reject both because no solution can have tradeoffs'], answer: 0,
    explanation: 'Evidence-informed decisions compare outcomes and tradeoffs. Both options conserve water, but they differ in cost and added benefits.',
    sep: 'Obtaining, Evaluating, and Communicating Information', ccc: 'Cause and Effect', representationType: 'tradeoff-matrix', sourceFamily: 'summer-water-solutions',
    stimulus: table('Community options', ['Option', 'Water saved', 'Cost', 'Additional effect'], [['A: leak repair', 'High', 'Medium', 'Less water loss'], ['B: native landscaping', 'Medium', 'Low', 'More pollinator habitat']]),
    repair: remediation([
      [1, 'first-option-is-automatically-best', 'Order in a table is not evidence. Compare performance, cost, and other effects.'],
      [2, 'cost-is-never-a-constraint', 'Cost is one relevant constraint, even when an option has benefits.'],
      [3, 'tradeoffs-make-solutions-invalid', 'Real solutions often have tradeoffs. The goal is to compare them transparently.']
    ])
  }),
  item({
    id: 'rp8', skill: 'resource-protection', standard: '5-ESS3-1',
    prompt: 'A growing community in a dry region wants to protect its limited freshwater supply. Engineers propose treating wastewater for irrigation and fixing leaks in water pipes. Which reasoning best transfers resource-protection ideas to this setting?',
    choices: ['Both actions can reduce demand for newly withdrawn freshwater, and their results should be measured', 'Treated wastewater creates unlimited new water', 'Leaks do not matter because water disappears after leaving a pipe', 'The community should choose without collecting evidence'], answer: 0,
    explanation: 'Reusing appropriately treated water and preventing losses can conserve freshwater. Monitoring use and outcomes tests whether the actions meet the community’s goal.',
    sep: 'Constructing Explanations and Designing Solutions', ccc: 'Systems and System Models', representationType: 'far-transfer-solution-analysis', sourceFamily: 'dry-region-water-reuse-leaks', transferLevel: 'far',
    repair: remediation([
      [1, 'reuse-creates-unlimited-water', 'Reuse changes how existing water is managed; it does not create an unlimited supply.'],
      [2, 'leaked-water-ceases-to-exist', 'The water still exists, but it is lost from the intended supply system and may require replacement.'],
      [3, 'resource-decisions-need-no-evidence', 'Measurement is needed to determine whether the actions actually reduce freshwater withdrawals.']
    ])
  })
];
