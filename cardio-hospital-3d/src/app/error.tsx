"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="fatal-error">
      <p className="eyebrow">Simulation interrupted</p>
      <h1>The clinical world could not load.</h1>
      <p>Your saved case data is unchanged.</p>
      <button onClick={reset}>Reload simulation</button>
    </main>
  );
}
