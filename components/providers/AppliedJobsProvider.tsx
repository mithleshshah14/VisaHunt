"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";

interface AppliedJobsContextValue {
  appliedJobIds: string[];
  toggleApplied: (jobId: string) => Promise<void>;
  isLoading: boolean;
}

const AppliedJobsContext = createContext<AppliedJobsContextValue>({
  appliedJobIds: [],
  toggleApplied: async () => {},
  isLoading: false,
});

export function useAppliedJobs() {
  return useContext(AppliedJobsContext);
}

export function AppliedJobsProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      setAppliedJobIds([]);
      return;
    }

    setIsLoading(true);
    fetch("/api/jobs/apply")
      .then((r) => r.json())
      .then((data) => setAppliedJobIds(data.appliedJobIds || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [status]);

  const toggleApplied = useCallback(
    async (jobId: string) => {
      if (!session?.user) return;

      const wasApplied = appliedJobIds.includes(jobId);

      // Optimistic update
      setAppliedJobIds((prev) =>
        wasApplied ? prev.filter((id) => id !== jobId) : [...prev, jobId]
      );

      try {
        const res = await fetch("/api/jobs/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        });

        if (!res.ok) {
          setAppliedJobIds((prev) =>
            wasApplied ? [...prev, jobId] : prev.filter((id) => id !== jobId)
          );
        }
      } catch {
        setAppliedJobIds((prev) =>
          wasApplied ? [...prev, jobId] : prev.filter((id) => id !== jobId)
        );
      }
    },
    [session, appliedJobIds]
  );

  return (
    <AppliedJobsContext.Provider value={{ appliedJobIds, toggleApplied, isLoading }}>
      {children}
    </AppliedJobsContext.Provider>
  );
}
