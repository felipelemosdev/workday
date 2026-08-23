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
