
export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  export const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  
  export const getOrcamentoPdfTemplate = (data: {
    company: any;
    client: any;
    quote: any;
    items: any[];
  }) => {
    const { company, client, quote, items } = data;
    
    // Calculate totals
    const subtotal = items.reduce((acc, item) => acc + (Number(item.cost) * Number(item.quantity)), 0);
    // Assuming final_price includes tax/labor/etc as per the app logic
    const total = quote.final_price;
    const labor = quote.labor_cost || 0;
    const other = (quote.painting_cost || 0) + (quote.transport_cost || 0) + (quote.other_costs || 0);
    
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #333;
        line-height: 1.5;
        font-size: 12px;
        margin: 0;
        padding: 0;
      }
      .header {
        margin-bottom: 40px;
        border-bottom: 2px solid #eee;
        padding-bottom: 20px;
        display: flex;
        justify-content: space-between;
      }
      .company-info h1 {
        margin: 0 0 5px 0;
        font-size: 24px;
        color: #1a1a1a;
      }
      .meta-info {
        text-align: right;
      }
      .client-section {
        margin-bottom: 40px;
        background: #f9f9f9;
        padding: 20px;
        border-radius: 4px;
      }
      .client-section h2 {
        margin-top: 0;
        font-size: 14px;
        text-transform: uppercase;
        color: #666;
        border-bottom: 1px solid #ddd;
        padding-bottom: 10px;
        margin-bottom: 10px;
      }
      .quote-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .quote-desc {
        margin-bottom: 30px;
        color: #555;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 30px;
      }
      th {
        text-align: left;
        background: #f1f1f1;
        padding: 10px;
        font-weight: 600;
        border-bottom: 2px solid #ddd;
      }
      td {
        padding: 10px;
        border-bottom: 1px solid #eee;
      }
      .totals {
        width: 100%;
        display: flex;
        justify-content: flex-end;
      }
      .totals-box {
        width: 300px;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        padding: 5px 0;
      }
      .total-row.final {
        border-top: 2px solid #333;
        margin-top: 10px;
        padding-top: 10px;
        font-weight: bold;
        font-size: 16px;
      }
      .footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 10px;
        color: #999;
        border-top: 1px solid #eee;
        padding-top: 10px;
      }
      .terms {
        margin-top: 50px;
        font-size: 10px;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="company-info">
        <h1>${company.company_name || 'Serralheria'}</h1>
        <p>
          ${company.company_address || ''}<br>
          ${company.company_phone || ''}<br>
          ${company.email || ''}
        </p>
      </div>
      <div class="meta-info">
        <p><strong>Orçamento:</strong> #${quote.id.slice(0, 8)}</p>
        <p><strong>Data:</strong> ${formatDate(quote.created_at)}</p>
        <p><strong>Validade:</strong> 15 dias</p>
      </div>
    </div>
  
    <div class="client-section">
      <h2>Dados do Cliente</h2>
      <p>
        <strong>Nome:</strong> ${client.name}<br>
        ${client.address ? `<strong>Endereço:</strong> ${client.address}<br>` : ''}
        ${client.email ? `<strong>Email:</strong> ${client.email}<br>` : ''}
        ${client.phone ? `<strong>Telefone:</strong> ${client.phone}` : ''}
      </p>
    </div>
  
    <div class="quote-title">${quote.title}</div>
    ${quote.description ? `<div class="quote-desc">${quote.description}</div>` : ''}
  
    <table>
      <thead>
        <tr>
          <th width="50%">Item / Material</th>
          <th width="15%" style="text-align: center">Qtd</th>
          <th width="15%">Unitário</th>
          <th width="20%" style="text-align: right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>
              <strong>${item.name}</strong>
            </td>
            <td style="text-align: center">${item.quantity} ${item.unit}</td>
            <td>${formatCurrency(item.cost)}</td>
            <td style="text-align: right">${formatCurrency(item.cost * item.quantity)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  
    <div class="totals">
      <div class="totals-box">
        <div class="total-row">
          <span>Subtotal Materiais:</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        ${labor > 0 ? `
        <div class="total-row">
          <span>Mão de Obra:</span>
          <span>${formatCurrency(labor)}</span>
        </div>` : ''}
        ${other > 0 ? `
        <div class="total-row">
          <span>Outros (Pintura/Transp):</span>
          <span>${formatCurrency(other)}</span>
        </div>` : ''}
        <div class="total-row final">
          <span>Total:</span>
          <span>${formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  
    <div class="terms">
      <h3>Termos e Condições</h3>
      <p>Este orçamento é válido por 15 dias. O pagamento deve ser efetuado conforme combinado. 
      Prazo de entrega a combinar após a aprovação.</p>
    </div>
  
    <div class="footer">
      Gerado em ${new Date().toLocaleString('pt-BR')}
    </div>
  </body>
  </html>
    `;
  };
