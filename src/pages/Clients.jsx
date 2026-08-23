import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, ChevronRight, Trash2, Loader2, FileUp, FileDown, Printer } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { maskCPF } from "@/lib/format";
import { CLIENT_SITUATION } from "@/lib/constants";
import ResponsavelField from "@/components/ResponsavelField";
import { importClientsFromExcel } from "@/lib/excel";
import { exportClientsMonthlyPDF, printClientsMonthlyPDF } from "@/lib/pdf";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sit, setSit] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite reimportar o mesmo arquivo depois
    if (!file) return;
    setImporting(true);
    try {
      const rows = await importClientsFromExcel(file);
      for (const row of rows) {
        await base44.entities.Client.create(row);
      }
      await load();
    } catch (err) {
      alert("Não foi possível importar a planilha. Confira se a coluna \"Nome\" está preenchida.");
    } finally {
      setImporting(false);
    }
  };

  const handleExportPDF = () => exportClientsMonthlyPDF(clients);
  const handlePrint = () => printClientsMonthlyPDF(clients);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await base44.entities.Client.delete(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } finally { setDeleting(false); }
  };

  const load = async () => {
    setLoading(true);
    try { setClients(await base44.entities.Client.list("nome", 500)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return clients.filter((c) => {
      if (sit !== "all" && c.situacao !== sit) return false;
      if (!term) return true;
      return [c.nome, c.cpf, c.beneficio_tipo, c.responsavel].filter(Boolean).some((v) => v.toLowerCase().includes(term));
    });
  }, [clients, q, sit]);

  return (
    <div>
      <PageHeader meta="Base de clientes" title="Clientes" subtitle={`${filtered.length} cliente(s) na lista`}>
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
        <Button variant="outline" className="h-9" onClick={handleExportPDF} title="Exporta os clientes cadastrados neste mês em PDF">
          <FileDown className="w-4 h-4 mr-1.5" /> Exportar PDF (mês)
        </Button>
        <Button variant="outline" className="h-9" onClick={handlePrint} title="Imprime os clientes cadastrados neste mês">
          <Printer className="w-4 h-4 mr-1.5" /> Imprimir
        </Button>
        <Button className="h-9 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Novo cliente
        </Button>
      </PageHeader>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, CPF, benefício ou responsável…"
            className="pl-9 h-10 bg-card"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
          {[
            { k: "all", label: "Todos" },
            { k: "ativo", label: "Ativos" },
            { k: "aguardando", label: "Aguardando" },
            { k: "finalizado", label: "Finalizados" },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => setSit(f.k)}
              className={`px-3 h-8 text-[13px] font-medium rounded transition-colors ${sit === f.k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1.4fr_1fr_1fr_72px] gap-4 px-5 py-3 border-b border-border text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          <span>Cliente</span><span>CPF</span><span>Benefício</span><span>Responsável</span><span>Situação</span><span />
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 rounded bg-secondary/50 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-muted-foreground">Nenhum cliente encontrado.</div>
        ) : (
          filtered.map((c) => {
            const s = CLIENT_SITUATION[c.situacao] || CLIENT_SITUATION.ativo;
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/clientes/${c.id}`)}
                className="w-full grid grid-cols-1 md:grid-cols-[2fr_1fr_1.4fr_1fr_1fr_72px] gap-4 px-5 py-4 border-b border-border last:border-b-0 text-left hover:bg-secondary/40 transition-colors group items-center cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-foreground truncate">{c.nome}</div>
                  <div className="text-[12px] text-muted-foreground md:hidden">{c.beneficio_tipo} · {c.responsavel}</div>
                </div>
                <div className="hidden md:block text-[13px] text-muted-foreground tabular-nums">{maskCPF(c.cpf)}</div>
                <div className="hidden md:block text-[13px] text-foreground truncate">{c.beneficio_tipo || "—"}</div>
                <div className="hidden md:block text-[13px] text-muted-foreground truncate">{c.responsavel || "—"}</div>
                <div className="hidden md:block">
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${s.chip}`}>{s.label}</span>
                </div>
                <div className="hidden md:flex items-center justify-end gap-1 text-muted-foreground">
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors"
                    aria-label="Excluir cliente"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.7} />
                  </button>
                  <ChevronRight className="w-4 h-4 group-hover:text-foreground" />
                </div>
              </div>
            );
          })
        )}
      </div>

      <NewClientDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={load} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong className="text-foreground">{deleteTarget?.nome}</strong>? Esta ação não pode ser desfeita. Registros vinculados (agendamentos, tarefas, processos, documentos e histórico) permanecerão, mas ficarão sem o cliente associado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Excluindo…</> : "Excluir cliente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function NewClientDialog({ open, onOpenChange, onSaved }) {
  const [form, setForm] = useState({ nome: "", cpf: "", email: "", telefone: "", whatsapp: "", senha_gov: "", beneficio_tipo: "Aposentadoria", responsavel: "", situacao: "ativo", data_nascimento: "", endereco: "", observacoes: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nome) return;
    setSaving(true);
    try {
      await base44.entities.Client.create(form);
      onSaved?.();
      onOpenChange?.(false);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader><DialogTitle className="font-display text-xl">Novo cliente</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="nome">Nome completo *</Label><Input id="nome" value={form.nome} onChange={(e) => set("nome", e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label htmlFor="cpf">CPF</Label><Input id="cpf" value={form.cpf} onChange={(e) => set("cpf", e.target.value)} placeholder="000.000.000-00" /></div>
            <div className="space-y-1.5"><Label htmlFor="dn">Data de nascimento</Label><Input id="dn" type="date" value={form.data_nascimento} onChange={(e) => set("data_nascimento", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="tel">Telefone</Label><Input id="tel" value={form.telefone} onChange={(e) => set("telefone", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label htmlFor="wpp">WhatsApp</Label><Input id="wpp" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="senhagov">Senha gov.br</Label><Input id="senhagov" value={form.senha_gov} onChange={(e) => set("senha_gov", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label htmlFor="ben">Tipo de benefício</Label>
              <select id="ben" value={form.beneficio_tipo} onChange={(e) => set("beneficio_tipo", e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                {["Aposentadoria", "BPC/LOAS", "Auxílio-Doença", "Pensão por Morte", "Auxílio-Acidente", "Revisão"].map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <ResponsavelField id="resp" value={form.responsavel} onChange={(v) => set("responsavel", v)} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="end">Endereço</Label><Input id="end" value={form.endereco} onChange={(e) => set("endereco", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="obs">Observações</Label><Input id="obs" value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} /></div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>Cadastrar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}