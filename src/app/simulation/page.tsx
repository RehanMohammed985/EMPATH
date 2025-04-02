"use client";

import { useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { prompts } from "@/config/prompts";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ChatPage() {
  const [simulationResponse, setSimulationResponse] = useState<
    { role: string; content: string; personality: any }[]
  >([]);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false); // Track completion
  const [allCharacters, setAllCharacters] = useState<string[]>([]);
  const [visibleCharacters, setVisibleCharacters] = useState<string[]>([]);

  const characterDynamicFactors = Object.fromEntries(
    prompts.characters.map(({ name, dynamic_factors }) => [name, [dynamic_factors]])
  );

  const [values, setValues] = useState<Record<string, any[]>>(characterDynamicFactors);

  const handleSimulation = async () => {
    setSimulationLoading(true);
    setSimulationComplete(false);
    setSimulationResponse([]);

    const eventSource = new EventSource("/api/simulation");

    eventSource.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      const { role, values } = newMessage;

      setValues((prev) => ({
        ...prev,
        [role]: [...(prev[role] || []), values],
      }));

      setSimulationResponse((prev) => [...prev, newMessage]);

      setAllCharacters((prev) => (prev.includes(role) ? prev : [...prev, role]));
      setVisibleCharacters((prev) => (prev.includes(role) ? prev : [...prev, role]));
    };

    eventSource.onerror = () => {
      eventSource.close();
      setSimulationLoading(false);
      setSimulationComplete(true); // Mark completion
    };
  };

  const handleSave = async () => {
    const simulationData = {
      chatLog: simulationResponse,
      graphValues: values,
    };

    try {
      const response = await fetch("/api/sims/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(simulationData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Simulation saved successfully!");
      } else {
        alert(`Failed to save simulation: ${data.error}`);
      }
    } catch (error) {
      console.error(error)
      alert("Error saving simulation.");
    }
  };

  const getChartData = (role: string) => {
    const valueList = values[role] || [];

    return {
      labels: valueList.map((_, i) => `Conv ${i + 1}`),
      datasets: [
        { label: "Belief", data: valueList.map((p) => p.belief_strength), borderColor: "rgb(192, 75, 85)", tension: 0.1 },
        { label: "Receptiveness", data: valueList.map((p) => p.receptiveness), borderColor: "rgb(55, 210, 166)", tension: 0.1 },
        { label: "Interest", data: valueList.map((p) => p.interest_in_argument), borderColor: "rgb(121, 64, 255)", tension: 0.1 },
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
      <h1 className="text-center mb-3">Conversation Simulation</h1>

      <div className="d-flex justify-content-center gap-3">
        <button onClick={handleSimulation} disabled={simulationLoading} className="btn btn-success">
          {simulationLoading ? "Streaming..." : "Simulate Chat"}
        </button>

        {simulationComplete && (
          <button onClick={handleSave} className="btn btn-primary">Save Simulation</button>
        )}
      </div>

      <div className="container-fluid">
        <div className="row">
          <div className="col-12 mt-4 p-4 border rounded shadow-md max-w-md">
            <div className="container">
              <div className="row">
                {Object.keys(values).map((role, index) => (
                  <div key={index} className="col-4 mt-6">
                    <h5 className="font-semibold text-lg">{role} - Character Values</h5>
                    <Line data={getChartData(role)} options={chartOptions} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-12">

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
          </div>
          <div className="col-12">
            <div className="mt-4 p-4 border rounded max-w-md text-left shadow-md">
              <div className="flex flex-col space-y-2">
                {simulationResponse.length > 0 ? (
                  simulationResponse
                    .filter((msg) => visibleCharacters.includes(msg.role))
                    .map((msg, index) => (
                      <div key={index} className="p-2 rounded-lg text-sm max-w-[90%] mt-3">
                        <strong className="text-uppercase">{msg.role}: </strong>
                        &#39;{msg.content}&#39;
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    Click [Simulate Chat] to start a conversation.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
