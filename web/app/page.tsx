const priorities = [
  "Connect your first goal",
  "Add a task for today",
  "Review the setup checklist",
];

export default function Home() {
  return (
    <main>
      <p className="eyebrow">PERSONAL OS</p>
      <h1>Make your next move deliberate.</h1>
      <p className="intro">
        Your private workspace for goals, tasks, applications, and progress.
      </p>
      <section aria-labelledby="priorities-heading">
        <h2 id="priorities-heading">Today&apos;s priorities</h2>
        <ul>
          {priorities.map((priority) => (
            <li key={priority}>{priority}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
