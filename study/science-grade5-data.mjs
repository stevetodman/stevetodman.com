const choice = (id, skill, standard, prompt, choices, answer, explanation, extra = {}) => ({
  id, skill, standard, prompt, choices, answer, explanation, ...extra
});

const multi = (id, skill, standard, prompt, options, answer, explanation, extra = {}) => choice(
  id, skill, standard, prompt, options, answer, explanation, { type: 'multi', ...extra }
);

const table = (label, headers, rows) => ({ label, table: { headers, rows } });
const flow = (label, steps) => ({ label, flow: steps });

const units = [
  {
    id: 'earth-sky',
    label: 'Unit 1',
    title: 'Earth, Sun & Stars',
    eyebrow: 'Forces and patterns in space',
    description: 'Use evidence and models to explain gravity, stars, shadows, and seasonal sky patterns.',
    summary: 'Gravity, stars, shadows, and seasonal sky patterns.',
    standards: ['5-PS2-1', '5-ESS1-1', '5-ESS1-2'],
    skills: [
      { id: 'gravity', label: 'Gravity', standard: '5-PS2-1' },
      { id: 'star-distance', label: 'Stars & distance', standard: '5-ESS1-1' },
      { id: 'sky-patterns', label: 'Sky patterns', standard: '5-ESS1-2' }
    ]
  },
  {
    id: 'matter',
    label: 'Unit 2',
    title: 'Matter & Its Interactions',
    eyebrow: 'Current focus',
    description: 'Model particles, measure conserved matter, identify materials, and test for new substances.',
    summary: 'Particles, conserved matter, properties, and reactions.',
    standards: ['5-PS1-1', '5-PS1-2', '5-PS1-3', '5-PS1-4'],
    skills: [
      { id: 'particle-models', label: 'Particle models', standard: '5-PS1-1' },
      { id: 'matter-conservation', label: 'Conservation of matter', standard: '5-PS1-2' },
      { id: 'material-properties', label: 'Material properties', standard: '5-PS1-3' },
      { id: 'new-substances', label: 'New substances', standard: '5-PS1-4' }
    ]
  },
  {
    id: 'ecosystems',
    label: 'Unit 3',
    title: 'Living Systems',
    eyebrow: 'Matter and energy in ecosystems',
    description: 'Trace plant materials, matter cycles, and the energy that begins with the Sun.',
    summary: 'Plant materials, matter cycles, and food energy.',
    standards: ['5-PS3-1', '5-LS1-1', '5-LS2-1'],
    skills: [
      { id: 'food-energy', label: 'Energy in food', standard: '5-PS3-1' },
      { id: 'plant-growth', label: 'Plant growth', standard: '5-LS1-1' },
      { id: 'matter-cycle', label: 'Matter cycles', standard: '5-LS2-1' }
    ]
  },
  {
    id: 'earth-systems',
    label: 'Unit 4',
    title: 'Earth Systems & Resources',
    eyebrow: 'A connected planet',
    description: 'Analyze interactions among Earth systems, water distribution, and ways communities protect resources.',
    summary: 'Earth-system interactions, water, and resources.',
    standards: ['5-ESS2-1', '5-ESS2-2', '5-ESS3-1'],
    skills: [
      { id: 'sphere-interactions', label: 'Earth-system interactions', standard: '5-ESS2-1' },
      { id: 'water-distribution', label: 'Earth’s water', standard: '5-ESS2-2' },
      { id: 'resource-protection', label: 'Protecting resources', standard: '5-ESS3-1' }
    ]
  },
  {
    id: 'engineering',
    label: 'Unit 5',
    title: 'Engineering Design',
    eyebrow: 'Design, compare, test, improve',
    description: 'Define problems with criteria and constraints, compare designs, and run fair tests.',
    summary: 'Define, compare, test, and improve solutions.',
    standards: ['3-5-ETS1-1', '3-5-ETS1-2', '3-5-ETS1-3'],
    skills: [
      { id: 'design-problem', label: 'Criteria & constraints', standard: '3-5-ETS1-1' },
      { id: 'compare-solutions', label: 'Compare solutions', standard: '3-5-ETS1-2' },
      { id: 'fair-tests', label: 'Fair tests', standard: '3-5-ETS1-3' }
    ]
  }
];

const items = [
  // 5-PS2-1 · gravity
  choice('g1', 'gravity', '5-PS2-1', 'A ball is released from a balcony. Which force best explains why it moves toward the ground?', ['Wind pushes it down', 'Earth’s gravity pulls it toward Earth', 'The balcony repels it', 'Its mass disappears'], 1, 'Earth’s gravitational force pulls objects toward Earth.'),
  choice('g2', 'gravity', '5-PS2-1', 'An astronaut and a toolbox drift near Earth. Which claim is scientifically strongest?', ['Gravity acts only on the astronaut', 'Gravity acts only on the toolbox', 'Earth pulls on both objects', 'No gravity exists above the ground'], 2, 'Earth’s gravity acts on objects with mass even when they appear to float.'),
  choice('g3', 'gravity', '5-PS2-1', 'Which model correctly shows the direction of Earth’s gravitational force on people standing at different places?', ['All arrows point north', 'All arrows point toward Earth’s center', 'All arrows point away from Earth', 'Arrows point in the direction people walk'], 1, 'Gravity pulls each person toward the center of Earth.'),

  // 5-ESS1-1 · stars and distance
  choice('sd1', 'star-distance', '5-ESS1-1', 'The Sun looks larger and brighter than other stars mainly because the Sun is…', ['the only star that gives light', 'much closer to Earth', 'made of a different kind of matter', 'larger than every other star'], 1, 'Distance strongly affects apparent brightness and size. The Sun is our nearest star.'),
  choice('sd2', 'star-distance', '5-ESS1-1', 'Star A and Star B give off the same amount of light. Star A appears dimmer from Earth. What is the best explanation?', ['Star A is farther from Earth', 'Star A has no energy', 'Earth blocks all of Star A', 'Star A is a planet'], 0, 'For equally luminous stars, the farther star appears dimmer.'),
  choice('sd3', 'star-distance', '5-ESS1-1', 'A student says, “Every star that looks tiny must actually be tiny.” Which evidence best challenges the claim?', ['Distant objects can look smaller than equally sized nearby objects', 'Stars are visible only at night', 'The Moon changes appearance', 'Some planets have moons'], 0, 'Apparent size depends on distance, so a very large distant star may look tiny.'),

  // 5-ESS1-2 · sky patterns
  choice('sp1', 'sky-patterns', '5-ESS1-2', 'Which observation collected over one day best shows a predictable sky pattern?', ['A cloud changes shape', 'The Sun appears to move from east to west', 'A bird crosses the sky', 'Rain begins suddenly'], 1, 'Earth’s rotation makes the Sun appear to follow a regular east-to-west path.', { stimulus: flow('Apparent daily path', ['east horizon', 'high in the sky', 'west horizon']) }),
  choice('sp2', 'sky-patterns', '5-ESS1-2', 'A student measures a flagpole shadow at noon once each month.', ['The student can look for a seasonal pattern in shadow length', 'The data will show the daily rainfall total', 'The data prove the Sun circles Earth each day', 'The shadow must be the same every month'], 0, 'Repeated measurements at the same time can reveal seasonal changes in the Sun’s apparent position.'),
  choice('sp3', 'sky-patterns', '5-ESS1-2', 'What pattern is supported by these observations?', ['Daylight is shortest in June', 'Daylight is longest in June', 'Every month has equal daylight', 'Daylight changes randomly'], 1, 'The table shows the greatest daylight duration in June.', { stimulus: table('Daylight in one Louisiana city', ['Month', 'Approximate daylight'], [['December', '10 hours'], ['March', '12 hours'], ['June', '14 hours'], ['September', '12 hours']]) }),

  // 5-PS1-1 · particle models
  choice('pm1', 'particle-models', '5-PS1-1', 'Sugar seems to disappear when stirred into water. Which particle model best explains what happened?', ['Sugar particles stopped existing', 'Sugar particles became too small and spread through the water to see', 'Water changed sugar into light', 'Sugar particles floated out of the cup'], 1, 'Dissolving separates and spreads sugar particles; the matter remains present.'),
  choice('pm2', 'particle-models', '5-PS1-1', 'Air is invisible. Which evidence supports the model that air is made of particles?', ['An inflated balloon has more mass than the same empty balloon', 'A balloon can be red', 'A balloon makes a sound when popped', 'A balloon is round'], 0, 'Added air adds measurable mass, supporting the idea that invisible gases are matter.'),
  choice('pm3', 'particle-models', '5-PS1-1', 'A sealed syringe of air can be pushed inward a little. Which model best explains this?', ['Air particles shrink to nothing', 'Spaces between gas particles become smaller', 'New particles enter through the seal', 'Air changes into a solid'], 1, 'Gas particles have space between them, so compression decreases that spacing.'),

  // 5-PS1-2 · conservation
  choice('mc1', 'matter-conservation', '5-PS1-2', 'Ice melts inside a sealed bag. The bag and ice have a mass of 84 g before melting. What should their mass be after melting?', ['0 g', '42 g', '84 g', 'More than 100 g'], 2, 'A phase change does not create or destroy matter in the sealed system.'),
  choice('mc2', 'matter-conservation', '5-PS1-2', 'Two substances react in an open cup and bubbles escape. The final measured mass is lower. Which explanation fits conservation of matter?', ['Some matter became energy and vanished', 'A gas formed and left the open system', 'The balance always removes mass', 'The substances stopped being matter'], 1, 'Matter can leave an open system as an unseen gas; it is not destroyed.'),
  choice('mc3', 'matter-conservation', '5-PS1-2', 'What conclusion is best supported by the sealed-container data?', ['Mixing destroyed 5 g of matter', 'The total mass was conserved', 'The liquid has no mass', 'The solid doubled in mass'], 1, 'The before and after totals are equal in the closed system.', { stimulus: table('Reaction measurements', ['Measurement', 'Mass'], [['Container + materials before', '156 g'], ['Sealed container after reaction', '156 g']]) }),

  // 5-PS1-3 · properties
  multi('mp1', 'material-properties', '5-PS1-3', 'Which TWO properties would best distinguish an unknown metal paper clip from a plastic one?', ['Magnetic attraction', 'Electrical conductivity', 'The desk location', 'The day it was tested'], [0, 1], 'Magnetism and conductivity are measurable material properties; location and date are not.'),
  choice('mp2', 'material-properties', '5-PS1-3', 'An unknown powder dissolves in water but is not attracted to a magnet. Which sample is it most likely to be?', ['Sample A', 'Sample B', 'Sample C', 'There is not enough property data'], 0, 'Only Sample A matches both observed properties.', { stimulus: table('Known samples', ['Sample', 'Dissolves in water?', 'Magnetic?'], [['A', 'Yes', 'No'], ['B', 'No', 'Yes'], ['C', 'No', 'No']]) }),
  choice('mp3', 'material-properties', '5-PS1-3', 'Why should scientists test several properties when identifying a substance?', ['One property may be shared by several substances', 'Every substance has the same properties', 'Properties change whenever measured', 'A substance can only have one property'], 0, 'A combination of characteristic properties provides stronger identification evidence.'),

  // 5-PS1-4 · new substances
  multi('ns1', 'new-substances', '5-PS1-4', 'Which TWO observations are strongest evidence that mixing substances produced new substances?', ['A gas forms unexpectedly', 'A new solid appears', 'The cup is moved', 'The mixture is stirred'], [0, 1], 'Unexpected gas or precipitate formation indicates substances with new properties may have formed.'),
  choice('ns2', 'new-substances', '5-PS1-4', 'Salt disappears in water and can later be recovered by evaporating the water. What is the best conclusion?', ['A new substance definitely formed', 'The salt remained present in a mixture', 'All matter was destroyed', 'The water changed into salt'], 1, 'Recovering the salt supports dissolving as mixing, not evidence of a new substance.'),
  choice('ns3', 'new-substances', '5-PS1-4', 'Which result best supports the claim that a chemical reaction occurred?', ['Before mixing both liquids are clear; afterward a yellow solid forms', 'Water changes shape in a new container', 'Ice becomes liquid water', 'Sand settles to the bottom of water'], 0, 'Formation of a new solid with different properties is evidence of new substances.'),

  // 5-PS3-1 · food energy
  choice('fe1', 'food-energy', '5-PS3-1', 'Which sequence best traces the energy in a rabbit’s food?', ['Soil → plant → Sun → rabbit', 'Sun → plant → rabbit', 'Rabbit → plant → Sun', 'Water → Sun → rabbit'], 1, 'Plants capture energy from sunlight; animals obtain that stored energy by eating plants or other animals.'),
  choice('fe2', 'food-energy', '5-PS3-1', 'A hawk gets energy by eating a snake that ate a mouse that ate seeds. Where did this food energy begin?', ['The hawk', 'The soil', 'The Sun', 'The snake'], 2, 'Most energy in food webs begins as sunlight captured by producers.'),
  choice('fe3', 'food-energy', '5-PS3-1', 'Which claim best fits this food chain?', ['The grass creates energy from nothing', 'Energy from the Sun is transferred through the organisms', 'The fox sends energy backward to the Sun', 'Soil is the only energy source'], 1, 'The arrows trace transferred food energy that originally came from sunlight.', { stimulus: flow('Energy pathway', ['Sun', 'grass', 'grasshopper', 'frog', 'fox']) }),

  // 5-LS1-1 · plant growth
  multi('pg1', 'plant-growth', '5-LS1-1', 'A tree gains a great deal of mass as it grows. Which TWO inputs provide most of the material used to build that new growth?', ['Carbon dioxide from air', 'Water', 'Light as matter', 'Soil as the source of nearly all mass'], [0, 1], 'Plants use carbon dioxide and water to make sugars and other growth materials; light supplies energy, not matter.'),
  choice('pg2', 'plant-growth', '5-LS1-1', 'A plant is grown in a pot. Its mass increases by 200 g while the dry soil mass changes very little. Which claim is best supported?', ['Most new plant matter did not come from the soil', 'The scale created plant matter', 'Plants do not need water', 'All plant mass came from sunlight'], 0, 'The evidence challenges the idea that soil supplies most plant matter; much comes from carbon dioxide and water.', { stimulus: table('Growth investigation', ['Measurement', 'Start', 'End'], [['Plant mass', '5 g', '205 g'], ['Dry soil mass', '2,000 g', '1,996 g']]) }),
  choice('pg3', 'plant-growth', '5-LS1-1', 'Which model correctly describes photosynthesis at this grade level?', ['Plants use water and carbon dioxide, with light energy, to make food materials', 'Plants eat soil to gain all their mass', 'Plants turn sunlight directly into matter', 'Plants grow without matter entering them'], 0, 'Water and carbon dioxide supply matter; sunlight supplies the energy for making food.'),

  // 5-LS2-1 · matter cycles
  choice('cy1', 'matter-cycle', '5-LS2-1', 'A decomposer breaks down a fallen leaf. What happens to the leaf’s matter?', ['It is destroyed', 'It returns to the environment and can cycle through the system', 'It becomes only energy', 'It leaves Earth'], 1, 'Decomposers return matter to soil, water, and air where it can be reused.'),
  choice('cy2', 'matter-cycle', '5-LS2-1', 'Which statement correctly compares matter and energy in an ecosystem?', ['Both cycle endlessly in exactly the same way', 'Matter cycles; energy flows through and much leaves as heat', 'Energy cycles but matter disappears', 'Neither moves among organisms'], 1, 'Matter is repeatedly recycled, while energy moves through the system.'),
  choice('cy3', 'matter-cycle', '5-LS2-1', 'Where can the matter in a rabbit go after the rabbit dies?', ['Nowhere; it vanishes', 'To decomposers and then into soil, air, or other organisms', 'Directly back into sunlight', 'Only into rocks'], 1, 'Decomposition transfers the rabbit’s matter to other parts of the ecosystem.', { stimulus: flow('Matter pathway', ['plant', 'rabbit', 'decomposer', 'soil and air', 'plant']) }),

  // 5-ESS2-1 · sphere interactions
  choice('ei1', 'sphere-interactions', '5-ESS2-1', 'Rainwater runs down a bare hillside and carries soil into a stream. Which Earth systems are interacting most directly?', ['Atmosphere, hydrosphere, and geosphere', 'Only the biosphere', 'Only the atmosphere', 'Moon and stars'], 0, 'Rain comes through the atmosphere, flowing water is hydrosphere, and soil is geosphere.'),
  multi('ei2', 'sphere-interactions', '5-ESS2-1', 'Plants grow beside a river. Which TWO interactions are represented?', ['Roots take water from the hydrosphere', 'Roots hold material in the geosphere', 'Stars remove soil', 'The Moon supplies river water'], [0, 1], 'The biosphere interacts with water and soil through plant roots.'),
  choice('ei3', 'sphere-interactions', '5-ESS2-1', 'How can a volcanic eruption affect more than one Earth system?', ['Ash enters the atmosphere and lava changes the geosphere', 'It affects only the volcano', 'It turns the hydrosphere into space', 'Earth systems never interact'], 0, 'An event in the geosphere can send material into the atmosphere and affect water and living things.'),

  // 5-ESS2-2 · water distribution
  choice('wd1', 'water-distribution', '5-ESS2-2', 'About 97% of Earth’s water is salt water. What does this imply?', ['Most Earth water is not directly usable as drinking water', 'Fresh water is unlimited', 'Oceans contain no water', 'All water is underground'], 0, 'Only a small fraction is fresh water, and much of that is frozen or underground.'),
  choice('wd2', 'water-distribution', '5-ESS2-2', 'Which reservoir holds the greatest amount of Earth’s water?', ['Rivers', 'Lakes', 'Oceans', 'Clouds'], 2, 'Oceans contain nearly all of Earth’s water.'),
  choice('wd3', 'water-distribution', '5-ESS2-2', 'Which conclusion is supported by the model?', ['Fresh liquid surface water is a small part of Earth’s water', 'Half of Earth’s water is in rivers', 'Salt water is rare', 'All fresh water is easy to reach'], 0, 'The distribution shows that readily available fresh surface water is only a tiny share.', { stimulus: table('Approximate distribution', ['Reservoir', 'Share of all water'], [['Oceans (salt water)', '97%'], ['Ice and groundwater', 'nearly 3%'], ['Lakes, rivers, atmosphere', 'much less than 1%']]) }),

  // 5-ESS3-1 · resource protection
  choice('rp1', 'resource-protection', '5-ESS3-1', 'A town wants to reduce fertilizer entering a bayou. Which action most directly addresses the problem?', ['Plant vegetated buffer strips beside fields', 'Add more pavement near the water', 'Remove all streamside plants', 'Use extra fertilizer before rain'], 0, 'Vegetated buffers slow runoff and capture some nutrients before they reach waterways.'),
  choice('rp2', 'resource-protection', '5-ESS3-1', 'Which evidence would best evaluate whether a recycling program conserves resources?', ['Compare landfill waste before and after the program', 'Count the colors of bins', 'Ask one person whether bins look nice', 'Measure the school hallway'], 0, 'Before-and-after waste data directly measure the program’s effect.'),
  multi('rp3', 'resource-protection', '5-ESS3-1', 'Louisiana communities restore coastal wetlands. Which TWO benefits connect the action to protecting Earth systems?', ['Wetlands can reduce erosion', 'Wetlands can provide habitat', 'Wetlands stop every storm', 'Wetlands create unlimited fresh water'], [0, 1], 'Wetlands connect land, water, and living systems by reducing erosion and supporting organisms.'),

  // 3-5-ETS1-1 · criteria and constraints
  choice('dp1', 'design-problem', '3-5-ETS1-1', 'Students must build a bridge that holds 2 kg, spans 30 cm, and uses no more than 50 craft sticks. Which statement identifies a constraint?', ['It must hold 2 kg', 'It may use no more than 50 sticks', 'It should be attractive', 'It will be tested'], 1, 'The limit of 50 sticks is a constraint; holding 2 kg and spanning 30 cm are criteria for success.'),
  multi('dp2', 'design-problem', '3-5-ETS1-1', 'A shade structure must lower playground temperature and cost under $300. Select the criterion and the constraint.', ['Criterion: lower temperature', 'Constraint: cost under $300', 'Criterion: use unlimited money', 'Constraint: make the day cloudy'], [0, 1], 'Criteria describe success; constraints limit the possible solution.'),
  choice('dp3', 'design-problem', '3-5-ETS1-1', 'Which problem statement is most useful for engineers?', ['Make something good', 'Design a filter that removes visible sediment from 500 mL of water in 5 minutes using $10 of materials', 'Water is interesting', 'Build any object'], 1, 'A strong problem statement includes a need, measurable criteria, and constraints.'),

  // 3-5-ETS1-2 · compare solutions
  choice('cs1', 'compare-solutions', '3-5-ETS1-2', 'The goal is to hold at least 1,000 g while costing no more than $4. Which design meets both requirements?', ['A', 'B', 'C', 'None'], 1, 'Design B holds at least 1,000 g and stays within the $4 limit.', { stimulus: table('Bridge designs', ['Design', 'Mass held', 'Cost'], [['A', '900 g', '$3'], ['B', '1,200 g', '$4'], ['C', '1,500 g', '$6']]) }),
  choice('cs2', 'compare-solutions', '3-5-ETS1-2', 'Why should engineers compare several possible solutions before building?', ['Different solutions may have different strengths and weaknesses', 'The first idea is always best', 'Comparing removes all constraints', 'Evidence is not useful in design'], 0, 'Comparison helps engineers choose a solution that best balances criteria and constraints.'),
  multi('cs3', 'compare-solutions', '3-5-ETS1-2', 'For a rain shelter, which TWO pieces of evidence are most useful when comparing designs?', ['Amount of water that leaks through', 'Cost of materials', 'Designer’s favorite color', 'Name of the design'], [0, 1], 'Performance and cost relate directly to likely criteria and constraints.'),

  // 3-5-ETS1-3 · fair tests
  choice('ft1', 'fair-tests', '3-5-ETS1-3', 'Students compare paper-airplane wing shapes. What should they keep the same for a fair test?', ['Wing shape', 'Throwing method and paper type', 'The result they hope for', 'The recorded distance'], 1, 'Only the tested feature should change; other important conditions stay controlled.'),
  choice('ft2', 'fair-tests', '3-5-ETS1-3', 'Why should a design be tested several times?', ['Repeated trials reduce the effect of chance and reveal consistency', 'The design changes its name', 'One trial can never produce data', 'Testing creates new criteria'], 0, 'Multiple trials provide more reliable evidence about performance.'),
  choice('ft3', 'fair-tests', '3-5-ETS1-3', 'Students revise a water filter after testing. Which revision is best supported by the data?', ['Increase the gravel layer because designs with more gravel produced clearer water', 'Paint it blue because blue is popular', 'Remove the container because it has mass', 'Choose without looking at results'], 0, 'A productive revision is tied to evidence from controlled tests.', { stimulus: table('Filter trials', ['Gravel depth', 'Water clarity score'], [['1 cm', '3/10'], ['3 cm', '7/10'], ['5 cm', '9/10']]) })
];

const skillToUnit = Object.fromEntries(units.flatMap(unit => unit.skills.map(skill => [skill.id, unit.id])));
items.forEach(item => { item.unit = skillToUnit[item.skill]; });

export const SCIENCE_CONFIG = {
  subject: 'science',
  title: 'Science Lab',
  eyebrow: 'Louisiana Grade 5 science',
  intro: 'Investigate the full course through models, data, explanations, and engineering decisions.',
  coverageLabel: '5 units · 16 science and engineering expectations',
  icon: '🔬',
  storageKey: 'g5-science-v1',
  hubHref: '/study/',
  currentUnit: 'matter',
  skills: Object.fromEntries(units.flatMap(unit => unit.skills.map(skill => [skill.id, skill.label]))),
  units,
  items,
  encouragement: ['Think like a scientist.', 'Use the evidence.', 'Models make the invisible visible.', 'Test the claim.']
};

export { units as SCIENCE_UNITS, items as SCIENCE_ITEMS };
