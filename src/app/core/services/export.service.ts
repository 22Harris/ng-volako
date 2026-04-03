import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SettingsService } from './settings.service';
import { environment } from '../../../environments/environment';
import type { BalanceLine, GrandLivreResponse } from './rapports.service';
import type { Ca3Report } from './tva.service';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly api = `${environment.apiUrl}/rapports`;

  private readonly settings = inject(SettingsService);

  constructor(private readonly http: HttpClient) {}

  // ─── CSV helper ───────────────────────────────────────────────────────────

  private downloadCsv(filename: string, rows: (string | number)[][]): void {
    const BOM = '\uFEFF';
    const csv = BOM + rows.map((r) => r.map((c) => `"${String(c).replaceAll(/"/g, '""')}"`).join(';')).join('\n');
    this._triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename);
  }

  private _triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── FEC ──────────────────────────────────────────────────────────────────

  downloadFec(dateFrom?: string, dateTo?: string): void {
    const params: Record<string, string> = {};
    if (dateFrom) params['dateFrom'] = dateFrom;
    if (dateTo) params['dateTo'] = dateTo;

    this.http
      .get(`${this.api}/fec`, { params, responseType: 'blob' })
      .subscribe((blob) => {
        const today = new Date().toISOString().split('T')[0].replaceAll('-', '');
        this._triggerDownload(blob, `FEC_${today}.txt`);
      });
  }

  // ─── Balance ──────────────────────────────────────────────────────────────

  csvBalance(lines: BalanceLine[]): void {
    const fmtEur = (c: number) => (c / 100).toFixed(2);
    const header = ['Code', 'Intitulé', 'Cl.', 'Mouv. Débit', 'Mouv. Crédit', 'Solde Débiteur', 'Solde Créditeur'];
    const rows = lines.map((l) => {
      const solde = l.totalDebit - l.totalCredit;
      return [
        l.code,
        l.name,
        l.account_class,
        fmtEur(l.totalDebit),
        fmtEur(l.totalCredit),
        solde > 0 ? fmtEur(solde) : '0.00',
        solde < 0 ? fmtEur(-solde) : '0.00',
      ];
    });
    this.downloadCsv('balance.csv', [header, ...rows]);
  }

  async excelBalance(lines: BalanceLine[]): Promise<void> {
    const { utils, writeFile } = await import('xlsx');
    const fmtEur = (c: number) => Number.parseFloat((c / 100).toFixed(2));
    const ws = utils.aoa_to_sheet([
      ['Code', 'Intitulé', 'Cl.', 'Mouv. Débit', 'Mouv. Crédit', 'Solde Débiteur', 'Solde Créditeur'],
      ...lines.map((l) => {
        const solde = l.totalDebit - l.totalCredit;
        return [
          l.code,
          l.name,
          l.account_class,
          fmtEur(l.totalDebit),
          fmtEur(l.totalCredit),
          solde > 0 ? fmtEur(solde) : 0,
          solde < 0 ? fmtEur(-solde) : 0,
        ];
      }),
    ]);
    ws['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Balance');
    writeFile(wb, 'balance.xlsx');
  }

  async pdfBalance(lines: BalanceLine[], totals: { totalDebit: number; totalCredit: number; soldesD: number; soldesC: number }): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const sym = this.settings.currencySymbol();
    const fmtEur = (c: number) => (c / 100).toFixed(2) + ' ' + sym;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text('Balance générale des comptes', 14, 18);
    doc.setFontSize(10);
    doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')}`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [['Code', 'Intitulé', 'Cl.', 'Mouv. Débit', 'Mouv. Crédit', 'Solde Débiteur', 'Solde Créditeur']],
      body: lines.map((l) => {
        const solde = l.totalDebit - l.totalCredit;
        return [
          l.code,
          l.name,
          l.account_class,
          fmtEur(l.totalDebit),
          fmtEur(l.totalCredit),
          solde > 0 ? fmtEur(solde) : '—',
          solde < 0 ? fmtEur(-solde) : '—',
        ];
      }),
      foot: [['', 'TOTAL GÉNÉRAL', '', fmtEur(totals.totalDebit), fmtEur(totals.totalCredit), fmtEur(totals.soldesD), fmtEur(totals.soldesC)]],
      headStyles: { fillColor: [30, 80, 162], fontSize: 8 },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 70 },
        2: { cellWidth: 10, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' },
        6: { cellWidth: 30, halign: 'right' },
      },
      showFoot: 'lastPage',
    });

    doc.save('balance.pdf');
  }

  // ─── Grand Livre ──────────────────────────────────────────────────────────

  csvGrandLivre(gl: GrandLivreResponse): void {
    const fmtEur = (c: number) => (c / 100).toFixed(2);
    const header = ['Date', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Solde Cumulé', 'Lettrage'];
    const rows = gl.lines.map((l) => [
      new Date(l.date).toLocaleDateString('fr-FR'),
      l.pieceNumber ?? '',
      l.label,
      fmtEur(l.debit),
      fmtEur(l.credit),
      fmtEur(l.soldeCumul),
      l.lettre ?? '',
    ]);
    const filename = `grand-livre-${gl.account.code}.csv`;
    this.downloadCsv(filename, [header, ...rows]);
  }

  async excelGrandLivre(gl: GrandLivreResponse): Promise<void> {
    const { utils, writeFile } = await import('xlsx');
    const fmtEur = (c: number) => Number.parseFloat((c / 100).toFixed(2));
    const ws = utils.aoa_to_sheet([
      [`Compte : ${gl.account.code} – ${gl.account.name}`],
      [],
      ['Date', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Solde Cumulé', 'Lettrage'],
      ...gl.lines.map((l) => [
        new Date(l.date).toLocaleDateString('fr-FR'),
        l.pieceNumber ?? '',
        l.label,
        fmtEur(l.debit),
        fmtEur(l.credit),
        fmtEur(l.soldeCumul),
        l.lettre ?? '',
      ]),
    ]);
    ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 45 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, gl.account.code);
    writeFile(wb, `grand-livre-${gl.account.code}.xlsx`);
  }

  async pdfGrandLivre(gl: GrandLivreResponse): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const sym = this.settings.currencySymbol();
    const fmtEur = (c: number) => (c / 100).toFixed(2) + ' ' + sym;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text(`Grand livre — ${gl.account.code} ${gl.account.name}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')}`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [['Date', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Solde cumulé', 'Lettrage']],
      body: gl.lines.map((l) => [
        new Date(l.date).toLocaleDateString('fr-FR'),
        l.pieceNumber ?? '',
        l.label,
        l.debit > 0 ? fmtEur(l.debit) : '—',
        l.credit > 0 ? fmtEur(l.credit) : '—',
        fmtEur(l.soldeCumul),
        l.lettre ?? '',
      ]),
      foot: [['', '', 'TOTAUX', fmtEur(gl.totalDebit), fmtEur(gl.totalCredit), '', '']],
      headStyles: { fillColor: [30, 80, 162], fontSize: 8 },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 20 },
        2: { cellWidth: 90 },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 28, halign: 'right' },
        6: { cellWidth: 16, halign: 'center' },
      },
      showFoot: 'lastPage',
    });

    doc.save(`grand-livre-${gl.account.code}.pdf`);
  }

  // ─── TVA CA3 ──────────────────────────────────────────────────────────────

  async pdfTva(rapport: Ca3Report, dateFrom: string, dateTo: string): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const sym = this.settings.currencySymbol();
    const fmtEur = (v: number) => v.toFixed(2) + ' ' + sym;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFontSize(18);
    doc.text('Déclaration TVA — Formulaire CA3', 14, 20);
    doc.setFontSize(10);
    doc.text(`Période : du ${dateFrom} au ${dateTo}`, 14, 28);
    doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')}`, 14, 34);

    // TVA collectée
    doc.setFontSize(12);
    doc.text('TVA collectée', 14, 46);
    autoTable(doc, {
      startY: 50,
      head: [['Régime', 'Taux', 'Base HT', 'TVA brute']],
      body: rapport.tvaCollectee.lignes.map((l) => [l.label, `${l.taux} %`, fmtEur(l.baseHt), fmtEur(l.tvaBrute)]),
      foot: [['Total', '', fmtEur(rapport.tvaCollectee.totalBaseHt), fmtEur(rapport.tvaCollectee.totalTva)]],
      headStyles: { fillColor: [230, 81, 0], fontSize: 9 },
      footStyles: { fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
      showFoot: 'lastPage',
    });

    const afterCollectee = (doc as any).lastAutoTable.finalY + 10;

    // TVA déductible
    doc.setFontSize(12);
    doc.text('TVA déductible', 14, afterCollectee);
    autoTable(doc, {
      startY: afterCollectee + 4,
      head: [['Nature', 'Compte', 'Montant']],
      body: [
        ['Sur immobilisations', '44562', fmtEur(rapport.tvaDeductible.surImmobilisations)],
        ['Autres biens et services', '44566', fmtEur(rapport.tvaDeductible.surAutresBiensServices)],
      ],
      foot: [['Total déductible', '', fmtEur(rapport.tvaDeductible.total)]],
      headStyles: { fillColor: [46, 125, 50], fontSize: 9 },
      footStyles: { fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 2: { halign: 'right' } },
      showFoot: 'lastPage',
    });

    const afterDeductible = (doc as any).lastAutoTable.finalY + 12;

    // Résultat
    doc.setFontSize(12);
    doc.text('Résultat net', 14, afterDeductible);
    autoTable(doc, {
      startY: afterDeductible + 4,
      body: [
        ['TVA collectée (44571)', fmtEur(rapport.tvaCollectee.totalTva)],
        ['TVA déductible (44562 + 44566)', `- ${fmtEur(rapport.tvaDeductible.total)}`],
        [rapport.tvaAPayer > 0 ? 'TVA nette à payer' : 'Crédit de TVA à reporter',
          fmtEur(rapport.tvaAPayer > 0 ? rapport.tvaAPayer : rapport.creditTva)],
      ],
      bodyStyles: { fontSize: 10 },
      columnStyles: { 0: { cellWidth: 120 }, 1: { halign: 'right', fontStyle: 'bold' } },
    });

    doc.save(`TVA_CA3_${dateFrom}_${dateTo}.pdf`);
  }

  // ─── Listes génériques ────────────────────────────────────────────────────

  csvAccounts(accounts: { code: string; name: string; class: number }[]): void {
    const header = ['Code', 'Intitulé', 'Classe'];
    const rows = accounts.map((a) => [a.code, a.name, a.class]);
    this.downloadCsv('comptes.csv', [header, ...rows]);
  }

  csvOperations(operations: { date: string; type: string; label: string; amount: number }[]): void {
    const sym = this.settings.currencySymbol();
    const header = ['Date', 'Type', 'Libellé', `Montant (${sym})`];
    const rows = operations.map((o) => [
      new Date(o.date).toLocaleDateString('fr-FR'),
      o.type,
      o.label,
      (o.amount / 100).toFixed(2),
    ]);
    this.downloadCsv('operations.csv', [header, ...rows]);
  }

  async excelOperations(operations: { date: string; typeLabel: string; label: string; amount: number }[]): Promise<void> {
    const { utils, writeFile } = await import('xlsx');
    const sym = this.settings.currencySymbol();
    const ws = utils.aoa_to_sheet([
      ['Date', 'Type', 'Libellé', `Montant (${sym})`],
      ...operations.map((o) => [
        new Date(o.date).toLocaleDateString('fr-FR'),
        o.typeLabel,
        o.label,
        Number.parseFloat((o.amount / 100).toFixed(2)),
      ]),
    ]);
    ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 55 }, { wch: 15 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Opérations');
    writeFile(wb, 'operations.xlsx');
  }

  async pdfOperations(operations: { date: string; typeLabel: string; label: string; amount: number }[]): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const sym = this.settings.currencySymbol();
    const fmtEur = (c: number) => (c / 100).toFixed(2) + ' ' + sym;
    const total = operations.reduce((s, o) => s + o.amount, 0);

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text('Liste des opérations', 14, 18);
    doc.setFontSize(10);
    doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')} — ${operations.length} opération(s)`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [['Date', 'Type', 'Libellé', 'Montant']],
      body: operations.map((o) => [
        new Date(o.date).toLocaleDateString('fr-FR'),
        o.typeLabel,
        o.label,
        fmtEur(o.amount),
      ]),
      foot: [['', '', 'TOTAL', fmtEur(total)]],
      headStyles: { fillColor: [30, 80, 162], fontSize: 8 },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 55 },
        2: { cellWidth: 120 },
        3: { cellWidth: 35, halign: 'right' },
      },
      showFoot: 'lastPage',
    });

    doc.save('operations.pdf');
  }

  // ─── Comptes (Excel + PDF) ────────────────────────────────────────────────

  async excelAccounts(accounts: { code: string; name: string; class: number; balance: number }[]): Promise<void> {
    const { utils, writeFile } = await import('xlsx');
    const ws = utils.aoa_to_sheet([
      ['Code', 'Intitulé', 'Classe', `Solde (${this.settings.currencySymbol()})`],
      ...accounts.map((a) => [a.code, a.name, a.class, Number.parseFloat((a.balance / 100).toFixed(2))]),
    ]);
    ws['!cols'] = [{ wch: 12 }, { wch: 55 }, { wch: 8 }, { wch: 15 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Comptes');
    writeFile(wb, 'comptes.xlsx');
  }

  async pdfAccounts(accounts: { code: string; name: string; class: number; balance: number }[]): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const sym = this.settings.currencySymbol();
    const fmtEur = (c: number) => (c / 100).toFixed(2) + ' ' + sym;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text('Plan comptable', 14, 18);
    doc.setFontSize(10);
    doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')} — ${accounts.length} compte(s)`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [['Code', 'Intitulé', 'Cl.', 'Solde']],
      body: accounts.map((a) => [a.code, a.name, a.class, fmtEur(a.balance)]),
      headStyles: { fillColor: [30, 80, 162], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 130 },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 35, halign: 'right' },
      },
    });

    doc.save('comptes.pdf');
  }

  // ─── Budget ───────────────────────────────────────────────────────────────

  private _budgetRowsFormatted(
    rows: { libelle: string; categorie: string; type: string; montantPrevu: number; montantReel: number; ecart: number }[],
  ): (string | number)[][] {
    const fmt = (c: number) => (c / 100).toFixed(2);
    return rows.map((r) => [r.libelle, r.categorie, r.type === 'PRODUIT' ? 'Produit' : 'Charge', fmt(r.montantPrevu), fmt(r.montantReel), fmt(r.ecart)]);
  }

  csvBudget(
    rows: { libelle: string; categorie: string; type: string; montantPrevu: number; montantReel: number; ecart: number }[],
    moisLabel: string,
  ): void {
    const sym = this.settings.currencySymbol();
    const header = ['Libellé', 'Catégorie', 'Type', `Prévu (${sym})`, `Réel (${sym})`, `Écart (${sym})`];
    this.downloadCsv(`budget-${moisLabel.replaceAll(/\s/g, '-')}.csv`, [header, ...this._budgetRowsFormatted(rows)]);
  }

  async excelBudget(
    rows: { libelle: string; categorie: string; type: string; montantPrevu: number; montantReel: number; ecart: number }[],
    moisLabel: string,
  ): Promise<void> {
    const { utils, writeFile } = await import('xlsx');
    const fmt = (c: number) => Number.parseFloat((c / 100).toFixed(2));
    const sym = this.settings.currencySymbol();
    const hdr = ['Libellé', 'Catégorie', `Prévu (${sym})`, `Réel (${sym})`, `Écart (${sym})`];
    const toRow = (r: typeof rows[0]) => [r.libelle, r.categorie, fmt(r.montantPrevu), fmt(r.montantReel), fmt(r.ecart)];
    const ws = utils.aoa_to_sheet([
      [moisLabel],
      [],
      ['── PRODUITS ──'],
      hdr,
      ...rows.filter((r) => r.type === 'PRODUIT').map(toRow),
      [],
      ['── CHARGES ──'],
      hdr,
      ...rows.filter((r) => r.type === 'CHARGE').map(toRow),
    ]);
    ws['!cols'] = [{ wch: 45 }, { wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Budget');
    writeFile(wb, `budget-${moisLabel.replaceAll(/\s/g, '-')}.xlsx`);
  }

  async pdfBudget(
    rows: { libelle: string; categorie: string; type: string; montantPrevu: number; montantReel: number; ecart: number }[],
    moisLabel: string,
    totals: { prevuProduits: number; prevuCharges: number; reelProduits: number; reelCharges: number },
  ): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const sym = this.settings.currencySymbol();
    const fmtEur = (c: number) => (c / 100).toFixed(2) + ' ' + sym;
    const cols = {
      0: { cellWidth: 65 }, 1: { cellWidth: 35 },
      2: { cellWidth: 28, halign: 'right' as const },
      3: { cellWidth: 28, halign: 'right' as const },
      4: { cellWidth: 28, halign: 'right' as const },
    };

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text(`Budget prévisionnel — ${moisLabel}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')}`, 14, 25);

    doc.setFontSize(12);
    doc.text('Produits', 14, 35);
    autoTable(doc, {
      startY: 39,
      head: [['Libellé', 'Catégorie', 'Prévu', 'Réel', 'Écart']],
      body: rows.filter((r) => r.type === 'PRODUIT').map((r) => [r.libelle, r.categorie, fmtEur(r.montantPrevu), fmtEur(r.montantReel), fmtEur(r.ecart)]),
      foot: [['Total Produits', '', fmtEur(totals.prevuProduits), fmtEur(totals.reelProduits), fmtEur(totals.reelProduits - totals.prevuProduits)]],
      headStyles: { fillColor: [46, 125, 50], fontSize: 8 },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: cols,
      showFoot: 'lastPage',
    });

    const y2 = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(12);
    doc.text('Charges', 14, y2);
    autoTable(doc, {
      startY: y2 + 4,
      head: [['Libellé', 'Catégorie', 'Prévu', 'Réel', 'Écart']],
      body: rows.filter((r) => r.type === 'CHARGE').map((r) => [r.libelle, r.categorie, fmtEur(r.montantPrevu), fmtEur(r.montantReel), fmtEur(r.ecart)]),
      foot: [['Total Charges', '', fmtEur(totals.prevuCharges), fmtEur(totals.reelCharges), fmtEur(totals.reelCharges - totals.prevuCharges)]],
      headStyles: { fillColor: [198, 40, 40], fontSize: 8 },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: cols,
      showFoot: 'lastPage',
    });

    const y3 = (doc as any).lastAutoTable.finalY + 12;
    autoTable(doc, {
      startY: y3,
      body: [
        ['Résultat prévu', fmtEur(totals.prevuProduits - totals.prevuCharges)],
        ['Résultat réel',  fmtEur(totals.reelProduits  - totals.reelCharges)],
      ],
      bodyStyles: { fontSize: 10, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 80 }, 1: { halign: 'right', cellWidth: 40 } },
    });

    doc.save(`budget-${moisLabel.replaceAll(/\s/g, '-')}.pdf`);
  }

  // ─── Événements ──────────────────────────────────────────────────────────

  csvEvenements(rows: { titre: string; categorie: string; montant: number; dateEcheance: string; recurrence: string; statut: string }[]): void {
    const sym = this.settings.currencySymbol();
    const header = ['Titre', 'Catégorie', `Montant (${sym})`, 'Échéance', 'Récurrence', 'Statut'];
    const data = rows.map((r) => [
      r.titre, r.categorie, (r.montant / 100).toFixed(2),
      new Date(r.dateEcheance).toLocaleDateString('fr-FR'), r.recurrence, r.statut,
    ]);
    this.downloadCsv('evenements.csv', [header, ...data]);
  }

  async excelEvenements(rows: { titre: string; categorie: string; montant: number; dateEcheance: string; recurrence: string; statut: string }[]): Promise<void> {
    const { utils, writeFile } = await import('xlsx');
    const ws = utils.aoa_to_sheet([
      ['Titre', 'Catégorie', `Montant (${this.settings.currencySymbol()})`, 'Échéance', 'Récurrence', 'Statut'],
      ...rows.map((r) => [
        r.titre, r.categorie, Number.parseFloat((r.montant / 100).toFixed(2)),
        new Date(r.dateEcheance).toLocaleDateString('fr-FR'), r.recurrence, r.statut,
      ]),
    ]);
    ws['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 14 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Événements');
    writeFile(wb, 'evenements.xlsx');
  }

  async pdfEvenements(rows: { titre: string; categorie: string; montant: number; dateEcheance: string; recurrence: string; statut: string }[]): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const sym = this.settings.currencySymbol();
    const fmtEur = (c: number) => (c / 100).toFixed(2) + ' ' + sym;
    const total = rows.reduce((s, r) => s + r.montant, 0);

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text('Événements récurrents', 14, 18);
    doc.setFontSize(10);
    doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')} — ${rows.length} événement(s)`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [['Titre', 'Catégorie', 'Montant', 'Échéance', 'Récurrence', 'Statut']],
      body: rows.map((r) => [r.titre, r.categorie, fmtEur(r.montant), new Date(r.dateEcheance).toLocaleDateString('fr-FR'), r.recurrence, r.statut]),
      foot: [['TOTAL', '', fmtEur(total), '', '', '']],
      headStyles: { fillColor: [30, 80, 162], fontSize: 8 },
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 65 },
        1: { cellWidth: 35 },
        2: { cellWidth: 28, halign: 'right' },
        3: { cellWidth: 25 },
        4: { cellWidth: 32 },
        5: { cellWidth: 28 },
      },
      showFoot: 'lastPage',
    });

    doc.save('evenements.pdf');
  }

  // ─── Objectifs ────────────────────────────────────────────────────────────

  csvObjectifs(rows: { nom: string; categorie: string; montantActuel: number; montantCible: number; progression: number; dateEcheance: string; statut: string }[]): void {
    const sym = this.settings.currencySymbol();
    const header = ['Nom', 'Catégorie', `Épargné (${sym})`, `Cible (${sym})`, 'Progression (%)', 'Échéance', 'Statut'];
    const data = rows.map((r) => [
      r.nom, r.categorie, (r.montantActuel / 100).toFixed(2), (r.montantCible / 100).toFixed(2),
      r.progression, new Date(r.dateEcheance).toLocaleDateString('fr-FR'), r.statut,
    ]);
    this.downloadCsv('objectifs.csv', [header, ...data]);
  }

  async excelObjectifs(rows: { nom: string; categorie: string; montantActuel: number; montantCible: number; progression: number; dateEcheance: string; statut: string }[]): Promise<void> {
    const { utils, writeFile } = await import('xlsx');
    const ws = utils.aoa_to_sheet([
      ['Nom', 'Catégorie', `Épargné (${this.settings.currencySymbol()})`, `Cible (${this.settings.currencySymbol()})`, 'Progression (%)', 'Échéance', 'Statut'],
      ...rows.map((r) => [
        r.nom, r.categorie,
        Number.parseFloat((r.montantActuel / 100).toFixed(2)),
        Number.parseFloat((r.montantCible  / 100).toFixed(2)),
        r.progression, new Date(r.dateEcheance).toLocaleDateString('fr-FR'), r.statut,
      ]),
    ]);
    ws['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Objectifs');
    writeFile(wb, 'objectifs.xlsx');
  }

  async pdfObjectifs(rows: { nom: string; categorie: string; montantActuel: number; montantCible: number; progression: number; dateEcheance: string; statut: string }[]): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const sym = this.settings.currencySymbol();
    const fmtEur = (c: number) => (c / 100).toFixed(2) + ' ' + sym;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text("Objectifs d'épargne", 14, 18);
    doc.setFontSize(10);
    doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')} — ${rows.length} objectif(s)`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [['Nom', 'Catégorie', 'Épargné', 'Cible', 'Progression', 'Échéance', 'Statut']],
      body: rows.map((r) => [
        r.nom, r.categorie, fmtEur(r.montantActuel), fmtEur(r.montantCible),
        r.progression + ' %', new Date(r.dateEcheance).toLocaleDateString('fr-FR'), r.statut,
      ]),
      headStyles: { fillColor: [30, 80, 162], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 32 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 25 },
        6: { cellWidth: 28 },
      },
    });

    doc.save('objectifs.pdf');
  }
}
