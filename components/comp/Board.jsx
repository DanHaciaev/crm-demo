/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import client from "@/app/api/client";

const COLUMN_LABELS = {
  created: "Создано",
  in_progress: "В работе",
  review: "Ревью",
  changes: "Правки",
  done: "Готово",
};

const COLUMN_CARD_STYLE = {
  created: { bg: "#94A3B8", text: "#fff" },
  in_progress: { bg: "#F59E0B", text: "#fff" },
  review: { bg: "#3B82F6", text: "#fff" },
  changes: { bg: "#EF4444", text: "#fff" },
  done: { bg: "#22C55E", text: "#fff" },
};

// ── Shared Task Form Fields ────────────────────────────
function TaskFormFields({ form, setForm, users }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600">Название *</label>
        <input
          autoFocus
          className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
          placeholder="Название задачи"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
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
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600">Исполнитель</label>
        <select
          className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 bg-white"
          value={form.assigned_to ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
        >
          <option value="">— Не назначен —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {[u.first_name, u.last_name].filter(Boolean).join(" ") || u.email}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ── Add Task Modal ─────────────────────────────────────
function AddTaskModal({ defaultStatus, onClose, onAdd, users }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: defaultStatus,
    assigned_to: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!form.title.trim()) return;
    setSaving(true);
    const { data, error } = await client
      .from("tasks")
      .insert([{ ...form, assigned_to: form.assigned_to || null }])
      .select()
      .single();
    setSaving(false);
    if (error) return alert("Ошибка: " + error.message);
    onAdd(data);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">Новая задача</h2>
        <TaskFormFields form={form} setForm={setForm} users={users} />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50 transition">
            Отмена
          </button>
          <button onClick={handleSubmit} disabled={saving || !form.title.trim()} className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50 transition">
            {saving ? "Сохранение..." : "Добавить"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Task Modal ────────────────────────────────────
function EditTaskModal({ task, onClose, onSave, onDelete, users }) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    assigned_to: task.assigned_to ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = { ...form, assigned_to: form.assigned_to || null };
    const { error } = await client.from("tasks").update(payload).eq("id", task.id);
    setSaving(false);
    if (error) return alert("Ошибка: " + error.message);
    onSave(task.id, payload);
    onClose();
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await client.from("tasks").delete().eq("id", task.id);
    setDeleting(false);
    if (error) return alert("Ошибка: " + error.message);
    onDelete(task.id, task.status);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">Редактировать задачу</h2>
        <TaskFormFields form={form} setForm={setForm} users={users} />

        <div className="flex items-center justify-between pt-2">
          {/* Удаление */}
          {confirmDelete ? (
            <div className="flex gap-2">
              <span className="text-xs text-red-500 self-center">Удалить задачу?</span>
              <button onClick={handleDelete} disabled={deleting} className="px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition">
                {deleting ? "..." : "Да"}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-xs rounded-lg border hover:bg-gray-50 transition">
                Нет
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition">
              Удалить
            </button>
          )}

          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50 transition">
              Отмена
            </button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()} className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50 transition">
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────
function Avatar({ user }) {
  if (!user) return null;
  const initials =
    [user.first_name, user.last_name]
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";
  return (
    <div
      title={[user.first_name, user.last_name].filter(Boolean).join(" ") || user.email}
      className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-bold shrink-0"
    >
      {initials}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────
const TaskCard = ({ task, columnId, style, assignedUser, onEdit }) => {
  const cardStyle = COLUMN_CARD_STYLE[columnId] ?? { bg: "#94A3B8", text: "#fff" };
  return (
    <div style={{ backgroundColor: cardStyle.bg, color: cardStyle.text, ...style }} className="p-3 rounded-lg select-none group">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm flex-1">{task.title}</p>
        <div className="flex items-center gap-1 shrink-0">
          {/* Кнопка редактирования */}
          {onEdit && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="opacity-0 group-hover:opacity-100 transition w-5 h-5 flex items-center justify-center rounded bg-white/20 hover:bg-white/40 text-xs"
            >
              ✏️
            </button>
          )}
          <Avatar user={assignedUser} />
        </div>
      </div>
      {task.description && <p className="text-xs mt-1 opacity-80 line-clamp-2">{task.description}</p>}
    </div>
  );
};

// ── Sortable Card ──────────────────────────────────────
const SortableItem = ({ task, columnId, assignedUser, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(task.id) });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mb-2">
      <TaskCard task={task} columnId={columnId} assignedUser={assignedUser} onEdit={onEdit} style={{ opacity: isDragging ? 0.3 : 1 }} />
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
    created: [],
    in_progress: [],
    review: [],
    changes: [],
    done: [],
  });
  const [users, setUsers] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [editTask, setEditTask] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor));

  // ── Fetch ────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const [{ data: tasks, error: tasksError }, { data: profiles }] = await Promise.all([
      client.from("tasks").select("*").order("created_at", { ascending: true }),
      client.from("profiles").select("id, first_name, last_name, email"),
    ]);

    if (tasksError) {
      setError(tasksError.message);
      setLoading(false);
      return;
    }

    setUsers(profiles ?? []);

    const grouped = { created: [], in_progress: [], review: [], changes: [], done: [] };
    tasks.forEach((task) => {
      if (grouped[task.status]) grouped[task.status].push(task);
    });
    setColumns(grouped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getUserById = (id) => users.find((u) => u.id === id) ?? null;

  // ── Add ──────────────────────────────────────────────
  function handleTaskAdded(newTask) {
    setColumns((prev) => ({
      ...prev,
      [newTask.status]: [...prev[newTask.status], newTask],
    }));
  }

  // ── Edit save ─────────────────────────────────────────
  function handleTaskSaved(taskId, payload) {
    setColumns((prev) => {
      const next = { ...prev };
      // Ищем задачу во всех колонках
      for (const col in next) {
        const idx = next[col].findIndex((t) => t.id === taskId);
        if (idx !== -1) {
          const oldTask = next[col][idx];
          // Если статус изменился — перемещаем в нужную колонку
          if (oldTask.status !== payload.status) {
            next[col] = next[col].filter((t) => t.id !== taskId);
            next[payload.status] = [...next[payload.status], { ...oldTask, ...payload }];
          } else {
            next[col] = next[col].map((t) => (t.id === taskId ? { ...t, ...payload } : t));
          }
          break;
        }
      }
      return next;
    });
  }

  // ── Delete ────────────────────────────────────────────
  function handleTaskDeleted(taskId, status) {
    setColumns((prev) => ({
      ...prev,
      [status]: prev[status].filter((t) => t.id !== taskId),
    }));
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
    const overId = String(over.id);

    const sourceColumnId = findColumnByTaskId(activeId);
    if (!sourceColumnId) return;

    const destColumnId = overId in columns ? overId : findColumnByTaskId(overId);
    if (!destColumnId) return;

    if (sourceColumnId === destColumnId) {
      const tasks = columns[sourceColumnId];
      const oldIndex = tasks.findIndex((t) => String(t.id) === activeId);
      const newIndex = tasks.findIndex((t) => String(t.id) === overId);
      if (oldIndex !== newIndex && newIndex !== -1) {
        setColumns({ ...columns, [sourceColumnId]: arrayMove(tasks, oldIndex, newIndex) });
      }
    } else {
      const sourceTasks = [...columns[sourceColumnId]];
      const destTasks = [...columns[destColumnId]];
      const sourceIndex = sourceTasks.findIndex((t) => String(t.id) === activeId);
      const [movedTask] = sourceTasks.splice(sourceIndex, 1);
      destTasks.push({ ...movedTask, status: destColumnId });

      setColumns({ ...columns, [sourceColumnId]: sourceTasks, [destColumnId]: destTasks });

      const { error } = await client.from("tasks").update({ status: destColumnId }).eq("id", movedTask.id);

      if (error) {
        alert("Ошибка: " + error.message);
        fetchTasks();
      }
    }
  };

  if (loading) return <div className="p-4 text-sm text-gray-400">Загрузка...</div>;
  if (error) return <div className="p-4 text-sm text-red-500">Ошибка: {error}</div>;

  return (
    <>
      <div className="flex justify-end px-4 pt-4">
        <button onClick={() => setModal({ defaultStatus: "created" })} className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800 transition">
          + Добавить задачу
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {Object.entries(columns).map(([columnId, tasks]) => (
            <div key={columnId} className="flex flex-col bg-gray-100 rounded-lg p-3 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm">{COLUMN_LABELS[columnId]}</h2>
                <span className="text-xs bg-white rounded-full px-2 py-0.5 text-gray-500 font-medium">{tasks.length}</span>
              </div>

              <SortableContext items={tasks.map((t) => String(t.id))} strategy={verticalListSortingStrategy}>
                <DroppableColumn id={columnId}>
                  {tasks.map((task) => (
                    <SortableItem key={task.id} task={task} columnId={columnId} assignedUser={getUserById(task.assigned_to)} onEdit={() => setEditTask(task)} />
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
                assignedUser={getUserById(activeTask.task.assigned_to)}
                style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.18)", cursor: "grabbing" }}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {modal && <AddTaskModal defaultStatus={modal.defaultStatus} onClose={() => setModal(null)} onAdd={handleTaskAdded} users={users} />}

      {editTask && <EditTaskModal task={editTask} users={users} onClose={() => setEditTask(null)} onSave={handleTaskSaved} onDelete={handleTaskDeleted} />}
    </>
  );
};

export default Board;
