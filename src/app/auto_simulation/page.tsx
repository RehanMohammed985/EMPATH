// Updated SimulationPage.tsx
"use client";

import { useState } from "react";
import CharacterMessage from "@/components/CharacterMessage";
import ChartComponent from "@/components/ChartComponent";
import { generatePersonalityGroups } from "@/utils/group_generator";
import { charactersData } from "@/config/characters";

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
  const [characters, setCharacters] = useState(charactersData);
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [chartData, setChartData] = useState<any>({});
  // const [isRunning, setIsRunning] = useState(false);
  // const [isSimulationComplete, setIsSimulationComplete] = useState(false);
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);
  const [showInputs, setShowInputs] = useState(true);
  const [autoRunning, setAutoRunning] = useState(false);

  const [currentSimulation, setCurrentSimulation] = useState<number | null>(
    null
  );
  const [countdown, setCountdown] = useState<number>(0);

  const getInitialChartData = (chars: typeof characters) => {
    const data: Record<string, { x: number; y: number }[]> = {};
    chars.forEach(({ name, opinion_strength }) => {
      data[name] = [{ x: 0, y: opinion_strength }];
    });
    return data;
  };

const runSimulation = async (chars: typeof characters) => {
  setCharacters(chars);
  setMessages([]);
  // setIsRunning(true);
  // setIsSimulationComplete(false);

  const localChartData: Record<string, { x: number; y: number }[]> = getInitialChartData(chars);
  setChartData(localChartData); // show initial chart state in UI

  const newMessages: {
    role: string;
    content: string;
    values?: any;
    turn?: number;
  }[] = [];

  const response = await fetch("/api/simulation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ characters: chars, topic }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  if (!reader) {
    // setIsRunning(false);
    return;
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || ""; // Keep leftover chunk for next loop

    for (const line of lines) {
      if (line.startsWith("data:")) {
        const json = line.replace("data: ", "").trim();
        try {
          const msg = JSON.parse(json);
          newMessages.push(msg);
          setMessages((prev) => [...prev, msg]);

          const { role, values, turn } = msg;
          if (role && values?.opinion != null && typeof turn === "number") {
            // Update local chart data
            if (!localChartData[role]) localChartData[role] = [];
            localChartData[role].push({ x: turn + 1, y: values.opinion });

            // Update state to reflect changes visually
            setChartData({ ...localChartData });
          }
        } catch (err) {
          console.error("Failed to parse message", err);
        }
      }
    }
  }

  // setIsRunning(false);
  // setIsSimulationComplete(true);

  // Save simulation run with correct chart datac
  const res = await fetch("/api/sims/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      characters: chars,
      topic,
      messages: newMessages,
      chartData: localChartData,
    }),
  });

  const data = await res.json();
  if (data.filePath) {
    setSavedFilePath(data.filePath);
  }
};


  const handleStartNow = async () => {
    setAutoRunning(true);
    const groups = generatePersonalityGroups(8);
    if (!Array.isArray(groups)) return;

    console.log("Generated groups:", groups);

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const selected = [];
      for (let j = 0; j < group.length; j++) {
        const mbti = group[j];
        const char = characters.find((c) => c.personality === mbti);
        if (char) {
          selected.push({ ...char, opinion_strength: j % 2 === 0 ? 1 : -1 });
        }
      }

      setCurrentSimulation(i + 1); // 1-based simulation count
      console.log("Running simulation for group:", selected);
      await runSimulation(selected);

      if (i < groups.length - 1) {
        // Start 5-minute countdown (300 seconds)
        setCountdown(20);

        // Countdown interval
        await new Promise<void>((resolve) => {
          const interval = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(interval);
                resolve();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        });
      }
    }

    setCurrentSimulation(null);
    setAutoRunning(false);
  };

  return (
    <div className="container min-vh-100 text-white bg-dark py-4">
      <h1 className="fw-bold mb-5 text-center mt-5">
        Evaluating multi-turn Opinion dynamics of LLM agents with rich
        personalities
      </h1>

      {autoRunning && currentSimulation !== null && (
        <div className="mb-3 text-center">
          <p>
            Running Simulation: <strong>{currentSimulation}</strong>
          </p>
          <p>
            Waiting Time:{" "}
            <strong>
              {Math.floor(countdown / 60)}:
              {(countdown % 60).toString().padStart(2, "0")}
            </strong>{" "}
            remaining
          </p>
        </div>
      )}

      <div className="d-flex flex-row align-items-center justify-content-between mb-4 g-3">
        <button
          className="btn btn-primary"
          onClick={handleStartNow}
          disabled={autoRunning}
        >
          {autoRunning ? "Auto Running..." : "Start Now (Auto Groups)"}
        </button>

        <div className="text-center mb-4">
          <button
            className="btn btn-secondary"
            onClick={() => setShowInputs(!showInputs)}
          >
            {showInputs ? "Hide Settings" : "Show Settings"}
          </button>
        </div>
      </div>

      {savedFilePath && (
        <div className="alert alert-success">Saved at: {savedFilePath}</div>
      )}

      {showInputs && (
        <div className="border p-4 rounded bg-dark">
          <label className="form-label">Debate Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="form-control mb-3 bg-dark text-white"
          />

          <h5 className="fw-semibold mb-3">Characters</h5>
          <table className="table table-dark table-bordered table-striped align-middle text-white">
            <thead>
              <tr>
                <th>Name</th>
                <th>Profession</th>
                <th>Personality</th>
                <th>Opinion Strength</th>
                <th>Info</th>
              </tr>
            </thead>
            <tbody>
              {characters.map((c, i) => (
                <tr key={i}>
                  <td>{c.name}</td>
                  <td>{c.profession}</td>
                  <td>{(personalities as any)[c.personality]}</td>
                  <td>{c.opinion_strength.toFixed(2)}</td>
                  <td>{c.additional_info}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ChartComponent chartData={chartData} />

      <div
        className="bg-secondary bg-opacity-25 rounded-4 shadow p-4 overflow-auto mt-5"
        style={{ maxHeight: "80vh" }}
      >
        {messages.length > 0 ? (
          messages.map((msg, idx) => (
            <CharacterMessage key={idx} role={msg.role} content={msg.content} />
          ))
        ) : (
          <p className="text-center text-white">
            No messages yet. Click Start.
          </p>
        )}
      </div>
    </div>
  );
}
