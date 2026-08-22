import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import AppointmentFormDialog from "@/components/AppointmentFormDialog";
import { fmt, isSameDay, addDays, weekStart, parseISO } from "@/lib/format";
import { APPOINTMENT_STATUS } from "@/lib/constants";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8h-19h

export default function Home() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Appointment.list("-data_hora", 200);
      setAppointments(list);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const ws = useMemo(() => weekStart(selected), [selected]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(ws, i)), [ws]);

  const dayAppointments = useMemo(
    () => appointments
      .filter((a) => isSameDay(parseISO(a.data_hora), selected))
      .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora)),
    [appointments, selected]
  );

  const nextAppointments = useMemo(
    () => appointments
      .filter((a) => new Date(a.data_hora) >= new Date(new Date().setHours(0, 0, 0, 0)))
      .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora))
      .slice(0, 5),
    [appointments]
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
            {fmt(selected, "EEEE")} · {fmt(selected, "MMMM yyyy")}
          </div>
          <h1 className="font-display text-[40px] sm:text-[48px] font-semibold tracking-tightest leading-none text-foreground">
            {fmt(selected, "dd")}
          </h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            {dayAppointments.length} compromisso{dayAppointments.length !== 1 ? "s" : ""} neste dia
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border bg-card">
            <button onClick={() => setSelected(addDays(selected, -1))} className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-l-md transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setSelected(new Date())} className="px-3 h-9 text-[13px] font-medium border-x border-border hover:bg-secondary/60 transition-colors">
              Hoje
            </button>
            <button onClick={() => setSelected(addDays(selected, 1))} className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-r-md transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Button variant="outline" className="h-9" onClick={() => navigate("/agenda")}>
            <CalendarDays className="w-4 h-4 mr-1.5" /> Ver semana
          </Button>
          <Button className="h-9 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Novo agendamento
          </Button>
        </div>
      </div>

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border mb-10">
        {weekDays.map((d) => {
          const isSel = isSameDay(d, selected);
          const isToday = isSameDay(d, new Date());
          const count = appointments.filter((a) => isSameDay(parseISO(a.data_hora), d)).length;
          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelected(d)}
              className={`flex flex-col items-center py-3.5 bg-card hover:bg-secondary/50 transition-colors ${isSel ? "bg-secondary" : ""}`}
            >
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{fmt(d, "EEE")}</span>
              <span className={`mt-1 text-[17px] font-medium leading-none ${isToday ? "text-accent" : "text-foreground"}`}>{fmt(d, "dd")}</span>
              <span className="mt-2 h-1.5 flex items-center gap-0.5">
                {count > 0 ? Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                  <span key={i} className={`w-1 h-1 rounded-full ${isSel ? "bg-accent" : "bg-muted-foreground/40"}`} />
                )) : <span className="w-1 h-1 rounded-full bg-transparent" />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day appointments */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Agenda do dia</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-lg bg-secondary/50 animate-pulse" />)}
            </div>
          ) : dayAppointments.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg py-16 text-center">
              <p className="text-[14px] text-muted-foreground">Nenhum compromisso agendado para este dia.</p>
              <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Criar agendamento
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {dayAppointments.map((a) => {
                const st = APPOINTMENT_STATUS[a.status] || APPOINTMENT_STATUS.agendado;
                return (
                  <div key={a.id} className="group flex items-stretch bg-card border border-border rounded-lg overflow-hidden hover:border-foreground/20 transition-colors">
                    <div className={`w-1 ${st.dot}`} />
                    <div className="w-24 shrink-0 flex flex-col items-center justify-center px-4 py-4 border-r border-border">
                      <span className="text-[18px] font-semibold text-foreground tabular-nums">{fmt(a.data_hora, "HH:mm")}</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{a.duracao || 60} min</span>
                    </div>
                    <div className="flex-1 flex items-center justify-between px-5 py-4 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[15px] font-medium text-foreground truncate">{a.titulo}</span>
                          <span className="text-[11px] text-muted-foreground px-2 py-0.5 rounded border border-border">{a.tipo_atendimento}</span>
                        </div>
                        <p className="text-[13px] text-muted-foreground mt-1 truncate">
                          {a.cliente_nome || "Sem cliente vinculado"} · {a.responsavel}
                        </p>
                      </div>
                      <span className={`shrink-0 ml-4 text-[11px] font-medium px-2.5 py-1 rounded-full ${st.chip}`}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <aside>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4">Próximos compromissos</h2>
          <div className="space-y-3">
            {nextAppointments.length === 0 && !loading && (
              <p className="text-[13px] text-muted-foreground">Nada por enquanto.</p>
            )}
            {nextAppointments.map((a) => {
              const st = APPOINTMENT_STATUS[a.status] || APPOINTMENT_STATUS.agendado;
              return (
                <div key={a.id} className="flex gap-3 pb-3 border-b border-border last:border-0">
                  <div className="shrink-0 text-right w-12">
                    <div className="text-[14px] font-semibold tabular-nums">{fmt(a.data_hora, "HH:mm")}</div>
                    <div className="text-[10px] uppercase text-muted-foreground">{fmt(a.data_hora, "dd MMM")}</div>
                  </div>
                  <div className="w-px bg-border relative">
                    <span className={`absolute -left-[3px] top-1.5 w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{a.titulo}</p>
                    <p className="text-[12px] text-muted-foreground truncate">{a.cliente_nome}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      <AppointmentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={load} defaultDate={selected} />
    </div>
  );
}