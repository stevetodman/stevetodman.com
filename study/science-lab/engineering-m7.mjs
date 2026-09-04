const remediation = entries => Object.fromEntries(entries.map(([index, tag, hint]) => [index, { tag, hint }]));
const table = (label, headers, rows) => ({ label, table: { headers, rows } });
const flow = (label, steps) => ({ label, flow: steps });

const meta = ({ sep, ccc, representationType = 'selected-response', sourceFamily, transferLevel = 'none', repair, ...extra }) => ({
  sep,
  ccc,
  representationType,
  sourceFamily: `engineering:${sourceFamily}`,
  transferLevel,
  transfer: transferLevel === 'far',
  ...(repair ? { remediation: repair } : {}),
  ...extra
});

export const M7_ENGINEERING_OVERRIDES = {
  dp1: meta({
    sep: 'Asking Questions and Defining Problems', ccc: 'Structure and Function', representationType: 'criterion-constraint-classification', sourceFamily: 'craft-stick-bridge',
    repair: remediation([
      [0, 'criterion-confused-with-constraint', 'Holding 2 kg describes successful performance. Look for the stated limit on materials.'],
      [2, 'unstated-preference-treated-as-requirement', 'Attractiveness is not listed as a requirement in this problem. Use an explicit limit from the prompt.'],
      [3, 'test-event-treated-as-constraint', 'Testing is an activity, not the stated limit on the design.']
    ])
  }),
  dp2: meta({
    sep: 'Asking Questions and Defining Problems', ccc: 'Cause and Effect', representationType: 'multi-select-requirements', sourceFamily: 'playground-shade',
    repair: remediation([
      [2, 'unlimited-money-as-criterion', 'Unlimited money is neither measurable success nor a realistic limit. The problem supplies a maximum cost.'],
      [3, 'uncontrollable-weather-as-constraint', 'Engineers can design shade, but they cannot require the design to make the day cloudy.']
    ])
  }),
  dp3: meta({
    sep: 'Asking Questions and Defining Problems', ccc: 'Structure and Function', representationType: 'problem-statement-evaluation', sourceFamily: 'sediment-filter-brief',
    repair: remediation([
      [0, 'vague-success-goal', '“Good” cannot be measured consistently. Look for a need with specific performance and resource limits.'],
      [2, 'topic-is-not-design-problem', 'A topic does not state what should be designed or how success will be judged.'],
      [3, 'unbounded-build-request', '“Any object” provides no need, success criterion, or constraint.']
    ])
  }),
  cs1: meta({
    sep: 'Analyzing and Interpreting Data', ccc: 'Scale, Proportion, and Quantity', representationType: 'criteria-constraint-table', sourceFamily: 'bridge-load-cost',
    repair: remediation([
      [0, 'meets-cost-but-misses-criterion', 'Design A is within budget but holds less than the required 1,000 g. Check both requirements.'],
      [2, 'meets-criterion-but-breaks-constraint', 'Design C holds enough mass but costs more than the $4 limit.'],
      [3, 'overlooks-feasible-solution', 'Check Design B against both the load criterion and cost constraint.']
    ])
  }),
  cs2: meta({
    sep: 'Engaging in Argument from Evidence', ccc: 'Structure and Function', representationType: 'comparison-rationale', sourceFamily: 'multiple-solution-tradeoffs',
    repair: remediation([
      [1, 'first-idea-is-best', 'An idea’s order does not show how well it meets criteria or constraints.'],
      [2, 'comparison-removes-constraints', 'Comparison helps engineers work within constraints; it does not make the limits disappear.'],
      [3, 'design-evidence-is-useless', 'Test and comparison evidence shows how each solution performs.']
    ])
  }),
  cs3: meta({
    sep: 'Engaging in Argument from Evidence', ccc: 'Cause and Effect', representationType: 'multi-select-comparison-evidence', sourceFamily: 'rain-shelter-evidence',
    repair: remediation([
      [2, 'preference-substitutes-for-evidence', 'Favorite color is useful only if appearance is an explicit criterion; it does not measure leakage or cost here.'],
      [3, 'label-substitutes-for-performance', 'A design’s name does not reveal how well it performs or whether it meets constraints.']
    ])
  }),
  ft1: meta({
    sep: 'Planning and Carrying Out Investigations', ccc: 'Cause and Effect', representationType: 'controlled-variable-selection', sourceFamily: 'paper-airplane-wings',
    repair: remediation([
      [0, 'tested-variable-held-constant', 'Wing shape is the variable being compared, so it must change among designs. Keep other important conditions constant.'],
      [2, 'desired-result-is-control', 'A hoped-for result is not a test condition that can be held constant.'],
      [3, 'outcome-held-constant', 'Flight distance is the outcome to measure, not a condition to force to be the same.']
    ])
  }),
  ft2: meta({
    sep: 'Planning and Carrying Out Investigations', ccc: 'Patterns', representationType: 'repeated-trial-reasoning', sourceFamily: 'repeat-design-trials',
    repair: remediation([
      [1, 'repetition-renames-design', 'Repeating a trial gathers more performance data; it does not change the design’s name.'],
      [2, 'one-trial-produces-no-data', 'One trial produces data, but it may be unusually high or low. Repetition reveals consistency.'],
      [3, 'testing-creates-criteria', 'Criteria should be defined before testing. Repeated trials evaluate performance against them.']
    ])
  }),
  ft3: meta({
    sep: 'Analyzing and Interpreting Data', ccc: 'Cause and Effect', representationType: 'data-based-revision', sourceFamily: 'gravel-filter-trials',
    repair: remediation([
      [1, 'appearance-only-revision', 'Color was not tested and is not linked to water clarity. Revise a feature supported by the results.'],
      [2, 'remove-essential-system-part', 'Removing the container does not follow from the clarity data and would prevent the filter from holding its materials.'],
      [3, 'revision-ignores-evidence', 'Engineering revision should respond to measured performance, not avoid the results.']
    ])
  })
};

function item({ id, skill, standard, prompt, choices, answer, explanation, sep, ccc, representationType = 'selected-response', sourceFamily, transferLevel = 'none', stimulus, repair }) {
  return {
    id,
    unit: 'engineering',
    skill,
    standard,
    prompt,
    choices,
    answer,
    explanation,
    sep,
    ccc,
    representationType,
    sourceFamily: `engineering:${sourceFamily}`,
    transferLevel,
    transfer: transferLevel === 'far',
    ...(stimulus ? { stimulus } : {}),
    ...(repair ? { remediation: repair } : {})
  };
}

export const M7_ENGINEERING_ITEMS = [
  item({
    id: 'dp4', skill: 'design-problem', standard: '3-5-ETS1-1',
    prompt: 'A team must design a lunch container that keeps food below 10°C for two hours, weighs under 200 g, and uses at most $6 of materials. Which statement is correct?',
    choices: ['Keeping food below 10°C for two hours is a criterion; the mass and cost limits are constraints', 'The cost limit is the only criterion', 'The food temperature is a constraint but cannot be measured', 'Color is the main criterion even though none is specified'], answer: 0,
    explanation: 'The temperature target defines successful performance. Maximum mass and cost limit the possible solutions.',
    sep: 'Asking Questions and Defining Problems', ccc: 'Structure and Function', representationType: 'requirement-classification', sourceFamily: 'cold-lunch-container', transferLevel: 'near',
    repair: remediation([
      [1, 'constraint-called-only-criterion', 'A maximum cost limits the solution. Identify the measurable performance the container must achieve.'],
      [2, 'measurable-criterion-called-constraint', 'Temperature can be measured and describes desired performance, so it is a criterion.'],
      [3, 'invented-aesthetic-criterion', 'Do not add an unstated preference. Use the explicit temperature, mass, and cost requirements.']
    ])
  }),
  item({
    id: 'dp5', skill: 'design-problem', standard: '3-5-ETS1-1',
    prompt: 'Residents need a warning device for a frequently flooded road. Which question most improves the engineering problem definition?',
    choices: ['How early must the warning appear, and what weather and power limits must the device withstand?', 'Which team member has the favorite color?', 'Can the device ignore drivers at night?', 'Can all limits be removed before designing?'], answer: 0,
    explanation: 'Useful problem definition clarifies stakeholder needs, measurable success, and constraints such as environment and power.',
    sep: 'Asking Questions and Defining Problems', ccc: 'Cause and Effect', representationType: 'stakeholder-question', sourceFamily: 'flooded-road-warning',
    repair: remediation([
      [1, 'personal-preference-replaces-user-need', 'A team preference does not clarify what road users need the device to do.'],
      [2, 'excludes-critical-use-condition', 'Night visibility is a use condition to address, not a reason to ignore drivers.'],
      [3, 'engineering-has-no-constraints', 'Constraints are part of real problems. Clarify them so solutions can be evaluated honestly.']
    ])
  }),
  item({
    id: 'dp6', skill: 'design-problem', standard: '3-5-ETS1-1',
    prompt: 'A school entrance needs a portable ramp. Which problem statement is most complete?',
    choices: ['Design a ramp that safely supports 250 kg, fits the doorway, can be moved by two adults, and costs under $400', 'Build a nice ramp', 'Make the entrance different', 'Choose any material and do not test it'], answer: 0,
    explanation: 'The complete statement identifies the need, measurable criteria, and important size, portability, and cost constraints.',
    sep: 'Asking Questions and Defining Problems', ccc: 'Structure and Function', representationType: 'design-brief-evaluation', sourceFamily: 'portable-entry-ramp',
    repair: remediation([
      [1, 'vague-quality-without-measures', '“Nice” does not specify safety, fit, portability, or cost.'],
      [2, 'change-without-defined-need', 'A request for difference alone does not define a problem or success.'],
      [3, 'unbounded-untested-solution', 'Materials and testing must connect to the stated need and limits.']
    ])
  }),
  item({
    id: 'dp7', skill: 'design-problem', standard: '3-5-ETS1-1',
    prompt: 'A class surveys students before designing a quieter study area. Which information is most useful for setting measurable criteria?',
    choices: ['Current sound levels and the sound level students can study comfortably in', 'The alphabetical order of student names', 'The wall color in an unrelated classroom', 'A promise that everyone will like the final design'], answer: 0,
    explanation: 'Current and desired sound measurements help define the performance gap and a testable criterion.',
    sep: 'Obtaining, Evaluating, and Communicating Information', ccc: 'Cause and Effect', representationType: 'needs-evidence', sourceFamily: 'quiet-study-area',
    repair: remediation([
      [1, 'names-define-performance', 'Names do not measure the noise problem or desired performance.'],
      [2, 'unrelated-color-defines-acoustics', 'An unrelated color does not establish a sound-level need.'],
      [3, 'universal-approval-as-measurable-criterion', 'A guarantee of universal preference is unrealistic and not a useful sound-performance measure.']
    ])
  }),
  item({
    id: 'dp8', skill: 'design-problem', standard: '3-5-ETS1-1',
    prompt: 'Wildlife must cross a busy road between two forest areas. Which statement best transfers criteria-and-constraints thinking to this unfamiliar problem?',
    choices: ['Design a crossing used by target animals that keeps them separated from traffic, fits the site, and stays within the available budget', 'Build the tallest structure possible even if animals avoid it', 'Remove every constraint so no comparison is needed', 'Define success only as looking attractive to drivers'], answer: 0,
    explanation: 'A useful definition centers the need and stakeholders, states measurable performance, and includes site and resource limits.',
    sep: 'Asking Questions and Defining Problems', ccc: 'Systems and System Models', representationType: 'far-transfer-problem-definition', sourceFamily: 'wildlife-road-crossing', transferLevel: 'far',
    repair: remediation([
      [1, 'maximize-feature-without-user-need', 'Height matters only if evidence connects it to safe animal use. Center the actual need.'],
      [2, 'constraints-can-be-erased', 'Site and budget limits remain part of the real problem even when they are difficult.'],
      [3, 'appearance-replaces-safety-function', 'Driver appearance does not measure whether animals cross safely.']
    ])
  }),

  item({
    id: 'cs4', skill: 'compare-solutions', standard: '3-5-ETS1-2',
    prompt: 'A container must keep water at least 8°C cooler than room temperature and cost no more than $5. Which design meets both requirements?',
    choices: ['A', 'B', 'C', 'All three'], answer: 1,
    explanation: 'Design B cools by 9°C and costs $4, meeting both the performance criterion and cost constraint.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Scale, Proportion, and Quantity', representationType: 'performance-cost-table', sourceFamily: 'insulated-container-comparison',
    stimulus: table('Container designs', ['Design', 'Temperature reduction', 'Cost'], [['A', '6°C', '$3'], ['B', '9°C', '$4'], ['C', '11°C', '$7']]),
    repair: remediation([
      [0, 'low-cost-solution-misses-performance', 'Design A meets the cost limit but does not reach the required 8°C reduction.'],
      [2, 'high-performance-solution-breaks-budget', 'Design C exceeds the temperature criterion but costs more than $5.'],
      [3, 'assumes-all-options-meet-both', 'Check each row against both numbers; some designs meet only one requirement.']
    ])
  }),
  item({
    id: 'cs5', skill: 'compare-solutions', standard: '3-5-ETS1-2',
    prompt: 'Two flood barriers are tested. Barrier A is inexpensive and leaks 4 L; Barrier B costs twice as much and leaks 1 L. What is the strongest comparison?',
    choices: ['Barrier B limits water better, while Barrier A costs less; the choice depends on the stated priorities and limits', 'Barrier A is automatically best because it is cheaper', 'Barrier B has no weakness', 'The test gives no useful evidence'], answer: 0,
    explanation: 'The evidence shows a performance-cost tradeoff. Engineers evaluate that tradeoff against the problem’s criteria and constraints.',
    sep: 'Engaging in Argument from Evidence', ccc: 'Cause and Effect', representationType: 'tradeoff-argument', sourceFamily: 'flood-barrier-tradeoff', transferLevel: 'near',
    repair: remediation([
      [1, 'cost-alone-decides-solution', 'Cost is important, but the leakage criterion also matters. Compare both.'],
      [2, 'higher-performance-means-no-weakness', 'Barrier B performs better in leakage but has the stated cost disadvantage.'],
      [3, 'measured-comparison-is-useless', 'Leakage and cost are directly relevant if the problem includes water control and budget.']
    ])
  }),
  item({
    id: 'cs6', skill: 'compare-solutions', standard: '3-5-ETS1-2',
    prompt: 'A playground needs a surface that reduces impact and can be used after rain. Which evidence should receive the greatest weight?',
    choices: ['Impact-test results and drainage measurements', 'The product names', 'Which sample arrived first', 'A color vote when color is not a criterion'], answer: 0,
    explanation: 'Evidence should match the defined criteria. Impact and drainage tests directly measure safety performance and wet-weather use.',
    sep: 'Obtaining, Evaluating, and Communicating Information', ccc: 'Structure and Function', representationType: 'evidence-relevance', sourceFamily: 'playground-surface-comparison',
    repair: remediation([
      [1, 'product-name-as-performance', 'A name does not measure impact reduction or drainage.'],
      [2, 'arrival-order-as-design-quality', 'Delivery order does not show how the surface performs.'],
      [3, 'unstated-preference-dominates', 'A color vote should not outweigh the explicit performance criteria when color was not defined as a goal.']
    ])
  }),
  item({
    id: 'cs7', skill: 'compare-solutions', standard: '3-5-ETS1-2',
    prompt: 'Prototype A is strong but heavy. Prototype B is light but bends. What is a productive next design move?',
    choices: ['Use evidence about both to propose a design that keeps needed strength while reducing mass', 'Copy A without considering mass', 'Copy B without considering strength', 'Average the prototype names'], answer: 0,
    explanation: 'Comparing strengths and weaknesses can reveal useful features to combine or revise toward the full set of requirements.',
    sep: 'Constructing Explanations and Designing Solutions', ccc: 'Structure and Function', representationType: 'feature-synthesis', sourceFamily: 'strong-light-prototype-synthesis',
    repair: remediation([
      [1, 'copy-strength-ignore-constraint', 'Strength is useful, but the mass problem remains. Use evidence from both prototypes.'],
      [2, 'copy-lightness-ignore-criterion', 'Low mass is useful, but bending may fail the strength criterion.'],
      [3, 'labels-can-be-averaged', 'Names carry no performance information. Compare tested features and outcomes.']
    ])
  }),
  item({
    id: 'cs8', skill: 'compare-solutions', standard: '3-5-ETS1-2',
    prompt: 'A remote observatory needs a shield that blocks windblown ice but still allows cooling air to pass. Which conclusion best transfers solution-comparison reasoning to this new setting?',
    choices: ['Compare ice blockage, airflow, mass, and cost for several shields because one design may not be best on every measure', 'Choose the heaviest shield without testing', 'Use only the designer’s favorite shape', 'Assume any shield that blocks some ice meets every need'], answer: 0,
    explanation: 'Multiple relevant measures reveal strengths and weaknesses. The best-supported choice balances the defined criteria and constraints.',
    sep: 'Engaging in Argument from Evidence', ccc: 'Structure and Function', representationType: 'far-transfer-multicriteria-comparison', sourceFamily: 'observatory-ice-airflow-shield', transferLevel: 'far',
    repair: remediation([
      [1, 'maximize-mass-without-evidence', 'Greater mass may create transport or support problems and does not prove airflow or blockage performance.'],
      [2, 'preference-replaces-multicriteria-evidence', 'Favorite shape does not measure any of the stated functions or limits.'],
      [3, 'one-criterion-means-complete-success', 'Blocking ice addresses only part of the need; airflow and constraints still matter.']
    ])
  }),

  item({
    id: 'ft4', skill: 'fair-tests', standard: '3-5-ETS1-3',
    prompt: 'Students compare three towel materials for absorbing a spill. Which plan is fairest?',
    choices: ['Use equal-size samples, equal water volumes, and equal contact times while changing only the material', 'Use a larger sample for the favorite material', 'Pour different water amounts on each sample', 'Stop each trial whenever it looks finished'], answer: 0,
    explanation: 'Changing only material while controlling sample size, water volume, and contact time supports a cause-and-effect comparison.',
    sep: 'Planning and Carrying Out Investigations', ccc: 'Cause and Effect', representationType: 'test-plan-evaluation', sourceFamily: 'towel-absorption-test', transferLevel: 'near',
    repair: remediation([
      [1, 'sample-size-confounds-material', 'A larger sample could absorb more because of size, not material. Keep area equal.'],
      [2, 'input-volume-confounds-material', 'Different water amounts make the material effect impossible to isolate.'],
      [3, 'subjective-stop-time-confounds-test', 'Use the same measured contact time so every sample receives the same opportunity.']
    ])
  }),
  item({
    id: 'ft5', skill: 'fair-tests', standard: '3-5-ETS1-3',
    prompt: 'A bridge prototype holds 900 g, 1,300 g, and 1,250 g in three trials. Why should the team avoid reporting only the first trial?',
    choices: ['The repeated results show variation, and the first trial may not represent typical performance', 'Only the lowest result is ever valid', 'Repeating trials changes the criterion', 'The bridge name determines which result counts'], answer: 0,
    explanation: 'Repeated trials reveal consistency and unusual results. Engineers should use the full evidence set when judging performance.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Patterns', representationType: 'repeated-trial-data', sourceFamily: 'bridge-load-replicates',
    stimulus: table('Bridge load trials', ['Trial', 'Maximum mass held'], [['1', '900 g'], ['2', '1,300 g'], ['3', '1,250 g']]),
    repair: remediation([
      [1, 'lowest-trial-is-only-valid-result', 'A low result matters, but the other controlled trials are also evidence. Investigate the pattern and variation.'],
      [2, 'trials-change-criterion', 'The success criterion should stay fixed; repetition improves evidence about whether it is met.'],
      [3, 'label-selects-valid-data', 'A name cannot determine data quality. Use the test conditions and all recorded results.']
    ])
  }),
  item({
    id: 'ft6', skill: 'fair-tests', standard: '3-5-ETS1-3',
    prompt: 'Students changed only blade length on model wind turbines and repeated each test. What revision is best supported by the graph?',
    choices: ['Use 12 cm blades for the next prototype because they produced the greatest average output in this tested range', 'Use 4 cm blades because the shortest must be best', 'Use 16 cm blades even though they were not tested', 'Change blade length and fan speed together so the cause is clearer'], answer: 0,
    explanation: 'Within the tested range, 12 cm blades had the highest average output. The next revision should follow that evidence while preserving a fair comparison.',
    sep: 'Analyzing and Interpreting Data', ccc: 'Patterns', representationType: 'bar-graph-revision', sourceFamily: 'wind-turbine-blade-length',
    stimulus: { graph: { type: 'bar', label: 'Average turbine output by blade length', ariaLabel: 'Bar graph with average outputs 3 for 4 centimeter blades, 7 for 8 centimeter blades, and 9 for 12 centimeter blades', xLabels: ['4 cm', '8 cm', '12 cm'], values: [3, 7, 9], yLabel: 'Average output units', yMin: 0, yMax: 10, yTicks: [0, 2, 4, 6, 8, 10] } },
    repair: remediation([
      [1, 'shortest-feature-assumed-best', 'Read the bar heights rather than using length alone as the decision rule.'],
      [2, 'untested-level-claimed-best', 'An untested length might be worth a future trial, but current evidence cannot show it is best.'],
      [3, 'changes-two-variables-at-once', 'Changing fan speed with blade length would make the cause of an output difference unclear.']
    ])
  }),
  item({
    id: 'ft7', skill: 'fair-tests', standard: '3-5-ETS1-3',
    prompt: 'A rain shelter leaks at the same roof seam in four trials. Which revision-and-test cycle is strongest?',
    choices: ['Reinforce that seam, then retest under the same rainfall conditions and compare leakage', 'Change the seam, roof angle, rainfall, and collection method at once', 'Ignore the repeated leak because the shelter looks good', 'Declare success without another measurement'], answer: 0,
    explanation: 'A repeated failure pattern supports a targeted revision. Retesting under comparable conditions shows whether that revision caused improvement.',
    sep: 'Planning and Carrying Out Investigations', ccc: 'Cause and Effect', representationType: 'iteration-cycle', sourceFamily: 'rain-shelter-seam-revision',
    stimulus: flow('Evidence-based iteration', ['find repeated leak', 'revise seam', 'retest consistently', 'compare leakage']),
    repair: remediation([
      [1, 'many-simultaneous-changes', 'If several design and test conditions change, the source of any improvement is unclear.'],
      [2, 'appearance-overrides-failure-data', 'Appearance does not address the repeated leakage evidence.'],
      [3, 'revision-needs-no-retest', 'A revision is a proposed improvement; a comparable retest provides evidence that it worked.']
    ])
  }),
  item({
    id: 'ft8', skill: 'fair-tests', standard: '3-5-ETS1-3',
    prompt: 'Engineers compare propeller guards for a small underwater robot. Which approach best transfers fair-testing and iteration principles to this unfamiliar system?',
    choices: ['Test each guard at the same motor setting, depth, and course; repeat trials; then revise using collision and travel-time data', 'Give the preferred guard a stronger motor', 'Test each guard in a different course and compare only appearance', 'Choose before collecting collision data'], answer: 0,
    explanation: 'Controlled repeated tests isolate guard design as the main changed variable, while relevant performance data guide revision.',
    sep: 'Planning and Carrying Out Investigations', ccc: 'Cause and Effect', representationType: 'far-transfer-test-design', sourceFamily: 'underwater-robot-propeller-guard', transferLevel: 'far',
    repair: remediation([
      [1, 'motor-setting-confounds-guard', 'A stronger motor could change travel time or collisions independently of guard design.'],
      [2, 'course-and-outcome-do-not-match', 'Different courses prevent a fair comparison, and appearance does not measure protection or motion.'],
      [3, 'decision-before-relevant-data', 'Collect evidence tied to the guard’s purpose before choosing or revising.']
    ])
  })
];
