import { NextResponse } from "next/server";
import * as ftp from "basic-ftp";

export async function POST(request) {
  const formData = await request.formData();
  const file     = formData.get("file");
  const taskId   = formData.get("taskId");

  if (!file || !taskId) {
    return NextResponse.json({ error: "Файл и taskId обязательны" }, { status: 400 });
  }

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = `${taskId}_${Date.now()}_${file.name}`;

  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host:     process.env.FTP_HOST,
      user:     process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure:   false,
    });

    const { Readable } = await import("stream");
    const stream = Readable.from(buffer);
    await client.uploadFrom(stream, fileName);

    return NextResponse.json({
      success:  true,
      fileName,
      url: `ftp://${process.env.FTP_HOST}/${fileName}`,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.close();
  }
}