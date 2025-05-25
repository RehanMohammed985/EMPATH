import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SAVE_DIR = path.join(process.cwd(), "saved");

// Ensure directory exists
if (!fs.existsSync(SAVE_DIR)) {
  fs.mkdirSync(SAVE_DIR, { recursive: true });
}

export async function POST(req: Request) {
  try {
    const simulationData = await req.json();
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(
      now.getHours()
    ).padStart(2, "0")}h${String(now.getMinutes()).padStart(2, "0")}m${String(
      now.getSeconds()
    ).padStart(2, "0")}s`;
    const filename = `${timestamp}.json`;
    const filePath = path.join(SAVE_DIR, filename);

    fs.writeFileSync(filePath, JSON.stringify(simulationData, null, 2));

    return NextResponse.json({ message: "Simulation saved", filePath });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to save simulation" },
      { status: 500 }
    );
  }
}
