import { engineManifest } from "../engine";

const foundations = [
  {
    label: "Interface",
    value: "React",
    note: "Browser-first design workspace",
  },
  {
    label: "Engine",
    value: "Pure TypeScript",
    note: "UI-independent calculation boundary",
  },
  {
    label: "Validation",
    value: "Vitest",
    note: "Repeatable checks from the first milestone",
  },
] as const;

export function App() {
  return (
    <main className="shell">
      <section className="hero" aria-labelledby="product-title">
        <p className="eyebrow">M0 · DEVELOPMENT BOOTSTRAP</p>
        <h1 id="product-title">Facade Solar Lab</h1>
        <p className="lede">
          A foundation for exploring how facade geometry shapes solar heat gain.
        </p>

        <div className="status" role="status">
          <span className="status-dot" aria-hidden="true" />
          <span>Development environment ready</span>
          <code>{engineManifest.milestone}</code>
        </div>
      </section>

      <section className="foundation" aria-label="M0 foundation">
        {foundations.map((item) => (
          <article className="foundation-card" key={item.label}>
            <p>{item.label}</p>
            <h2>{item.value}</h2>
            <span>{item.note}</span>
          </article>
        ))}
      </section>

      <p className="scope-note">
        Calculation models arrive in M1. Absolute performance values are not
        available in this bootstrap.
      </p>
    </main>
  );
}
