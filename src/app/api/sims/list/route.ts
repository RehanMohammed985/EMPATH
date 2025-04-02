import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SAVE_DIR = path.join(process.cwd(), "saved");

export async function GET() {
    try {
        // Ensure directory exists
        if (!fs.existsSync(SAVE_DIR)) {
            return NextResponse.json({ files: [] });
        }

        // Read all files in the directory
        const files = fs.readdirSync(SAVE_DIR).filter(file => file.endsWith(".json"));

        return NextResponse.json({ files });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
    }
}
