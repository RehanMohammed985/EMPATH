"use client";

import { useState } from "react";
import CharacterMessage from "@/components/CharacterMessage";
import ChartComponent from "@/components/ChartComponent";

const personalities = {
  INTJ: "INTJ (Architect)",
  INTP: "INTP (Logician)",
  ENTJ: "ENTJ (Commander)",
  ENTP: "ENTP (Debater)",
  INFJ: "INFJ (Advocate)",
  INFP: "INFP (Mediator)",
  ENFJ: "ENFJ (Protagonist)",
  ENFP: "ENFP (Campaigner)",
  ISTJ: "ISTJ (Logistician)",
  ISFJ: "ISFJ (Defender)",
  ESTJ: "ESTJ (Executive)",
  ESFJ: "ESFJ (Consul)",
  ISTP: "ISTP (Virtuoso)",
  ISFP: "ISFP (Adventurer)",
  ESTP: "ESTP (Entrepreneur)",
  ESFP: "ESFP (Entertainer)",
};

export default function SimulationPage() {
  const [characters, setCharacters] = useState([
    {
      name: "Dr. Elena Voss",
      profession: "Climate Scientist",
      personality: "INTJ",
      opinion_strength: 1,
      added_information: "",
    },
    {
      name: "Tom Caldwell",
      profession: "Skeptical Journalist",
      personality: "ENTP",
      opinion_strength: -0.5,
      added_information: "",
    },
    {
      name: "Sofia Green",
      profession: "Environmental Activist",
      personality: "ENFJ",
      opinion_strength: 0.9,
      added_information: "",
    },
    {
      name: "Dr. Marcus Lang",
      profession: "Economist",
      personality: "ISTJ",
      opinion_strength: 0.5,
      added_information: "",
    },
    {
      name: "Jenna Blake",
      profession: "High School Science Teacher",
      personality: "ISFJ",
      opinion_strength: -0.7,
      added_information: "",
    },
  ]);

  const [isSimulationComplete, setIsSimulationComplete] = useState(false);
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);

  const getInitialChartData = (chars: typeof characters) => {
    const data: Record<string, { x: number; y: number }[]> = {};
    chars.forEach(({ name, opinion_strength }) => {
      data[name] = [{ x: 0, y: opinion_strength }];
    });
    return data;
  };

  const [topic, setTopic] = useState("Is climate change real?");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [isRunning, setIsRunning] = useState(false);
  const [showInputs, setShowInputs] = useState(true);

  const [chartData, setChartData] = useState(() =>
    getInitialChartData(characters)
  );

  const updateCharacter = (index: number, field: string, value: any) => {
    const newChars = [...characters];
    (newChars[index] as any)[field] = value;
    setCharacters(newChars);
    setChartData(getInitialChartData(newChars));
  };

  const addCharacter = () => {
    const newChars = [
      ...characters,
      {
        name: "Test Character",
        profession: "Student",
        personality: "INTJ",
        opinion_strength: 0,
        added_information: "",
      },
    ];
    setCharacters(newChars);
    setChartData(getInitialChartData(newChars));
  };

  const removeCharacter = (index: number) => {
    setCharacters(characters.filter((_, i) => i !== index));
    setChartData(getInitialChartData(characters.filter((_, i) => i !== index)));
  };

  const handleStartSimulation = async () => {
    setMessages([]);
    setIsRunning(true);

    const payload = { characters, topic };

    const response = await fetch("/api/simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");

      for (const line of lines) {
        if (line.startsWith("data:")) {
          const json = line.replace("data: ", "").trim();
          try {
            const msg = JSON.parse(json);

            setMessages((prev) => [...prev, msg]);

            const { role, values, turn } = msg;

            console.log(
              `[handleStartSimulation] (${role}) Message: ${JSON.stringify(
                values
              )}`
            );
            console.log(
              `[handleStartSimulation] (${role}) TURN: ${JSON.stringify(turn)}`
            );

            setChartData((prev) => {
              const updated = { ...prev };
              if (!updated[role]) {
                updated[role] = [];
              }
              updated[role].push({ x: turn + 1, y: values.opinion });
              return updated;
            });
          } catch {}
        }
      }

      buffer = "";
    }

    setIsRunning(false);
    setIsSimulationComplete(true);
  };

  return (
    <div className="container min-vh-100 text-white bg-dark py-4">
      <h1 className="display-4 fw-bold mb-4 text-center">Group Chat</h1>

      <div className="d-flex flex-row align-items-center justify-content-between mb-4 g-3">
        <button
          onClick={handleStartSimulation}
          disabled={isRunning}
          className={`btn btn-lg ${
            isRunning ? "btn-secondary disabled" : "btn-primary"
          }`}
        >
          {isRunning ? "Running Simulation..." : "Start Simulation"}
        </button>

        <div className="d-flex justify-content-end align-items-center gap-3">
          {isSimulationComplete && (
            <div className="text-center mb-4">
              <button
                className="btn btn-success"
                onClick={async () => {
                  const simulationData = {
                    characters,
                    topic,
                    messages,
                    chartData,
                  };

                  const res = await fetch("/api/sims/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(simulationData),
                  });

                  const data = await res.json();
                  if (data.filePath) {
                    setSavedFilePath(data.filePath);
                    alert("Simulation saved successfully!" + data.filePath);
                  } else {
                    alert("Failed to save simulation.");
                  }
                }}
              >
                Save Simulation
              </button>
            </div>
          )}
          <div className="text-center mb-4">
            <button
              className="btn btn-secondary"
              onClick={() => setShowInputs(!showInputs)}
            >
              {showInputs ? "Hide Settings" : "Show Settings"}
            </button>
          </div>
        </div>
      </div>

      <div className={`slide-toggle ${showInputs ? "open" : "closed"}`}>
        <div className="container border border-light rounded-4 p-4 bg-dark p-2">
          <div className="mb-4">
            <label className="form-label fw-semibold">Debate Topic:</label>
            <input
              type="text"
              className="form-control bg-dark text-white"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="mb-4 px-2">
            <h5 className="fw-semibold mb-3">Characters</h5>
            <div className="table-responsive mb-3">
              <table className="table table-dark table-bordered table-striped align-middle text-white">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Profession</th>
                    <th>Personality</th>
                    <th>Opinion Strength</th>
                    <th>Added Info</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {characters.map((char, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="text"
                          className="form-control bg-dark text-white"
                          value={char.name}
                          onChange={(e) =>
                            updateCharacter(idx, "name", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control bg-dark text-white"
                          value={char.profession}
                          onChange={(e) =>
                            updateCharacter(idx, "profession", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <select
                          className="form-select bg-dark text-white"
                          value={char.personality}
                          onChange={(e) =>
                            updateCharacter(idx, "personality", e.target.value)
                          }
                        >
                          {Object.entries(personalities).map(([key, val]) => (
                            <option key={key} value={key}>
                              {val}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control bg-dark text-white"
                          min={-1}
                          max={1}
                          step={0.05}
                          value={char.opinion_strength}
                          onChange={(e) =>
                            updateCharacter(
                              idx,
                              "opinion_strength",
                              parseFloat(e.target.value)
                            )
                          }
                        />
                      </td>
                      <td>
                        <textarea
                          className="form-control bg-dark text-white"
                          rows={2}
                          value={char.added_information}
                          onChange={(e) =>
                            updateCharacter(
                              idx,
                              "added_information",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-outline-danger w-100"
                          onClick={() => removeCharacter(idx)}
                          disabled={characters.length === 1}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              className="btn btn-outline-light mb-3"
              onClick={addCharacter}
            >
              + Add Character
            </button>
          </div>
        </div>
      </div>

      <ChartComponent chartData={chartData} />

      <div
        className="bg-secondary bg-opacity-25 rounded-4 shadow p-4 overflow-auto"
        style={{ maxHeight: "80vh" }}
      >
        {messages.length > 0 ? (
          messages.map((msg, idx) => (
            <CharacterMessage key={idx} role={msg.role} content={msg.content} />
          ))
        ) : (
          <p className="text-center text-white">
            No messages yet. Click "Start Simulation".
          </p>
        )}
      </div>
    </div>
  );
}
