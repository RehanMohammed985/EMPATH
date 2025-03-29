import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const SAVE_DIR = path.join(process.cwd(), "saved");

// Ensure directory exists
if (!fs.existsSync(SAVE_DIR)) {
    fs.mkdirSync(SAVE_DIR, { recursive: true });
}

export async function POST(req: Request) {
    try {
        const simulationData = await req.json();
        const timestamp = new Date().toISOString().replace(/[:.-]/g, "_");
        const filename = `${timestamp}-${uuidv4()}.json`;
        const filePath = path.join(SAVE_DIR, filename);

        fs.writeFileSync(filePath, JSON.stringify(simulationData, null, 2));

        return NextResponse.json({ message: "Simulation saved", filePath });
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Failed to save simulation" }, { status: 500 });
    }
}
