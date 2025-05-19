"use server";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { BaseMessageLike } from "@langchain/core/messages";
import { RunnableSequence, type Runnable } from "@langchain/core/runnables";
import { AIMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { MessagesAnnotation } from "@langchain/langgraph";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { StateGraph, END, START } from "@langchain/langgraph";

import { prompts, personalities } from "@/config";
import { messageLimit, topic } from "@/config/run_config";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey:
    process.env.GOOGLE_API_KEY ??
    (() => {
      throw new Error("GOOGLE_API_KEY is not set.");
    })(),
});

export async function createSimulatedUser(character: any) {
  console.log(
    `[createSimulatedUser] (${character.name}) Creating simulated user`
  );

  if (
    !character.name.trim() ||
    !character.profession.trim() ||
    !character.personality
  ) {
    console.log(character);
    throw new Error("[createSimulatedUser] Error: Fields are empty!");
  }

  const personality_type =
    personalities[character.personality as keyof typeof personalities];

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", prompts.system],
    ["human", "{messages}"],
  ]);

  const partialPrompt = await prompt.partial({
    topic,
    name: character.name,
    profession: character.profession,
    personality: JSON.stringify(personality_type),
    opinion_strength: JSON.stringify(character.opinion_strength),
  });
  console.log("[createSimulatedUser] Final Prompt Created");

  const simulatedUser = partialPrompt.pipe(llm);
  return simulatedUser;
}

function swapRoles(messages: BaseMessage[]) {
  return messages.map((m) =>
    m instanceof AIMessage
      ? new HumanMessage({ content: m.content })
      : new AIMessage({ content: m.content })
  );
}

async function simulatedUserNode(
  state: typeof MessagesAnnotation.State,
  character: any
) {
  console.log(`[simulatedUserNode] (${character.name}) State received`);
  const messages = state.messages;

  if (messages.length === 0) {
    console.warn(
      `[simulatedUserNode] (${character.name}) No messages received, initializing with default.`
    );
    messages.push(new HumanMessage("Hello. Shall we have a discussion?"));
  }

  const newMessages = swapRoles(messages);

  const simulatedUser = await createSimulatedUser(character);
  const response = await simulatedUser.invoke({ messages: newMessages });

  if (!response || !response.content) {
    console.error(
      `[simulatedUserNode] (${character.name}) Received invalid response.`
    );
    return {
      messages: [
        { role: "user", content: "I'm sorry, I didn't understand that." },
      ],
    };
  }

  console.log(
    `[simulatedUserNode] (${character.name}) Simulated user response`
  );

  character = adjustCharacterValues(character, response.content);

  const updatedSimulatedUser = await createSimulatedUser(character);

  const updatedResponse = await updatedSimulatedUser.invoke({
    messages: newMessages,
  });

  return { messages: [{ role: "user", content: updatedResponse.content }] };
}

function shouldContinue(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  if (messages.length > messageLimit) {
    console.log("[shouldContinue] Ending simulation - Too many messages.");
    return "__end__";
  } else if (messages[messages.length - 1].content == "FINISHED") {
    console.log(
      "[shouldContinue] Ending simulation - One user finished conversation."
    );
    return "__end__";
  } else {
    console.log("[shouldContinue] Continuing conversation.");
    return "continue";
  }
}

function createSimulation() {
  console.log("[createSimulation] Creating simulation workflow");

  function shuffleArray(array: any) {
    return array.sort(() => Math.random() - 0.5);
  }

  const characters = prompts.characters;

  shuffleArray(characters);

  const workflow = new StateGraph(MessagesAnnotation);

  for (let i = 0; i < characters.length; i++) {
    workflow.addNode(characters[i].name, (state) =>
      simulatedUserNode(state, characters[i])
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

export async function runSimulationStream() {
  const simulation = createSimulation();

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
        console.log(JSON.stringify(messages));
        const messageText = messages[0].content;

        let conv = "";
        let values = { opinion_strength: 0 };

        try {
          conv = messageText;
          const nodeCharacter = prompts.characters.find(
            (c) => c.name === nodeName
          );
          if (nodeCharacter) {
            values = { opinion_strength: nodeCharacter.opinion_strength };
          }
        } catch (err) {
          console.log(err);
        }

        if (messageText.trim() === "FINISHED") {
          continue;
        }

        const messageObj = { role: nodeName, content: conv, values: values };
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

// function adjustCharacterValues(character: any, content: any) {
//   console.log(
//     `[adjustCharacterValues] (${character.name}) Adjusting values for conversation.`
//   );
//   // console.log(content)
//   const dynamic_factors = JSON.parse(
//     content.replace(/```json\n|\n```/g, "")
//   ).values;
//   character.dynamic_factors = dynamic_factors;
//   return character;
// }

function adjustCharacterValues(character: any, content: any) {
  console.log(
    `[adjustCharacterValues] (${character.name}) Adjusting opinion_strength`
  );

  // Randomly increase or decrease opinion_strength by 0.1 (clamped between 0 and 1)
  const delta = Math.random() < 0.5 ? -0.1 : 0.1;
  character.opinion_strength = Math.min(
    1,
    Math.max(0, character.opinion_strength + delta)
  );

  return character;
}
