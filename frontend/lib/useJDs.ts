import { useState, useEffect } from "react";
import { JD, initialJDs } from "./data";

export function useJDs() {
  const [jds, setJds] = useState<JD[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("jds_store");
    if (saved) {
      try {
        setJds(JSON.parse(saved));
      } catch (e) {
        setJds(initialJDs);
      }
    } else {
      setJds(initialJDs);
      localStorage.setItem("jds_store", JSON.stringify(initialJDs));
    }
    setIsLoaded(true);
  }, []);

  const updateJD = (updatedJD: JD) => {
    const newJds = jds.map(jd => jd.id === updatedJD.id ? updatedJD : jd);
    setJds(newJds);
    localStorage.setItem("jds_store", JSON.stringify(newJds));
  };

  const markAsFinalized = (id: string) => {
    const newJds = jds.map(jd => jd.id === id ? { ...jd, status: "finalized" as const } : jd);
    setJds(newJds);
    localStorage.setItem("jds_store", JSON.stringify(newJds));
  };

  const saveToFile = (jd: JD) => {
    const text = `TITLE: ${jd.title}
SUMMARY: ${jd.content.summary}
EXPERIENCE: ${jd.content.experience}
LOCATION: ${jd.content.location}
MODE: ${jd.content.mode}

RESPONSIBILITIES:
${jd.content.responsibilities.map(r => "- " + r).join("\n")}

QUALIFICATIONS:
${jd.content.qualifications.map(q => "- " + q).join("\n")}

GOOD TO HAVE:
${jd.content.goodToHave.map(g => "- " + g).join("\n")}
`;
    
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${jd.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return { jds, setJds, updateJD, markAsFinalized, saveToFile, isLoaded };
}
