/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import client from "@/app/api/client";

const STATUS_LABEL = {
  created: { label: "Создано", className: "bg-gray-100 text-gray-600" },
  in_progress: { label: "В работе", className: "bg-yellow-100 text-yellow-700" },
  review: { label: "Ревью", className: "bg-blue-100 text-blue-700" },
  changes: { label: "Правки", className: "bg-red-100 text-red-700" },
  done: { label: "Готово", className: "bg-green-100 text-green-700" },
};

function FileItem({ file, onDelete }) {
  const url = `https://13.63.74.74/files/${file.fullName}`;
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch("/api/delete-file", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.fullName }),
    });
    setDeleting(false);
    if (res.ok) onDelete(file.fullName);
    else alert("Ошибка удаления");
  }

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-lg">📄</span>
        <div>
          <p className="text-sm font-medium">{file.name}</p>
          <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <a href={url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-xs rounded-md border hover:bg-gray-50 transition">
          Открыть
        </a>
        <a href={url} download={file.name} className="px-3 py-1 text-xs rounded-md border border-black bg-black text-white hover:bg-gray-800 transition">
          Скачать
        </a>

        {confirm ? (
          <div className="flex gap-1 items-center">
            <span className="text-xs text-red-500">Удалить?</span>
            <button onClick={handleDelete} disabled={deleting} className="px-2 py-1 text-xs rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition">
              {deleting ? "..." : "Да"}
            </button>
            <button onClick={() => setConfirm(false)} className="px-2 py-1 text-xs rounded-md border hover:bg-gray-50 transition">
              Нет
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} className="px-3 py-1 text-xs rounded-md border border-red-200 text-red-500 hover:bg-red-50 transition">
            Удалить
          </button>
        )}
      </div>
    </div>
  );
}

export default function TaskComponent() {
  const { id } = useParams();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [assigned, setAssigned] = useState(null);
  const [createdBy, setCreatedBy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Файлы
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    async function fetchTask() {
      const { data, error } = await client.from("tasks").select("*").eq("id", id).single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setTask(data);

      if (data.assigned_to) {
        const { data: profile } = await client.from("profiles").select("first_name, last_name, email").eq("id", data.assigned_to).single();
        setAssigned(profile);
      }

      if (data.created_by) {
        const { data: profile } = await client.from("profiles").select("first_name, last_name, email").eq("id", data.created_by).single();
        setCreatedBy(profile);
      }

      setLoading(false);
    }
    fetchTask();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchFiles();
  }, [id]);

  async function fetchFiles() {
    setFilesLoading(true);
    const res = await fetch(`/api/get-files?taskId=${id}`);
    const data = await res.json();
    setFiles(Array.isArray(data) ? data : []);
    setFilesLoading(false);
  }

  async function uploadFiles(fileList) {
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", id);

      await fetch("/api/upload-file", { method: "POST", body: formData });
    }
    await fetchFiles();
    setUploading(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  function handleFileInput(e) {
    if (e.target.files.length) uploadFiles(e.target.files);
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Загрузка...</div>;
  if (error) return <div className="p-8 text-sm text-red-500">Ошибка: {error}</div>;
  if (!task) return <div className="p-8 text-sm text-gray-400">Задача не найдена</div>;

  const status = STATUS_LABEL[task.status];
  const created = new Date(task.created_at).toLocaleString("ru-RU");

  function userName(profile) {
    if (!profile) return "—";
    return [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email;
  }

  return (
    <div className="p-8">
      {/* Назад */}
      <button onClick={() => router.back()} className="text-sm text-gray-400 border px-4 py-2 rounded-lg hover:text-black transition mb-6 flex items-center gap-1">
        Назад
      </button>

      {/* Заголовок */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{task.title}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${status?.className}`}>{status?.label ?? task.status}</span>
      </div>

      {/* Описание */}
      <div className="border rounded-xl p-5 mb-4">
        <h2 className="text-sm font-medium text-gray-500 mb-2">Описание</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description || "Описание не указано"}</p>
      </div>

      {/* Детали */}
      <div className="border rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400">Исполнитель</p>
          <p className="text-sm font-medium mt-0.5">{userName(assigned)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Создал</p>
          <p className="text-sm font-medium mt-0.5">{userName(createdBy)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Дата создания</p>
          <p className="text-sm font-medium mt-0.5">{created}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">ID задачи</p>
          <p className="text-sm font-medium mt-0.5 font-mono">{task.id}</p>
        </div>
      </div>

      {/* Файлы */}
      <div className="border rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-500 mb-4">Файлы</h2>

        {/* Drag & Drop зона */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition mb-4 ${dragOver ? "border-black bg-gray-50" : "border-gray-200"}`}
        >
          <p className="text-sm text-gray-400 mb-2">{uploading ? "Загрузка..." : "Перетащи файлы сюда или"}</p>
          {!uploading && (
            <label className="cursor-pointer px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800 transition">
              Выбрать файлы
              <input type="file" multiple className="hidden" onChange={handleFileInput} />
            </label>
          )}
        </div>

        {/* Список файлов */}
        {filesLoading ? (
          <p className="text-sm text-gray-400">Загрузка файлов...</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-gray-400">Файлов пока нет</p>
        ) : (
          <div>
            {files.map((f, i) => (
              <FileItem key={i} file={f} onDelete={(fileName) => setFiles((prev) => prev.filter((f) => f.fullName !== fileName))} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
