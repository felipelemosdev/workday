import { jsPDF } from "jspdf";
import { fmt } from "@/lib/format";

// Colunas do relatório impresso: dados de contato + acesso gov.br usados
// pelo escritório para acompanhar o benefício do cliente no INSS.
const REPORT_COLUMNS = [
  { key: "nome", header: "Nome", width: 46 },
  { key: "telefone", header: "Telefone", width: 28 },
  { key: "whatsapp", header: "WhatsApp", width: 28 },
  { key: "cpf", header: "CPF", width: 30 },
  { key: "senha_gov", header: "Senha gov.br", width: 30 },
];

// Filtra os clientes cujo cadastro (created_date) caiu no mês/ano de referência.
export function clientsRegisteredInMonth(clients, referenceDate = new Date()) {
  const y = referenceDate.getFullYear();
  const m = referenceDate.getMonth();
  return clients.filter((c) => {
    if (!c.created_date) return false;
    const d = new Date(c.created_date);
    return d.getFullYear() === y && d.getMonth() === m;
  });
}

// Monta o documento jsPDF com a tabela de clientes do mês. Reaproveitado
// tanto pela exportação (salvar arquivo) quanto pela impressão (abrir diálogo).
function buildMonthlyClientsDoc(clients, referenceDate = new Date()) {
  const rows = clientsRegisteredInMonth(clients, referenceDate);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 12;
  const tableWidth = REPORT_COLUMNS.reduce((s, c) => s + c.width, 0);
  const startX = (pageWidth - tableWidth) / 2 > marginX ? (pageWidth - tableWidth) / 2 : marginX;

  const rowHeight = 9;
  const headerHeight = 10;
  let y = 24;

  const drawHeaderBlock = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Diário — Clientes cadastrados no mês", marginX, 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(`Referência: ${fmt(referenceDate, "MMMM 'de' yyyy")} · ${rows.length} cliente(s)`, marginX, 20);
    doc.setTextColor(0);
  };

  const drawTableHeader = () => {
    doc.setFillColor(30, 41, 59);
    doc.rect(startX, y, tableWidth, headerHeight, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    let x = startX;
    REPORT_COLUMNS.forEach((col) => {
      doc.text(col.header, x + 2, y + headerHeight / 2 + 1.5);
      x += col.width;
    });
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    y += headerHeight;
  };

  drawHeaderBlock();
  drawTableHeader();

  doc.setFontSize(9);
  rows.forEach((c, i) => {
    if (y + rowHeight > pageHeight - 14) {
      doc.addPage();
      y = 20;
      drawTableHeader();
    }
    if (i % 2 === 1) {
      doc.setFillColor(244, 246, 248);
      doc.rect(startX, y, tableWidth, rowHeight, "F");
    }
    let x = startX;
    REPORT_COLUMNS.forEach((col) => {
      const raw = c[col.key] ?? "—";
      const text = doc.splitTextToSize(String(raw || "—"), col.width - 4)[0] || "—";
      doc.text(text, x + 2, y + rowHeight / 2 + 1.2);
      x += col.width;
    });
    doc.setDrawColor(224, 227, 231);
    doc.line(startX, y + rowHeight, startX + tableWidth, y + rowHeight);
    y += rowHeight;
  });

  if (rows.length === 0) {
    doc.setTextColor(120);
    doc.text("Nenhum cliente cadastrado neste mês.", startX + 2, y + 8);
    doc.setTextColor(0);
  }

  // Rodapé com aviso de confidencialidade, já que a lista traz CPF e senha do gov.br.
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(140);
    doc.text("Documento confidencial — contém dados sensíveis (CPF e senha gov.br). Uso interno do escritório.", marginX, pageHeight - 8);
    doc.text(`${p}/${pageCount}`, pageWidth - marginX - 8, pageHeight - 8);
    doc.setTextColor(0);
  }

  return doc;
}

export function exportClientsMonthlyPDF(clients, referenceDate = new Date(), filename) {
  const doc = buildMonthlyClientsDoc(clients, referenceDate);
  const name = filename || `clientes-${fmt(referenceDate, "yyyy-MM")}.pdf`;
  doc.save(name);
}

export function printClientsMonthlyPDF(clients, referenceDate = new Date()) {
  const doc = buildMonthlyClientsDoc(clients, referenceDate);
  // autoPrint + abrir em nova aba dispara o diálogo de impressão do navegador.
  doc.autoPrint();
  const blobUrl = doc.output("bloburl");
  window.open(blobUrl, "_blank");
}
