async function getApiHealth() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${apiUrl}/`, { cache: "no-store" });
    return await res.text();
  } catch {
    return "API not reachable — start it with `pnpm dev`";
  }
}

export default async function Home() {
  const apiMessage = await getApiHealth();

  return (
    <main style={{ maxWidth: 640, margin: "4rem auto", padding: "0 1.5rem" }}>
      <h1>synt</h1>
      <p>Next.js (web) + NestJS (api) in a Turborepo.</p>
      <p>
        <strong>API says:</strong> {apiMessage}
      </p>
    </main>
  );
}
