import { NextResponse } from "next/server";
import * as ftp from "basic-ftp";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json({ error: "taskId обязателен" }, { status: 400 });
  }

  console.log("FTP_HOST:", process.env.FTP_HOST);
  console.log("FTP_USER:", process.env.FTP_USER);

  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    await client.access({
      host:     process.env.FTP_HOST,
      user:     process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure:   false,
    });

    const list = await client.list();
    const files = list
      .filter((f) => f.name.startsWith(`${taskId}_`))
      .map((f) => ({
        name:     f.name.replace(`${taskId}_`, "").replace(/^\d+_/, ""),
        fullName: f.name,
        size:     f.size,
      }));

    return NextResponse.json(files);
  } catch (err) {
    console.error("FTP error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.close();
  }
}