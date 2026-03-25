"use client";

import { useEffect, useState, useMemo } from "react";
import client from "@/app/api/client";

const FILE_TYPE_LABEL = {
  image:   { label: "Изображение", icon: "🖼️" },
  pdf:     { label: "PDF",         icon: "📋" },
  word:    { label: "Word",        icon: "📝" },
  excel:   { label: "Excel",       icon: "📊" },
  archive: { label: "Архив",       icon: "🗜️" },
  video:   { label: "Видео",       icon: "🎬" },
  audio:   { label: "Аудио",       icon: "🎵" },
  other:   { label: "Другое",      icon: "📄" },
};

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks]         = useState([]);
  const [uploaders, setUploaders] = useState({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Фильтры
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [taskFilter, setTaskFilter] = useState("all");

  // Удаление
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [{ data: docs, error: docsError }, { data: tasksData }] = await Promise.all([
        client.from("documents").select("*").order("created_at", { ascending: false }),
        client.from("tasks").select("id, title"),
      ]);

      if (docsError) { setError(docsError.message); setLoading(false); return; }

      setDocuments(docs ?? []);
      setTasks(tasksData ?? []);

      // Загружаем профили загрузивших
      const userIds = [...new Set(docs.map((d) => d.uploaded_by).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await client
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", userIds);

        const map = {};
        profiles?.forEach((p) => { map[p.id] = p; });
        setUploaders(map);
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  // Фильтрация
  const filtered = useMemo(() => {
    return documents.filter((d) => {
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
      const matchType   = typeFilter === "all" || d.file_type === typeFilter;
      const matchTask   = taskFilter === "all" || String(d.task_id) === taskFilter;
      return matchSearch && matchType && matchTask;
    });
  }, [documents, search, typeFilter, taskFilter]);

  async function handleDelete(doc) {
    setDeleting(true);

    // Удаляем с FTP
    await fetch("/api/delete-file", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ fileName: doc.full_name }),
    });

    // Удаляем из Supabase
    await client.from("documents").delete().eq("id", doc.id);

    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    setDeleteTarget(null);
    setDeleting(false);
  }

  function getTaskTitle(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    return task?.title ?? "—";
  }

  function getUserName(userId) {
    if (!userId) return "—";
    const p = uploaders[userId];
    if (!p) return "—";
    return [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email;
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">Загрузка...</div>;
  if (error)   return <div className="p-6 text-sm text-red-500">Ошибка: {error}</div>;

  const uniqueTypes = [...new Set(documents.map((d) => d.file_type).filter(Boolean))];

  return (
    <div className="p-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Документы</h1>
          <p className="text-sm text-gray-400 mt-0.5">Всего: {filtered.length}</p>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Поиск */}
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 w-64"
        />

        {/* Фильтр по типу */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 bg-white"
        >
          <option value="all">Все типы</option>
          {uniqueTypes.map((t) => (
            <option key={t} value={t}>{FILE_TYPE_LABEL[t]?.label ?? t}</option>
          ))}
        </select>

        {/* Фильтр по задаче */}
        <select
          value={taskFilter}
          onChange={(e) => setTaskFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 bg-white"
        >
          <option value="all">Все задачи</option>
          {tasks.map((t) => (
            <option key={t.id} value={String(t.id)}>{t.title}</option>
          ))}
        </select>

        {/* Сброс фильтров */}
        {(search || typeFilter !== "all" || taskFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setTypeFilter("all"); setTaskFilter("all"); }}
            className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 transition text-gray-500"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Таблица */}
      {filtered.length === 0 ? (
        <div className="border rounded-xl p-8 text-center text-sm text-gray-400">
          Документы не найдены
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Файл</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Тип</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Размер</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Задача</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Загрузил</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Дата</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => {
                const typeInfo = FILE_TYPE_LABEL[doc.file_type] ?? { label: "Другое", icon: "📄" };
                const url      = `https://13.63.74.74/files/${doc.full_name}`;
                return (
                  <tr key={doc.id} className="border-t hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{typeInfo.icon}</span>
                        <span className="text-sm font-medium truncate max-w-48">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatSize(doc.size)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-32 truncate">
                      {getTaskTitle(doc.task_id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{getUserName(doc.uploaded_by)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(doc.created_at).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 text-xs rounded-md border hover:bg-gray-50 transition"
                        >
                          Открыть
                        </a>
                        <a
                          href={url}
                          download={doc.name}
                          className="px-3 py-1 text-xs rounded-md border border-black bg-black text-white hover:bg-gray-800 transition"
                        >
                          Скачать
                        </a>
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          className="px-3 py-1 text-xs rounded-md border border-red-200 text-red-500 hover:bg-red-50 transition"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Модалка удаления */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold">Удалить документ?</h2>
            <p className="text-sm text-gray-500">
              Вы уверены что хотите удалить{" "}
              <span className="font-medium text-black">{deleteTarget.name}</span>?
              Это действие необратимо.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition"
              >
                {deleting ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}