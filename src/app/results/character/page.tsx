"use client";

import { useEffect, useState } from "react";
import ChartComponent from "@/components/ResultCharts";

type ChartSeries = { label: string; data: { x: number; y: number }[] };
type CharacterGroup = {
  characterName: string;
  series: ChartSeries[];
};

export default function CharacterViewPage() {
  const [characterGroups, setCharacterGroups] = useState<CharacterGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAndGroupByCharacter() {
      const res = await fetch("/api/sims/readfiles");
      const filenames: string[] = await res.json();

      const nameCounters: Record<string, number> = {};
      const groups: Record<string, ChartSeries[]> = {};

      for (const filename of filenames) {
        const simName = filename.replace(".json", "");
        const simRes = await fetch(`/api/sims/read?filename=${filename}`);
        const simJson = await simRes.json();

        if (!simJson.content?.characters || !simJson.content?.chartData) continue;

        for (const char of simJson.content.characters) {
          const baseName = char.name;
          const count = (nameCounters[baseName] || 0) + 1;
          nameCounters[baseName] = count;

          // Label variant, e.g. "Sophia Reed", "Sophia Reed (2)", ...
          const instanceLabel = count === 1 ? baseName : `${baseName} (${count})`;

          const dataPoints = simJson.content.chartData[baseName] || [];
          const series: ChartSeries = { label: instanceLabel, data: dataPoints };

          // Append to that character's group
          if (!groups[baseName]) groups[baseName] = [];
          groups[baseName].push(series);
        }
      }

      // Convert to array for rendering
      const charGroupsArray: CharacterGroup[] = Object.entries(groups).map(
        ([characterName, series]) => ({ characterName, series })
      );

      setCharacterGroups(charGroupsArray);
      setLoading(false);
    }

    fetchAndGroupByCharacter();
  }, []);

  if (loading) {
    return <p className="text-white text-center">Loading character charts...</p>;
  }

  return (
    <div className="container min-vh-100 text-white bg-dark py-4">
      <h1 className="display-5 fw-bold text-center mb-4">
        Character-Based View – Combined Instances
      </h1>

      <div className="row">
        {characterGroups.map(({ characterName, series }) => {
          const chartData = series.reduce(
            (acc, s) => ({ ...acc, [s.label]: s.data }),
            {} as Record<string, { x: number; y: number }[]>
          );

          return (
            <div key={characterName} className="col-12 mb-5 d-flex flex-column align-items-center">
              <h5 className="text-center mb-3">{characterName}</h5>
              <ChartComponent chartData={chartData} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
