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
      payload: clone(payload),
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

  #findAction(actionId) {
    const definition = this.graph.actions.find((action) => action.id === actionId);
    if (!definition) throw new Error(`Unknown action ${actionId}`);
    return definition;
  }
}

export function createCaseEngine(document, caseId) {
  const graph = document.caseGraphs.find((candidate) => candidate.caseId === caseId);
  const clinicalCase = document.cases.find((candidate) => candidate.id === caseId);
  if (!graph) throw new Error(`No case graph found for ${caseId}`);
  if (!clinicalCase) throw new Error(`No clinical truth found for ${caseId}`);
  return new CaseEngine(graph, clinicalCase);
}
