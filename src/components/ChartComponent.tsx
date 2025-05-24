"use client";

import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, Filler);

type ChartPoint = {
  x: number;
  y: number;
};

type ChartData = {
  [role: string]: ChartPoint[];
};

interface OpinionStrengthChartProps {
  chartData: ChartData;
}

const ChartComponent: React.FC<OpinionStrengthChartProps> = ({ chartData }) => {
  if (Object.keys(chartData).length === 0) return null;

  // Dynamically compute the max X value across all roles
  const maxX = Math.max(
    ...Object.values(chartData)
      .flat()
      .map((point: ChartPoint) => point.x)
  );

  return (
    <div className="container d-flex flex-row align-items-center justify-content-center mb-4 g-3">
      <div className="col-6">
        <div className="bg-dark mt-4 p-4 rounded-4 shadow">
          <h4 className="text-white mb-3">Opinion Strength Over Turns</h4>
          <Line
            data={{
              datasets: Object.entries(chartData).map(([role, data], i) => ({
                label: role,
                data,
                borderColor: `hsl(${(i * 60) % 360}, 70%, 60%)`,
                tension: 0.3,
                fill: false,
              })),
            }}
            options={{
              responsive: true,
              scales: {
                x: {
                  type: "linear",
                  min: 0,
                  max: Math.min(10, maxX), // ensure at least 10 or the real max
                  title: {
                    display: true,
                    text: "Turn Index",
                    color: "#fff",
                  },
                  ticks: {
                    color: "#fff",
                  },
                },
                y: {
                  min: -1,
                  max: 1,
                  title: {
                    display: true,
                    text: "Opinion Strength",
                    color: "#fff",
                  },
                  ticks: {
                    color: "#fff",
                  },
                },
              },
              plugins: {
                legend: {
                  labels: {
                    color: "#fff",
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartComponent;
