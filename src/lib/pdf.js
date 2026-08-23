import { jsPDF } from "jspdf";
import { fmt } from "@/lib/format";

// Margem "estreita" padrão do Word (1,27 cm) em todos os lados.
const MARGIN = 12.7;

// Peso relativo de cada coluna — a tabela ocupa 100% da largura útil da
// página (entre as margens), então as colunas são distribuídas
// proporcionalmente em vez de usar larguras fixas.
const REPORT_COLUMNS = [
  { key: "nome", header: "Nome", weight: 0.30 },
  { key: "telefone", header: "Telefone", weight: 0.16 },
  { key: "whatsapp", header: "WhatsApp", weight: 0.16 },
  { key: "cpf", header: "CPF", weight: 0.19 },
  { key: "senha_gov", header: "Senha gov.br", weight: 0.19 },
];

const NAVY = [30, 41, 59];
const BORDER = [209, 213, 219];
const ZEBRA = [247, 248, 250];
const MUTED = [107, 114, 128];

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

  const tableWidth = pageWidth - MARGIN * 2;
  const cols = REPORT_COLUMNS.map((c) => ({ ...c, width: c.weight * tableWidth }));

  const headerRowHeight = 9;
  const bodyRowHeight = 9;
  const cellPad = 3;
  const footerY = pageHeight - MARGIN + 2;
  const contentBottom = footerY - 4;

  const generatedAt = fmt(new Date(), "dd/MM/yyyy 'às' HH:mm");

  // Cabeçalho institucional no topo de cada página.
  const drawLetterhead = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text("DIÁRIO — GESTÃO JURÍDICA PREVIDENCIÁRIA", MARGIN, MARGIN);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...NAVY);
    doc.text("Clientes cadastrados no mês", MARGIN, MARGIN + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    const ref = fmt(referenceDate, "MMMM 'de' yyyy");
    const refCap = ref.charAt(0).toUpperCase() + ref.slice(1);
    doc.text(`${refCap} · ${rows.length} cliente(s) cadastrado(s)`, MARGIN, MARGIN + 14);

    doc.setFontSize(8.5);
    doc.text(`Gerado em ${generatedAt}`, pageWidth - MARGIN, MARGIN, { align: "right" });

    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, MARGIN + 18, pageWidth - MARGIN, MARGIN + 18);
    doc.setLineWidth(0.2);

    return MARGIN + 25;
  };

  const drawTableHeader = (y) => {
    doc.setFillColor(...NAVY);
    doc.rect(MARGIN, y, tableWidth, headerRowHeight, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    let x = MARGIN;
    cols.forEach((col) => {
      doc.text(col.header, x + cellPad, y + headerRowHeight / 2 + 1.3);
      x += col.width;
    });
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    return y + headerRowHeight;
  };

  const drawFooter = (page, pageCount) => {
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, footerY - 4, pageWidth - MARGIN, footerY - 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      "Documento confidencial — contém dados sensíveis (CPF e senha gov.br). Uso interno do escritório.",
      MARGIN,
      footerY
    );
    doc.text(`Página ${page} de ${pageCount}`, pageWidth - MARGIN, footerY, { align: "right" });
    doc.setTextColor(0, 0, 0);
  };

  let y = drawLetterhead();
  const tableTop = y;
  y = drawTableHeader(y);

  doc.setFontSize(9);
  rows.forEach((c, i) => {
    if (y + bodyRowHeight > contentBottom) {
      doc.addPage();
      y = drawLetterhead();
      y = drawTableHeader(y);
    }
    if (i % 2 === 1) {
      doc.setFillColor(...ZEBRA);
      doc.rect(MARGIN, y, tableWidth, bodyRowHeight, "F");
    }
    let x = MARGIN;
    cols.forEach((col) => {
      const raw = c[col.key];
      const text = doc.splitTextToSize(String(raw && String(raw).trim() ? raw : "—"), col.width - cellPad * 2)[0] || "—";
      doc.text(text, x + cellPad, y + bodyRowHeight / 2 + 1.2);
      x += col.width;
    });
    x = MARGIN;
    cols.forEach((col) => {
      doc.setDrawColor(...BORDER);
      doc.line(x, y, x, y + bodyRowHeight);
      x += col.width;
    });
    doc.line(x, y, x, y + bodyRowHeight);
    y += bodyRowHeight;
  });

  // Moldura externa da tabela (bordas superior/inferior/laterais definidas).
  doc.setDrawColor(...BORDER);
  doc.rect(MARGIN, tableTop, tableWidth, y - tableTop);

  if (rows.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text("Nenhum cliente cadastrado neste mês.", MARGIN + cellPad, y + 8);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    drawFooter(p, pageCount);
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
