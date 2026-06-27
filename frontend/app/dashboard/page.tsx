"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import * as api from "@/lib/api";
import { ApiClientError } from "@/lib/api";
import { DashboardSummary } from "@/types";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadSummary() {
    setIsLoading(true);
    setError("");

    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Failed to load dashboard"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Overview of your projects and tasks
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-xl bg-gray-200"
              />
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
            <Button className="mt-3" variant="secondary" onClick={loadSummary}>
              Retry
            </Button>
          </div>
        ) : null}

        {summary && !isLoading ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Projects" value={summary.totalProjects} />
              <StatCard label="Total Tasks" value={summary.totalTasks} />
              <StatCard label="Completed Tasks" value={summary.completedTasks} />
              <StatCard label="Pending Tasks" value={summary.pendingTasks} />
            </div>
            <Link href="/projects">
              <Button>View All Projects</Button>
            </Link>
          </>
        ) : null}
      </div>
    </ProtectedLayout>
  );
}
