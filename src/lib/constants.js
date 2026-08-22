export const NAV_ITEMS = [
  { label: "Início", to: "/" },
  { label: "Agenda", to: "/agenda" },
  { label: "Clientes", to: "/clientes" },
  { label: "Atendimentos", to: "/atendimentos" },
  { label: "Tarefas", to: "/tarefas" },
  { label: "Processos", to: "/processos" },
  { label: "Relatórios", to: "/relatorios" },
];

export const TASK_STAGES = [
  { id: "novo_contato", label: "Novo Contato" },
  { id: "em_atendimento", label: "Em Atendimento" },
  { id: "documentacao", label: "Documentação" },
  { id: "analise", label: "Análise" },
  { id: "contrato", label: "Contrato" },
  { id: "requerimento", label: "Requerimento" },
  { id: "pericia", label: "Perícia" },
  { id: "acompanhamento", label: "Acompanhamento" },
  { id: "finalizado", label: "Finalizado" },
];

export const APPOINTMENT_TYPES = [
  "Consulta Inicial",
  "Reunião",
  "Perícia",
  "Audiência",
  "Requerimento",
  "Retorno",
  "Outro",
];

export const APPOINTMENT_STATUS = {
  agendado: { label: "Agendado", dot: "bg-slate-400", chip: "bg-slate-100 text-slate-600" },
  confirmado: { label: "Confirmado", dot: "bg-sky-500", chip: "bg-sky-50 text-sky-700" },
  realizado: { label: "Realizado", dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" },
  cancelado: { label: "Cancelado", dot: "bg-rose-500", chip: "bg-rose-50 text-rose-700" },
};

export const CLIENT_SITUATION = {
  ativo: { label: "Ativo", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  aguardando: { label: "Aguardando", chip: "bg-amber-50 text-amber-700 border-amber-200" },
  suspenso: { label: "Suspenso", chip: "bg-slate-100 text-slate-600 border-slate-200" },
  finalizado: { label: "Finalizado", chip: "bg-sky-50 text-sky-700 border-sky-200" },
};

export const PRIORITY = {
  baixa: { label: "Baixa", chip: "text-slate-500" },
  media: { label: "Média", chip: "text-amber-600" },
  alta: { label: "Alta", chip: "text-rose-600" },
};

export const PROCESS_STATUS = {
  em_analise: "Em análise",
  aguardando_pericia: "Aguardando perícia",
  pericia_marcada: "Perícia marcada",
  aguardando_decisao: "Aguardando decisão",
  deferido: "Deferido",
  indeferido: "Indeferido",
  recurso: "Recurso",
};

export const TEAM = ["Dra. Helena Ribeiro", "Dr. Marcos Almeida", "Bianca Souza", "Rafael Lima"];