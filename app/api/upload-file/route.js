import { NextResponse } from "next/server";
import * as ftp from "basic-ftp";
import { createClient } from "@supabase/supabase-js";
import { Readable } from "stream";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getFileType(name) {
  const ext = name.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["pdf"].includes(ext)) return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["xls", "xlsx"].includes(ext)) return "excel";
  if (["zip", "rar", "7z"].includes(ext)) return "archive";
  if (["mp4", "mov", "avi"].includes(ext)) return "video";
  if (["mp3", "wav"].includes(ext)) return "audio";
  return "other";
}

export async function POST(request) {
  const formData = await request.formData();
  const file     = formData.get("file");
  const taskId   = formData.get("taskId");
  const userId   = formData.get("userId");

  if (!file || !taskId) {
    return NextResponse.json({ error: "Файл и taskId обязательны" }, { status: 400 });
  }

  const bytes    = await file.arrayBuffer();
  const buffer   = Buffer.from(bytes);
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

    const stream = Readable.from(buffer);
    await client.uploadFrom(stream, fileName);

    // Сохраняем метаданные в Supabase
    await supabase.from("documents").insert([{
      name:        file.name,
      full_name:   fileName,
      size:        file.size,
      file_type:   getFileType(file.name),
      task_id:     parseInt(taskId),
      uploaded_by: userId || null,
    }]);

    return NextResponse.json({ success: true, fileName });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.close();
  }
}