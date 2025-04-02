"use client";

import { Key, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function SimulationPage() {
  const { sim_name } = useParams(); // Get filename from URL
  const [simulationData, setSimulationData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleCharacters, setVisibleCharacters] = useState<string[]>([]);
  const [allCharacters, setAllCharacters] = useState<string[]>([]);

  useEffect(() => {
    const fetchSimulationData = async () => {
      try {
        const response = await fetch(`/api/sims/read?filename=${sim_name}.json`);
        const data = await response.json();

        if (response.ok) {
          setSimulationData(data);
          const characters = Object.keys(data.content.graphValues);
          setAllCharacters(characters);
          setVisibleCharacters(characters);
        } else {
          console.error("Error fetching simulation:", data.error);
        }
      } catch (error) {
        console.error("Error fetching simulation:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimulationData();
  }, [sim_name]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!simulationData) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error loading simulation.</div>;
  }

  const getChartData = (role: string) => {
    const valueList = simulationData.content.graphValues[role] || [];

    return {
      labels: valueList.map((_: any, i: number) => `Conv ${i + 1}`),
      datasets: [
        { label: "Belief", data: valueList.map((p: any) => p.belief_strength), borderColor: "rgb(192, 75, 85)", tension: 0.1 },
        { label: "Receptiveness", data: valueList.map((p: any) => p.receptiveness), borderColor: "rgb(55, 210, 166)", tension: 0.1 },
        { label: "Interest", data: valueList.map((p: any) => p.interest_in_argument), borderColor: "rgb(121, 64, 255)", tension: 0.1 },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: { min: 0, max: 12, ticks: { stepSize: 1 } },
    },
  };

  return (
    <div className="container py-4">
      <h2 className="text-center mb-3">Simulation Log: {simulationData.filename}</h2>
      
      <div className="mt-4 p-4 border rounded shadow-md">
        <h5 className="font-semibold text-lg">Filter Characters:</h5>
        <div className="d-flex flex-wrap">
          {allCharacters.map((character) => (
            <div key={character} className="form-check me-3">
              <input
                className="form-check-input"
                type="checkbox"
                checked={visibleCharacters.includes(character)}
                onChange={() =>
                  setVisibleCharacters((prev) =>
                    prev.includes(character) ? prev.filter((c) => c !== character) : [...prev, character]
                  )
                }
              />
              <label className="form-check-label">{character}</label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="row">
        <div className="col-12 mt-4 p-4 border rounded shadow-md max-w-md">
          <div className="container">
            <div className="row">
              {allCharacters.map((role, index) =>
                visibleCharacters.includes(role) ? (
                  <div key={index} className="col-4 mt-6">
                    <h5 className="font-semibold text-lg">{role} - Character Values</h5>
                    <Line data={getChartData(role)} options={chartOptions} />
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>
        <div className="col-12">
          <div className="mt-4 p-4 border rounded max-w-md text-left shadow-md">
            <div className="flex flex-col space-y-2">
              {simulationData.content.chatLog.length > 0 ? (
                simulationData.content.chatLog
                  .filter((msg: any) => visibleCharacters.includes(msg.role))
                  .map((msg: any, index: Key | null | undefined) => (
                    <div key={index} className="p-2 rounded-lg text-sm max-w-[90%] mt-3">
                      <strong className="text-uppercase">{msg.role}: </strong>
                      &#39;{msg.content}&#39;
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 text-sm">No chat logs available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
