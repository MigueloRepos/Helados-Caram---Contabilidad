import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { DailyClosing } from '../types';
import { formatCurrency, formatNumber, formatDateFull } from '../lib/utils';

export const exportService = {
  /**
   * Export multiple closings to a clean, UTF-8 CSV with Excel BOM
   */
  exportToCSV(closings: DailyClosing[], filenamePrefix = 'helados_caram_auditoria') {
    if (!closings || closings.length === 0) return;

    const headers = [
      'Fecha',
      'Responsable',
      'Vasos Vendidos (u.)',
      'Total Ventas ($)',
      'Salario Trabajadores ($)',
      'Salario Mensajero ($)',
      'Otros Gastos ($)',
      'Total Gastos ($)',
      'Entregado a Frank ($)',
      'Balance ($)',
      'Balance Restante ($)',
      'Desglose Sabores',
      'Notas / Observaciones',
      'ID Registro',
    ];

    const rows = closings.map((c) => {
      const flavorsSummary = (c.flavors || [])
        .map((f) => `${f.flavor?.name || f.flavor_name || 'Sabor'}: ${f.quantity}u`)
        .join('; ');

      return [
        c.closing_date,
        `"${(c.profile?.full_name || 'Usuario').replace(/"/g, '""')}"`,
        c.total_cups,
        Number(c.total_sales || 0).toFixed(2),
        Number(c.workers_salary || 0).toFixed(2),
        Number(c.delivery_salary || 0).toFixed(2),
        Number(c.other_expenses || 0).toFixed(2),
        Number(c.total_expenses || 0).toFixed(2),
        Number(c.delivered_to_frank || 0).toFixed(2),
        Number(c.balance || 0).toFixed(2),
        Number(c.remaining_balance || 0).toFixed(2),
        `"${flavorsSummary.replace(/"/g, '""')}"`,
        `"${(c.notes || '').replace(/"/g, '""')}"`,
        c.id,
      ];
    });

    // Add Excel BOM (\uFEFF) so accents render perfectly in Excel
    const csvContent =
      '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Export multiple closings to a multi-sheet Microsoft Excel Workbook (.xlsx)
   */
  exportToExcel(closings: DailyClosing[], filenamePrefix = 'helados_caram_auditoria_completa') {
    if (!closings || closings.length === 0) return;

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Cierres Contables
    const closingsData = closings.map((c) => {
      const flavorsSummary = (c.flavors || [])
        .map((f) => `${f.flavor?.name || f.flavor_name || 'Sabor'}: ${f.quantity}u`)
        .join(', ');

      return {
        'Fecha': c.closing_date,
        'Responsable': c.profile?.full_name || 'Usuario',
        'Vasos Vendidos (u.)': c.total_cups,
        'Total Ventas ($)': Number(c.total_sales || 0),
        'Salario Trabajadores ($)': Number(c.workers_salary || 0),
        'Salario Mensajero ($)': Number(c.delivery_salary || 0),
        'Otros Gastos ($)': Number(c.other_expenses || 0),
        'Total Gastos ($)': Number(c.total_expenses || 0),
        'Entregado a Frank ($)': Number(c.delivered_to_frank || 0),
        'Balance Neto ($)': Number(c.balance || 0),
        'Balance Restante ($)': Number(c.remaining_balance || 0),
        'Resumen Sabores': flavorsSummary,
        'Notas': c.notes || '',
      };
    });

    const worksheetClosings = XLSX.utils.json_to_sheet(closingsData);
    XLSX.utils.book_append_sheet(workbook, worksheetClosings, 'Cierres Diarios');

    // Sheet 2: Desglose Detallado de Sabores
    const flavorsDetailData: any[] = [];
    closings.forEach((c) => {
      (c.flavors || []).forEach((f) => {
        flavorsDetailData.push({
          'Fecha Cierre': c.closing_date,
          'Responsable': c.profile?.full_name || 'Usuario',
          'Sabor': f.flavor?.name || f.flavor_name || 'Sabor',
          'Vasos Vendidos': f.quantity,
          'Porcentaje del Día': c.total_cups > 0 ? `${((f.quantity / c.total_cups) * 100).toFixed(1)}%` : '0%',
        });
      });
    });

    if (flavorsDetailData.length > 0) {
      const worksheetFlavors = XLSX.utils.json_to_sheet(flavorsDetailData);
      XLSX.utils.book_append_sheet(workbook, worksheetFlavors, 'Desglose Sabores');
    }

    // Sheet 3: Resumen Ejecutivo y Totales
    const totalSales = closings.reduce((sum, c) => sum + Number(c.total_sales || 0), 0);
    const totalExpenses = closings.reduce((sum, c) => sum + Number(c.total_expenses || 0), 0);
    const totalWorkers = closings.reduce((sum, c) => sum + Number(c.workers_salary || 0), 0);
    const totalDelivery = closings.reduce((sum, c) => sum + Number(c.delivery_salary || 0), 0);
    const totalOther = closings.reduce((sum, c) => sum + Number(c.other_expenses || 0), 0);
    const totalFrank = closings.reduce((sum, c) => sum + Number(c.delivered_to_frank || 0), 0);
    const totalBalance = totalSales - totalExpenses;
    const totalRemaining = totalBalance - totalFrank;
    const totalCups = closings.reduce((sum, c) => sum + Number(c.total_cups || 0), 0);

    const summaryData = [
      { 'Indicador / Métrica': 'Total de Días Registrados', 'Valor': closings.length },
      { 'Indicador / Métrica': 'Total Vasos Vendidos (u.)', 'Valor': totalCups },
      { 'Indicador / Métrica': 'Ingreso Total por Ventas ($)', 'Valor': totalSales },
      { 'Indicador / Métrica': 'Total Salarios Trabajadores ($)', 'Valor': totalWorkers },
      { 'Indicador / Métrica': 'Total Salario Mensajero ($)', 'Valor': totalDelivery },
      { 'Indicador / Métrica': 'Total Otros Gastos ($)', 'Valor': totalOther },
      { 'Indicador / Métrica': 'Total Gastos Operativos ($)', 'Valor': totalExpenses },
      { 'Indicador / Métrica': 'Total Entregado a Frank ($)', 'Valor': totalFrank },
      { 'Indicador / Métrica': 'Balance Neto Acumulado ($)', 'Valor': totalBalance },
      { 'Indicador / Métrica': 'Balance Restante en Caja ($)', 'Valor': totalRemaining },
      {
        'Indicador / Métrica': 'Margen de Ganancia Operativa (%)',
        'Valor': totalSales > 0 ? `${(((totalSales - totalExpenses) / totalSales) * 100).toFixed(2)}%` : '0%',
      },
    ];

    const worksheetSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, worksheetSummary, 'Resumen Contable');

    // Trigger download
    XLSX.writeFile(workbook, `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  /**
   * Generates and downloads an official, beautifully styled PDF Accounting Report for a selected Daily Closing
   */
  generateClosingPDF(closing: DailyClosing) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Header Banner & Branding
    doc.setFillColor(217, 119, 6); // Amber 600
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Brand Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('HELADOS CARAM', 14, 13);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('SISTEMA CONTABLE Y REPORTE DE AUDITORÍA DIARIA', 14, 20);

    // Voucher / Reference Number on right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const voucherText = `COMPROBANTE N° ${closing.closing_date.replace(/-/g, '')}`;
    doc.text(voucherText, pageWidth - 14, 13, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Fecha Emisión: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - 14, 20, { align: 'right' });

    let currentY = 36;

    // 2. Info Box: Closing General Metadata
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'FD');

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('FECHA DEL CIERRE:', 20, currentY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDateFull(closing.closing_date), 56, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('RESPONSABLE:', 20, currentY + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(closing.profile?.full_name || 'Personal Autorizado', 56, currentY + 15);

    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL VASOS:', pageWidth - 80, currentY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`${formatNumber(closing.total_cups)} vasos`, pageWidth - 45, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO CUADRE:', pageWidth - 80, currentY + 15);
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.text('CONCILIADO', pageWidth - 45, currentY + 15);

    currentY += 28;

    // 3. Financial Summary Table
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. RESUMEN FINANCIERO Y BALANCES', 14, currentY);
    currentY += 3;

    const financialRows = [
      ['Total Ventas Generadas (+)', `${formatNumber(closing.total_cups)} vasos vendidos`, formatCurrency(closing.total_sales)],
      ['Total Gastos Operativos (-)', 'Salarios, mensajería y compras', formatCurrency(closing.total_expenses)],
      ['Balance Neto del Día (=)', 'Total Ventas menos Gastos', formatCurrency(closing.balance)],
      ['Monto Entregado a Frank (-)', 'Retiro directo en efectivo', formatCurrency(closing.delivered_to_frank)],
      ['Balance Restante en Caja (=)', 'Fondo residual en caja', formatCurrency(closing.remaining_balance)],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Concepto Contable', 'Detalle / Descripción', 'Monto ($)']],
      body: financialRows,
      theme: 'grid',
      headStyles: {
        fillColor: [217, 119, 6],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 72 },
        2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // 4. Desglose de Sabores (Table on left/full width)
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. DESGLOSE DE VENTAS POR SABOR', 14, currentY);
    currentY += 3;

    const flavorsRows = (closing.flavors && closing.flavors.length > 0)
      ? closing.flavors.map((f) => [
          f.flavor?.name || f.flavor_name || 'Sabor',
          `${f.quantity} vasos`,
          closing.total_cups > 0 ? `${((f.quantity / closing.total_cups) * 100).toFixed(1)}%` : '0%',
        ])
      : [['Sin detalle específico de sabores', `${closing.total_cups} vasos`, '100%']];

    autoTable(doc, {
      startY: currentY,
      head: [['Sabor de Helado', 'Cantidad Vendida', 'Participación']],
      body: flavorsRows,
      theme: 'striped',
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 50, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 42, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // 5. Itemized Expenses
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. DESGLOSE DE GASTOS OPERATIVOS', 14, currentY);
    currentY += 3;

    const expensesRows = [
      ['Salario de Trabajadores', 'Pago de nómina / jornada diaria', formatCurrency(closing.workers_salary)],
      ['Salario de Mensajero', 'Despacho y logística de entrega', formatCurrency(closing.delivery_salary)],
      ['Otros Gastos Operativos', 'Insumos, hielo, compras menores', formatCurrency(closing.other_expenses)],
      ['TOTAL GASTOS DEL DÍA', 'Suma de egresos operativos', formatCurrency(closing.total_expenses)],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Categoría de Gasto', 'Descripción', 'Total']],
      body: expensesRows,
      theme: 'plain',
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [51, 65, 85],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.2,
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 72 },
        2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // 6. Notes section (if exists)
    if (closing.notes && closing.notes.trim()) {
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('OBSERVACIONES Y NOTAS DE AUDITORÍA:', 14, currentY);
      currentY += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const splitNotes = doc.splitTextToSize(closing.notes, pageWidth - 28);
      doc.text(splitNotes, 14, currentY);
      currentY += splitNotes.length * 4 + 6;
    }

    // Ensure we have enough space for signature block, or move to next page
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 25;
    }

    // 7. Signature / Verification Block
    currentY = Math.max(currentY + 6, pageHeight - 40);

    doc.setDrawColor(148, 163, 184);
    doc.line(20, currentY, 80, currentY);
    doc.line(pageWidth - 80, currentY, pageWidth - 20, currentY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('FIRMA RESPONSABLE DE CAJA', 50, currentY + 4, { align: 'center' });
    doc.text('FIRMA FRANK / ADMINISTRACIÓN', pageWidth - 50, currentY + 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Documento generado electrónicamente por Sistema Helados Caram • ID: ${closing.id} • ${new Date().toISOString()}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );

    // Save PDF
    doc.save(`Helados_Caram_Cierre_${closing.closing_date}.pdf`);
  },
};
