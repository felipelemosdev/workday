import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APPOINTMENT_TYPES, APPOINTMENT_STATUS } from "@/lib/constants";
import { toISO } from "@/lib/format";
import ResponsavelField from "@/components/ResponsavelField";

const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AppointmentFormDialog({ open, onOpenChange, onSaved, defaultDate }) {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    titulo: "",
    cliente_id: "",
    cliente_nome: "",
    tipo_atendimento: "Consulta Inicial",
    data_hora: "",
    duracao: 60,
    responsavel: "",
    status: "agendado",
    observacoes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    base44.entities.Client.list().then(setClients).catch(() => {});
    if (defaultDate) {
      const d = new Date(defaultDate);
      d.setHours(9, 0, 0, 0);
      setForm((f) => ({ ...f, data_hora: toLocalInput(d.toISOString()) }));
    }
  }, [open, defaultDate]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.titulo || !form.data_hora) return;
    setSaving(true);
    try {
      const selected = clients.find((c) => c.id === form.cliente_id);
      const payload = {
        ...form,
        duracao: Number(form.duracao) || 60,
        cliente_nome: selected?.nome || form.cliente_nome,
        data_hora: toISO(form.data_hora),
      };
      await base44.entities.Appointment.create(payload);
      onSaved?.();
      onOpenChange?.(false);
      setForm({ titulo: "", cliente_id: "", cliente_nome: "", tipo_atendimento: "Consulta Inicial", data_hora: "", duracao: 60, responsavel: "", status: "agendado", observacoes: "" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Novo agendamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ex.: Consulta inicial — Aposentadoria" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cliente">Cliente</Label>
              <select id="cliente" value={form.cliente_id} onChange={(e) => set("cliente_id", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="">— Sem cliente —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo de atendimento</Label>
              <select id="tipo" value={form.tipo_atendimento} onChange={(e) => set("tipo_atendimento", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                {APPOINTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="data">Data e hora</Label>
              <Input id="data" type="datetime-local" value={form.data_hora} onChange={(e) => set("data_hora", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duracao">Duração (min)</Label>
              <Input id="duracao" type="number" min={15} step={15} value={form.duracao} onChange={(e) => set("duracao", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ResponsavelField id="resp" value={form.responsavel} onChange={(v) => set("responsavel", v)} />
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select id="status" value={form.status} onChange={(e) => set("status", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                {Object.entries(APPOINTMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="obs">Observações</Label>
            <Input id="obs" value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>Agendar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}