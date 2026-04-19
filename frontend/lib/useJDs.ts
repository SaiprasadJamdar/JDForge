import { useState, useEffect } from "react";
import { fetchApi } from "./api"; // Ensure fetchApi exists and manages auth

export function useJDs() {
  const [jds, setJds] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchDatabaseJDs = async () => {
    try {
      const rawJDs = await fetchApi("/jds");
      const parsedJDs = rawJDs.map((jd: any) => {
        try {
          if (typeof jd.content === 'string') {
            jd.content = JSON.parse(jd.content);
          }
        } catch (e) {
          jd.content = { template_name: "wissen_standard", sections: {} };
        }
        if (jd.status !== "finalized") {
          const backup = localStorage.getItem(`jd_backup_${jd.id}`);
          if (backup) try { jd.content = JSON.parse(backup); } catch {}
        }
        if (!jd.content || typeof jd.content !== "object") {
          jd.content = { template_name: "wissen_standard", sections: {} };
        }
        if (!jd.content.sections) {
          jd.content.sections = {};
        }
        return jd;
      });
      setJds(parsedJDs);
    } catch (err) {
      console.error("Failed to load JDs:", err);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchDatabaseJDs();
    
    // Listen for global refresh events (e.g. from NotificationBell)
    const handleRefresh = () => fetchDatabaseJDs();
    window.addEventListener("jd-refresh", handleRefresh);
    return () => window.removeEventListener("jd-refresh", handleRefresh);
  }, []);

  const updateJD = async (updatedJD: any) => {
    // 1. Optimistic UI update only (Lightning Fast)
    const newJds = jds.map(jd => jd.id === updatedJD.id ? updatedJD : jd);
    setJds(newJds);

    // 2. Backup to Local Storage to survive organic refreshing without API load
    localStorage.setItem(`jd_backup_${updatedJD.id}`, JSON.stringify(updatedJD.content));
  };

  const markAsFinalized = async (id: string) => {
    const jdToSave = jds.find(j => j.id === id);
    if (!jdToSave) return;
    
    // Status update in UI immediately
    const newJds = jds.map(jd => jd.id === id ? { ...jd, status: "finalized" } : jd);
    setJds(newJds);

    // Commit explicitly to Postgres Database now
    try {
      await fetchApi(`/jds/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "finalized",
          content: JSON.stringify(jdToSave.content)
        })
      });
      // Clear out the temporary local backup
      localStorage.removeItem(`jd_backup_${id}`);
    } catch (err) {
      console.error("Failed to finalize and save JD:", err);
    }
  };

  const deleteJD = async (id: string) => {
    setJds(jds.filter(jd => jd.id !== id));
    try {
      await fetchApi(`/jds/${id}`, {
        method: "DELETE"
      });
    } catch (err) {
      console.error("Failed to delete JD:", err);
    }
  };

  const updateJDTitle = async (id: string, newTitle: string) => {
    const newJds = jds.map(jd => jd.id === id ? { ...jd, title: newTitle } : jd);
    setJds(newJds);
    try {
      await fetchApi(`/jds/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: newTitle })
      });
    } catch (err) {
      console.error("Failed to update JD title:", err);
    }
  };

  const createJD = async (title: string = "Untitled JD") => {
    try {
      const newJD = await fetchApi("/jds", {
        method: "POST",
        body: JSON.stringify({ title })
      });
      // Parse content if string
      if (typeof newJD.content === "string") {
        try { newJD.content = JSON.parse(newJD.content) } catch {}
      }
      setJds(prev => [newJD, ...prev]);
      return newJD;
    } catch (err) {
      console.error("Failed to create JD:", err);
      throw err;
    }
  };

  return { jds, setJds, updateJD, updateJDTitle, deleteJD, markAsFinalized, createJD, refreshDatabaseJDs: fetchDatabaseJDs, isLoaded };
}
