"use client";

import { useState } from "react";
import { formatHospitalTime } from "@/lib/hospital-engine";
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
            <span>{pages.length} message{pages.length === 1 ? "" : "s"}</span>
          </header>

          <div className="pager-list">
            {pages.map((page) => (
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
                  {!page.acknowledged && (
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "PAGE_ACKNOWLEDGED", pageId: page.pageId })}
                    >
                      Acknowledge
                    </button>
                  )}
                </footer>
              </article>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
