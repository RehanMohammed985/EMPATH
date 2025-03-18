import { NextRequest } from "next/server";
import { runSimulationStream } from "@/lib/simulation";

export async function GET(req: NextRequest) {
    return runSimulationStream();
}
