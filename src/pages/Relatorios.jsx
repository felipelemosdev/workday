import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import PageHeader from "@/components/PageHeader";
import { fmt, parseISO, weekStart, addDays } from "@/lib/format";
import { TASK_STAGES, PROCESS_STATUS, CLIENT_SITUATION } from "@/lib/constants";

const ACCENT = "hsl(221 56% 23%)";
const SOFT = "hsl(220 16% 80%)";

export default function Relatorios() {
  const [data, setData] = useState({ appointments: [], tasks: [], processes: [], clients: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [appointments, tasks, processes, clients] = await Promise.all([
          base44.entities.Appointment.list("-data_hora", 500).catch(() => []),
          base44.entities.Task.list("-updated_date", 500).catch(() => []),
          base44.entities.Process.list("-data_distribuicao", 500).catch(() => []),
          base44.entities.Client.list("nome", 500).catch(() => []),
        ]);
        setData({ appointments, tasks, processes, clients });
      } finally { setLoading(false); }
    })();
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const apptsThisMonth = data.appointments.filter((a) => new Date(a.data_hora) >= monthStart).length;
    const activeTasks = data.tasks.filter((t) => t.etapa !== "finalizado").length;
    const granted = data.processes.filter((p) => p.status === "deferido").length;
    const activeClients = data.clients.filter((c) => c.situacao === "ativo").length;
    return { apptsThisMonth, activeTasks, granted, activeClients, total: data.processes.length };
  }, [data]);

  const weekdayData = useMemo(() => {
    const ws = weekStart(new Date());
    const labels = Array.from({ length: 7 }, (_, i) => fmt(addDays(ws, i), "EEE"));
    const counts = [0, 0, 0, 0, 0, 0, 0];
    data.appointments.forEach((a) => {
      const d = parseISO(a.data_hora);
      const idx = Math.floor((d - ws) / 86400000);
      if (idx >= 0 && idx < 7) counts[idx]++;
    });
    return labels.map((l, i) => ({ name: l, value: counts[i] }));
  }, [data.appointments]);

  const stageData = useMemo(() => TASK_STAGES.map((s) => ({ name: s.label, value: data.tasks.filter((t) => t.etapa === s.id).length })), [data.tasks]);

  const situacaoData = useMemo(() => Object.entries(CLIENT_SITUATION).map(([k, v]) => ({ name: v.label, value: data.clients.filter((c) => c.situacao === k).length })), [data.clients]);

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader meta="Análise" title="Relatórios" subtitle={`Visão consolidada do escritório · ${fmt(new Date(), "MMMM 'de' yyyy")}`} />

      {/* Executive summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden border border-border mb-8">
        <Metric label="Clientes ativos" value={metrics.activeClients} hint={`${data.clients.length} no total`} />
        <Metric label="Agendamentos no mês" value={metrics.apptsThisMonth} hint="mês corrente" />
        <Metric label="Tarefas em andamento" value={metrics.activeTasks} hint={`${data.tasks.length} tarefas`} />
        <Metric label="Processos deferidos" value={metrics.granted} hint={`${metrics.total} processos`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Agendamentos por dia da semana" subtitle="Distribuição da semana corrente">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weekdayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={SOFT} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(220 9% 44%)" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(220 9% 44%)" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "hsl(220 16% 96%)" }} contentStyle={{ borderRadius: 8, border: "1px solid hsl(220 16% 91%)", fontSize: 12 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={ACCENT} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tarefas por etapa" subtitle="Funil de trabalho do escritório">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stageData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={SOFT} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(220 9% 44%)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "hsl(220 9% 44%)" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "hsl(220 16% 96%)" }} contentStyle={{ borderRadius: 8, border: "1px solid hsl(220 16% 91%)", fontSize: 12 }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={ACCENT} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Clientes por situação" subtitle="Status atual da carteira">
        <div className="flex flex-wrap gap-x-10 gap-y-4 pt-2">
          {situacaoData.map((s) => (
            <div key={s.name} className="flex items-center gap-3">
              <span className="text-[28px] font-semibold tabular-nums text-foreground leading-none">{s.value}</span>
              <span className="text-[13px] text-muted-foreground">{s.name}</span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div className="bg-card px-6 py-6">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="font-display text-[34px] font-semibold tracking-tight text-foreground mt-2 leading-none tabular-nums">{value}</div>
      <div className="text-[12px] text-muted-foreground mt-2">{hint}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-5">
        <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
        <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}