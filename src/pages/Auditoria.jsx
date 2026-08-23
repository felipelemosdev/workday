import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/PageHeader";
import { fmt } from "@/lib/format";
import { Plus, Pencil, Trash2, ShieldAlert } from "lucide-react";

const ENTITY_LABELS = {
  clients: "Cliente",
  appointments: "Agendamento",
  attendances: "Atendimento",
  tasks: "Tarefa",
  processes: "Processo",
  documents: "Documento",
  history_events: "Histórico",
  users: "Usuário",
};

const ACTION_META = {
  create: { label: "Criou", icon: Plus, className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300" },
  update: { label: "Editou", icon: Pencil, className: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300" },
  delete: { label: "Apagou", icon: Trash2, className: "text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-300" },
};

export default function Auditoria() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setEvents(await base44.audit.list(1000));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const uniqueUsers = useMemo(() => {
    const map = new Map();
    events.forEach((e) => {
      if (e.actor) map.set(e.actor.id, e.actor.email);
    });
    return Array.from(map.entries());
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (userFilter !== "all" && e.actor_id !== userFilter) return false;
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      return true;
    });
  }, [events, userFilter, actionFilter]);

  if (user && user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldAlert className="w-8 h-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Apenas administradores podem ver o relatório de sistema.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        meta="Administração"
        title="Relatório de sistema"
        subtitle="Histórico de tudo que cada usuário criou, editou ou apagou no sistema."
      >
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-[13px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="all">Todos os usuários</option>
          {uniqueUsers.map(([id, email]) => (
            <option key={id} value={id}>{email}</option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-[13px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="all">Todas as ações</option>
          <option value="create">Criações</option>
          <option value="update">Edições</option>
          <option value="delete">Exclusões</option>
        </select>
      </PageHeader>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Data/Hora</th>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Ação</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const meta = ACTION_META[e.action] || ACTION_META.create;
                const Icon = meta.icon;
                return (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                      {fmt(e.created_date, "dd/MM/yyyy HH:mm")}
                    </td>
                    <td className="px-4 py-3">{e.actor?.email || "Desconhecido"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-medium ${meta.className}`}>
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{ENTITY_LABELS[e.entity] || e.entity}</span>
                      {e.label && <span className="text-muted-foreground"> — {e.label}</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {e.action === "update" && Array.isArray(e.changes) && e.changes.length > 0
                        ? e.changes.map((c) => c.field).join(", ")
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
