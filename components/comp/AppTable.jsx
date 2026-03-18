/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState, useCallback } from "react";
import client from "@/app/api/client";

const EMPTY_FORM = { name: "", company: "", phone_number: "", email: "" };

function Modal({ title, onClose, onSubmit, form, setForm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">{title}</h2>

        <div className="space-y-3">
          {[
            { key: "name", label: "Имя *", placeholder: "Иван Иванов" },
            { key: "company", label: "Компания", placeholder: "ООО Ромашка" },
            { key: "phone_number", label: "Телефон", placeholder: "+7 999 000 00 00" },
            { key: "email", label: "Email", placeholder: "ivan@mail.ru" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">{label}</label>
              <input
                className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50 transition">
            Отмена
          </button>
          <button onClick={onSubmit} disabled={loading || !form.name.trim()} className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50 transition">
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ name, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold">Удалить клиента?</h2>
        <p className="text-sm text-gray-500">
          Вы уверены, что хотите удалить <span className="font-medium text-black">{name}</span>? Это действие необратимо.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50 transition">
            Отмена
          </button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition">
            {loading ? "Удаление..." : "Удалить"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppTable() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // объект клиента
  const [deleteTarget, setDeleteTarget] = useState(null); // объект клиента

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ── Fetch ──────────────────────────────────────────────
  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data, error } = await client.from("clients").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setClients(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // ── Create ─────────────────────────────────────────────
  function openCreate() {
    setForm(EMPTY_FORM);
    setCreateOpen(true);
  }

  async function handleCreate() {
    setSaving(true);
    const { error } = await client.from("clients").insert([form]);
    setSaving(false);
    if (error) return alert("Ошибка: " + error.message);
    setCreateOpen(false);
    fetchClients();
  }

  // ── Edit ───────────────────────────────────────────────
  function openEdit(c) {
    setForm({ name: c.name, company: c.company ?? "", phone_number: c.phone_number ?? "", email: c.email ?? "" });
    setEditTarget(c);
  }

  async function handleEdit() {
    setSaving(true);
    const { error } = await client.from("clients").update(form).eq("id", editTarget.id);
    setSaving(false);
    if (error) return alert("Ошибка: " + error.message);

    // Обновляем только нужный объект локально, не перезапрашивая весь список
    setClients((prev) => prev.map((c) => (c.id === editTarget.id ? { ...c, ...form } : c)));
    setEditTarget(null);
  }

  // ── Delete ─────────────────────────────────────────────
  async function handleDelete() {
    setSaving(true);
    const { error } = await client.from("clients").delete().eq("id", deleteTarget.id);
    setSaving(false);
    if (error) return alert("Ошибка: " + error.message);
    setDeleteTarget(null);
    fetchClients();
  }

  // ── Render ─────────────────────────────────────────────
  if (loading) return <div className="mt-5 text-sm text-muted-foreground">Загрузка...</div>;
  if (error) return <div className="mt-5 text-sm text-red-500">Ошибка: {error}</div>;

  return (
    <>
      {/* Кнопка добавления */}
      <div className="flex justify-end mt-5">
        <button onClick={openCreate} className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800 transition">
          + Добавить клиента
        </button>
      </div>

      {/* Таблица */}
      <div className="w-full overflow-auto h-fit mt-3 border rounded-xl">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-white">
            <TableRow>
              <TableHead className="text-center">Имя</TableHead>
              <TableHead className="text-center">Компания</TableHead>
              <TableHead className="text-center">Телефон</TableHead>
              <TableHead className="text-center">Email</TableHead>
              <TableHead className="text-center">Дата создания</TableHead>
              <TableHead className="text-center">Действия</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Нет данных
                </TableCell>
              </TableRow>
            ) : (
              clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-center font-medium">{c.name}</TableCell>
                  <TableCell className="text-center">{c.company ?? "—"}</TableCell>
                  <TableCell className="text-center">{c.phone_number ?? "—"}</TableCell>
                  <TableCell className="text-center">{c.email ?? "—"}</TableCell>
                  <TableCell className="text-center">{new Date(c.created_at).toLocaleDateString("ru-RU")}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(c)} className="px-3 py-1 text-xs rounded-md border hover:bg-gray-50 transition">
                        Изменить
                      </button>
                      <button onClick={() => setDeleteTarget(c)} className="px-3 py-1 text-xs rounded-md border border-red-200 text-red-500 hover:bg-red-50 transition">
                        Удалить
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Модалки */}
      {createOpen && <Modal title="Новый клиент" form={form} setForm={setForm} loading={saving} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} />}

      {editTarget && <Modal title="Редактировать клиента" form={form} setForm={setForm} loading={saving} onClose={() => setEditTarget(null)} onSubmit={handleEdit} />}

      {deleteTarget && <ConfirmModal name={deleteTarget.name} loading={saving} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}
    </>
  );
}
