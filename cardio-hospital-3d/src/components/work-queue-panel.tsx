"use client";

import { useState } from "react";
import {
  formatHospitalTime,
  getOpenTasks,
  hasTaskMissedDeadline,
  isTaskOverdue,
  type HospitalTaskState,
} from "@/lib/hospital-engine";
import { getHospitalWorkDefinition } from "@/lib/hospital-work";
import { useHospitalStore } from "@/lib/hospital-store";
import { HCM_CASE_ID, VASOVAGAL_CASE_ID } from "@/lib/scenario-ids";

function taskLabel(task: HospitalTaskState): { title: string; detail: string } {
  if (task.kind === "work") {
    const definition = getHospitalWorkDefinition(task.taskId);
    return {
      title: definition?.title ?? "Hospital work item",
      detail: definition?.description ?? task.location.replaceAll("-", " "),
    };
  }

  if (task.caseId === HCM_CASE_ID) {
    return {
      title: "Marcus Chen · Cardiology consult",
      detail: "Exertional syncope · Clinic Room 3",
    };
  }

  if (task.caseId === VASOVAGAL_CASE_ID) {
    return {
      title: "Ava Rodriguez · Cardiology consult",
      detail: "Post-race syncope · Clinic Room 1",
    };
  }

  return {
    title: "Clinical consult",
    detail: task.location.replaceAll("-", " "),
  };
}

export default function WorkQueuePanel() {
  const [open, setOpen] = useState(false);
  const hospital = useHospitalStore((state) => state.hospital);
  const openTasks = getOpenTasks(hospital);

  return (
    <aside className={`work-queue-shell${open ? " open" : ""}`} aria-label="Hospital work queue">
      <button
        type="button"
        className="work-queue-toggle"
        aria-expanded={open}
        aria-controls="hospital-work-queue"
        onClick={() => setOpen((value) => !value)}
      >
        <span>Worklist</span>
        <strong>{openTasks.length}</strong>
      </button>

      {open && (
        <section id="hospital-work-queue" className="work-queue-panel">
          <header>
            <div>
              <p className="eyebrow">Current shift</p>
              <h2>Worklist</h2>
            </div>
            <div className="work-queue-header-actions">
              <span>{openTasks.length} open</span>
              <button
                type="button"
                className="work-queue-close"
                aria-label="Close worklist"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
          </header>

          {openTasks.length === 0 ? (
            <p className="work-queue-empty">No open work items.</p>
          ) : (
            <div className="work-queue-list">
              {openTasks.map((task) => {
                const label = taskLabel(task);
                const priority = task.priority ?? "routine";
                const missed = hasTaskMissedDeadline(task);
                const overdue = missed || isTaskOverdue(hospital, task);
                return (
                  <article key={task.taskId} className={`work-queue-item ${task.kind} ${task.status} ${priority}${overdue ? " overdue" : ""}`}>
                    <div className="work-queue-meta">
                      <span className={`priority-${priority}`}>{priority}</span>
                      <span>{task.kind}</span>
                      <span>{task.location.replaceAll("-", " ")}</span>
                      <span>{task.status.replace("-", " ")}</span>
                      {typeof task.durationMinutes === "number" && <span>{task.durationMinutes} min</span>}
                      {typeof task.dueAtMinute === "number" && (
                        <span className={overdue ? "due-overdue" : undefined}>
                          {missed ? "missed" : overdue ? "overdue" : "due"} {formatHospitalTime(task.dueAtMinute)}
                        </span>
                      )}
                    </div>
                    <h3>{label.title}</h3>
                    <p>{label.detail}</p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </aside>
  );
}
