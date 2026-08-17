function clone(value) {
  return structuredClone(value);
}

function satisfies(transition, effects) {
  const hasAll = transition.allOf.every((effect) => effects.has(effect));
  const hasAny = transition.anyOf.length === 0 || transition.anyOf.some((effect) => effects.has(effect));
  return hasAll && hasAny;
}

export class CaseEngine {
  constructor(graph, clinicalCase) {
    if (!graph || !clinicalCase || graph.caseId !== clinicalCase.id) {
      throw new Error("Case graph and clinical truth must identify the same case");
    }

    this.graph = clone(graph);
    this.clinicalCase = clone(clinicalCase);
    this.nodeId = graph.startNodeId;
    this.effects = new Set();
    this.completedActions = new Set();
    this.actionLog = [];
  }

  get currentNode() {
    return this.graph.nodes.find((node) => node.id === this.nodeId);
  }

  get isComplete() {
    return this.graph.terminalNodeIds.includes(this.nodeId);
  }

  getAvailableActions() {
    if (this.isComplete) return [];
    return this.currentNode.availableActions.filter((actionId) => {
      const definition = this.#findAction(actionId);
      return definition.requiresAll.every((effect) => this.effects.has(effect));
    });
  }

  perform(actionId, payload = {}) {
    const nodeBefore = this.nodeId;
    if (!this.getAvailableActions().includes(actionId)) {
      throw new Error(`Action ${actionId} is not available in node ${this.nodeId}`);
    }

    const definition = this.#findAction(actionId);
    for (const effect of definition.effects) this.effects.add(effect);
    this.completedActions.add(actionId);

    const event = {
      sequence: this.actionLog.length + 1,
      nodeId: nodeBefore,
      actionId,
      eventType: definition.eventType,
      target: definition.target,
      payload: { ...clone(payload), ...this.#disclosurePayload(definition) },
    };
    this.actionLog.push(event);

    const next = this.currentNode.transitions.find((candidate) => satisfies(candidate, this.effects));
    if (next) this.nodeId = next.to;

    return {
      event: clone(event),
      nodeBefore,
      nodeAfter: this.nodeId,
      transitioned: nodeBefore !== this.nodeId,
    };
  }

  getAcceptanceReport() {
    const nodeReports = this.graph.nodes
      .filter((node) => node.acceptanceActions.length > 0)
      .map((node) => {
        const missingActions = node.acceptanceActions.filter((actionId) => !this.completedActions.has(actionId));
        return {
          nodeId: node.id,
          passed: missingActions.length === 0,
          missingActions,
        };
      });

    const missingActions = nodeReports.flatMap((node) => node.missingActions);
    return {
      caseId: this.graph.caseId,
      graphVersion: this.graph.version,
      caseCompleted: this.isComplete,
      acceptancePassed: this.isComplete && missingActions.length === 0,
      missingActions,
      nodes: nodeReports,
    };
  }

  snapshot() {
    return {
      caseId: this.graph.caseId,
      graphVersion: this.graph.version,
      nodeId: this.nodeId,
      effects: [...this.effects].sort(),
      completedActions: [...this.completedActions].sort(),
      actionLog: clone(this.actionLog),
    };
  }

  getRevealedHistory() {
    const asked = new Set(
      this.actionLog
        .filter((event) => event.eventType === "history_question")
        .map((event) => event.target),
    );
    return this.clinicalCase.history
      .filter((fact) => asked.has(fact.key))
      .map((fact) => ({
        key: fact.key,
        question: fact.question,
        answer: fact.answer,
        redFlag: Boolean(fact.redFlag),
        confidential: Boolean(fact.confidential),
      }));
  }

  getRevealedExam() {
    const performed = new Set(
      this.actionLog
        .filter((event) => event.eventType === "exam_performed")
        .map((event) => event.target),
    );
    return performedFindings(this.clinicalCase.exam, performed);
  }

  getPresentation() {
    const phase = this.currentNode?.phase ?? "complete";
    const completed = this.completedActions;
    const assigned = completed.has("assignment.accept");
    const introduced = completed.has("encounter.introduce");
    const diagnosing = ["reasoning", "management", "debrief", "continuation", "complete"].includes(phase);
    const diagnosed = completed.has("reasoning.submit");
    const debriefed = completed.has("debrief.review");

    return {
      caseId: this.graph.caseId,
      phase,
      nodeId: this.nodeId,
      availableActionIds: this.getAvailableActions(),
      assignment: assigned
        ? {
            patientName: this.clinicalCase.patientName,
            age: this.clinicalCase.age,
            sex: this.clinicalCase.sex,
            chiefComplaint: this.clinicalCase.chiefComplaint,
            room: this.clinicalCase.room,
            vibe: this.clinicalCase.vibe,
            parentPresent: this.clinicalCase.parentPresent,
          }
        : null,
      history: introduced ? this.getRevealedHistory() : [],
      exam: this.getRevealedExam(),
      results: this.getRevealedResults(),
      diagnosisChoices: diagnosing ? clone(this.clinicalCase.differentials) : [],
      socratic: diagnosed ? clone(this.clinicalCase.attendingSocratic) : [],
      teachingPoint: debriefed ? this.clinicalCase.teachingPoint : "",
      correctDiagnosis: debriefed ? this.clinicalCase.correctDiagnosis : "",
    };
  }

  getRevealedResults() {
    const reviewed = new Set(
      this.actionLog
        .filter((event) => event.eventType === "test_interpreted")
        .map((event) => event.target),
    );
    const results = [];
    if (reviewed.has("ECG")) results.push({ test: "ECG", findings: clone(this.clinicalCase.ecg) });
    if (reviewed.has("Echocardiogram")) results.push({ test: "Echocardiogram", findings: clone(this.clinicalCase.echo) });
    return results;
  }

  #disclosurePayload(definition) {
    if (definition.eventType === "history_question") {
      const fact = this.clinicalCase.history.find((entry) => entry.key === definition.target);
      if (!fact) throw new Error(`No authored history fact for ${definition.target}`);
      return { key: fact.key, question: fact.question, answer: fact.answer };
    }
    if (definition.eventType === "exam_performed") {
      const finding = examFindingForTarget(this.clinicalCase.exam, definition.target);
      if (finding === undefined) throw new Error(`No authored exam finding for ${definition.target}`);
      return { target: definition.target, finding };
    }
    if (definition.eventType === "test_interpreted") {
      if (definition.target === "ECG") return { test: "ECG", findings: clone(this.clinicalCase.ecg) };
      if (definition.target === "Echocardiogram") return { test: "Echocardiogram", findings: clone(this.clinicalCase.echo) };
    }
    return {};
  }

  #findAction(actionId) {
    const definition = this.graph.actions.find((action) => action.id === actionId);
    if (!definition) throw new Error(`Unknown action ${actionId}`);
    return definition;
  }
}

function examFindingForTarget(exam, target) {
  if (target === "general") return exam.general;
  if (target === "vitals") return clone(exam.vitals);
  if (target === "auscultation") return clone(exam.auscultation);
  if (target === "femoralPulses") return exam.femoralPulses;
  return undefined;
}

function performedFindings(exam, performed) {
  const revealed = {};
  if (performed.has("general")) revealed.general = exam.general;
  if (performed.has("vitals")) revealed.vitals = clone(exam.vitals);
  if (performed.has("auscultation")) revealed.auscultation = clone(exam.auscultation);
  if (performed.has("femoralPulses")) revealed.femoralPulses = exam.femoralPulses;
  if (performed.size > 0) revealed.extras = clone(exam.extras ?? []);
  return revealed;
}

export function createCaseEngine(document, caseId) {
  const graph = document.caseGraphs.find((candidate) => candidate.caseId === caseId);
  const clinicalCase = document.cases.find((candidate) => candidate.id === caseId);
  if (!graph) throw new Error(`No case graph found for ${caseId}`);
  if (!clinicalCase) throw new Error(`No clinical truth found for ${caseId}`);
  return new CaseEngine(graph, clinicalCase);
}
