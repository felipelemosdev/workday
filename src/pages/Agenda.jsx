import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, FileDown, FileUp, Loader2 } from "lucide-react";
import AppointmentFormDialog from "@/components/AppointmentFormDialog";
import PageHeader from "@/components/PageHeader";
import { fmt, isSameDay, addDays, addWeeks, weekStart, weekEnd, parseISO } from "@/lib/format";
import { APPOINTMENT_STATUS } from "@/lib/constants";
import { exportAppointmentsToExcel, importAppointmentsFromExcel } from "@/lib/excel";

const HOUR_HEIGHT = 56;
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

export default function Agenda() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      setAppointments(await base44.entities.Appointment.list("-data_hora", 300));
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleExport = () => {
    exportAppointmentsToExcel(appointments);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite reimportar o mesmo arquivo depois
    if (!file) return;
    setImporting(true);
    try {
      const rows = await importAppointmentsFromExcel(file);
      for (const row of rows) {
        await base44.entities.Appointment.create(row);
      }
      await load();
    } catch (err) {
      alert("Não foi possível importar a planilha. Confira se as colunas seguem o modelo exportado.");
    } finally {
      setImporting(false);
    }
  };

  const ws = useMemo(() => weekStart(cursor), [cursor]);
  const we = useMemo(() => weekEnd(cursor), [cursor]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(ws, i)), [ws]);

  const byDay = useMemo(() => {
    const map = {};
    days.forEach((d) => { map[d.toDateString()] = []; });
    appointments.forEach((a) => {
      const d = parseISO(a.data_hora);
      const key = d.toDateString();
      if (map[key]) map[key].push(a);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora)));
    return map;
  }, [appointments, days]);

  const blockStyle = (a) => {
    const d = parseISO(a.data_hora);
    const top = (d.getHours() - 8) * HOUR_HEIGHT + (d.getMinutes() / 60) * HOUR_HEIGHT;
    const height = Math.max(((a.duracao || 60) / 60) * HOUR_HEIGHT - 4, 22);
    return { top: `${top}px`, height: `${height}px` };
  };

  return (
    <div>
      <PageHeader meta="Visão semanal" title="Agenda do escritório" subtitle={`${fmt(ws, "dd 'de' MMMM")} — ${fmt(we, "dd 'de' MMMM 'de' yyyy")}`}>
        <div className="flex items-center rounded-md border border-border bg-card">
          <button onClick={() => setCursor(addWeeks(cursor, -1))} className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-l-md"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setCursor(new Date())} className="px-3 h-9 text-[13px] font-medium border-x border-border hover:bg-secondary/60">Hoje</button>
          <button onClick={() => setCursor(addWeeks(cursor, 1))} className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-r-md"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <Button variant="outline" className="h-9" onClick={handleExport}>
          <FileDown className="w-4 h-4 mr-1.5" /> Exportar Excel
        </Button>
        <Button variant="outline" className="h-9" onClick={handleImportClick} disabled={importing}>
          {importing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <FileUp className="w-4 h-4 mr-1.5" />}
          Importar Excel
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleImportFile}
        />
        <Button className="h-9 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => { setDialogDate(new Date()); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-1.5" /> Novo agendamento
        </Button>
      </PageHeader>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border">
          <div className="border-r border-border" />
          {days.map((d) => {
            const isToday = isSameDay(d, new Date());
            return (
              <button
                key={d.toISOString()}
                onClick={() => { setDialogDate(d); setDialogOpen(true); }}
                className="px-3 py-3 text-center border-r border-border last:border-r-0 hover:bg-secondary/40 transition-colors"
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{fmt(d, "EEE")}</div>
                <div className={`mt-1 text-[20px] font-medium leading-none ${isToday ? "text-accent" : "text-foreground"}`}>{fmt(d, "dd")}</div>
              </button>
            );
          })}
        </div>

        {/* Grid body */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)] relative">
          {/* Hour column */}
          <div className="border-r border-border">
            {HOURS.map((h) => (
              <div key={h} className="h-14 px-2 pt-1 text-right">
                <span className="text-[10px] text-muted-foreground tabular-nums">{String(h).padStart(2, "0")}:00</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d) => {
            const list = byDay[d.toDateString()] || [];
            return (
              <div key={d.toISOString()} className="relative border-r border-border last:border-r-0">
                {HOURS.map((h, i) => (
                  <div key={h} className={`h-14 ${i < HOURS.length - 1 ? "border-b border-border/60" : ""}`} />
                ))}
                {list.map((a) => {
                  const st = APPOINTMENT_STATUS[a.status] || APPOINTMENT_STATUS.agendado;
                  return (
                    <div
                      key={a.id}
                      style={blockStyle(a)}
                      className="absolute left-1 right-1 rounded-md border border-border bg-secondary/60 px-2 py-1 overflow-hidden hover:border-foreground/25 hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot} shrink-0`} />
                        <span className="text-[11px] font-semibold tabular-nums text-foreground">{fmt(a.data_hora, "HH:mm")}</span>
                      </div>
                      <p className="text-[12px] font-medium text-foreground truncate mt-0.5">{a.titulo}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{a.cliente_nome}</p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <AppointmentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={load} defaultDate={dialogDate} />
    </div>
  );
}