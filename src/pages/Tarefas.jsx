import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { TASK_STAGES, PRIORITY } from "@/lib/constants";
import { fmt } from "@/lib/format";
import ResponsavelField from "@/components/ResponsavelField";

export default function Tarefas() {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([
        base44.entities.Task.list("-updated_date", 500),
        base44.entities.Client.list("nome", 500),
      ]);
      setTasks(t);
      setClients(c);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const byStage = (stageId) => tasks.filter((t) => (t.etapa || "novo_contato") === stageId);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, etapa: destination.droppableId } : t)));
    try { await base44.entities.Task.update(task.id, { etapa: destination.droppableId }); }
    catch { load(); }
  };

  return (
    <div>
      <PageHeader meta="Fluxo de trabalho" title="Tarefas" subtitle="Acompanhe cada caso da primeira ligação à conclusão. Arraste os cartões entre as etapas.">
        <Button className="h-9 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Nova tarefa
        </Button>
      </PageHeader>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-4 -mx-2 px-2">
            {TASK_STAGES.map((stage) => {
              const items = byStage(stage.id);
              return (
                <div key={stage.id} className="flex flex-col w-[260px] shrink-0">
                  <div className="flex items-center justify-between px-1 pb-3">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-foreground">{stage.label}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">{items.length}</span>
                  </div>
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 min-h-[120px] rounded-lg p-2 transition-colors ${snapshot.isDraggingOver ? "bg-secondary/70" : "bg-secondary/30"}`}
                      >
                        {items.map((t, idx) => (
                          <Draggable key={t.id} draggableId={t.id} index={idx}>
                            {(p, s) => (
                              <div
                                ref={p.innerRef}
                                {...p.draggableProps}
                                {...p.dragHandleProps}
                                className={`bg-card border rounded-md p-3 mb-2 cursor-grab active:cursor-grabbing transition-shadow ${s.isDragging ? "border-foreground/25 shadow-md" : "border-border hover:border-foreground/15"}`}
                              >
                                <p className="text-[13px] font-medium text-foreground leading-snug">{t.titulo}</p>
                                {t.cliente_nome && <p className="text-[11px] text-muted-foreground mt-1 truncate">{t.cliente_nome}</p>}
                                <div className="flex items-center justify-between mt-2.5">
                                  <span className={`text-[10px] font-medium ${PRIORITY[t.prioridade]?.chip || PRIORITY.media.chip}`}>● {PRIORITY[t.prioridade]?.label || "Média"}</span>
                                  {t.vencimento && <span className="text-[10px] text-muted-foreground tabular-nums">vence {fmt(t.vencimento, "dd/MM")}</span>}
                                </div>
                                {t.responsavel && <p className="text-[10px] text-muted-foreground mt-1.5 pt-1.5 border-t border-border/60">{t.responsavel}</p>}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {items.length === 0 && !snapshot.isDraggingOver && (
                          <div className="text-center py-6 text-[11px] text-muted-foreground/60">Solte aqui</div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      <NewTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={load} clients={clients} />
    </div>
  );
}

function NewTaskDialog({ open, onOpenChange, onSaved, clients }) {
  const [form, setForm] = useState({ titulo: "", descricao: "", cliente_id: "", cliente_nome: "", etapa: "novo_contato", responsavel: "", prioridade: "media", vencimento: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.titulo) return;
    setSaving(true);
    try {
      const sel = clients.find((c) => c.id === form.cliente_id);
      await base44.entities.Task.create({ ...form, cliente_nome: sel?.nome || form.cliente_nome });
      onSaved?.();
      onOpenChange?.(false);
      setForm({ titulo: "", descricao: "", cliente_id: "", cliente_nome: "", etapa: "novo_contato", responsavel: "", prioridade: "media", vencimento: "" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle className="font-display text-xl">Nova tarefa</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="t">Título *</Label><Input id="t" value={form.titulo} onChange={(e) => set("titulo", e.target.value)} required /></div>
          <div className="space-y-1.5"><Label htmlFor="d">Descrição</Label><Input id="d" value={form.descricao} onChange={(e) => set("descricao", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label htmlFor="c">Cliente</Label>
              <select id="c" value={form.cliente_id} onChange={(e) => set("cliente_id", e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="">— Nenhum —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="et">Etapa</Label>
              <select id="et" value={form.etapa} onChange={(e) => set("etapa", e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                {TASK_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <ResponsavelField id="r" value={form.responsavel} onChange={(v) => set("responsavel", v)} />
            <div className="space-y-1.5"><Label htmlFor="p">Prioridade</Label>
              <select id="p" value={form.prioridade} onChange={(e) => set("prioridade", e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="v">Vencimento</Label><Input id="v" type="date" value={form.vencimento} onChange={(e) => set("vencimento", e.target.value)} /></div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>Criar tarefa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}