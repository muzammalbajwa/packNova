import type { Metadata } from "next";
import Button from "@/components/ui/Button";

export const metadata: Metadata = { title: "Configurator | PackCo" };

export default function ConfiguratorPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="eyebrow">Coming soon</p>
      <h1 className="font-display text-5xl font-bold tracking-tight md:text-7xl">The 3D configurator</h1>
      <p className="max-w-md text-[var(--muted)]">Placeholder page. Configure size, material and print in real time.</p>
      <Button href="/">Back home</Button>
    </main>
  );
}
