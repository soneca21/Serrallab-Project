import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '@/lib/customSupabaseClient';
import { formatCurrencyBR, getPdfFileName } from '@/lib/pdf';

const COLORS = {
  accent: '#F97316',
  lightGray: '#F3F4F6',
  darkText: '#1E293B',
  grayText: '#6B7280',
  white: '#FFFFFF',
  border: '#E5E7EB',
};

const PAGE = {
  width: 210,
  height: 297,
  marginX: 15,
  marginTop: 20,
};

const hexToRgb = (hex) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

const setFillHex = (doc, hex) => {
  doc.setFillColor(...hexToRgb(hex));
};

const setTextHex = (doc, hex) => {
  doc.setTextColor(...hexToRgb(hex));
};

const setDrawHex = (doc, hex) => {
  doc.setDrawColor(...hexToRgb(hex));
};

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('pt-BR');
};

const safeText = (value) => (value == null ? '' : String(value));

const loadImageAsDataUrl = async (url) => {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return null;
  }
};

const normalizeCost = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const setupFonts = (doc) => {
  doc.setFont('Helvetica', 'normal');
  setTextHex(doc, COLORS.darkText);
};

const getStatusStyles = (status) => {
  const normalized = safeText(status).toLowerCase();
  if (normalized.includes('aprov')) return { bg: '#DCFCE7', text: '#166534' };
  if (normalized.includes('rejeit') || normalized.includes('cancel')) return { bg: '#FEE2E2', text: '#991B1B' };
  if (normalized.includes('enviado')) return { bg: '#DBEAFE', text: '#1D4ED8' };
  return { bg: '#FFEDD5', text: '#C2410C' };
};

const drawStatusBadge = (doc, status, x, y) => {
  const label = safeText(status || 'Rascunho').toUpperCase();
  const { bg, text } = getStatusStyles(label);
  const paddingX = 6;
  const textWidth = doc.getTextWidth(label);
  const pillWidth = textWidth + paddingX * 2;
  const pillHeight = 6.5;
  setDrawHex(doc, bg);
  setFillHex(doc, bg);
  doc.roundedRect(x - pillWidth, y - pillHeight + 1.5, pillWidth, pillHeight, 3.5, 3.5, 'F');
  setTextHex(doc, text);
  doc.setFontSize(8.5);
  doc.text(label, x - paddingX, y, { align: 'right' });
};

const drawHeader = (doc, data) => {
  setFillHex(doc, COLORS.accent);
  doc.rect(0, 0, PAGE.width, 36, 'F');

  if (data.logo) {
    doc.addImage(data.logo, 'PNG', PAGE.marginX, 8, 26, 20);
  }

  setTextHex(doc, COLORS.white);
  doc.setFontSize(11);
  doc.text(safeText(data.companyName), 46, 14);
  doc.setFontSize(9);
  doc.text(safeText(data.companyAddress), 46, 19);
  doc.text(safeText(data.companyTaxId), 46, 24);
  doc.text(safeText(data.companyPhones), 46, 29);
  doc.text(safeText(data.companyEmail), 46, 34);

  doc.setFontSize(10);
  doc.text(`ORCAMENTO No ${data.budgetNumber}`, PAGE.width - PAGE.marginX, 14, { align: 'right' });
  doc.text(`Data: ${formatDate(data.createdAt)}`, PAGE.width - PAGE.marginX, 20, { align: 'right' });
  drawStatusBadge(doc, data.status, PAGE.width - PAGE.marginX, 28);

  setDrawHex(doc, COLORS.border);
  doc.line(PAGE.marginX, 40, PAGE.width - PAGE.marginX, 40);
};

const drawCard = (doc, x, y, w, h, title, lines) => {
  setFillHex(doc, COLORS.lightGray);
  doc.rect(x, y, w, h, 'F');

  setTextHex(doc, COLORS.darkText);
  doc.setFontSize(11);
  doc.text(title, x + 4, y + 7);

  setTextHex(doc, COLORS.grayText);
  doc.setFontSize(9);
  lines.forEach((line, i) => {
    doc.text(line, x + 4, y + 14 + i * 6);
  });
};

const drawClientAndProjectCards = (doc, data) => {
  const y = 50;
  const cardWidth = 85;
  const cardHeight = 35;

  drawCard(doc, PAGE.marginX, y, cardWidth, cardHeight, 'Cliente', [
    `Nome: ${safeText(data.clientName)}`,
    `Email: ${safeText(data.clientEmail)}`,
    `Telefone: ${safeText(data.clientPhone)}`,
  ]);

  const projectDescription = safeText(data.projectDescription);
  const projectDescLines = doc.splitTextToSize(projectDescription, cardWidth - 8).slice(0, 2);
  const projectLines = [
    `Titulo: ${safeText(data.projectTitle)}`,
    ...projectDescLines,
    `Atualizado: ${formatDate(data.updatedAt)}`,
  ];

  drawCard(doc, PAGE.marginX + cardWidth + 5, y, cardWidth, cardHeight, 'Projeto', projectLines);

  return y + cardHeight + 10;
};

const drawItemsTable = (doc, data, startY) => {
  const items = Array.isArray(data.items) ? data.items : [];
  const rows = items.length
    ? items.map((item) => {
        const quantity = Number(item.quantity || 0);
        const unitCost = Number(item.cost || 0);
        return [
          safeText(item.name || 'Item'),
          safeText(item.unit || '-'),
          quantity,
          formatCurrencyBR(unitCost),
          formatCurrencyBR(quantity * unitCost),
        ];
      })
    : [['Nenhum item informado', '-', '-', '-', '-']];

  doc.autoTable({
    startY,
    head: [['Descricao', 'Un.', 'Qtd', 'Valor', 'Total']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: hexToRgb(COLORS.lightGray),
      textColor: hexToRgb(COLORS.grayText),
      fontStyle: 'bold',
      lineColor: hexToRgb(COLORS.border),
    },
    alternateRowStyles: {
      fillColor: hexToRgb('#FAFAFB'),
    },
    styles: {
      fontSize: 9,
      textColor: hexToRgb(COLORS.darkText),
      lineColor: hexToRgb(COLORS.border),
      lineWidth: 0.3,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 20 },
      2: { cellWidth: 15, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: PAGE.marginX, right: PAGE.marginX },
  });

  return doc.lastAutoTable?.finalY || startY + 20;
};

const drawFinancialSummary = (doc, data, startY) => {
  const rows = [
    ['Materiais', data.materialsSubtotal],
    ['Mao de obra', data.laborCost],
    ['Pintura', data.paintingCost],
    ['Transporte', data.transportCost],
    ['Outros', data.otherCosts],
  ].filter((row) => Number(row[1] || 0) > 0);

  const summaryY = Math.min(startY + 10, PAGE.height - 70);

  doc.setFontSize(10);
  setTextHex(doc, COLORS.darkText);
  if (rows.length) {
    rows.forEach((row, i) => {
      doc.text(row[0], 120, summaryY + i * 6);
      doc.text(formatCurrencyBR(row[1]), 195, summaryY + i * 6, { align: 'right' });
    });
  } else {
    setTextHex(doc, COLORS.grayText);
    doc.setFontSize(9);
    doc.text('Sem custos adicionais', 120, summaryY + 6);
    setTextHex(doc, COLORS.darkText);
  }

  setFillHex(doc, COLORS.accent);
  doc.rect(110, summaryY + 35, 85, 15, 'F');

  setTextHex(doc, COLORS.white);
  doc.setFontSize(12);
  doc.text('TOTAL DO ORCAMENTO', 152, summaryY + 41, { align: 'center' });
  doc.setFontSize(14);
  doc.text(formatCurrencyBR(data.finalPrice), 152, summaryY + 48, { align: 'center' });

  setTextHex(doc, COLORS.darkText);

  return summaryY + 55;
};

const drawFooter = (doc, data) => {
  const y = PAGE.height - 15;
  setDrawHex(doc, COLORS.border);
  doc.line(PAGE.marginX, y - 5, PAGE.width - PAGE.marginX, y - 5);

  doc.setFontSize(8);
  setTextHex(doc, COLORS.grayText);
  doc.text(`Suporte: ${safeText(data.supportEmail)}`, PAGE.marginX, y);
  doc.text(`Atualizado em: ${formatDate(data.updatedAt)}`, PAGE.width - PAGE.marginX, y, { align: 'right' });
};

export const createOrcamentoPdf = async ({ orcamento, client, profile }) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  setupFonts(doc);

  const logoUrl = profile?.logo_url || '';
  const logoDataUrl = await loadImageAsDataUrl(logoUrl);
  const itemsSubtotal = (orcamento.items || []).reduce((total, item) => {
    const qty = normalizeCost(item?.quantity || 0);
    const cost = normalizeCost(item?.cost || 0);
    return total + (qty * cost);
  }, 0);

  const data = {
    logo: logoDataUrl,
    companyName: profile?.company_name || 'Serrallab',
    companyAddress: profile?.company_address || '',
    companyTaxId: profile?.company_tax_id || '',
    companyPhones: [profile?.company_phone, profile?.company_whatsapp].filter(Boolean).join(' | '),
    companyEmail: profile?.company_email || profile?.email || '',
    supportEmail: profile?.company_support_email || profile?.company_email || profile?.email || 'contato@serrallab.com',
    budgetNumber: safeText((orcamento.id || '').slice(0, 8)),
    status: orcamento.status || 'Rascunho',
    createdAt: orcamento.created_at,
    updatedAt: orcamento.updated_at || orcamento.created_at,
    clientName: client?.name || 'Cliente',
    clientEmail: client?.email || '',
    clientPhone: client?.phone || '',
    projectTitle: orcamento.title || 'Orcamento',
    projectDescription: orcamento.description || '',
    items: orcamento.items || [],
    materialsSubtotal: itemsSubtotal,
    laborCost: normalizeCost(orcamento.labor_cost || 0),
    paintingCost: normalizeCost(orcamento.painting_cost || 0),
    transportCost: normalizeCost(orcamento.transport_cost || 0),
    otherCosts: normalizeCost(orcamento.other_costs || 0),
    finalPrice: normalizeCost(orcamento.final_price || 0),
  };

  drawHeader(doc, data);
  const tableStartY = drawClientAndProjectCards(doc, data);
  const afterTable = drawItemsTable(doc, data, tableStartY + 6);
  drawFinancialSummary(doc, data, afterTable + 6);
  drawFooter(doc, data);

  return doc;
};

export async function generatePdf(orcamento_id) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*, clients(*)')
    .eq('id', orcamento_id)
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message || 'Erro ao carregar orcamento.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_name, company_phone, company_email, company_whatsapp, company_address, company_tax_id, company_website, company_support_email, logo_url, email')
    .eq('id', order.user_id)
    .single();

  const doc = await createOrcamentoPdf({
    orcamento: order,
    client: order.clients,
    profile: profile || {},
  });

  const blob = doc.output('blob');
  const pdf_url = URL.createObjectURL(blob);
  return { pdf_url };
}

export async function downloadPdf(orcamento_id, fileName) {
  const { pdf_url } = await generatePdf(orcamento_id);
  const link = document.createElement('a');
  link.href = pdf_url;
  link.download = fileName || getPdfFileName(orcamento_id.slice(0, 8));
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(pdf_url), 1000);
}
