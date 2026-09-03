import type { DiscloseKey } from "./cases-data";

export const HOSPITAL_SCHEMA_VERSION = 2 as const;

export type HospitalLocation =
  | "lobby"
  | "workroom"
  | "clinic-corridor"
  | "clinic-room-1"
  | "clinic-room-2"
  | "clinic-room-3"
  | "echo"
  | "mri"
  | "cath"
  | "nicu"
  | "picu"
  | "or"
  | string;

export type ShiftStatus = "not-started" | "active" | "complete";
export type EncounterStage =
  | "not-started"
  | "history"
  | "exam"
  | "tests"
  | "assessment"
  | "debrief"
  | "complete";
export type PatientDisposition = "waiting" | "in-encounter" | "transferred" | "complete";
export type TaskStatus = "available" | "assigned" | "in-progress" | "complete";
export type HospitalWorkflowPhase = "arrival" | "assigned" | "encounter" | "complete";

export interface ShiftState {
  id: string;
  day: number;
  status: ShiftStatus;
  clockMinutes: number;
  startedAtMinute?: number;
  completedAtMinute?: number;
}

export interface WorldState {
  currentLocation: HospitalLocation;
}

export interface LearnerState {
  activeCaseId?: string;
  completedCaseIds: string[];
}

export interface PagerState {
  receivedIds: string[];
  acknowledgedIds: string[];
}

export interface HospitalTaskState {
  taskId: string;
  kind: "consult";
  caseId: string;
  patientId: string;
  location: HospitalLocation;
  status: TaskStatus;
}

export interface PatientRuntimeState {
  patientId: string;
  caseId: string;
  currentLocation: HospitalLocation;
  disposition: PatientDisposition;
  activeEncounterId?: string;
}

export interface EcgInterpretationState {
  selectedFindings: string[];
  score?: number;
}

export interface EncounterRuntimeState {
  encounterId: string;
  taskId?: string;
  patientId: string;
  caseId: string;
  location: HospitalLocation;
  stage: EncounterStage;
  startedAtMinute: number;
  completedAtMinute?: number;
  askedHistoryKeys: DiscloseKey[];
  confidentialInterviewDone: boolean;
  performedExamActions: string[];
  orderedTests: string[];
  reviewedResults: string[];
  ecgInterpretation?: EcgInterpretationState;
  diagnosis?: string;
  management: string[];
  safetyEvents: string[];
}

export type HospitalEvent =
  | { type: "SHIFT_STARTED"; shiftId: string; day: number; startMinute: number; location: HospitalLocation }
  | { type: "SHIFT_COMPLETED" }
  | { type: "LOCATION_CHANGED"; location: HospitalLocation }
  | { type: "PAGE_RECEIVED"; pageId: string }
  | { type: "PAGE_ACKNOWLEDGED"; pageId: string }
  | { type: "PATIENT_ARRIVED"; patientId: string; caseId: string; location: HospitalLocation }
  | { type: "TASK_CREATED"; taskId: string; kind: "consult"; caseId: string; patientId: string; location: HospitalLocation }
  | { type: "TASK_ASSIGNED"; taskId: string }
  | { type: "TASK_STARTED"; taskId: string }
  | {
      type: "ENCOUNTER_STARTED";
      encounterId: string;
      taskId?: string;
      patientId: string;
      caseId: string;
      location: HospitalLocation;
    }
  | { type: "ENCOUNTER_STAGE_CHANGED"; encounterId: string; stage: EncounterStage }
  | { type: "HISTORY_ASKED"; encounterId: string; key: DiscloseKey }
  | { type: "CONFIDENTIAL_INTERVIEW_STARTED"; encounterId: string }
  | { type: "EXAM_PERFORMED"; encounterId: string; action: string }
  | { type: "TEST_ORDERED"; encounterId: string; test: string }
  | { type: "RESULT_REVIEWED"; encounterId: string; result: string }
  | { type: "ECG_INTERPRETATION_COMMITTED"; encounterId: string; selectedFindings: string[]; score?: number }
  | { type: "DIAGNOSIS_COMMITTED"; encounterId: string; diagnosis: string }
  | { type: "MANAGEMENT_SELECTED"; encounterId: string; management: string[] }
  | { type: "SAFETY_EVENT_RECORDED"; encounterId: string; description: string }
  | { type: "PATIENT_TRANSFERRED"; patientId: string; location: HospitalLocation }
  | { type: "TIME_ADVANCED"; minutes: number }
  | { type: "ENCOUNTER_COMPLETED"; encounterId: string };

export interface HospitalTimelineEntry {
  sequence: number;
  atMinute: number;
  event: HospitalEvent;
}

export interface HospitalState {
  schemaVersion: typeof HOSPITAL_SCHEMA_VERSION;
  revision: number;
  shift: ShiftState;
  world: WorldState;
  learner: LearnerState;
  pager: PagerState;
  tasks: Record<string, HospitalTaskState>;
  patients: Record<string, PatientRuntimeState>;
  encounters: Record<string, EncounterRuntimeState>;
  timeline: HospitalTimelineEntry[];
}

export interface InitialHospitalOptions {
  shiftId?: string;
  day?: number;
  startMinute?: number;
  location?: HospitalLocation;
}

export function createInitialHospitalState(options: InitialHospitalOptions = {}): HospitalState {
  const startMinute = options.startMinute ?? 7 * 60 + 42;
  return {
    schemaVersion: HOSPITAL_SCHEMA_VERSION,
    revision: 0,
    shift: {
      id: options.shiftId ?? "shift-1",
      day: options.day ?? 1,
      status: "not-started",
      clockMinutes: startMinute,
    },
    world: { currentLocation: options.location ?? "lobby" },
    learner: { completedCaseIds: [] },
    pager: { receivedIds: [], acknowledgedIds: [] },
    tasks: {},
    patients: {},
    encounters: {},
    timeline: [],
  };
}

function uniquePush<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items : [...items, item];
}

function updateEncounter(
  state: HospitalState,
  encounterId: string,
  update: (encounter: EncounterRuntimeState) => EncounterRuntimeState
): HospitalState {
  const encounter = state.encounters[encounterId];
  if (!encounter) return state;
  return {
    ...state,
    encounters: { ...state.encounters, [encounterId]: update(encounter) },
  };
}

function updateTask(state: HospitalState, taskId: string, status: TaskStatus): HospitalState {
  const task = state.tasks[taskId];
  if (!task || task.status === status) return state;
  return {
    ...state,
    tasks: { ...state.tasks, [taskId]: { ...task, status } },
  };
}

function applyEvent(state: HospitalState, event: HospitalEvent): HospitalState {
  switch (event.type) {
    case "SHIFT_STARTED":
      return {
        ...state,
        shift: {
          id: event.shiftId,
          day: event.day,
          status: "active",
          clockMinutes: event.startMinute,
          startedAtMinute: event.startMinute,
        },
        world: { currentLocation: event.location },
      };

    case "SHIFT_COMPLETED":
      return {
        ...state,
        shift: { ...state.shift, status: "complete", completedAtMinute: state.shift.clockMinutes },
      };

    case "LOCATION_CHANGED":
      return state.world.currentLocation === event.location
        ? state
        : { ...state, world: { currentLocation: event.location } };

    case "PAGE_RECEIVED":
      if (state.pager.receivedIds.includes(event.pageId)) return state;
      return {
        ...state,
        pager: { ...state.pager, receivedIds: [...state.pager.receivedIds, event.pageId] },
      };

    case "PAGE_ACKNOWLEDGED":
      if (state.pager.acknowledgedIds.includes(event.pageId)) return state;
      return {
        ...state,
        pager: {
          receivedIds: uniquePush(state.pager.receivedIds, event.pageId),
          acknowledgedIds: [...state.pager.acknowledgedIds, event.pageId],
        },
      };

    case "PATIENT_ARRIVED": {
      if (state.patients[event.patientId]) return state;
      return {
        ...state,
        patients: {
          ...state.patients,
          [event.patientId]: {
            patientId: event.patientId,
            caseId: event.caseId,
            currentLocation: event.location,
            disposition: "waiting",
          },
        },
      };
    }

    case "TASK_CREATED": {
      if (state.tasks[event.taskId]) return state;
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [event.taskId]: {
            taskId: event.taskId,
            kind: event.kind,
            caseId: event.caseId,
            patientId: event.patientId,
            location: event.location,
            status: "available",
          },
        },
      };
    }

    case "TASK_ASSIGNED":
      return updateTask(state, event.taskId, "assigned");

    case "TASK_STARTED":
      return updateTask(state, event.taskId, "in-progress");

    case "ENCOUNTER_STARTED": {
      if (state.encounters[event.encounterId]) return state;
      const encounter: EncounterRuntimeState = {
        encounterId: event.encounterId,
        taskId: event.taskId,
        patientId: event.patientId,
        caseId: event.caseId,
        location: event.location,
        stage: "history",
        startedAtMinute: state.shift.clockMinutes,
        askedHistoryKeys: [],
        confidentialInterviewDone: false,
        performedExamActions: [],
        orderedTests: [],
        reviewedResults: [],
        management: [],
        safetyEvents: [],
      };
      const existingPatient = state.patients[event.patientId];
      const patient: PatientRuntimeState = {
        patientId: event.patientId,
        caseId: event.caseId,
        currentLocation: event.location,
        disposition: "in-encounter",
        activeEncounterId: event.encounterId,
      };
      const task = event.taskId ? state.tasks[event.taskId] : undefined;
      return {
        ...state,
        learner: { ...state.learner, activeCaseId: event.caseId },
        patients: {
          ...state.patients,
          [event.patientId]: { ...existingPatient, ...patient },
        },
        tasks: task
          ? { ...state.tasks, [task.taskId]: { ...task, status: "in-progress" } }
          : state.tasks,
        encounters: { ...state.encounters, [event.encounterId]: encounter },
      };
    }

    case "ENCOUNTER_STAGE_CHANGED":
      return updateEncounter(state, event.encounterId, (encounter) => ({ ...encounter, stage: event.stage }));

    case "HISTORY_ASKED":
      return updateEncounter(state, event.encounterId, (encounter) => ({
        ...encounter,
        askedHistoryKeys: uniquePush(encounter.askedHistoryKeys, event.key),
      }));

    case "CONFIDENTIAL_INTERVIEW_STARTED":
      return updateEncounter(state, event.encounterId, (encounter) => ({
        ...encounter,
        confidentialInterviewDone: true,
      }));

    case "EXAM_PERFORMED":
      return updateEncounter(state, event.encounterId, (encounter) => ({
        ...encounter,
        performedExamActions: uniquePush(encounter.performedExamActions, event.action),
      }));

    case "TEST_ORDERED":
      return updateEncounter(state, event.encounterId, (encounter) => ({
        ...encounter,
        orderedTests: uniquePush(encounter.orderedTests, event.test),
      }));

    case "RESULT_REVIEWED":
      return updateEncounter(state, event.encounterId, (encounter) => ({
        ...encounter,
        reviewedResults: uniquePush(encounter.reviewedResults, event.result),
      }));

    case "ECG_INTERPRETATION_COMMITTED":
      return updateEncounter(state, event.encounterId, (encounter) => ({
        ...encounter,
        ecgInterpretation: { selectedFindings: [...event.selectedFindings], score: event.score },
      }));

    case "DIAGNOSIS_COMMITTED":
      return updateEncounter(state, event.encounterId, (encounter) => ({ ...encounter, diagnosis: event.diagnosis }));

    case "MANAGEMENT_SELECTED":
      return updateEncounter(state, event.encounterId, (encounter) => ({
        ...encounter,
        management: [...new Set(event.management)],
      }));

    case "SAFETY_EVENT_RECORDED":
      return updateEncounter(state, event.encounterId, (encounter) => ({
        ...encounter,
        safetyEvents: uniquePush(encounter.safetyEvents, event.description),
      }));

    case "PATIENT_TRANSFERRED": {
      const patient = state.patients[event.patientId];
      if (!patient) return state;
      return {
        ...state,
        patients: {
          ...state.patients,
          [event.patientId]: { ...patient, currentLocation: event.location, disposition: "transferred" },
        },
      };
    }

    case "TIME_ADVANCED":
      if (!Number.isFinite(event.minutes) || event.minutes <= 0) return state;
      return {
        ...state,
        shift: { ...state.shift, clockMinutes: state.shift.clockMinutes + Math.floor(event.minutes) },
      };

    case "ENCOUNTER_COMPLETED": {
      const encounter = state.encounters[event.encounterId];
      if (!encounter || encounter.stage === "complete") return state;
      const patient = state.patients[encounter.patientId];
      const linkedTask = encounter.taskId
        ? state.tasks[encounter.taskId]
        : Object.values(state.tasks).find(
            (task) => task.patientId === encounter.patientId && task.caseId === encounter.caseId && task.status !== "complete"
          );
      return {
        ...state,
        learner: {
          activeCaseId: state.learner.activeCaseId === encounter.caseId ? undefined : state.learner.activeCaseId,
          completedCaseIds: uniquePush(state.learner.completedCaseIds, encounter.caseId),
        },
        tasks: linkedTask
          ? { ...state.tasks, [linkedTask.taskId]: { ...linkedTask, status: "complete" } }
          : state.tasks,
        encounters: {
          ...state.encounters,
          [event.encounterId]: { ...encounter, stage: "complete", completedAtMinute: state.shift.clockMinutes },
        },
        patients: patient
          ? {
              ...state.patients,
              [patient.patientId]: { ...patient, disposition: "complete", activeEncounterId: undefined },
            }
          : state.patients,
      };
    }
  }
}

export function reduceHospitalState(state: HospitalState, event: HospitalEvent): HospitalState {
  if (state.schemaVersion !== HOSPITAL_SCHEMA_VERSION) return state;
  const changed = applyEvent(state, event);
  if (changed === state) return state;
  const revision = state.revision + 1;
  return {
    ...changed,
    revision,
    timeline: [...state.timeline, { sequence: revision, atMinute: changed.shift.clockMinutes, event }],
  };
}

export function getActiveEncounter(state: HospitalState): EncounterRuntimeState | undefined {
  const activeCaseId = state.learner.activeCaseId;
  if (!activeCaseId) return undefined;
  return Object.values(state.encounters).find(
    (encounter) => encounter.caseId === activeCaseId && encounter.stage !== "complete"
  );
}

export function getEncounter(state: HospitalState, encounterId: string): EncounterRuntimeState | undefined {
  return state.encounters[encounterId];
}

export function getPatient(state: HospitalState, patientId: string): PatientRuntimeState | undefined {
  return state.patients[patientId];
}

export function getTask(state: HospitalState, taskId: string): HospitalTaskState | undefined {
  return state.tasks[taskId];
}

export function getPrimaryTask(state: HospitalState): HospitalTaskState | undefined {
  return Object.values(state.tasks).find((task) => task.status !== "complete")
    ?? Object.values(state.tasks).at(-1);
}

export function getHospitalWorkflowPhase(state: HospitalState): HospitalWorkflowPhase {
  if (getActiveEncounter(state)) return "encounter";
  const task = getPrimaryTask(state);
  if (!task) return "arrival";
  if (task.status === "assigned" || task.status === "in-progress") return "assigned";
  if (task.status === "complete") return "complete";
  return "arrival";
}

export function formatHospitalTime(clockMinutes: number): string {
  const normalized = ((Math.floor(clockMinutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
