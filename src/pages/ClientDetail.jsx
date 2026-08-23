import React, { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Mail, MapPin, CalendarClock, FileText, Scale, ListChecks, Clock, Trash2, Loader2 } from "lucide-react";
import { fmt, maskCPF, parseISO, isSameDay } from "@/lib/format";
import { CLIENT_SITUATION, APPOINTMENT_STATUS, PROCESS_STATUS, TASK_STAGES, PRIORITY } from "@/lib/constants";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "agenda", label: "Agenda" },
  { id: "documentos", label: "Documentos" },
  { id: "tarefas", label: "Tarefas" },
  { id: "processos", label: "Processos" },
  { id: "historico", label: "Histórico" },
];

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [tab, setTab] = useState("resumo");
  const [data, setData] = useState({ appointments: [], tasks: [], processes: [], documents: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.entities.Client.delete(id);
      navigate("/clientes");
    } catch (e) {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const c = await base44.entities.Client.get(id);
        setClient(c);
        const [appointments, tasks, processes, documents, history] = await Promise.all([
          base44.entities.Appointment.filter({ cliente_id: id }, "-data_hora", 200).catch(() => []),
          base44.entities.Task.filter({ cliente_id: id }, "-updated_date", 200).catch(() => []),
          base44.entities.Process.filter({ cliente_id: id }, "-data_distribuicao", 200).catch(() => []),
          base44.entities.Document.filter({ cliente_id: id }, "-data", 200).catch(() => []),
          base44.entities.HistoryEvent.filter({ cliente_id: id }, "-data", 200).catch(() => []),
        ]);
        setData({ appointments, tasks, processes, documents, history });
      } finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  if (!client) return <div className="py-20 text-center text-muted-foreground">Cliente não encontrado.</div>;

  const sit = CLIENT_SITUATION[client.situacao] || CLIENT_SITUATION.ativo;

  return (
    <div>
      <button onClick={() => navigate("/clientes")} className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground mb-5">
        <ArrowLeft className="w-4 h-4" /> Voltar para clientes
      </button>

      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-secondary border border-border flex items-center justify-center font-display text-xl font-semibold text-foreground shrink-0">
              {client.nome.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div>
              <h1 className="font-display text-[26px] font-semibold tracking-tight text-foreground leading-tight">{client.nome}</h1>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2 text-[13px] text-muted-foreground">
                <span className="tabular-nums">CPF {maskCPF(client.cpf)}</span>
                {client.email && <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {client.email}</span>}
                {client.telefone && <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {client.telefone}</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-2">
            <span className={`text-[12px] font-medium px-3 py-1 rounded-full border ${sit.chip}`}>{sit.label}</span>
            <span className="text-[12px] text-muted-foreground">Benefício: <span className="text-foreground font-medium">{client.beneficio_tipo || "—"}</span></span>
            <span className="text-[12px] text-muted-foreground">Responsável: <span className="text-foreground font-medium">{client.responsavel || "—"}</span></span>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 mt-1" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="w-4 h-4" /> Excluir cliente
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-4 py-3 text-[13px] font-medium tracking-wide whitespace-nowrap transition-colors ${tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t.label.toUpperCase()}
              {tab === t.id && <span className="absolute left-3 right-3 -bottom-px h-[2px] bg-accent rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === "resumo" && <ResumoTab client={client} data={data} />}
      {tab === "agenda" && <AgendaTab appointments={data.appointments} />}
      {tab === "documentos" && <DocumentsTab documents={data.documents} />}
      {tab === "tarefas" && <TasksTab tasks={data.tasks} />}
      {tab === "processos" && <ProcessesTab processes={data.processes} />}
      {tab === "historico" && <HistoryTab history={data.history} />}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong className="text-foreground">{client.nome}</strong>? Esta ação não pode ser desfeita.
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

function Empty({ icon: Icon, text }) {
  return (
    <div className="border border-dashed border-border rounded-lg py-12 text-center">
      <Icon className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" strokeWidth={1.5} />
      <p className="text-[13px] text-muted-foreground">{text}</p>
    </div>
  );
}

function ResumoTab({ client, data }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Section title="Dados cadastrais">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13px]">
            <Field label="Nome" value={client.nome} />
            <Field label="CPF" value={maskCPF(client.cpf)} />
            <Field label="Data de nascimento" value={client.data_nascimento ? fmt(client.data_nascimento, "dd/MM/yyyy") : "—"} />
            <Field label="Tipo de benefício" value={client.beneficio_tipo || "—"} />
            <Field label="Responsável" value={client.responsavel || "—"} />
            <Field label="Situação" value={CLIENT_SITUATION[client.situacao]?.label || "—"} />
            <Field label="E-mail" value={client.email || "—"} />
            <Field label="Telefone" value={client.telefone || "—"} />
            <Field label="WhatsApp" value={client.whatsapp || "—"} />
            <Field label="Senha gov.br" value={client.senha_gov || "—"} />
            <div className="col-span-2"><Field label="Endereço" value={client.endereco || "—"} /></div>
            <div className="col-span-2"><Field label="Observações" value={client.observacoes || "—"} /></div>
          </dl>
        </Section>
        <Section title="Observações do caso">{client.observacoes ? <p className="text-[13px] text-muted-foreground leading-relaxed">{client.observacoes}</p> : <p className="text-[13px] text-muted-foreground">Sem observações registradas.</p>}</Section>
      </div>
      <div className="space-y-6">
        <Section title="Resumo do caso">
          <div className="space-y-3">
            <Stat icon={CalendarClock} label="Agendamentos" value={data.appointments.length} />
            <Stat icon={ListChecks} label="Tarefas ativas" value={data.tasks.filter((t) => t.etapa !== "finalizado").length} />
            <Stat icon={Scale} label="Processos" value={data.processes.length} />
            <Stat icon={FileText} label="Documentos" value={data.documents.length} />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}
function Field({ label, value }) {
  return (<div><dt className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{label}</dt><dd className="text-foreground">{value}</dd></div>);
}
function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="inline-flex items-center gap-2.5 text-[13px] text-muted-foreground"><Icon className="w-4 h-4" strokeWidth={1.6} /> {label}</span>
      <span className="text-[16px] font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function AgendaTab({ appointments }) {
  if (!appointments.length) return <Empty icon={CalendarClock} text="Nenhum agendamento vinculado a este cliente." />;
  return (
    <div className="space-y-2">
      {appointments.map((a) => {
        const st = APPOINTMENT_STATUS[a.status] || APPOINTMENT_STATUS.agendado;
        return (
          <div key={a.id} className="flex items-stretch bg-card border border-border rounded-lg overflow-hidden">
            <div className={`w-1 ${st.dot}`} />
            <div className="w-28 flex flex-col justify-center px-4 py-3 border-r border-border">
              <span className="text-[15px] font-semibold tabular-nums">{fmt(a.data_hora, "dd MMM")}</span>
              <span className="text-[12px] text-muted-foreground tabular-nums">{fmt(a.data_hora, "HH:mm")}</span>
            </div>
            <div className="flex-1 flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-[14px] font-medium">{a.titulo}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{a.tipo_atendimento} · {a.responsavel}</p>
              </div>
              <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${st.chip}`}>{st.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DocumentsTab({ documents }) {
  if (!documents.length) return <Empty icon={FileText} text="Nenhum documento cadastrado." />;
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {documents.map((d) => (
        <div key={d.id} className="flex items-center justify-between px-5 py-3.5 border-b border-border last:border-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-secondary border border-border flex items-center justify-center"><FileText className="w-4 h-4 text-muted-foreground" /></div>
            <div>
              <p className="text-[13px] font-medium">{d.nome}</p>
              <p className="text-[12px] text-muted-foreground">{d.tipo} · {d.data ? fmt(d.data, "dd/MM/yyyy") : "—"}</p>
            </div>
          </div>
          {d.arquivo_url && <a href={d.arquivo_url} target="_blank" rel="noreferrer" className="text-[12px] text-accent hover:underline">Abrir</a>}
        </div>
      ))}
    </div>
  );
}

function TasksTab({ tasks }) {
  if (!tasks.length) return <Empty icon={ListChecks} text="Nenhuma tarefa vinculada a este cliente." />;
  return (
    <div className="space-y-2">
      {tasks.map((t) => {
        const stage = TASK_STAGES.find((s) => s.id === t.etapa);
        const pr = PRIORITY[t.prioridade] || PRIORITY.media;
        return (
          <div key={t.id} className="bg-card border border-border rounded-lg px-5 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium">{t.titulo}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">{stage?.label} · {t.responsavel || "—"}{t.vencimento ? ` · vence ${fmt(t.vencimento, "dd/MM")}` : ""}</p>
            </div>
            <span className={`text-[11px] font-medium ${pr.chip}`}>● {pr.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProcessesTab({ processes }) {
  if (!processes.length) return <Empty icon={Scale} text="Nenhum processo vinculado." />;
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {processes.map((p) => (
        <div key={p.id} className="px-5 py-4 border-b border-border last:border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium tabular-nums">{p.numero}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">{p.tipo_beneficio} · {p.orgao} · {p.responsavel || "—"}</p>
            </div>
            <div className="text-right">
              <span className="text-[12px] font-medium text-foreground">{PROCESS_STATUS[p.status] || p.status}</span>
              {p.data_distribuicao && <p className="text-[11px] text-muted-foreground mt-0.5">Distribuído em {fmt(p.data_distribuicao, "dd/MM/yyyy")}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryTab({ history }) {
  if (!history.length) return <Empty icon={Clock} text="Sem histórico registrado." />;
  const sorted = [...history].sort((a, b) => new Date(b.data) - new Date(a.data));
  return (
    <div className="relative pl-6">
      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
      {sorted.map((h) => (
        <div key={h.id} className="relative pb-6 last:pb-0">
          <span className="absolute -left-[22px] top-1 w-3.5 h-3.5 rounded-full bg-card border-2 border-accent" />
          <div className="flex items-baseline gap-3">
            <span className="text-[12px] font-medium text-muted-foreground tabular-nums whitespace-nowrap">{fmt(h.data, "dd MMM yyyy 'às' HH:mm")}</span>
            <span className="text-[11px] uppercase tracking-wider text-accent">{h.tipo}</span>
          </div>
          <p className="text-[14px] text-foreground mt-1">{h.descricao}</p>
          {h.responsavel && <p className="text-[12px] text-muted-foreground mt-0.5">por {h.responsavel}</p>}
        </div>
      ))}
    </div>
  );
}