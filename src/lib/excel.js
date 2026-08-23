import * as XLSX from "xlsx";
import { parse } from "date-fns";
import { fmt } from "@/lib/format";

// Colunas usadas tanto para exportar quanto para reconhecer ao importar.
const APPOINTMENT_COLUMNS = [
  { key: "titulo", header: "Título" },
  { key: "cliente_nome", header: "Cliente" },
  { key: "tipo_atendimento", header: "Tipo de atendimento" },
  { key: "data_hora", header: "Data e hora" },
  { key: "duracao", header: "Duração (min)" },
  { key: "responsavel", header: "Responsável" },
  { key: "status", header: "Status" },
  { key: "observacoes", header: "Observações" },
];

export function exportAppointmentsToExcel(appointments, filename = "agenda-workday.xlsx") {
  const rows = appointments.map((a) => {
    const row = {};
    APPOINTMENT_COLUMNS.forEach(({ key, header }) => {
      if (key === "data_hora") {
        row[header] = a.data_hora ? fmt(a.data_hora, "dd/MM/yyyy HH:mm") : "";
      } else {
        row[header] = a[key] ?? "";
      }
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Agenda");
  XLSX.writeFile(workbook, filename);
}

// Lê um arquivo .xlsx/.xls/.csv e devolve uma lista de agendamentos prontos
// para criar via base44.entities.Appointment.create(...).
export async function importAppointmentsFromExcel(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const headerToKey = Object.fromEntries(APPOINTMENT_COLUMNS.map((c) => [c.header, c.key]));

  return rows
    .map((row) => {
      const record = {};
      Object.entries(row).forEach(([header, value]) => {
        const key = headerToKey[header.trim()];
        if (key) record[key] = value;
      });
      // Converte "dd/MM/yyyy HH:mm" de volta para ISO.
      if (record.data_hora) {
        const parsed = parse(String(record.data_hora), "dd/MM/yyyy HH:mm", new Date());
        record.data_hora = isNaN(parsed) ? null : parsed.toISOString();
      }
      if (record.duracao) record.duracao = Number(record.duracao) || 60;
      return record;
    })
    .filter((r) => r.titulo && r.data_hora); // ignora linhas sem os campos obrigatórios
}

// Colunas reconhecidas ao importar/exportar a planilha de clientes.
// "Nome" é a única obrigatória — os demais campos, incluindo "Endereço",
// são sempre opcionais tanto na exportação quanto na importação.
const CLIENT_COLUMNS = [
  { key: "nome", header: "Nome" },
  { key: "cpf", header: "CPF" },
  { key: "telefone", header: "Telefone" },
  { key: "whatsapp", header: "WhatsApp" },
  { key: "endereco", header: "Endereço" },
  { key: "beneficio_tipo", header: "Tipo de benefício" },
  { key: "responsavel", header: "Responsável" },
];

// Aceita variações comuns de cabeçalho (acentos, maiúsculas, espaços) para
// facilitar a importação de planilhas que não seguem o modelo exato.
function normalizeHeader(h) {
  return String(h)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const HEADER_ALIASES = {
  nome: "nome",
  "nome completo": "nome",
  cliente: "nome",
  cpf: "cpf",
  telefone: "telefone",
  celular: "telefone",
  fone: "telefone",
  whatsapp: "whatsapp",
  zap: "whatsapp",
  endereco: "endereco",
  "endereco completo": "endereco",
  "tipo de beneficio": "beneficio_tipo",
  beneficio: "beneficio_tipo",
  responsavel: "responsavel",
};

// Lê um arquivo .xlsx/.xls/.csv com clientes e devolve uma lista de
// registros prontos para criar via base44.entities.Client.create(...).
// Apenas "nome" é obrigatório; "endereço" e os demais campos são opcionais —
// linhas sem endereço são importadas normalmente.
export async function importClientsFromExcel(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return rows
    .map((row) => {
      const record = {};
      Object.entries(row).forEach(([header, value]) => {
        const key = HEADER_ALIASES[normalizeHeader(header)];
        if (key && String(value).trim() !== "") record[key] = String(value).trim();
      });
      return record;
    })
    .filter((r) => r.nome); // única exigência: nome preenchido
}

export function exportClientsToExcel(clients, filename = "clientes-workday.xlsx") {
  const rows = clients.map((c) => {
    const row = {};
    CLIENT_COLUMNS.forEach(({ key, header }) => { row[header] = c[key] ?? ""; });
    return row;
  });
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
  XLSX.writeFile(workbook, filename);
}
