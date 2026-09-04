"use client";

import { useState } from "react";
import { formatHospitalTime, getTask } from "@/lib/hospital-engine";
import { getReceivedHospitalPages, getUnreadPagerCount } from "@/lib/hospital-pages";
import { useHospitalStore } from "@/lib/hospital-store";

export default function PagerPanel() {
  const [open, setOpen] = useState(false);
  const hospital = useHospitalStore((state) => state.hospital);
  const dispatch = useHospitalStore((state) => state.dispatch);
  const pages = getReceivedHospitalPages(hospital);
  const unreadCount = getUnreadPagerCount(hospital);

  if (pages.length === 0) return null;

  return (
    <aside className={`pager-shell${open ? " open" : ""}`} aria-label="Hospital pager">
      <button
        type="button"
        className="pager-toggle"
        aria-expanded={open}
        aria-controls="hospital-pager-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="pager-toggle-label">Pager</span>
        <strong>{unreadCount > 0 ? `${unreadCount} new` : "All read"}</strong>
      </button>

      {open && (
        <section id="hospital-pager-panel" className="pager-panel">
          <header>
            <div>
              <p className="eyebrow">Cardiology service</p>
              <h2>Pager</h2>
            </div>
            <div className="pager-header-actions">
              <span>{pages.length} message{pages.length === 1 ? "" : "s"}</span>
              <button
                type="button"
                className="pager-close"
                aria-label="Close pager"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
          </header>

          <div className="pager-list">
            {pages.map((page) => {
              const linkedTask = page.taskId ? getTask(hospital, page.taskId) : undefined;
              const acceptTask = () => {
                if (!linkedTask || linkedTask.status !== "available") return;
                dispatch({ type: "PAGE_ACKNOWLEDGED", pageId: page.pageId });
                dispatch({ type: "TASK_ASSIGNED", taskId: linkedTask.taskId });
              };

              return (
                <article key={page.pageId} className={`pager-message ${page.priority}${page.acknowledged ? " acknowledged" : " unread"}`}>
                  <div className="pager-message-meta">
                    <span>{formatHospitalTime(page.receivedAtMinute)}</span>
                    <span>{page.priority}</span>
                    {page.location && <span>{page.location.replaceAll("-", " ")}</span>}
                  </div>
                  <h3>{page.title}</h3>
                  <p>{page.message}</p>
                  <footer>
                    <span>{page.from}</span>
                    {linkedTask?.status === "available" ? (
                      <button type="button" onClick={acceptTask}>Accept task</button>
                    ) : linkedTask ? (
                      <strong className={`pager-task-status ${linkedTask.status}`}>{linkedTask.status.replace("-", " ")}</strong>
                    ) : !page.acknowledged ? (
                      <button type="button" onClick={() => dispatch({ type: "PAGE_ACKNOWLEDGED", pageId: page.pageId })}>
                        Acknowledge
                      </button>
                    ) : null}
                  </footer>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </aside>
  );
}
