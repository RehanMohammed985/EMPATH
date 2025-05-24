"use server";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MessagesAnnotation } from "@langchain/langgraph";
import { StateGraph, END, START } from "@langchain/langgraph";
import { messageLimit } from "@/config/run_config";
import {
  rateOpinionOnTopic,
  simulatedUserNode,
} from "@/utils/simulation_utils";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey:
    process.env.GOOGLE_API_KEY ??
    (() => {
      throw new Error("GOOGLE_API_KEY is not set.");
    })(),
});

function shouldContinue(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  if (messages.length > messageLimit) {
    console.log("[shouldContinue] Ending simulation - Too many messages.");
    return "__end__";
  } else {
    console.log("[shouldContinue] Continuing conversation.");
    return "continue";
  }
}

function createSimulation(characters: any[] = [], topic: string = "") {
  console.log("[createSimulation] Creating simulation workflow");

  function shuffleArray(array: any) {
    return array.sort(() => Math.random() - 0.5);
  }

  shuffleArray(characters);

  const workflow = new StateGraph(MessagesAnnotation);

  for (let i = 0; i < characters.length; i++) {
    workflow.addNode(characters[i].name, (state) =>
      simulatedUserNode(llm, state, characters[i], topic)
    );
  }

  // Add normal edges (A → B → C → D)
  for (let i = 0; i < characters.length - 1; i++) {
    workflow.addEdge(characters[i].name as any, characters[i + 1].name as any);
  }

  // Conditional looping logic (D → A if shouldContinue allows)
  for (let i = 0; i < characters.length; i++) {
    const nextIndex = (i + 1) % characters.length;
    workflow.addConditionalEdges(characters[i].name as any, shouldContinue, {
      [END]: END,
      continue: characters[nextIndex].name as any,
    });
  }

  workflow.addEdge(START, characters[0].name as any);

  const simulation = workflow.compile();

  console.log("[createSimulation] Simulation workflow compiled.");
  return simulation;
}

export async function runSimulationStream(characters: any[], topic: string) {
  const simulation = createSimulation(characters, topic);
  const roleTurnCounters: Record<string, number | null> = {};

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const recursionLimit = 100; // Set your desired limit

      for await (const chunk of await simulation.stream(
        {},
        { recursionLimit }
      )) {
        const nodeName = Object.keys(chunk)[0];
        const messages = chunk[nodeName].messages;
        const messageText = messages[0].content;

        let conv = "";
        let values: Record<string, number | null> = { opinion: null };

        try {
          conv = messageText;
          const opinion = await rateOpinionOnTopic(llm, topic, conv);
          values.opinion = opinion;
          console.log(
            `[runSimulationStream] (${nodeName}) Opinion rating: ${JSON.stringify(
              opinion
            )}`
          );
        } catch (err) {
          console.log(err);
        }

        if (messageText.trim() === "FINISHED") {
          continue;
        }

        // Increment the character’s turn count
        const turnIndex = roleTurnCounters[nodeName] ?? 0;
        roleTurnCounters[nodeName] = turnIndex + 1;

        console.log(
          `[runSimulationStream] (${nodeName}) Turn: ${turnIndex}, Message`
        );

        const messageObj = {
          role: nodeName,
          content: conv,
          values: values,
          turn: turnIndex,
        };
        const data = `data: ${JSON.stringify(messageObj)}\n\n`;

        controller.enqueue(encoder.encode(data));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
