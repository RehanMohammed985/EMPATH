"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch("/api/sims/list");
        const data = await response.json();
        setFiles(data.files || []);
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    fetchFiles();
  }, []);

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="border p-5 bg-light shadow rounded w-50 text-center bg-dark w-75">
        <h1 className="mb-4">Simulation Dashboard</h1>

        <div className="row mb-3">
          <button
            className="btn btn-primary w-100"
            onClick={() => router.push("/simulation")}
          >
            Create New Simulation
          </button>
        </div>

        <hr />

        <div className="row">
        <div className="col-12 mb-3">
            <select
              className="form-select"
              value={selectedFile || ""}
              onChange={(e) => setSelectedFile(e.target.value)}
            >
              <option value="" disabled>Select a log file</option>
              {files.length > 0 ? (
                files.map((file, index) => (
                  <option key={index} value={file.replace('.json', '')}>
                    {file.replace('.json', '')}
                  </option>
                ))
              ) : (
                <option value="" disabled>No logs available</option>
              )}
            </select>
          </div>
          <div className="col-12">
            <button
              className={`btn w-75 ${selectedFile ? "btn-success" : "btn-secondary disabled"}`}
              disabled={!selectedFile}
              onClick={() => selectedFile && router.push(`/simulation/${selectedFile}`)}
            >
              Open Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}