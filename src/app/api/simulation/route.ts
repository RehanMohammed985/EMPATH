import { runSimulationStream } from "@/lib/simulation";

export async function GET() {
    return runSimulationStream();
}
