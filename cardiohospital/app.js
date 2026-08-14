import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { audioSupported, startHcmMurmur, stopHcmMurmur, updateHcmSite, updateHcmValsalva } from "./murmur-audio.js?v=20260814-3";

const canvas = document.querySelector("#world");
const qaMode = new URLSearchParams(window.location.search).has("qa");
function createNoopRenderer() {
  return {
    shadowMap: { enabled: false, type: null },
    userData: { webgl: false },
    outputColorSpace: null,
    toneMapping: null,
    toneMappingExposure: 1,
    setPixelRatio() {},
    setSize() {},
    render() {}
  };
}
let renderer;
if (qaMode) {
  renderer = createNoopRenderer();
} else {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.userData = { webgl: true };
  } catch (error) {
    console.warn("Cardio Hospital could not initialize WebGL.", error);
    renderer = createNoopRenderer();
  }
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#111b1e");
scene.fog = new THREE.Fog("#dbe2e0", 19, 39);
const camera = new THREE.PerspectiveCamera(67, innerWidth / innerHeight, 0.05, 80);
camera.position.set(0, 1.65, 8.55);
const controls = new PointerLockControls(camera, canvas);

if (!renderer.userData.webgl && !qaMode) {
  const warning = document.createElement("p");
  warning.className = "fineprint";
  warning.textContent = "This browser could not initialize WebGL. Use current desktop Chrome with hardware acceleration enabled.";
  warning.style.color = "#f1b862";
  document.querySelector(".entry__content").append(warning);
  document.querySelector("#enterButton").disabled = true;
}

const materialCache = new Map();
function material(color, roughness = .72, metalness = 0) {
  const key = `${color}-${roughness}-${metalness}`;
  if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
  return materialCache.get(key);
}
function box(size, position, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color, options.roughness ?? .72, options.metalness ?? 0));
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  scene.add(mesh);
  return mesh;
}
function cylinder(radius, height, position, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 24), material(color, options.roughness ?? .68, options.metalness ?? 0));
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

scene.add(new THREE.HemisphereLight("#e5f2ff", "#5d5a50", 1.9));
const sun = new THREE.DirectionalLight("#fff1d5", 2.8);
sun.position.set(-8, 12, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -15; sun.shadow.camera.right = 15; sun.shadow.camera.top = 15; sun.shadow.camera.bottom = -15;
scene.add(sun);

function panelLight(x, z) {
  box([1.15, .025, .42], [x, 2.94, z], "#fffbea", { roughness: .15, castShadow: false });
  const light = new THREE.PointLight("#fff8df", 7, 5.4, 2);
  light.position.set(x, 2.7, z);
  scene.add(light);
}

// Team room shell: authentic conference-room proportions plus workstations.
box([10, .12, 8], [0, -.06, 8], "#595b59", { roughness: .96 });
box([10, 3, .16], [0, 1.5, 12], "#e9e6df");
box([.16, 3, 8], [-5, 1.5, 8], "#e9e6df");
box([.16, 3, 8], [5, 1.5, 8], "#788b97");
box([3.8, 3, .16], [-3.1, 1.5, 4], "#e9e6df");
box([3.8, 3, .16], [3.1, 1.5, 4], "#e9e6df");

// Conference table.
box([4.65, .12, 1.78], [0, .84, 8], "#eee9de", { roughness: .4 });
for (const x of [-1.75, 1.75]) for (const z of [7.45, 8.55]) cylinder(.055, .78, [x, .42, z], "#8a9297", { metalness: .45 });
box([.58, .025, .23], [.75, .92, 8.1], "#18232a", { metalness: .2 });
box([.34, .03, .22], [-.7, .92, 7.9], "#30383d");

function chair(x, z, angle = 0) {
  const group = new THREE.Group(); group.position.set(x, 0, z); group.rotation.y = angle; scene.add(group);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(.52,.09,.48), material("#171a1c",.55)); seat.position.y=.52; seat.castShadow=true; group.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(.52,.76,.1), material("#171a1c",.55)); back.position.set(0,.9,.2); back.castShadow=true; group.add(back);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.45,14), material("#62696e",.5,.3)); stem.position.y=.27; group.add(stem);
}
[-1.55,0,1.55].forEach(x=>{chair(x,6.65,0);chair(x,9.35,Math.PI)});

function workstation(z) {
  box([1.45,.08,.62],[-4.45,.76,z],"#59636b",{rotation:[0,Math.PI/2,0]});
  box([.7,.43,.06],[-4.08,1.08,z],"#11181d",{rotation:[0,Math.PI/2,0],metalness:.15});
  box([.015,.33,.58],[-4.04,1.08,z],"#194a5c",{roughness:.25});
}
[6.15,7.9,9.65].forEach(workstation);

// Wall display with stylized rhythm content.
box([4.15,1.18,.08],[0,1.86,11.86],"#10191e",{metalness:.18});
box([3.95,.98,.025],[0,1.86,11.8],"#164d60",{roughness:.23});
[-1.35,-.55,.3,1.15].forEach((x,i)=>box([.52,.018,.01],[x,1.68+(i%2)*.25,11.77],"#7fe0e4",{castShadow:false}));
for (const z of [6.05,8,9.95]) box([.07,.72,1.05],[4.9,2.08,z],"#7790a0",{rotation:[0,Math.PI/2,0],roughness:.95});

function clinician(x,z,coat=true) {
  const body = cylinder(.23,.92,[x,.93,z],coat?"#eff2ef":"#3f8ca4");
  const head = new THREE.Mesh(new THREE.SphereGeometry(.23,20,16),material("#b97858",.76)); head.position.set(x,1.58,z); head.castShadow=true; scene.add(head);
  box([.14,.08,.03],[x,1.1,z-.23],"#184c65");
  return {body,head};
}
clinician(0,10.55,true); clinician(2.65,8.9,false);
cylinder(.24,.42,[4.25,.21,11.1],"#9d8c77"); cylinder(.045,1.2,[4.25,.85,11.1],"#5e4b3c");
for(let i=0;i<5;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.31,12,8),material(i%2?"#416846":"#355a3c",.9));leaf.scale.set(1,.55,.6);leaf.position.set(4.1+(i%2)*.25,.85+i*.23,11.1);leaf.castShadow=true;scene.add(leaf)}
[-2.8,0,2.8].forEach(x=>{panelLight(x,6.2);panelLight(x,9.8)});

// Clinic corridor.
box([4.5,.12,12],[0,-.06,-2],"#d9dedc",{roughness:.84});
box([.16,3,12],[-2.25,1.5,-2],"#f0eee8");
box([.16,3,5.1],[2.25,1.5,1.45],"#f0eee8");
box([.16,3,3.7],[2.25,1.5,-6.15],"#f0eee8");
box([4.5,3,.16],[0,1.5,-8],"#f0eee8");
box([.13,.18,11.6],[-2.12,1,-2],"#89979c",{metalness:.42});
box([.13,.18,5],[2.12,1,1.45],"#89979c",{metalness:.42});
box([.13,.18,3.6],[2.12,1,-6.15],"#89979c",{metalness:.42});
[2.8,.3,-2.2,-4.7,-7].forEach(z=>panelLight(0,z));

// Exam room and opening door.
box([6.2,.12,6],[5.35,-.06,-3],"#cfc6b9",{roughness:.9});
box([6.2,3,.16],[5.35,1.5,0],"#e9eee8");
box([6.2,3,.16],[5.35,1.5,-6],"#d9e7ea");
box([.16,3,6],[8.45,1.5,-3],"#d9e7ea");
box([.16,3,2.1],[2.25,1.5,-1.05],"#e9eee8");
box([.16,3,2.1],[2.25,1.5,-4.95],"#e9eee8");
const doorPivot = new THREE.Group(); doorPivot.position.set(2.25,0,-2.18); scene.add(doorPivot);
const door = new THREE.Mesh(new THREE.BoxGeometry(.08,2.35,1.65),material("#b58b54",.62)); door.position.set(0,1.18,-.82); door.castShadow=true; doorPivot.add(door);
const handle = new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.18),material("#697276",.35,.6)); handle.position.set(-.08,1.05,-1.42);doorPivot.add(handle);

// Exam furniture.
box([.82,.62,1.9],[7.25,.46,-3.7],"#dedbd4");
box([.88,.15,1.93],[7.25,.82,-3.7],"#b4a08e",{roughness:.83});
box([.88,.15,.7],[7.25,1.17,-3.1],"#b4a08e",{rotation:[-.38,0,0],roughness:.83});
box([2.65,.86,.68],[6.4,.43,-5.55],"#5d666a");
box([2.55,.72,.05],[6.4,1.18,-5.83],"#e6e0d5");
box([1.75,.09,.75],[4.05,.76,-5.45],"#59636b");
box([.75,.52,.06],[4.05,1.15,-5.72],"#10181c");
box([.65,.42,.025],[4.05,1.15,-5.68],"#224f5d",{roughness:.24});
cylinder(.32,.12,[5.65,.58,-2.25],"#a79383");cylinder(.045,.48,[5.65,.3,-2.25],"#525b61");
[4.2,6.9].forEach(x=>{panelLight(x,-1.4);panelLight(x,-4.6)});

// Interaction and movement.
const entry = document.querySelector("#entry");
const hud = document.querySelector("#hud");
const prompt = document.querySelector("#prompt");
const lockHint = document.querySelector("#lockHint");
const objective = document.querySelector("#objective");
const briefingBackdrop = document.querySelector("#briefingBackdrop");
const encounter = document.querySelector("#encounter");
const encounterStep = document.querySelector("#encounterStep");
const clinicalSignal = document.querySelector("#clinicalSignal");
let phase = "arrival";
let activeInteraction = null;
let doorTarget = 0;

document.querySelector("#enterButton").addEventListener("click",()=>{entry.classList.add("hidden");hud.classList.remove("hidden");controls.lock()});
controls.addEventListener("lock",()=>lockHint.classList.add("hidden"));
controls.addEventListener("unlock",()=>{if(briefingBackdrop.classList.contains("hidden")&&encounter.classList.contains("hidden"))lockHint.classList.remove("hidden")});

function openBriefing(){briefingBackdrop.classList.remove("hidden");controls.unlock()}
document.querySelector("#closeBriefing").addEventListener("click",()=>briefingBackdrop.classList.add("hidden"));
document.querySelector("#acceptButton").addEventListener("click",()=>{phase="assigned";doorTarget=-Math.PI/2;objective.textContent="Walk to Clinic Room 3";briefingBackdrop.classList.add("hidden")});

const historyAnswers = {
  generic: "He collapsed at basketball practice yesterday. Coach said he just went down.",
  exertional_timing: "It was right in the middle of a sprint drill. He didn't even slow down first.",
  prodrome: "No warning. One second I was running, then I woke up on the floor.",
  palpitations: "Sometimes my chest feels tight when I really push. I didn't say anything.",
  family_sudden_death: "His mother's brother died suddenly at 29. He was healthy and no cause was found.",
  activity_level: "Varsity basketball: practice five days a week and games on weekends."
};
const examAnswers = {
  pulses: "Femoral pulses are 2+ and symmetric.",
  llsb: "Harsh grade 3/6 crescendo-decrescendo systolic murmur at the LLSB.",
  valsalva: "The murmur becomes distinctly louder with Valsalva.",
  pmi: "The PMI is prominent. There is no edema."
};
const testAnswers = {
  ecg: "ECG — Sinus rhythm, LVH by voltage, deep narrow Q waves and lateral T-wave inversion.",
  echo: "Echo — Septum 22 mm; LVOT gradient 45 mmHg at rest and 78 mmHg with Valsalva; systolic anterior motion of the mitral valve.",
  troponin: "Troponin and BNP add no useful discrimination in this stable presentation.",
  mri: "Cardiac MRI may help later with phenotype and scar burden, but is not required before the immediate safety decision."
};
const criticalHistory = new Set(["exertional_timing", "prodrome", "family_sudden_death"]);
const encounterState = {
  history: new Set(), exam: new Set(), tests: new Set(), diagnosis: null, ecgScore: null, startedAt: null
};

function showPanel(id, label) {
  document.querySelectorAll(".clinical-panel").forEach(panel => panel.classList.toggle("hidden", panel.id !== id));
  encounterStep.textContent = label;
  encounter.scrollTop = 0;
}
function openEncounter() {
  if (!encounterState.startedAt) encounterState.startedAt = Date.now();
  encounter.classList.remove("hidden");
  controls.unlock();
}
function closeEncounter() {
  stopHcmMurmur();
  document.querySelector("#ecgBackdrop").classList.add("hidden");
  document.querySelector("#stethoscopeLab").classList.remove("listening");
  document.querySelector("#listenButton").textContent = "Begin listening";
  encounter.classList.add("hidden");
  lockHint.classList.remove("hidden");
}
if (qaMode) {
  document.body.dataset.qaMode = "true";
  const qaToolbar = document.createElement("nav");
  qaToolbar.setAttribute("aria-label", "QA room positioning");
  qaToolbar.style.cssText = "position:fixed;left:12px;bottom:44px;z-index:80;display:flex;gap:6px;padding:7px;border:1px solid rgba(100,216,211,.35);border-radius:7px;background:#071215;color:white";
  const qaTeam = document.createElement("button");
  qaTeam.id = "qaTeam";
  qaTeam.className = "secondary";
  qaTeam.textContent = "QA: Team room";
  qaTeam.addEventListener("click", () => {
    phase = "arrival";
    camera.position.set(0, 1.65, 10.3);
  });
  const qaExam = document.createElement("button");
  qaExam.id = "qaExam";
  qaExam.className = "secondary";
  qaExam.textContent = "QA: Exam door";
  qaExam.addEventListener("click", () => {
    phase = "assigned";
    doorTarget = -Math.PI / 2;
    camera.position.set(2.1, 1.65, -3);
  });
  qaToolbar.append(qaTeam, qaExam);
  document.querySelector("#app").append(qaToolbar);
}
function updateHistorySignal() {
  const redFlags = [...criticalHistory].filter(key => encounterState.history.has(key)).length;
  clinicalSignal.textContent = redFlags === 3 ? "High-risk cardiac syncope" : redFlags ? `${redFlags} of 3 red flags recognized` : "Clinical picture incomplete";
  document.querySelector("#toExam").disabled = encounterState.history.size < 3;
}

document.querySelectorAll("[data-history]").forEach(button => button.addEventListener("click", () => {
  const key = button.dataset.history;
  encounterState.history.add(key);
  button.classList.add("used");
  document.querySelector("#historyResponse").textContent = historyAnswers[key];
  updateHistorySignal();
}));
document.querySelector("#toExam").addEventListener("click", () => {
  showPanel("examPanel", "Examination");
  clinicalSignal.textContent = "Focused cardiac examination";
});

document.querySelectorAll("[data-exam]").forEach(button => button.addEventListener("click", () => {
  const key = button.dataset.exam;
  encounterState.exam.add(key);
  button.classList.add("used");
  document.querySelector("#examResponse").textContent = examAnswers[key];
  document.querySelector("#toTests").disabled = encounterState.exam.size < 2;
  if (encounterState.exam.has("llsb") && encounterState.exam.has("valsalva")) clinicalSignal.textContent = "Dynamic outflow murmur identified";
}));

const siteDetails = {
  RUSB: { name: "RUSB · Aortic area", finding: "Normal S1 and S2. The systolic murmur is faint here.", left: 46, top: 65 },
  LUSB: { name: "LUSB · Pulmonic area", finding: "Soft systolic murmur, grade 2/6.", left: 139, top: 65 },
  LLSB: { name: "LLSB · Tricuspid area", finding: "Harsh crescendo-decrescendo systolic murmur, grade 3/6.", left: 132, top: 132 },
  Apex: { name: "Apex · Mitral area", finding: "S1 is normal with a faint holosystolic component.", left: 167, top: 194 }
};
let selectedSite = "RUSB";
let stethoscopeListening = false;
const stethoscopeLab = document.querySelector("#stethoscopeLab");
const chestpiece = document.querySelector("#chestpiece");
const listenButton = document.querySelector("#listenButton");
const valsalvaToggle = document.querySelector("#valsalvaToggle");

function renderStethoscopeSite() {
  const detail = siteDetails[selectedSite];
  document.querySelector("#siteName").textContent = detail.name;
  document.querySelector("#siteFinding").textContent = valsalvaToggle.checked && selectedSite === "LLSB" ? `${detail.finding} It becomes distinctly louder with Valsalva.` : detail.finding;
  chestpiece.style.left = `${detail.left}px`;
  chestpiece.style.top = `${detail.top}px`;
  document.querySelectorAll("[data-site]").forEach(button => button.classList.toggle("selected", button.dataset.site === selectedSite));
  updateHcmSite(selectedSite);
  if (selectedSite === "LLSB") encounterState.exam.add("llsb");
  document.querySelector("#toTests").disabled = encounterState.exam.size < 2;
}
document.querySelector("#openStethoscope").addEventListener("click", () => {
  stethoscopeLab.classList.remove("hidden");
  document.querySelector("#openStethoscope").classList.add("used");
  clinicalSignal.textContent = "Map the murmur across the precordium";
  renderStethoscopeSite();
});
document.querySelectorAll("[data-site]").forEach(button => button.addEventListener("click", () => {
  selectedSite = button.dataset.site;
  renderStethoscopeSite();
}));
listenButton.addEventListener("click", async () => {
  if (stethoscopeListening) {
    stopHcmMurmur();
    stethoscopeListening = false;
    stethoscopeLab.classList.remove("listening");
    listenButton.textContent = "Begin listening";
    return;
  }
  if (!audioSupported()) {
    document.querySelector("#siteFinding").textContent = "Web Audio is unavailable in this browser. The visual findings remain active.";
    return;
  }
  const started = await startHcmMurmur(selectedSite, valsalvaToggle.checked);
  if (started) {
    stethoscopeListening = true;
    stethoscopeLab.classList.add("listening");
    listenButton.textContent = "Stop listening";
    renderStethoscopeSite();
  }
});
valsalvaToggle.addEventListener("change", () => {
  updateHcmValsalva(valsalvaToggle.checked);
  if (valsalvaToggle.checked) encounterState.exam.add("valsalva");
  else encounterState.exam.delete("valsalva");
  if (encounterState.exam.has("llsb") && encounterState.exam.has("valsalva")) clinicalSignal.textContent = "Murmur increases with reduced preload";
  renderStethoscopeSite();
});
document.querySelector("#toTests").addEventListener("click", () => {
  stopHcmMurmur();
  stethoscopeListening = false;
  stethoscopeLab.classList.remove("listening");
  listenButton.textContent = "Begin listening";
  showPanel("testsPanel", "Diagnostic testing");
  clinicalSignal.textContent = "Select high-yield studies";
});

const ecgBackdrop = document.querySelector("#ecgBackdrop");
const ecgSvgGroup = document.querySelector("#ecgTraces");
let ecgSpeed = 25;
let ecgGain = 10;
const leadProfiles = {
  I:   { q: -.34, r: 1.25, s: -.18, t: -.34 },
  aVR: { q: .06, r: -.72, s: .16, t: .22, p: -.08 },
  V1:  { q: -.04, r: .28, s: -.9, t: -.18 },
  V4:  { q: -.2, r: 1.75, s: -.15, t: -.28 },
  II:  { q: -.1, r: 1.05, s: -.2, t: .3 },
  aVL: { q: -.38, r: 1.15, s: -.12, t: -.4 },
  V2:  { q: -.08, r: .62, s: -.78, t: -.16 },
  V5:  { q: -.42, r: 1.95, s: -.12, t: -.48 },
  III: { q: -.08, r: .62, s: -.25, t: .2 },
  aVF: { q: -.09, r: .78, s: -.22, t: .2 },
  V3:  { q: -.13, r: 1.2, s: -.42, t: -.1 },
  V6:  { q: -.36, r: 1.62, s: -.08, t: -.42 }
};
const leadLayout = [
  ["I", "aVR", "V1", "V4"],
  ["II", "aVL", "V2", "V5"],
  ["III", "aVF", "V3", "V6"]
];
const SVG_NS = "http://www.w3.org/2000/svg";

function gaussian(phase, center, width) {
  const distance = phase - center;
  return Math.exp(-(distance * distance) / (2 * width * width));
}
function waveform(phase, profile) {
  const p = profile.p ?? .12;
  return p * gaussian(phase, .12, .028)
    + profile.q * gaussian(phase, .235, .011)
    + profile.r * gaussian(phase, .258, .008)
    + profile.s * gaussian(phase, .285, .012)
    + profile.t * gaussian(phase, .53, .072);
}
function tracePath(x, baseline, width, profile, cycles) {
  const points = Math.max(420, Math.round(width * 1.7));
  const amplitudeScale = ecgGain * 5;
  let path = "";
  for (let i = 0; i <= points; i += 1) {
    const fraction = i / points;
    const phasePosition = fraction * cycles;
    const phase = phasePosition - Math.floor(phasePosition);
    const value = waveform(phase, profile) + Math.sin(fraction * Math.PI * 2) * .008;
    const px = x + fraction * width;
    const py = baseline - value * amplitudeScale;
    path += `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)} `;
  }
  return path;
}
function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}
function renderEcg() {
  ecgSvgGroup.replaceChildren();
  const segmentCycles = ecgSpeed === 25 ? 2.75 : 1.375;
  const xPositions = [22, 316, 610, 904];
  const baselines = [112, 268, 424];
  leadLayout.forEach((row, rowIndex) => row.forEach((lead, columnIndex) => {
    const x = xPositions[columnIndex];
    const baseline = baselines[rowIndex];
    const label = svgElement("text", { x: x + 4, y: baseline - 60, fill: "#51272c", "font-size": "16", "font-family": "ui-monospace, monospace", "font-weight": "700" });
    label.textContent = lead;
    const trace = svgElement("path", { d: tracePath(x + 4, baseline, 270, leadProfiles[lead], segmentCycles), fill: "none", stroke: "#171717", "stroke-width": "2", "stroke-linejoin": "round" });
    ecgSvgGroup.append(label, trace);
  }));
  const rhythmLabel = svgElement("text", { x: "26", y: "520", fill: "#51272c", "font-size": "16", "font-family": "ui-monospace, monospace", "font-weight": "700" });
  rhythmLabel.textContent = "II  rhythm";
  const rhythmCycles = ecgSpeed === 25 ? 11 : 5.5;
  const rhythmTrace = svgElement("path", { d: tracePath(26, 585, 1145, leadProfiles.II, rhythmCycles), fill: "none", stroke: "#171717", "stroke-width": "2", "stroke-linejoin": "round" });
  const calibrationHeight = ecgGain * 5;
  const calibration = svgElement("path", { d: `M26 665 L38 665 L38 ${665-calibrationHeight} L88 ${665-calibrationHeight} L88 665 L102 665`, fill: "none", stroke: "#171717", "stroke-width": "2" });
  const calibrationLabel = svgElement("text", { x: "112", y: "668", fill: "#51272c", "font-size": "13", "font-family": "ui-monospace, monospace" });
  calibrationLabel.textContent = "1 mV";
  ecgSvgGroup.append(rhythmLabel, rhythmTrace, calibration, calibrationLabel);
  document.querySelector("#ecgCalibration").textContent = `${ecgSpeed} mm/s · ${ecgGain} mm/mV`;
}
function openEcgReader() {
  renderEcg();
  ecgBackdrop.classList.remove("hidden");
}
function closeEcgReader() {
  ecgBackdrop.classList.add("hidden");
}
function renderTestResults() {
  document.querySelector("#testResponse").textContent = [...encounterState.tests].map(test => testAnswers[test]).join("\n\n") || "No studies ordered.";
  document.querySelector("#toAssessment").disabled = encounterState.tests.size < 1;
  if (encounterState.tests.has("ecg") && encounterState.tests.has("echo")) clinicalSignal.textContent = "HCM phenotype confirmed";
}
document.querySelectorAll("[data-speed]").forEach(button => button.addEventListener("click", () => {
  ecgSpeed = Number(button.dataset.speed);
  document.querySelectorAll("[data-speed]").forEach(control => control.classList.toggle("selected", control === button));
  renderEcg();
}));
document.querySelectorAll("[data-gain]").forEach(button => button.addEventListener("click", () => {
  ecgGain = Number(button.dataset.gain);
  document.querySelectorAll("[data-gain]").forEach(control => control.classList.toggle("selected", control === button));
  renderEcg();
}));
document.querySelector("#closeEcg").addEventListener("click", closeEcgReader);
document.querySelector("#submitEcg").addEventListener("click", () => {
  const selected = new Set([...document.querySelectorAll(".finding-grid input:checked")].map(input => input.value));
  const correct = new Set(["sinus", "lvh", "lateral_q", "lateral_t"]);
  const missed = [...correct].filter(finding => !selected.has(finding));
  const falsePositives = [...selected].filter(finding => !correct.has(finding));
  encounterState.ecgScore = Math.round(((7 - missed.length - falsePositives.length) / 7) * 100);
  encounterState.tests.add("ecg");
  document.querySelector('[data-test="ecg"]').classList.add("used");
  const feedback = document.querySelector("#ecgFeedback");
  feedback.classList.toggle("correct", missed.length === 0 && falsePositives.length === 0);
  feedback.textContent = missed.length === 0 && falsePositives.length === 0
    ? "Complete interpretation: sinus rhythm with LVH, deep narrow lateral Q waves, and lateral repolarization abnormality. QTc 432 ms."
    : `Interpretation score ${encounterState.ecgScore}%. ${missed.length ? `${missed.length} key finding(s) missed.` : "No key findings missed."} ${falsePositives.length ? `${falsePositives.length} unsupported finding(s) selected.` : "No unsupported findings selected."}`;
  renderTestResults();
  clinicalSignal.textContent = `ECG interpretation ${encounterState.ecgScore}%`;
  document.querySelector("#submitEcg").textContent = "Update interpretation";
});

document.querySelectorAll("[data-test]").forEach(button => button.addEventListener("click", () => {
  const key = button.dataset.test;
  if (key === "ecg") {
    openEcgReader();
    return;
  }
  encounterState.tests.add(key);
  button.classList.add("used");
  if (key === "troponin" || key === "mri") button.classList.add("unnecessary");
  renderTestResults();
}));
document.querySelector("#toAssessment").addEventListener("click", () => {
  showPanel("assessmentPanel", "Assessment + plan");
  clinicalSignal.textContent = "Commit your clinical judgment";
});

function updateFinishState() {
  const planSelected = document.querySelectorAll("#assessmentPanel input:checked").length > 0;
  document.querySelector("#finishEncounter").disabled = !encounterState.diagnosis || !planSelected;
}
document.querySelectorAll("[data-diagnosis]").forEach(button => button.addEventListener("click", () => {
  encounterState.diagnosis = button.dataset.diagnosis;
  document.querySelectorAll("[data-diagnosis]").forEach(choice => choice.classList.toggle("selected", choice === button));
  updateFinishState();
}));
document.querySelectorAll("#assessmentPanel input").forEach(input => input.addEventListener("change", updateFinishState));

function scoreEncounter() {
  const plan = new Set([...document.querySelectorAll("#assessmentPanel input:checked")].map(input => input.value));
  const redFlags = [...criticalHistory].filter(key => encounterState.history.has(key)).length;
  const history = Math.round(40 + redFlags * 20);
  const exam = Math.min(100, 40 + (encounterState.exam.has("llsb") ? 30 : 0) + (encounterState.exam.has("valsalva") ? 30 : 0));
  const appropriateTests = ["ecg", "echo"].filter(test => encounterState.tests.has(test)).length;
  const unnecessaryTests = ["troponin", "mri"].filter(test => encounterState.tests.has(test)).length;
  const testSelection = Math.max(20, 40 + appropriateTests * 30 - unnecessaryTests * 15);
  const ecgInterpretation = encounterState.ecgScore ?? 0;
  const reasoning = encounterState.diagnosis === "hcm" ? Math.round(70 + ecgInterpretation * .3) : Math.round(20 + ecgInterpretation * .1);
  const safety = Math.max(10, (plan.has("restrict") ? 100 : 25) - (plan.has("reassure") ? 35 : 0));
  const efficiency = Math.max(40, 100 - unnecessaryTests * 25);
  const communication = Math.min(100, 60 + (plan.has("family") ? 20 : 0) + (plan.has("genetics") ? 20 : 0));
  const dimensions = { History: history, Examination: exam, "Test selection": testSelection, Reasoning: reasoning, Safety: safety, Efficiency: efficiency, Communication: communication };
  const overall = Math.round(Object.values(dimensions).reduce((sum, value) => sum + value, 0) / Object.keys(dimensions).length);
  return { dimensions, overall, ecgInterpretation, plan: [...plan], elapsedSeconds: Math.round((Date.now() - encounterState.startedAt) / 1000) };
}
document.querySelector("#finishEncounter").addEventListener("click", () => {
  const result = scoreEncounter();
  showPanel("debriefPanel", "Debrief");
  clinicalSignal.textContent = `Overall ${result.overall}%`;
  document.querySelector("#debriefHeadline").textContent = result.overall >= 85 ? "Strong clinical judgment" : result.overall >= 70 ? "Safe, with missed opportunities" : "Revisit the red flags";
  document.querySelector("#debriefSummary").textContent = encounterState.diagnosis === "hcm" ? "You identified hypertrophic cardiomyopathy and reached the attending debrief." : "Your diagnosis did not fully account for the mid-exertional collapse and family history.";
  document.querySelector("#scoreGrid").innerHTML = Object.entries(result.dimensions).map(([label, value]) => `<div><span>${label}</span><strong>${value}%</strong></div>`).join("");
  objective.textContent = "Review your debrief with Dr. Patel";
  const attempts = JSON.parse(localStorage.getItem("cardio_hospital:v1:preview_attempts") || "[]");
  attempts.push({ caseId: "case-hcm", completedAt: new Date().toISOString(), ...result });
  localStorage.setItem("cardio_hospital:v1:preview_attempts", JSON.stringify(attempts.slice(-20)));
});

function resetEncounter() {
  stopHcmMurmur(); stethoscopeListening = false; selectedSite = "RUSB";
  encounterState.history.clear(); encounterState.exam.clear(); encounterState.tests.clear(); encounterState.diagnosis = null; encounterState.ecgScore = null; encounterState.startedAt = Date.now();
  document.querySelectorAll(".clinical-action").forEach(button => button.classList.remove("used", "unnecessary"));
  document.querySelectorAll(".choice").forEach(button => button.classList.remove("selected"));
  document.querySelectorAll("#assessmentPanel input").forEach(input => { input.checked = false; });
  document.querySelector("#historyResponse").textContent = "Marcus and his mother wait for your first question.";
  document.querySelector("#examResponse").textContent = "Well-appearing, tall, muscular adolescent. No acute distress.";
  document.querySelector("#testResponse").textContent = "No studies ordered.";
  ecgBackdrop.classList.add("hidden");
  document.querySelectorAll(".finding-grid input").forEach(input => { input.checked = false; });
  document.querySelector("#ecgFeedback").classList.remove("correct");
  document.querySelector("#ecgFeedback").textContent = "The machine interpretation is intentionally hidden.";
  document.querySelector("#submitEcg").textContent = "Commit ECG interpretation";
  stethoscopeLab.classList.add("hidden"); stethoscopeLab.classList.remove("listening");
  listenButton.textContent = "Begin listening"; valsalvaToggle.checked = false;
  ["#toExam", "#toTests", "#toAssessment", "#finishEncounter"].forEach(id => { document.querySelector(id).disabled = true; });
  clinicalSignal.textContent = "Clinical picture incomplete";
  showPanel("historyPanel", "History");
}
document.querySelector("#resetEncounter").addEventListener("click", resetEncounter);
document.querySelector("#closeEncounter").addEventListener("click", closeEncounter);
document.querySelector("#resumeWorld").addEventListener("click", closeEncounter);

const keys = new Set();
addEventListener("keydown",event=>{
  keys.add(event.code);
  if(event.code==="KeyE"&&!event.repeat){if(activeInteraction==="attending")openBriefing();if(activeInteraction==="exam"){phase="encounter";objective.textContent="Complete Marcus Chen's evaluation";openEncounter()}}
});
addEventListener("keyup",event=>keys.delete(event.code));

function allowed(x,z){
  const team=x>-4.68&&x<4.68&&z>4.28&&z<11.68;
  const corridor=x>-2.02&&x<2.02&&z>-7.68&&z<4.4;
  const doorway=x>1.75&&x<2.75&&z>-3.92&&z<-2.08;
  const room=x>2.38&&x<8.12&&z>-5.68&&z<-.32;
  return team||corridor||doorway||room;
}

const clock = new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);
  doorPivot.rotation.y=THREE.MathUtils.damp(doorPivot.rotation.y,doorTarget,7,dt);
  if(controls.isLocked){
    const previous=camera.position.clone();const speed=(keys.has("ShiftLeft")||keys.has("ShiftRight")?3.7:2.3)*dt;
    if(keys.has("KeyW")||keys.has("ArrowUp"))controls.moveForward(speed);
    if(keys.has("KeyS")||keys.has("ArrowDown"))controls.moveForward(-speed);
    if(keys.has("KeyA")||keys.has("ArrowLeft"))controls.moveRight(-speed);
    if(keys.has("KeyD")||keys.has("ArrowRight"))controls.moveRight(speed);
    if(!allowed(camera.position.x,camera.position.z))camera.position.copy(previous);
    camera.position.y=1.65;
  }
  const attending=Math.hypot(camera.position.x,camera.position.z-10.3);
  const exam=Math.hypot(camera.position.x-2.2,camera.position.z+3);
  activeInteraction=null;
  if(phase==="arrival"&&attending<2.15){activeInteraction="attending";prompt.textContent="E  Speak with Dr. Patel"}
  else if(phase==="assigned"&&exam<2.2){activeInteraction="exam";prompt.textContent="E  Enter Clinic Room 3"}
  prompt.classList.toggle("hidden",!activeInteraction);
  renderer.render(scene,camera);
}
animate();

addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7))});
