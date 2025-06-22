"use client";

import { useEffect, useState } from "react";
import ChartComponent from "@/components/ResultCharts";

export default function ResultsPage() {
  const [groupedSimulations, setGroupedSimulations] = useState<
    Record<
      string,
      {
        simName: string;
        topic: string;
        chartData: Record<string, { x: number; y: number }[]>;
        visibleCharacters: Record<string, boolean>;
      }[]
    >
  >({});

  const [showAll, setShowAll] = useState(true);
  
  useEffect(() => {
    async function fetchAllSimulations() {
      const res = await fetch("/api/sims/readfiles");
      const json = await res.json();

      if (Array.isArray(json)) {
        const topicGroups: Record<string, any[]> = {};

        for (const filename of json) {
          const simName = filename.replace(".json", "");
          const simRes = await fetch(`/api/sims/read?filename=${filename}`);
          const simJson = await simRes.json();

          if (simJson.content) {
            const topic = simJson.content.topic || "Untitled";
            const initialVisibility: Record<string, boolean> = {};
            simJson.content.characters.forEach((char: any) => {
              initialVisibility[char.name] = true;
            });

            const sim = {
              simName,
              topic,
              chartData: simJson.content.chartData,
              visibleCharacters: initialVisibility,
            };

            if (!topicGroups[topic]) {
              topicGroups[topic] = [];
            }
            topicGroups[topic].push(sim);
          }
        }

        setGroupedSimulations(topicGroups);
      }
    }

    fetchAllSimulations();
  }, []);
  

  if (Object.keys(groupedSimulations).length === 0) {
    return <p className="text-white text-center">Loading all simulations...</p>;
  }

  return (
    <div className="container min-vh-100 text-white bg-dark py-4">
      <h1 className="display-5 fw-bold text-center mb-4">
        All Simulation Replays
      </h1>

      <div className="text-center mb-5">
        <button
          className="btn btn-primary"
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll ? "Hide All Replays" : "Show All Replays"}
        </button>

      </div>

      {showAll &&
        Object.entries(groupedSimulations).map(([topic, sims]) => (
          <div key={topic} className="col-12 mb-5">
            <h4 className="text-xl font-semibold text-center mb-4 pb-2">
              Topic: {topic}
            </h4>
            <div className="row">
              {sims.map((sim) => (
                <ChartComponent
                  key={sim.simName}
                  chartData={Object.fromEntries(
                    Object.entries(sim.chartData).filter(
                      ([charName]) => sim.visibleCharacters[charName]
                    )
                  )}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
