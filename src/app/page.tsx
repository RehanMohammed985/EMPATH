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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 ">Simulation Dashboard</h1>

      {/* Create New Simulation Button */}
      <button
        className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 mb-4"
        onClick={() => router.push("/chat")}
      >
        Create New Simulation
      </button>

      {/* Dropdown + Open Logs Button */}
      <div className="">
        <select
          className="p-2 border rounded-md shadow-md"
          value={selectedFile || ""}
          onChange={(e) => setSelectedFile(e.target.value)}
        >
          <option value="" disabled>Select a log file</option>
          {files.length > 0 ? (
            files.map((file, index) => (
              <option key={index} value={file}>
                {file.replace('.json', '')}
              </option>
            ))
          ) : (
            <option value="" disabled>No logs available</option>
          )}
        </select>

        <button
          className={`mt-4 px-6 py-3 rounded-lg shadow-md ${
            selectedFile ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!selectedFile}
          onClick={() => selectedFile && router.push(`/simulation/${selectedFile}`)}
        >
          Open Logs
        </button>
      </div>
    </div>
  );
}
