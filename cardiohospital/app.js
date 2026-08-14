import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

const canvas = document.querySelector("#world");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
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
let phase = "arrival";
let activeInteraction = null;
let doorTarget = 0;

document.querySelector("#enterButton").addEventListener("click",()=>{entry.classList.add("hidden");hud.classList.remove("hidden");controls.lock()});
controls.addEventListener("lock",()=>lockHint.classList.add("hidden"));
controls.addEventListener("unlock",()=>{if(briefingBackdrop.classList.contains("hidden")&&encounter.classList.contains("hidden"))lockHint.classList.remove("hidden")});

function openBriefing(){briefingBackdrop.classList.remove("hidden");controls.unlock()}
document.querySelector("#closeBriefing").addEventListener("click",()=>briefingBackdrop.classList.add("hidden"));
document.querySelector("#acceptButton").addEventListener("click",()=>{phase="assigned";doorTarget=-Math.PI/2;objective.textContent="Walk to Clinic Room 3";briefingBackdrop.classList.add("hidden")});
document.querySelector("#closeEncounter").addEventListener("click",()=>encounter.classList.add("hidden"));

const keys = new Set();
addEventListener("keydown",event=>{
  keys.add(event.code);
  if(event.code==="KeyE"&&!event.repeat){if(activeInteraction==="attending")openBriefing();if(activeInteraction==="exam"){phase="encounter";objective.textContent="Begin the patient encounter";encounter.classList.remove("hidden");controls.unlock()}}
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
