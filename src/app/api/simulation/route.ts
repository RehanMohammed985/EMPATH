import { runSimulationStream } from "@/lib/simulation";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  return runSimulationStream(body.characters, body.topic); // Assume this returns a ReadableStream<Response>
}
