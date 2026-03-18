/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import client from "@/api/client";

const COLUMN_LABELS = {
  created:     "Создано",
  in_progress: "В работе",
  review:      "Ревью",
  changes:     "Правки",
  done:        "Готово",
};

const COLUMN_CARD_STYLE = {
  created:     { bg: "#94A3B8", text: "#fff" },
  in_progress: { bg: "#F59E0B", text: "#fff" },
  review:      { bg: "#3B82F6", text: "#fff" },
  changes:     { bg: "#EF4444", text: "#fff" },
  done:        { bg: "#22C55E", text: "#fff" },
};

// ── Add Task Modal ─────────────────────────────────────
function AddTaskModal({ defaultStatus, onClose, onAdd }) {
  const [form, setForm] = useState({ title: "", description: "", status: defaultStatus })
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!form.title.trim()) return
    setSaving(true)
    const { data, error } = await client
      .from("tasks")
      .insert([form])
      .select()
      .single()
    setSaving(false)
    if (error) return alert("Ошибка: " + error.message)
    onAdd(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">Новая задача</h2>

        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Название *</label>
            <input
              autoFocus
              className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Название задачи"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Описание</label>
            <textarea
              rows={3}
              className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 resize-none"
              placeholder="Описание задачи"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Колонка</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 bg-white"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              {Object.entries(COLUMN_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50 transition"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.title.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {saving ? "Сохранение..." : "Добавить"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Card ───────────────────────────────────────────────
const TaskCard = ({ task, columnId, style }) => {
  const cardStyle = COLUMN_CARD_STYLE[columnId] ?? { bg: "#94A3B8", text: "#fff" };
  return (
    <div
      style={{ backgroundColor: cardStyle.bg, color: cardStyle.text, ...style }}
      className="p-3 rounded-lg select-none"
    >
      <p className="font-medium text-sm">{task.title}</p>
      {task.description && (
        <p className="text-xs mt-1 opacity-80 line-clamp-2">{task.description}</p>
      )}
    </div>
  );
};

// ── Sortable Card ──────────────────────────────────────
const SortableItem = ({ task, columnId }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: String(task.id) });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing mb-2"
    >
      <TaskCard task={task} columnId={columnId} style={{ opacity: isDragging ? 0.3 : 1 }} />
    </div>
  );
};

// ── Droppable Column ───────────────────────────────────
const DroppableColumn = ({ id, children }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="min-h-16 flex-1 rounded">
      {children}
    </div>
  );
};

// ── Board ──────────────────────────────────────────────
const Board = () => {
  const [columns, setColumns] = useState({
    created: [], in_progress: [], review: [], changes: [], done: [],
  });
  const [activeTask, setActiveTask]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [modal, setModal]             = useState(null); // null | { defaultStatus }

  const sensors = useSensors(useSensor(PointerSensor));

  // ── Fetch ────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await client
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) { setError(error.message); setLoading(false); return; }

    const grouped = { created: [], in_progress: [], review: [], changes: [], done: [] };
    data.forEach((task) => {
      if (grouped[task.status]) grouped[task.status].push(task);
    });
    setColumns(grouped);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── Add ──────────────────────────────────────────────
  function handleTaskAdded(newTask) {
    setColumns((prev) => ({
      ...prev,
      [newTask.status]: [...prev[newTask.status], newTask],
    }))
  }

  // ── Helpers ──────────────────────────────────────────
  const findColumnByTaskId = (taskId) => {
    for (const columnId in columns) {
      if (columns[columnId].some((t) => String(t.id) === taskId)) return columnId;
    }
    return null;
  };

  // ── Drag Start ───────────────────────────────────────
  const handleDragStart = (event) => {
    const activeId = String(event.active.id);
    const columnId = findColumnByTaskId(activeId);
    if (!columnId) return;
    const task = columns[columnId].find((t) => String(t.id) === activeId);
    if (task) setActiveTask({ task, columnId });
  };

  // ── Drag End ─────────────────────────────────────────
  const handleDragEnd = async (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId   = String(over.id);

    const sourceColumnId = findColumnByTaskId(activeId);
    if (!sourceColumnId) return;

    const destColumnId = overId in columns ? overId : findColumnByTaskId(overId);
    if (!destColumnId) return;

    if (sourceColumnId === destColumnId) {
      const tasks    = columns[sourceColumnId];
      const oldIndex = tasks.findIndex((t) => String(t.id) === activeId);
      const newIndex = tasks.findIndex((t) => String(t.id) === overId);
      if (oldIndex !== newIndex && newIndex !== -1) {
        setColumns({ ...columns, [sourceColumnId]: arrayMove(tasks, oldIndex, newIndex) });
      }
    } else {
      const sourceTasks = [...columns[sourceColumnId]];
      const destTasks   = [...columns[destColumnId]];
      const sourceIndex = sourceTasks.findIndex((t) => String(t.id) === activeId);
      const [movedTask] = sourceTasks.splice(sourceIndex, 1);
      destTasks.push({ ...movedTask, status: destColumnId });

      setColumns({ ...columns, [sourceColumnId]: sourceTasks, [destColumnId]: destTasks });

      const { error } = await client
        .from("tasks")
        .update({ status: destColumnId })
        .eq("id", movedTask.id);

      if (error) { alert("Ошибка: " + error.message); fetchTasks(); }
    }
  };

  if (loading) return <div className="p-4 text-sm text-gray-400">Загрузка...</div>;
  if (error)   return <div className="p-4 text-sm text-red-500">Ошибка: {error}</div>;

  return (
    <>
      {/* Кнопка добавления */}
      <div className="flex justify-end px-4 pt-4">
        <button
          onClick={() => setModal({ defaultStatus: "created" })}
          className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800 transition"
        >
          + Добавить задачу
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4 p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {Object.entries(columns).map(([columnId, tasks]) => (
            <div key={columnId} className="flex flex-col bg-gray-100 rounded-lg p-3 min-w-0">
              {/* Заголовок колонки */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm">{COLUMN_LABELS[columnId]}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-white rounded-full px-2 py-0.5 text-gray-500 font-medium">
                    {tasks.length}
                  </span>
                </div>
              </div>

              <SortableContext
                items={tasks.map((t) => String(t.id))}
                strategy={verticalListSortingStrategy}
              >
                <DroppableColumn id={columnId}>
                  {tasks.map((task) => (
                    <SortableItem key={task.id} task={task} columnId={columnId} />
                  ))}
                </DroppableColumn>
              </SortableContext>
            </div>
          ))}

          <DragOverlay>
            {activeTask && (
              <TaskCard
                task={activeTask.task}
                columnId={activeTask.columnId}
                style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.18)", cursor: "grabbing" }}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {modal && (
        <AddTaskModal
          defaultStatus={modal.defaultStatus}
          onClose={() => setModal(null)}
          onAdd={handleTaskAdded}
        />
      )}
    </>
  );
};

export default Board;