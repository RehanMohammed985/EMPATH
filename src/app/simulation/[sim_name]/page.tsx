"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function SimulationReplayPage() {
  const { sim_name } = useParams();
  const [data, setData] = useState<{
    topic: string;
    characters: any[];
    messages: any[];
    chartData: Record<string, { x: number; y: number }[]>;
  } | null>(null);

  const [showChart, setShowChart] = useState(true);
  const [showCharacters, setShowCharacters] = useState(false);
  const [visibleCharacters, setVisibleCharacters] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/sims/read?filename=${sim_name}.json`);
      const json = await res.json();
      if (json.content) {
        setData(json.content);

        const initialVisibility: Record<string, boolean> = {};
        json.content.characters.forEach((char: any) => {
          initialVisibility[char.name] = true;
        });
        setVisibleCharacters(initialVisibility);
      }
    }
    fetchData();
  }, [sim_name]);

  if (!data) {
    return (
      <p className="text-white text-center">Loading saved simulation...</p>
    );
  }

  return (
    <div className="container min-vh-100 text-white bg-dark py-4">
      <h1 className="display-5 fw-bold text-center mb-4">Replay Simulation</h1>
      <h4 className="text-center mb-4">Simulation Name: {sim_name}</h4>
      <h3 className="text-center mb-4">Topic: {data.topic}</h3>

      {/* Character visibility checkboxes */}
      <div className="d-flex flex-wrap gap-3 justify-content-center mb-4">
        {data.characters.map((char) => (
          <div key={char.name} className="form-check form-switch text-white">
            <input
              type="checkbox"
              className="form-check-input"
              id={`toggle-${char.name}`}
              checked={visibleCharacters[char.name]}
              onChange={() =>
                setVisibleCharacters((prev) => ({
                  ...prev,
                  [char.name]: !prev[char.name],
                }))
              }
            />
            <label className="form-check-label" htmlFor={`toggle-${char.name}`}>
              {char.name}
            </label>
          </div>
        ))}
      </div>

      {/* Toggle Buttons */}
      <div className="d-flex justify-content-end gap-3 mb-4">
        <button
          className="btn btn-secondary"
          onClick={() => setShowCharacters((prev) => !prev)}
        >
          {showCharacters ? "Hide Characters" : "Show Characters"}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowChart((prev) => !prev)}
        >
          {showChart ? "Hide Graph" : "Show Graph"}
        </button>
      </div>

      {/* Character Cards */}
      <div className={`slide-toggle ${showCharacters ? "open" : "closed"}`}>
        <div className="container border border-light rounded-4 p-4 bg-dark mb-4">
          <h5 className="fw-semibold mb-3">Characters</h5>

          <div className="table-responsive">
            <table className="table table-dark table-bordered table-hover align-middle text-white">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Profession</th>
                  <th>Personality</th>
                  <th>Opinion Strength</th>
                  <th>Added Information</th>
                </tr>
              </thead>
              <tbody>
                {data.characters
                  .filter((char) => visibleCharacters[char.name])
                  .map((char, idx) => (
                    <tr key={idx}>
                      <td>{char.name}</td>
                      <td>{char.profession}</td>
                      <td>
                        {(personalities as any)[char.personality] ||
                          char.personality}
                      </td>
                      <td>{char.opinion_strength}</td>
                      <td style={{ whiteSpace: "pre-wrap" }}>
                        {char.added_information || "N/A"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ChartComponent */}
      <div className={`slide-toggle ${showChart ? "open" : "closed"}`}>
        <ChartComponent
          chartData={Object.fromEntries(
            Object.entries(data.chartData).filter(
              ([charName]) => visibleCharacters[charName]
            )
          )}
        />
      </div>

      {/* Messages */}
      <div
        className="bg-secondary bg-opacity-25 rounded-4 shadow p-4 overflow-auto mt-4"
        style={{ maxHeight: "80vh" }}
      >
        {data.messages?.length > 0 ? (
          data.messages
            .filter((msg) => visibleCharacters[msg.role])
            .map((msg, idx) => (
              <CharacterMessage
                key={idx}
                role={msg.role}
                content={msg.content}
              />
            ))
        ) : (
          <p className="text-center text-white">No messages found.</p>
        )}
      </div>
    </div>
  );
}
