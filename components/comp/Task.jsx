"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import client from "@/app/api/client";

const STATUS_LABEL = {
  created:     { label: "Создано",   className: "bg-gray-100 text-gray-600" },
  in_progress: { label: "В работе",  className: "bg-yellow-100 text-yellow-700" },
  review:      { label: "Ревью",     className: "bg-blue-100 text-blue-700" },
  changes:     { label: "Правки",    className: "bg-red-100 text-red-700" },
  done:        { label: "Готово",    className: "bg-green-100 text-green-700" },
};

export default function TaskComponent() {
  const { id }   = useParams();
  const router   = useRouter();
  const [task, setTask]       = useState(null);
  const [assigned, setAssigned] = useState(null);
  const [createdBy, setCreatedBy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    async function fetchTask() {
      const { data, error } = await client
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single();

      if (error) { setError(error.message); setLoading(false); return; }
      setTask(data);

      // Загружаем исполнителя
      if (data.assigned_to) {
        const { data: profile } = await client
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", data.assigned_to)
          .single();
        setAssigned(profile);
      }

      // Загружаем создателя
      if (data.created_by) {
        const { data: profile } = await client
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", data.created_by)
          .single();
        setCreatedBy(profile);
      }

      setLoading(false);
    }
    fetchTask();
  }, [id]);

  if (loading) return <div className="p-8 text-sm text-gray-400">Загрузка...</div>;
  if (error)   return <div className="p-8 text-sm text-red-500">Ошибка: {error}</div>;
  if (!task)   return <div className="p-8 text-sm text-gray-400">Задача не найдена</div>;

  const status  = STATUS_LABEL[task.status];
  const created = new Date(task.created_at).toLocaleString("ru-RU");

  function userName(profile) {
    if (!profile) return "—";
    return [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email;
  }

  return (
    <div className=" p-8">
      {/* Назад */}
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-400 border px-4 py-2 rounded-lg hover:text-black transition mb-6 flex items-center gap-1"
      >
        Назад
      </button>

      {/* Заголовок */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{task.title}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${status?.className}`}>
          {status?.label ?? task.status}
        </span>
      </div>

      {/* Описание */}
      <div className="border rounded-xl p-5 mb-4">
        <h2 className="text-sm font-medium text-gray-500 mb-2">Описание</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {task.description || "Описание не указано"}
        </p>
      </div>

      {/* Детали */}
      <div className="border rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </div>
  );
}