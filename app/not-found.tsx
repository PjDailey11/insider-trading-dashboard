import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="flex h-full items-center justify-center p-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="font-mono text-3xl text-text-subtle">404</span>
        <h1 className="text-md font-medium">Route not found</h1>
        <p className="text-xs text-text-muted">The page you were looking for is not here.</p>
        <Link href="/">
          <Button variant="secondary" size="sm">Back to dashboard</Button>
        </Link>
      </div>
    </main>
  );
}
