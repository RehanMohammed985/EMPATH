"use client";

import { useState } from "react";
import CharacterMessage from "@/components/CharacterMessage";

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

  const [topic, setTopic] = useState("Is climate change real?");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [isRunning, setIsRunning] = useState(false);
  const [showInputs, setShowInputs] = useState(true);

  const updateCharacter = (index: number, field: string, value: any) => {
    const newChars = [...characters];
    (newChars[index] as any)[field] = value;
    setCharacters(newChars);
  };

  const addCharacter = () => {
    setCharacters([
      ...characters,
      {
        name: "",
        profession: "",
        personality: "INTJ",
        opinion_strength: 0,
        added_information: "",
      },
    ]);
  };

  const removeCharacter = (index: number) => {
    setCharacters(characters.filter((_, i) => i !== index));
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
          } catch {}
        }
      }

      buffer = "";
    }

    setIsRunning(false);
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
        <button
          className="btn btn-secondary"
          onClick={() => setShowInputs(!showInputs)}
        >
          {showInputs ? "Hide Settings" : "Show Settings"}
        </button>
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
            <div className="row">
              {characters.map((char, idx) => (
                <div
                  key={idx}
                  className="card bg-dark text-white mb-3 p-3 col-3 border border-dark"
                >
                  <div className="card bg-dark text-white row g-1 border border-light p-2">
                    <div className="col-12">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white"
                        value={char.name}
                        onChange={(e) =>
                          updateCharacter(idx, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Profession</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white"
                        value={char.profession}
                        onChange={(e) =>
                          updateCharacter(idx, "profession", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Personality</label>
                      <select
                        className="form-select bg-dark text-white"
                        value={char.personality}
                        onChange={(e) =>
                          updateCharacter(idx, "personality", e.target.value)
                        }
                      >
                        {Object.keys(personalities).map((p) => (
                          <option key={p} value={p}>
                            {personalities[p as keyof typeof personalities]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Opinion Strength</label>
                      <input
                        type="number"
                        min={-1}
                        max={1}
                        step={0.05}
                        className="form-control bg-dark text-white"
                        value={char.opinion_strength}
                        onChange={(e) =>
                          updateCharacter(
                            idx,
                            "opinion_strength",
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Added Information</label>
                      <textarea
                        rows={2}
                        className="form-control bg-dark text-white"
                        value={char.added_information}
                        onChange={(e) =>
                          updateCharacter(
                            idx,
                            "added_information",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="col-12 text-end mt-2">
                      <button
                        className="btn btn-outline-danger w-100"
                        onClick={() => removeCharacter(idx)}
                        disabled={characters.length === 1}
                      >
                        Remove Character
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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

      {/* <div className="text-center">
        <button
          onClick={handleStartSimulation}
          disabled={isRunning}
          className={`btn btn-lg mb-4 fw-semibold shadow ${
            isRunning ? "btn-secondary disabled" : "btn-primary"
          }`}
        >
          {isRunning ? "Running Simulation..." : "Start Simulation"}
        </button>
      </div> */}

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
