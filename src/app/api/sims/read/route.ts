import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SAVE_DIR = path.join(process.cwd(), "saved");

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const filename = searchParams.get("filename");

        if (!filename) {
            return NextResponse.json({ error: "Filename is required" }, { status: 400 });
        }

        const filePath = path.join(SAVE_DIR, filename);

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        const fileContent = fs.readFileSync(filePath, "utf-8");
        const jsonData = JSON.parse(fileContent);

        return NextResponse.json({ filename, content: jsonData });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
    }
}
