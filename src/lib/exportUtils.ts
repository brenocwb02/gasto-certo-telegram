/**
 * Utilitários para exportação de relatórios financeiros
 * Suporta CSV e PDF
 */

interface TransactionForExport {
    data_transacao: string;
    descricao: string;
    categoria?: string;
    valor: number;
    tipo: 'receita' | 'despesa';
}

interface ReportSummary {
    periodo: string;
    totalReceitas: number;
    totalDespesas: number;
    saldo: number;
    taxaPoupanca: number;
    categorias: Array<{ nome: string; valor: number; percentual: number }>;
}

/**
 * Formata valor para moeda brasileira
 */
function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Formata data para DD/MM/YYYY
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

/**
 * Exporta transações para CSV
 */
export function exportTransactionsToCSV(
    transactions: TransactionForExport[],
    filename: string = 'transacoes'
): void {
    // Headers
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'];

    // Rows
    const rows = transactions.map(t => [
        formatDate(t.data_transacao),
        `"${(t.descricao || '').replace(/"/g, '""')}"`, // Escape quotes
        `"${(t.categoria || 'Sem categoria').replace(/"/g, '""')}"`,
        t.tipo === 'receita' ? 'Receita' : 'Despesa',
        t.valor.toFixed(2).replace('.', ',')
    ]);

    // Build CSV content
    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
    ].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Trigger download
    downloadBlob(blob, `${filename}_${getDateString()}.csv`);
}

/**
 * Exporta resumo DRE para CSV
 */
export function exportDREToCSV(summary: ReportSummary): void {
    const lines = [
        'DEMONSTRATIVO DE RESULTADO - ' + summary.periodo,
        '',
        'Item;Valor',
        `RECEITAS TOTAIS;${summary.totalReceitas.toFixed(2).replace('.', ',')}`,
        `(-) DESPESAS TOTAIS;${summary.totalDespesas.toFixed(2).replace('.', ',')}`,
        `= RESULTADO;${summary.saldo.toFixed(2).replace('.', ',')}`,
        '',
        `Taxa de Poupança;${summary.taxaPoupanca.toFixed(1)}%`,
        '',
        'DESPESAS POR CATEGORIA',
        'Categoria;Valor;%',
        ...summary.categorias.map(c =>
            `${c.nome};${c.valor.toFixed(2).replace('.', ',')};${c.percentual.toFixed(1)}%`
        )
    ];

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `dre_${getDateString()}.csv`);
}

/**
 * Exporta para PDF simples (texto)
 * Usa uma abordagem leve sem dependências externas
 */
export function exportToPDF(summary: ReportSummary): void {
    // Criar HTML para impressão
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório Financeiro - Boas Contas</title>
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          color: #1a365d;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #1a365d;
        }
        .periodo {
          color: #64748b;
          margin-top: 10px;
        }
        .dre {
          background: #f8fafc;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .dre-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .dre-row:last-child {
          border-bottom: none;
        }
        .dre-row.total {
          font-weight: bold;
          font-size: 18px;
          background: #1a365d;
          color: white;
          margin: 10px -20px -20px;
          padding: 15px 20px;
          border-radius: 0 0 8px 8px;
        }
        .receita { color: #22c55e; }
        .despesa { color: #ef4444; }
        .categorias {
          margin-top: 30px;
        }
        .categoria-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .bar {
          height: 8px;
          background: #3b82f6;
          border-radius: 4px;
          margin-top: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          color: #94a3b8;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">💰 Boas Contas</div>
        <div class="periodo">Relatório Financeiro - ${summary.periodo}</div>
      </div>

      <div class="dre">
        <h3 style="margin-top: 0;">DRE Simplificado</h3>
        <div class="dre-row">
          <span>RECEITAS TOTAIS</span>
          <span class="receita">${formatCurrency(summary.totalReceitas)}</span>
        </div>
        <div class="dre-row">
          <span>(-) DESPESAS TOTAIS</span>
          <span class="despesa">${formatCurrency(summary.totalDespesas)}</span>
        </div>
        <div class="dre-row total">
          <span>= RESULTADO</span>
          <span>${formatCurrency(summary.saldo)}</span>
        </div>
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <strong>Taxa de Poupança:</strong> 
        <span style="font-size: 24px; color: ${summary.taxaPoupanca >= 20 ? '#22c55e' : summary.taxaPoupanca >= 0 ? '#eab308' : '#ef4444'};">
          ${summary.taxaPoupanca.toFixed(1)}%
        </span>
        <span style="color: #64748b;"> (Meta: 20%)</span>
      </div>

      <div class="categorias">
        <h3>Despesas por Categoria</h3>
        ${summary.categorias.map(c => `
          <div class="categoria-row">
            <span>${c.nome}</span>
            <span>${formatCurrency(c.valor)} (${c.percentual.toFixed(1)}%)</span>
          </div>
          <div class="bar" style="width: ${c.percentual}%;"></div>
        `).join('')}
      </div>

      <div class="footer">
        <p>Gerado por Boas Contas em ${new Date().toLocaleString('pt-BR')}</p>
        <p>boascontas.com.br</p>
      </div>
    </body>
    </html>
  `;

    // Abrir em nova janela para impressão/salvar como PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Aguardar carregamento e abrir diálogo de impressão
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
            }, 250);
        };
    }
}

/**
 * Helper: Gera string de data para nome de arquivo
 */
function getDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Helper: Dispara download de blob
 */
function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
