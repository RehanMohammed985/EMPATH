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

  const characterDynamicFactors = Object.fromEntries(
    prompts.characters.map(({ name, dynamic_factors }) => [name, [dynamic_factors]]) // Wrap in an array
  );
  
  const [values, setValues] = useState<Record<string, any[]>>(characterDynamicFactors);
  
  const handleSimulation = async () => {
    setSimulationLoading(true);
    setSimulationResponse([]);

    const eventSource = new EventSource("/api/simulation");

    eventSource.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      const { role, values } = newMessage;

      setValues((prev: Record<string, any[]>) => ({
        ...prev,
        [role]: [...(prev[role] || []), values],
      }));
      setSimulationResponse((prev) => [...prev, newMessage]);
    };

    eventSource.onerror = () => {
      eventSource.close();
      setSimulationLoading(false);
    };
  };

  const getChartData = (role: string) => {
    const valueList = values[role] || [];

    const chartData = {
      labels: valueList.map((_: any, i: number) => `Conv ${i + 1}`),
      datasets: [
        {
          label: "Belief",
          data: valueList.map((p: { belief_strength: any; }) => p.belief_strength),
          borderColor: "rgb(192, 75, 85)",
          tension: 0.1,
        },
        {
          label: "Receptiveness",
          data: valueList.map((p: { receptiveness: any; }) => p.receptiveness),
          borderColor: "rgb(55, 210, 166)",
          tension: 0.1,
        },
        {
          label: "Interest",
          data: valueList.map((p: { interest_in_argument: any; }) => p.interest_in_argument),
          borderColor: "rgb(121, 64, 255)",
          tension: 0.1,
        }
      ],
    };

    return chartData;
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        min: 0,
        max: 12,
        ticks: {
          stepSize: 1,
        }
      },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-200">
      <h1 className="text-2xl font-bold mb-2">Conversation Simulation</h1>

      <button
        onClick={handleSimulation}
        disabled={simulationLoading}
        className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400 mt-4"
      >
        {simulationLoading ? "Streaming..." : "Simulate Chat"}
      </button>

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
            <div className="mt-4 p-4 border rounded max-w-md text-left shadow-md">
              <div className="flex flex-col space-y-2">
                {simulationResponse.length > 0 ? (
                  simulationResponse.map((msg, index) => (
                    <div
                      key={index}
                      className="p-2 rounded-lg text-sm max-w-[90%] mt-3"
                    >
                      <strong className="text-uppercase">{msg.role}: </strong>
                      "{msg.content}"
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    Click "Simulate Chat" to start a conversation.
                  </p>
                )}
              </div>
            </div>
          </div>
          {/* <div className="col-4">
            <div className="mt-4 p-4 border rounded max-w-md text-left shadow-md">
              <h3 className="font-semibold text-lg">Personalities:</h3>
              {Object.entries(personalities).map(([role, personalityList], index) => (
                <div key={index} className="mt-2">
                  <h4 className="font-medium">{role}:</h4>
                  <ul>
                    {personalityList &&
                      personalityList.map((personality, i) => (
                        <li key={i} className="text-sm">
                          {`Openness: ${personality.Openness}, Conscientiousness: ${personality.Conscientiousness}, Extraversion: ${personality.Extraversion}, Agreeableness: ${personality.Agreeableness}, Neuroticism: ${personality.Neuroticism}`}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      </div>

      {/* Render a chart for each user/role */}

    </div>
  );
}
