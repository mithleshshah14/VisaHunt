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

interface SavedJobsContextValue {
  savedJobIds: string[];
  toggleSave: (jobId: string) => Promise<void>;
  isLoading: boolean;
}

const SavedJobsContext = createContext<SavedJobsContextValue>({
  savedJobIds: [],
  toggleSave: async () => {},
  isLoading: false,
});

export function useSavedJobs() {
  return useContext(SavedJobsContext);
}

export function SavedJobsProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      setSavedJobIds([]);
      return;
    }

    setIsLoading(true);
    fetch("/api/jobs/save")
      .then((r) => r.json())
      .then((data) => setSavedJobIds(data.savedJobIds || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [status]);

  const toggleSave = useCallback(
    async (jobId: string) => {
      if (!session?.user) return;

      const wasSaved = savedJobIds.includes(jobId);

      // Optimistic update
      setSavedJobIds((prev) =>
        wasSaved ? prev.filter((id) => id !== jobId) : [...prev, jobId]
      );

      try {
        const res = await fetch("/api/jobs/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        });

        if (!res.ok) {
          // Revert on error
          setSavedJobIds((prev) =>
            wasSaved ? [...prev, jobId] : prev.filter((id) => id !== jobId)
          );
        }
      } catch {
        // Revert on error
        setSavedJobIds((prev) =>
          wasSaved ? [...prev, jobId] : prev.filter((id) => id !== jobId)
        );
      }
    },
    [session, savedJobIds]
  );

  return (
    <SavedJobsContext.Provider value={{ savedJobIds, toggleSave, isLoading }}>
      {children}
    </SavedJobsContext.Provider>
  );
}
