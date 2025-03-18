
// async function chatBotNode(state: typeof MessagesAnnotation.State) {
//     let messages = state.messages;

//     // Ensure there is at least one user message
//     if (messages.length === 0) {
//         messages = [new HumanMessage("Hello.")];
//         console.warn("[chatBotNode] No messages received, adding default user message.");
//     }

//     console.log("[chatBotNode] Sending messages to myChatBot:", messages);

//     const chatBotResponse = await myChatBot(messages);

//     return { messages: [new AIMessage(chatBotResponse)] };
// }

// export async function myChatBot(messages: BaseMessageLike[]): Promise<string> {
//     console.log("[myChatBot] Received messages:", messages);
//     const systemMessage = {
//         role: "system",
//         content: "You are a customer support agent for an airline.",
//     };
//     const allMessages = [systemMessage, ...messages];

//     console.log("[myChatBot] Sending messages to LLM:", allMessages);
//     const response = await llm.invoke(allMessages);
//     console.log("[myChatBot] Response from LLM:", response);

//     return response?.content.toString() ?? "No response received";
// }

// function createSimulation() {
//     console.log("[createSimulation] Creating simulation workflow...");

//     const characters = prompts.characters;

//     const workflow = new StateGraph(MessagesAnnotation)
//         .addNode(characters.char1.name, (state) => simulatedUserNode(state, characters.char1))
//         .addNode(characters.char2.name, (state) => simulatedUserNode(state, characters.char2))
//         .addEdge(characters.char1.name, characters.char2.name)
//         .addConditionalEdges(characters.char2.name, shouldContinue, {
//             [END]: END,
//             continue: characters.char1.name,
//         })
//         .addConditionalEdges(characters.char1.name, shouldContinue, {
//             [END]: END,
//             continue: characters.char2.name,
//         })
//         .addEdge(START, characters.char1.name);

//     const simulation = workflow.compile();
//     console.log("[createSimulation] Simulation workflow compiled.");
//     return simulation;
// }