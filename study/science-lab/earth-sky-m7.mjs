const remediation = entries => Object.fromEntries(entries.map(([index, tag, hint]) => [index, { tag, hint }]));
const table = (label, headers, rows) => ({ label, table: { headers, rows } });

const meta = ({ sep, ccc, representationType = 'selected-response', sourceFamily, transferLevel = 'none', repair, ...extra }) => ({
  sep,
  ccc,
  representationType,
  sourceFamily: `earth-sky:${sourceFamily}`,
  transferLevel,
  transfer: transferLevel === 'far',
  ...(repair ? { remediation: repair } : {}),
  ...extra
});

export const M7_EARTH_SKY_OVERRIDES = {
  g1: meta({
    sep: 'Constructing Explanations and Designing Solutions', ccc: 'Cause and Effect', sourceFamily: 'balcony-drop',
    repair: remediation([
      [0, 'air-motion-is-gravity', 'Wind can push objects, but the ball falls even when the air is still. Identify the force Earth exerts on the ball.'],
      [2, 'support-repels-object', 'Removing the support lets the ball move toward Earth; the balcony is not pushing it downward after release.'],
      [3, 'falling-means-mass-disappears', 'The ball still has mass while it falls. Choose the explanation that keeps the object present and identifies the force.']
    ])
  }),
  g2: meta({
    sep: 'Engaging in Argument from Evidence', ccc: 'Systems and System Models', representationType: 'evidence-choice', sourceFamily: 'astronaut-toolbox-near-earth',
    repair: remediation([
      [0, 'gravity-acts-only-on-people', 'Gravity is not limited to living things. Both the astronaut and toolbox have mass.'],
      [1, 'gravity-acts-only-on-objects', 'Gravity is not limited to tools. Both objects are part of the Earth-object gravitational system.'],
      [3, 'gravity-stops-above-ground', 'Objects can appear weightless while still being affected by Earth’s gravity. Do not treat altitude as an on/off switch.']
    ])
  }),
  g3: meta({
    sep: 'Developing and Using Models', ccc: 'Systems and System Models', representationType: 'system-model', sourceFamily: 'globe-gravity-directions',
    prompt: 'Four people are shown at different places around Earth. Which statement correctly describes the gravitational-force arrows that should be added to the model?',
    stimulus: {
      systemModel: {
        label: 'People at different places around Earth',
        ariaLabel: 'System model with Earth in the center and four people positioned above, below, left, and right of Earth',
        nodes: [
          { id: 'earth', label: 'Earth', x: 0.50, y: 0.50 },
          { id: 'north', label: 'person', x: 0.50, y: 0.12 },
          { id: 'east', label: 'person', x: 0.88, y: 0.50 },
          { id: 'south', label: 'person', x: 0.50, y: 0.88 },
          { id: 'west', label: 'person', x: 0.12, y: 0.50 }
        ],
        arrows: []
      }
    },
    repair: remediation([
      [0, 'gravity-points-north', 'North is a map direction, not the direction of gravity everywhere. Use Earth itself as the reference.'],
      [2, 'gravity-points-away-from-earth', 'A released object moves toward Earth, not away from it. Point each force arrow toward the attracting body.'],
      [3, 'gravity-follows-motion', 'Gravity does not point in whatever direction a person walks. The force direction is set by the Earth-object interaction.']
    ])
  }),
  sd1: meta({
    sep: 'Engaging in Argument from Evidence', ccc: 'Scale, Proportion, and Quantity', sourceFamily: 'sun-nearest-star',
    repair: remediation([
      [0, 'sun-is-only-luminous-star', 'Other stars also emit light. Focus on what is especially different about the Sun’s distance from Earth.'],
      [2, 'sun-must-be-different-matter', 'The question asks why it appears brighter. Use relative distance rather than inventing a different kind of matter.'],
      [3, 'apparent-brightness-proves-largest', 'Apparent brightness alone does not prove the Sun is larger than every other star. Distance strongly affects how bright a star looks from Earth.']
    ])
  }),
  sd2: meta({
    sep: 'Analyzing and Interpreting Data', ccc: 'Scale, Proportion, and Quantity', representationType: 'comparative-evidence', sourceFamily: 'equal-output-stars',
    repair: remediation([
      [1, 'dim-means-no-energy', 'A dim appearance does not mean a star gives off no energy. The two stars are stated to give off the same amount of light.'],
      [2, 'earth-must-block-dimmer-star', 'No blocking evidence is given. Compare the one stated difference that can change apparent brightness: distance.'],
      [3, 'dim-star-must-be-planet', 'The prompt identifies both objects as stars. Explain the brightness difference using the evidence provided.']
    ])
  }),
  sd3: meta({
    sep: 'Engaging in Argument from Evidence', ccc: 'Scale, Proportion, and Quantity', representationType: 'evidence-choice', sourceFamily: 'faint-star-distance-claim',
    prompt: 'A student says, “Every star that looks faint from Earth must give off only a little light.” Which evidence best challenges the claim?',
    choices: ['Two equally bright lamps can look different in brightness when one is much farther away', 'Stars are easier to see at night', 'The Moon changes its apparent shape', 'Some planets have moons'],
    answer: 0,
    explanation: 'Apparent brightness depends on distance as well as the light a source gives off. A faraway bright source can appear faint.',
    repair: remediation([
      [1, 'visibility-time-explains-brightness', 'Nighttime visibility does not isolate the effect of distance on apparent brightness. Look for evidence that changes distance while keeping the source comparable.'],
      [2, 'moon-phase-explains-star-brightness', 'Moon phases do not test the student’s claim about star brightness and distance. Choose evidence that directly compares apparent brightness at different distances.'],
      [3, 'planet-moons-explain-star-brightness', 'The number of moons a planet has is unrelated to the claim. Use a distance-and-brightness comparison.']
    ])
  }),
  sp1: meta({
    sep: 'Analyzing and Interpreting Data', ccc: 'Patterns', representationType: 'flow-sequence', sourceFamily: 'daily-sun-path',
    repair: remediation([
      [0, 'weather-change-is-sky-cycle', 'A cloud can change unpredictably. Look for a repeating astronomical pattern observed over a day.'],
      [2, 'animal-motion-is-sky-pattern', 'A bird crossing the sky is not an Earth-Sun pattern. Focus on the regular apparent motion of the Sun.'],
      [3, 'weather-event-is-sky-cycle', 'Rain can begin irregularly. Choose the observation that repeats predictably from day to day.']
    ])
  }),
  sp2: meta({
    sep: 'Analyzing and Interpreting Data', ccc: 'Patterns', representationType: 'graph-construction', sourceFamily: 'noon-shadow-seasonal'
  }),
  sp3: meta({
    sep: 'Analyzing and Interpreting Data', ccc: 'Patterns', representationType: 'line-graph', sourceFamily: 'daylight-seasonal',
    repair: remediation([
      [0, 'reverses-daylight-pattern', 'Read the highest and lowest points on the graph before choosing the seasonal claim.'],
      [2, 'daylight-never-varies', 'The plotted values are not all equal. Compare June with December.'],
      [3, 'seasonal-pattern-is-random', 'The values follow a repeatable seasonal pattern rather than random changes. Use the graph to identify it.']
    ])
  })
};

function item({ id, skill, standard, prompt, choices, answer, explanation, sep, ccc, representationType = 'selected-response', sourceFamily, transferLevel = 'none', stimulus, repair }) {
  return {
    id,
    unit: 'earth-sky',
    skill,
    standard,
    prompt,
    choices,
    answer,
    explanation,
    sep,
    ccc,
    representationType,
    sourceFamily: `earth-sky:${sourceFamily}`,
    transferLevel,
    transfer: transferLevel === 'far',
    ...(stimulus ? { stimulus } : {}),
    ...(repair ? { remediation: repair } : {})
  };
}

export const M7_EARTH_SKY_ITEMS = [
  item({
    id: 'g4', skill: 'gravity', standard: '5-PS2-1',
    prompt: 'Students in Louisiana and Australia each release a ball outdoors. In both places, the ball moves toward the local ground. Which claim is best supported?',
    choices: ['Earth’s gravity pulls objects toward Earth from different places on the planet', 'Gravity always points toward North America', 'Only objects in Louisiana are affected by gravity', 'The ground pushes released balls downward from a distance'], answer: 0,
    explanation: '“Down” is local: at different places on Earth, gravitational force is directed toward Earth.',
    sep: 'Engaging in Argument from Evidence', ccc: 'Patterns', representationType: 'data-table', sourceFamily: 'opposite-side-drop-observations', transferLevel: 'near',
    stimulus: table('Drop observations', ['Location', 'After release'], [['Louisiana', 'Ball moves toward local ground'], ['Australia', 'Ball moves toward local ground']]),
    repair: remediation([
      [1, 'gravity-points-to-continent', 'A continent is not the gravitational reference point. The same local observation occurs on opposite sides of Earth.'],
      [2, 'gravity-only-at-one-location', 'The table shows the same effect in both locations. Build a claim that explains both observations.'],
      [3, 'ground-pulls-from-distance', 'The support is no longer touching the ball after release. Identify the Earth-object interaction that acts at both locations.']
    ])
  }),
  item({
    id: 'g5', skill: 'gravity', standard: '5-PS2-1',
    prompt: 'A skateboarder jumps upward from a ramp, slows, and then comes back down. Which explanation best fits the motion after takeoff?',
    choices: ['Earth continues to exert a gravitational force toward Earth', 'Gravity turns off while the skateboarder moves upward', 'The ramp keeps pulling the skateboarder down after contact ends', 'The skateboarder loses all mass at the top of the jump'], answer: 0,
    explanation: 'After takeoff, Earth’s gravitational force continues to act toward Earth throughout the jump.',
    sep: 'Constructing Explanations and Designing Solutions', ccc: 'Cause and Effect', sourceFamily: 'skateboard-jump',
    repair: remediation([
      [1, 'gravity-turns-off-upward', 'Moving upward does not switch gravity off. Ask what force explains why the upward motion slows and reverses.'],
      [2, 'support-force-persists-after-contact', 'The ramp is no longer touching the skateboarder after takeoff. Use a force that can still act.'],
      [3, 'motion-removes-mass', 'The skateboarder remains matter throughout the jump. A change in motion does not erase mass.']
    ])
  }),
  item({
    id: 'g6', skill: 'gravity', standard: '5-PS2-1',
    prompt: 'A light foam ball and a heavier rubber ball are each released from the same low height. Both begin moving toward the ground. What evidence-based statement is justified?',
    choices: ['Earth exerts a gravitational force toward Earth on both objects', 'Only the heavier ball experiences gravity', 'Only the lighter ball experiences gravity', 'Gravity pushes both objects away from Earth before they fall'], answer: 0,
    explanation: 'The observation supports the argument that Earth exerts a gravitational force toward Earth on both objects.',
    sep: 'Engaging in Argument from Evidence', ccc: 'Cause and Effect', representationType: 'experimental-evidence', sourceFamily: 'two-mass-drop',
    repair: remediation([
      [1, 'gravity-only-heavy-objects', 'The lighter ball also begins moving toward Earth. Your claim must account for both observations.'],
      [2, 'gravity-only-light-objects', 'The heavier ball also begins moving toward Earth. Your claim must account for both observations.'],
      [3, 'gravity-pushes-away-first', 'No observation shows an initial push away from Earth. Use the direction actually observed after release.']
    ])
  }),
  item({
    id: 'g7', skill: 'gravity', standard: '5-PS2-1',
    prompt: 'A student rotates a globe so a model person is sideways relative to the classroom floor. Which force arrow should the student draw for Earth’s gravity on the model person?',
    choices: ['Toward the center of the globe', 'Toward the classroom floor no matter how the globe is turned', 'Away from the globe', 'Toward the top edge of the paper'], answer: 0,
    explanation: 'A globe model helps separate local “down” from classroom orientation: Earth’s gravitational force is directed toward Earth.',
    sep: 'Developing and Using Models', ccc: 'Systems and System Models', representationType: 'model-reasoning', sourceFamily: 'rotated-globe-model', transferLevel: 'near',
    repair: remediation([
      [1, 'classroom-down-is-universal', 'The classroom floor is only the local reference where you are standing. Rotate the globe and keep Earth as the reference.'],
      [2, 'gravity-repels-from-earth', 'Earth’s gravitational interaction attracts the object toward Earth, not away from it.'],
      [3, 'paper-orientation-controls-gravity', 'The top of a drawing is not a physical force direction. Use the Earth-object system.']
    ])
  }),
  item({
    id: 'g8', skill: 'gravity', standard: '5-PS2-1',
    prompt: 'A small spacecraft coasts high above the atmosphere near Earth. Its path bends toward Earth instead of continuing in a perfectly straight line. Which explanation transfers the surface-gravity model to this new situation?',
    choices: ['Earth can still exert a gravitational force toward Earth even when the spacecraft is far above the ground', 'Gravity exists only where air touches an object', 'The spacecraft must have lost its mass', 'Earth’s gravity points away from Earth in space'], answer: 0,
    explanation: 'Earth’s gravitational interaction is not limited to objects touching the ground or atmosphere. The force is still directed toward Earth.',
    sep: 'Constructing Explanations and Designing Solutions', ccc: 'Systems and System Models', representationType: 'transfer-explanation', sourceFamily: 'spacecraft-path-near-earth', transferLevel: 'far',
    repair: remediation([
      [1, 'gravity-requires-air', 'Gravity is not an air force. The spacecraft can be above most of the atmosphere and still interact gravitationally with Earth.'],
      [2, 'curved-path-means-mass-loss', 'A change in path does not imply the spacecraft stopped having mass. Look for a force that changes motion.'],
      [3, 'space-gravity-points-outward', 'The observed path bends toward Earth. Choose the force direction consistent with that evidence.']
    ])
  }),

  item({
    id: 'sd4', skill: 'star-distance', standard: '5-ESS1-1',
    prompt: 'The same lamp is measured with a light sensor at several distances. Which pattern in the data supports the distance explanation for apparent brightness?',
    choices: ['The sensor reading decreases as distance increases', 'The lamp stops producing light after 2 meters', 'Distance has no relationship to the reading', 'The farthest position always gives the largest reading'], answer: 0,
    explanation: 'With the source held constant, increasing distance lowers the measured apparent brightness. This models why relative distance matters when comparing stars from Earth.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Scale, Proportion, and Quantity', representationType: 'data-table', sourceFamily: 'lamp-distance-sensor', transferLevel: 'near',
    stimulus: table('Same lamp, different distance', ['Distance from sensor', 'Relative light reading'], [['1 m', '100'], ['2 m', '27'], ['4 m', '7']]),
    repair: remediation([
      [1, 'distance-turns-source-off', 'The lamp remains on at every distance. Compare the sensor readings rather than assuming the source stops emitting light.'],
      [2, 'ignores-distance-pattern', 'The readings change systematically with distance. Look for the direction of that relationship.'],
      [3, 'reverses-distance-brightness', 'Check the largest and smallest readings in the table. The farthest measurement is not the brightest.']
    ])
  }),
  item({
    id: 'sd5', skill: 'star-distance', standard: '5-ESS1-1',
    prompt: 'Two model stars give off the same amount of light. Model Star A is placed much closer to the observer than Model Star B. What should the observer expect?',
    choices: ['Star A should appear brighter because it is closer', 'Star B should appear brighter because farther always means brighter', 'They must appear equally bright at every distance', 'Neither can be seen because they are stars'], answer: 0,
    explanation: 'For comparable light output, the closer source appears brighter. Relative distance is the key variable in this model.',
    sep: 'Developing and Using Models', ccc: 'Scale, Proportion, and Quantity', representationType: 'comparative-model', sourceFamily: 'equal-light-model-stars',
    repair: remediation([
      [1, 'farther-means-brighter', 'Holding the source constant, greater distance reduces apparent brightness rather than increasing it.'],
      [2, 'distance-never-affects-brightness', 'The model changes distance while keeping light output the same specifically to test the effect of distance.'],
      [3, 'star-label-prevents-observation', 'The model is about what an observer detects. Use the relative distances given.']
    ])
  }),
  item({
    id: 'sd6', skill: 'star-distance', standard: '5-ESS1-1',
    prompt: 'Three model stars give off equal amounts of light but are placed at different relative distances. What pattern does the graph show?',
    choices: ['Apparent brightness is lower for the more distant model star', 'Apparent brightness increases with distance', 'All distances produce identical apparent brightness', 'The middle-distance star produces no light'], answer: 0,
    explanation: 'The graph represents a model in which equal-output sources appear dimmer as their distance from the observer increases.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Patterns', representationType: 'bar-graph', sourceFamily: 'equal-output-distance-graph',
    stimulus: { graph: { type: 'bar', label: 'Apparent brightness of equal-output model stars', ariaLabel: 'Bar graph with relative brightness 80 for near, 20 for middle distance, and 5 for far', xLabels: ['Near', 'Middle', 'Far'], values: [80, 20, 5], yLabel: 'Relative apparent brightness', yMin: 0, yMax: 80, yTicks: [0, 20, 40, 60, 80] } },
    repair: remediation([
      [1, 'reverses-brightness-distance-pattern', 'Read the bars from near to far. The bar height decreases rather than increases.'],
      [2, 'ignores-graphed-variation', 'The three bars are different heights. Use the visible pattern instead of assuming equality.'],
      [3, 'low-reading-means-no-light', 'A lower apparent-brightness bar is not zero. The source still gives off light; it is farther away.']
    ])
  }),
  item({
    id: 'sd7', skill: 'star-distance', standard: '5-ESS1-1',
    prompt: 'A distant star is known to give off more light than the Sun, yet it still looks much fainter from Earth. Which explanation is scientifically strongest?',
    choices: ['Its much greater distance can make it appear fainter from Earth', 'A star that appears faint cannot give off much light', 'The Sun must be the largest star in the universe', 'Distance affects only color, not apparent brightness'], answer: 0,
    explanation: 'Apparent brightness depends on both a source’s light output and its distance. Great distance can make a very luminous star look faint from Earth.',
    sep: 'Engaging in Argument from Evidence', ccc: 'Scale, Proportion, and Quantity', representationType: 'argument-from-evidence', sourceFamily: 'luminous-distant-star', transferLevel: 'near',
    repair: remediation([
      [1, 'appearance-equals-light-output', 'The prompt explicitly separates actual light output from how bright the star looks from Earth. Account for the distance.'],
      [2, 'brightness-proves-largest-star', 'Apparent brightness does not establish which star is physically largest. Use the stated distance relationship.'],
      [3, 'distance-does-not-affect-brightness', 'Distance is central to the performance expectation. Compare how a distant source can look from the observer’s position.']
    ])
  }),
  item({
    id: 'sd8', skill: 'star-distance', standard: '5-ESS1-1',
    prompt: 'A museum exhibit uses identical bulbs at different distances. Visitors consistently rate the nearby bulb as brighter. Which conclusion best transfers this evidence to the Sun and other stars?',
    choices: ['A closer light source can appear brighter, so the Sun’s much smaller distance from Earth helps explain why it appears so bright', 'The Sun is the only star that emits light', 'All stars must actually give off exactly the same amount of light', 'Distance can be ignored when comparing apparent brightness'], answer: 0,
    explanation: 'The bulb model isolates distance. It supports the argument that the Sun’s relative closeness to Earth strongly affects its apparent brightness compared with other stars.',
    sep: 'Engaging in Argument from Evidence', ccc: 'Scale, Proportion, and Quantity', representationType: 'analogical-transfer', sourceFamily: 'museum-bulb-distance-analogy', transferLevel: 'far',
    repair: remediation([
      [1, 'sun-only-light-emitting-star', 'The model says nothing about other stars failing to emit light. Transfer only the tested relationship: distance and apparent brightness.'],
      [2, 'model-proves-equal-star-output', 'Identical bulbs control one variable in the model; they do not prove all real stars have identical light output.'],
      [3, 'distance-irrelevant-to-brightness', 'The whole exhibit changes distance and observes a brightness difference. Use that relationship in the astronomical explanation.']
    ])
  }),

  item({
    id: 'sp4', skill: 'sky-patterns', standard: '5-ESS1-2',
    prompt: 'A student records the same flagpole shadow several times in one clear day. Which pattern is supported by the data?',
    choices: ['The shadow becomes shorter toward midday and longer again later', 'The shadow length is completely random', 'The shadow is longest when the Sun is highest', 'The shadow never changes during a day'], answer: 0,
    explanation: 'Repeated daytime measurements reveal a predictable daily shadow-length pattern associated with the Sun’s changing apparent position.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Patterns', representationType: 'data-table', sourceFamily: 'daily-shadow-lengths', transferLevel: 'near',
    stimulus: table('Flagpole shadow', ['Time', 'Shadow length'], [['8:00 AM', '7.2 m'], ['12:00 PM', '3.1 m'], ['4:00 PM', '6.5 m']]),
    repair: remediation([
      [1, 'shadow-change-is-random', 'The measurements form a directional pattern over the day. Compare morning, midday, and afternoon.'],
      [2, 'highest-sun-longest-shadow', 'The noon measurement is the shortest in the table. Use the evidence before selecting the relationship.'],
      [3, 'shadow-length-never-changes', 'The recorded lengths are different. Identify how they change across the day.']
    ])
  }),
  item({
    id: 'sp5', skill: 'sky-patterns', standard: '5-ESS1-2',
    prompt: 'A camera records one location continuously for several days. Which repeating sequence is an astronomical pattern rather than a weather event?',
    choices: ['Daylight → night → daylight → night', 'Cloudy → rainy → sunny → snowy every day', 'One bird flies past at noon', 'A thunderstorm starts at exactly the same minute each day'], answer: 0,
    explanation: 'The day-night cycle is a regular astronomical pattern. Weather and animal observations are not guaranteed to repeat in that sequence.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Patterns', representationType: 'sequence-model', sourceFamily: 'repeating-day-night-cycle',
    repair: remediation([
      [1, 'weather-sequence-is-fixed-cycle', 'Weather does not follow a guaranteed four-step daily cycle. Choose the astronomical pattern that repeats reliably.'],
      [2, 'single-animal-event-is-cycle', 'One bird observation is not a repeating sky pattern. Look for a sequence that continues over multiple days.'],
      [3, 'storm-time-is-astronomical-pattern', 'Storm timing is weather, not a predictable Earth-Sun cycle.']
    ])
  }),
  item({
    id: 'sp6', skill: 'sky-patterns', standard: '5-ESS1-2',
    prompt: 'Students check the same part of the evening sky each month. What conclusion is best supported by the observation table?',
    choices: ['Some star patterns are visible in particular seasons and not in others', 'The same stars must appear in the same evening position every month', 'Season has no relationship to which star patterns are visible', 'A star pattern disappears because its stars stop existing'], answer: 0,
    explanation: 'Repeated observations can reveal a seasonal pattern in which certain groups of stars are visible during some parts of the year and not others.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Patterns', representationType: 'seasonal-observation-table', sourceFamily: 'seasonal-star-visibility',
    stimulus: table('Evening observation of Star Group A', ['Month', 'Visible at 8 PM?'], [['January', 'Yes'], ['April', 'Low / setting early'], ['July', 'No'], ['October', 'Rising later']]),
    repair: remediation([
      [1, 'seasonal-sky-never-changes', 'The table shows different visibility across months. Use the repeated observations rather than assuming the evening sky is unchanged.'],
      [2, 'season-does-not-affect-visible-patterns', 'The monthly observations show a systematic seasonal difference. Identify that pattern.'],
      [3, 'not-visible-means-star-stops-existing', 'Not visible from one place at one time does not mean a star ceased to exist. Interpret visibility as an observation pattern.']
    ])
  }),
  item({
    id: 'sp7', skill: 'sky-patterns', standard: '5-ESS1-2',
    prompt: 'In the morning the Sun appears in the eastern sky and a pole’s shadow points generally west. In late afternoon the Sun appears in the western sky. Which prediction best follows the daily pattern?',
    choices: ['The pole’s shadow should point generally east in late afternoon', 'The shadow should always point west', 'The shadow direction cannot show a daily pattern', 'The shadow should point straight up into the sky'], answer: 0,
    explanation: 'A shadow points generally away from the Sun. As the Sun’s apparent position changes across the day, shadow direction changes predictably.',
    sep: 'Developing and Using Models', ccc: 'Patterns', representationType: 'direction-model', sourceFamily: 'shadow-direction-sun-position', transferLevel: 'near',
    repair: remediation([
      [1, 'shadow-direction-never-changes', 'The Sun’s apparent position changes across the day. Use the away-from-Sun relationship to update the shadow direction.'],
      [2, 'shadow-direction-is-random', 'Morning observations already show a relationship between Sun position and shadow direction. Apply the same relationship later.'],
      [3, 'shadow-points-upward', 'A pole’s shadow lies on the ground. Predict its horizontal direction relative to the Sun.']
    ])
  }),
  item({
    id: 'sp8', skill: 'sky-patterns', standard: '5-ESS1-2',
    prompt: 'For three years, a school astronomy club sees Star Group B in the early evening every December but not in the early evening every June. They want to schedule next year’s observing night. Which prediction best transfers the pattern?',
    choices: ['An early-evening December session is more likely than a June session to show Star Group B', 'Star Group B can never be seen again because one June observation was negative', 'The club should expect exactly the same stars at the same time every night of the year', 'The yearly pattern gives no useful evidence for a future observation'], answer: 0,
    explanation: 'A repeated seasonal visibility pattern can support a prediction for the same season in a later year, while remaining an evidence-based prediction rather than a guarantee about weather.',
    sep: 'Using Mathematics and Computational Thinking', ccc: 'Patterns', representationType: 'pattern-transfer', sourceFamily: 'future-season-observing-plan', transferLevel: 'far',
    repair: remediation([
      [1, 'not-visible-once-means-gone', 'A seasonal non-observation does not mean the stars stopped existing. Use the repeated December-versus-June pattern.'],
      [2, 'night-sky-identical-year-round', 'The evidence specifically shows a seasonal difference in early-evening visibility.'],
      [3, 'repeated-pattern-cannot-support-prediction', 'Three years of the same seasonal pattern provide evidence for a reasonable next-year prediction.']
    ])
  })
];
