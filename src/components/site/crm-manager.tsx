"use client";

/**
 * src/components/site/crm-manager.tsx
 *
 * A generic, configuration-driven CRUD manager for the CRM entities.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The dashboards previously linked "Manage users / leads / students / …"
 * straight to the JSON API endpoints. Every link "worked", but it opened raw
 * JSON — no table, no form, no way to actually manage anything without curl.
 * That single gap was the loudest "unfinished product" signal in the portals.
 *
 * This component renders, for any entity the CRUD factory exposes:
 *   - a searchable, paginated table;
 *   - a create form;
 *   - an edit form pre-filled from the row;
 *   - a delete action with confirmation;
 * and it talks to the same REST surface the API inventory documents:
 *   GET    /api/crm/{entity}?page=&limit=&search=
 *   POST   /api/crm/{entity}
 *   PUT    /api/crm/{entity}/{id}
 *   DELETE /api/crm/{entity}/{id}
 *
 * The server remains the authority: role checks, ownership scoping and
 * validation all happen there. This UI only renders what the session is
 * allowed to see.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";

export type CrmFieldType = "text" | "email" | "number" | "textarea" | "date" | "select" | "checkbox";

export type CrmField = {
  name: string;
  label: string;
  type: CrmFieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** Only asked at create time (e.g. a password), never on edit. */
  createOnly?: boolean;
  help?: string;
};

export type CrmColumn = {
  name: string;
  label: string;
  /** Render the value as yes/no (for booleans). */
  boolean?: boolean;
};

export type CrmEntityConfig = {
  /** The API entity segment, e.g. "users" → /api/crm/users. */
  slug: string;
  title: string;
  singular: string;
  description: string;
  columns: CrmColumn[];
  fields: CrmField[];
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  /** Read-only entities (audit logs) hide every mutation control. */
  readOnly?: boolean;
};

type Row = Record<string, unknown> & { id: string };

type ListResponse = {
  success: boolean;
  message?: string;
  data?: Record<string, unknown> & {
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  };
};

const PAGE_SIZE = 20;

function defaultValueFor(field: CrmField): string | boolean {
  if (field.type === "checkbox") return false;
  return "";
}

function emptyForm(config: CrmEntityConfig): Record<string, string | boolean> {
  const form: Record<string, string | boolean> = {};
  for (const field of config.fields) form[field.name] = defaultValueFor(field);
  return form;
}

function formFromRow(config: CrmEntityConfig, row: Row): Record<string, string | boolean> {
  const form: Record<string, string | boolean> = {};
  for (const field of config.fields) {
    if (field.createOnly) {
      form[field.name] = defaultValueFor(field);
      continue;
    }
    const value = row[field.name];
    if (field.type === "checkbox") form[field.name] = Boolean(value);
    else if (value == null) form[field.name] = "";
    else if (field.type === "date" && typeof value === "string") form[field.name] = value.slice(0, 10);
    else if (typeof value === "object") form[field.name] = JSON.stringify(value);
    else form[field.name] = String(value);
  }
  return form;
}

function rowLabel(row: Row): string {
  const candidate = row.name ?? row.title ?? row.organizationName ?? row.email ?? row.id;
  return String(candidate);
}

export function CrmManager({ config }: { config: CrmEntityConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>(() => emptyForm(config));
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

  const canCreate = config.canCreate ?? !config.readOnly;
  const canEdit = config.canEdit ?? !config.readOnly;
  const canDelete = config.canDelete ?? !config.readOnly;

  const fetchPage = useCallback(
    (page: number, searchTerm: string) => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (searchTerm) params.set("search", searchTerm);
      return fetch(`/api/crm/${config.slug}?${params.toString()}`, { cache: "no-store" }).then(
        (response) => response.json() as Promise<ListResponse>,
      );
    },
    [config.slug],
  );

  const applyList = useCallback(
    (body: ListResponse) => {
      if (!body.success) {
        setError(body.message || `Could not load ${config.title}.`);
        setRows([]);
        return;
      }
      const data = body.data ?? {};
      // The list key is the entity name (e.g. data.users). Dashed entities
      // (audit-logs) arrive with the dash stripped by the CRUD factory.
      const list =
        (data[config.slug] as Row[] | undefined) ??
        (data[config.slug.replace(/-/g, "")] as Row[] | undefined) ??
        [];
      setError("");
      setRows(list);
      setPagination({
        page: data.pagination?.page ?? 1,
        total: data.pagination?.total ?? list.length,
        totalPages: data.pagination?.totalPages ?? 1,
      });
    },
    [config.slug, config.title],
  );

  // Promise chain in the effect (the codebase pattern): no state is written
  // synchronously during the effect, so the first render is not invalidated.
  useEffect(() => {
    let cancelled = false;
    fetchPage(1, search)
      .then((body) => {
        if (!cancelled) applyList(body);
      })
      .catch(() => {
        if (!cancelled) setError(`Network error while loading ${config.title}.`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPage, applyList, search, config.title]);

  /** Event-handler path: safe to set state synchronously here. */
  const load = useCallback(
    (page: number) => {
      setLoading(true);
      fetchPage(page, search)
        .then(applyList)
        .catch(() => setError(`Network error while loading ${config.title}.`))
        .finally(() => setLoading(false));
    },
    [fetchPage, applyList, search, config.title],
  );

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      const payload: Record<string, unknown> = {};
      for (const field of config.fields) {
        if (editing && field.createOnly) continue;
        const value = form[field.name];
        if (field.createOnly && value === "") continue; // optional on edit, required handled by zod on create
        if (field.type === "number") payload[field.name] = value === "" ? undefined : Number(value);
        else if (field.type === "checkbox") payload[field.name] = Boolean(value);
        else if (field.type === "date") payload[field.name] = value === "" ? undefined : new Date(String(value)).toISOString();
        else payload[field.name] = value === "" ? undefined : value;
      }
      const res = await fetch(editing ? `/api/crm/${config.slug}/${editing.id}` : `/api/crm/${config.slug}`, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { success: boolean; message?: string };
      if (!body.success) {
        setFormError(body.message || "The server rejected this change.");
        return;
      }
      setFormOpen(false);
      setEditing(null);
      setNotice(editing ? `${config.singular} updated.` : `${config.singular} created.`);
      load(pagination.page);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function performDelete() {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/crm/${config.slug}/${confirmDelete.id}`, { method: "DELETE" });
      const body = (await res.json()) as { success: boolean; message?: string };
      if (!body.success) {
        setError(body.message || "The server refused to delete this record.");
      } else {
        setNotice(`${config.singular} deleted.`);
        load(pagination.page);
      }
    } catch {
      setError("Network error while deleting.");
    } finally {
      setBusy(false);
      setConfirmDelete(null);
    }
  }

  const visibleFields = useMemo(
    () => config.fields.filter((field) => !(editing && field.createOnly)),
    [config.fields, editing],
  );

  function renderCell(row: Row, column: CrmColumn) {
    const value = row[column.name];
    if (column.boolean) return value ? "Yes" : "No";
    if (value == null || value === "") return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (column.name.toLowerCase().includes("at") && typeof value === "string") {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date.toLocaleDateString();
    }
    return String(value);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{config.title}</h2>
          <p className="text-sm text-slate-600">{config.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput.trim());
            }}
            className="flex items-center gap-2"
          >
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={`Search ${config.title.toLowerCase()}…`}
              aria-label={`Search ${config.title}`}
              className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Search
            </button>
          </form>
          <button
            type="button"
            onClick={() => load(pagination.page)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="size-4" aria-hidden="true" /> Refresh
          </button>
          {canCreate ? (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(emptyForm(config));
                setFormError("");
                setFormOpen(true);
              }}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#0057B8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B1F3A]"
            >
              <Plus className="size-4" aria-hidden="true" /> New {config.singular}
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {config.columns.map((column) => (
                <th key={column.name} className="px-4 py-3 font-semibold text-slate-700">
                  {column.label}
                </th>
              ))}
              {canEdit || canDelete ? <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={config.columns.length + 1} className="px-4 py-8 text-center text-slate-400">
                  Loading {config.title.toLowerCase()}…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length + 1} className="px-4 py-8 text-center text-slate-400">
                  {search ? `No ${config.title.toLowerCase()} match “${search}”.` : `No ${config.title.toLowerCase()} yet.`}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  {config.columns.map((column) => (
                    <td key={column.name} className="max-w-64 truncate px-4 py-3 text-slate-700">
                      {renderCell(row, column)}
                    </td>
                  ))}
                  {canEdit || canDelete ? (
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(row);
                              setForm(formFromRow(config, row));
                              setFormError("");
                              setFormOpen(true);
                            }}
                            aria-label={`Edit ${rowLabel(row)}`}
                            className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(row)}
                            aria-label={`Delete ${rowLabel(row)}`}
                            className="inline-flex size-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <p>
          {pagination.total} record{pagination.total === 1 ? "" : "s"} · page {pagination.page} of {Math.max(1, pagination.totalPages)}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1 || loading}
            onClick={() => load(pagination.page - 1)}
            className="min-h-9 rounded-lg border border-slate-300 px-3 text-sm font-medium disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages || loading}
            onClick={() => load(pagination.page + 1)}
            className="min-h-9 rounded-lg border border-slate-300 px-3 text-sm font-medium disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {editing ? `Edit ${config.singular}` : `New ${config.singular}`}
              </h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Close form"
                className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            {formError ? <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p> : null}
            <form onSubmit={submitForm} className="space-y-3">
              {visibleFields.map((field) => (
                <div key={field.name}>
                  <label htmlFor={`field-${field.name}`} className="mb-1 block text-sm font-medium text-slate-700">
                    {field.label}
                    {field.required ? <span className="text-red-500"> *</span> : null}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={`field-${field.name}`}
                      value={String(form[field.name] ?? "")}
                      onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                      required={field.required}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  ) : field.type === "select" ? (
                    <select
                      id={`field-${field.name}`}
                      value={String(form[field.name] ?? "")}
                      onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                      required={field.required}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select…</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "checkbox" ? (
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        id={`field-${field.name}`}
                        type="checkbox"
                        checked={Boolean(form[field.name])}
                        onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.checked }))}
                        className="size-4"
                      />
                      {field.help ?? "Yes"}
                    </label>
                  ) : (
                    <input
                      id={`field-${field.name}`}
                      type={field.type === "date" ? "date" : field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
                      value={String(form[field.name] ?? "")}
                      onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                      required={field.required}
                      placeholder={field.placeholder}
                      step={field.type === "number" ? "any" : undefined}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  )}
                  {field.help && field.type !== "checkbox" ? <p className="mt-1 text-xs text-slate-500">{field.help}</p> : null}
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-10 rounded-lg bg-[#0057B8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B1F3A] disabled:opacity-50"
                >
                  {busy ? "Saving…" : editing ? "Save changes" : `Create ${config.singular}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold">Delete this {config.singular}?</h3>
            <p className="mt-2 text-sm text-slate-600">
              “{rowLabel(confirmDelete)}” will be permanently removed. This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="min-h-10 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void performDelete()}
                disabled={busy}
                className="min-h-10 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
