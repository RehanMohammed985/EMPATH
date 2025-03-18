"use server";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import type { BaseMessageLike } from "@langchain/core/messages";
import { type Runnable } from "@langchain/core/runnables";
import { AIMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { MessagesAnnotation } from "@langchain/langgraph";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { StateGraph, END, START } from "@langchain/langgraph";

import { prompts } from "@/config/prompts";
import { messageLimit } from "@/config/run_config";

const llm = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey: process.env.GOOGLE_API_KEY ?? (() => { throw new Error("GOOGLE_API_KEY is not set."); })(),
});

export async function createSimulatedUser(character: any): Promise<Runnable<{ messages: BaseMessageLike[] }, AIMessage>> {
    console.log("[createSimulatedUser] Creating simulated user with custom instructions...");

    // Ensure `messages` placeholder is properly formatted
    const prompt = ChatPromptTemplate.fromMessages([
        ["system", prompts.system],
        ["human", "{messages}"], // Ensure this key matches expected format
    ]);

    if (!character.instructions.trim()) {
        throw new Error("[createSimulatedUser] Error: Instructions are empty!");
    }

    if (!character.knowledge.trim()) {
        throw new Error("[createSimulatedUser] Error: Knowledge is empty!");
    }

    const partialPrompt = await prompt.partial({
        instructions: character.instructions,
        knowledge: character.knowledge,
        personality: JSON.stringify(character.personality)
    });
    console.log("[createSimulatedUser] Final Prompt Created");

    const simulatedUser = partialPrompt.pipe(llm);
    return simulatedUser;
}

function swapRoles(messages: BaseMessage[]) {
    console.log("[swapRoles] Swapping roles for messages");
    return messages.map((m) =>
        m instanceof AIMessage
            ? new HumanMessage({ content: m.content })
            : new AIMessage({ content: m.content }),
    );
}

async function simulatedUserNode(state: typeof MessagesAnnotation.State, character: any) {
    console.log(`[simulatedUserNode] (${character.name}) State received`);
    const messages = state.messages;

    if (messages.length === 0) {
        console.warn(`[simulatedUserNode] (${character.name}) No messages received, initializing with default.`);
        messages.push(new HumanMessage("Hello."));
    }

    const newMessages = swapRoles(messages);
    console.log(`[simulatedUserNode] (${character.name}) Swapped messages`);

    const simulatedUser = await createSimulatedUser(character);
    const response = await simulatedUser.invoke({ messages: newMessages });

    if (!response || !response.content) {
        console.error(`[simulatedUserNode] (${character.name}) Received invalid response.`);
        return { messages: [{ role: "user", content: "I'm sorry, I didn't understand that." }] };
    }

    console.log(`[simulatedUserNode] (${character.name}) Simulated user response`);

    adjustOCEANValues(character, response.content);

    // console.log(response)

    return { messages: [{ role: "user", content: response.content }] };
}

function shouldContinue(state: typeof MessagesAnnotation.State) {
    const messages = state.messages;
    if (messages.length > messageLimit) {  // Increased limit for a natural conversation flow
        console.log("[shouldContinue] Ending simulation - Too many messages.");
        return '__end__';
    } else if (messages[messages.length - 1].content == 'FINISHED') {
        console.log("[shouldContinue] Ending simulation - One user finished conversation.");
        return '__end__';
    } else {
        console.log("[shouldContinue] Continuing conversation.");
        return 'continue';
    }
}

function createSimulation() {
    console.log("[createSimulation] Creating simulation workflow...");

    const characters = prompts.characters;

    const workflow = new StateGraph(MessagesAnnotation)

    for (let i = 0; i < characters.length; i++) {
        workflow.addNode(characters[i].name, (state) => simulatedUserNode(state, characters[i]))
    }

    for (let i = 0; i < characters.length - 1; i++) {
        workflow.addEdge(characters[i].name as any, characters[i + 1].name as any)
    }

    for (let i = 0; i < characters.length; i++) {
        const nextIndex = (i + 1) % characters.length;
        workflow.addConditionalEdges(characters[i].name as any, shouldContinue, {
            [END]: END,
            continue: characters[nextIndex].name as any,
        })
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
            for await (const chunk of await simulation.stream({})) {
                const nodeName = Object.keys(chunk)[0];
                const messages = chunk[nodeName].messages;
                const messageText = messages[0].content

                let conv = "--"
                let personality;

                try {
                    const cleanedMessageText = messageText.replace(/```json\n|\n```/g, '');
                    const parsedMessage = JSON.parse(cleanedMessageText)
                    conv = parsedMessage[0].content
                    personality = parsedMessage[0].personality
                }
                catch (err) {
                    console.log(err)
                }

                if (messageText.trim() === "FINISHED") {
                    continue;
                }

                const messageObj = { role: nodeName, content: conv, personality: personality };
                const data = `data: ${JSON.stringify(messageObj)}\n\n`;

                controller.enqueue(encoder.encode(data));
            }
            controller.close();
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    });
}

function adjustOCEANValues(character:any, content:any){
    console.log("NAME:", character.name)
    console.log("before", JSON.stringify(character.personality))
    const personality = JSON.parse(content.replace(/```json\n|\n```/g, ''))[0].personality;
    character.personality = personality
    console.log("after", JSON.stringify(character.personality))
    return character
}
