## Integrações prioritárias (Supabase + Twilio/SendGrid)

### 1. Supabase
- Conectar cada tela (`Dashboard`, `Contas`, `Orçamentos`, `Agenda`, `Notificações`) às views/funções que já existem no painel web para manter os KPIs e alertas em sincronia.
- Usar `supabase.functions.invoke` sempre que possível (especialmente para `dashboard-summary`, `clients-list`, `orders-status`, `events-today` e `audit-feed`) para evitar expor chaves no cliente mobile.
- Implementar WebSocket/Realtime (`supabase.channel(...)`) assim que o canal estiver disponível, repetindo o comportamento de atualização do painel.

### 2. Twilio / SendGrid
- Criar wrappers no mobile (`mobile/services/communication.ts`) para invocar as Edge Functions `send-sms`, `send-whatsapp` e `send-email`. Elas são a mesma base usada no web (com `supabase.functions.invoke` + JWT do usuário logado).
- Esses env vars (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM`, `TWILIO_WHATSAPP_FROM`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`) devem ficar apenas nos Secrets do Supabase. O mobile nunca armazena essas chaves.
- Para QA, mantenha o template Z-API no meio até migrar completamente para Twilio. Os env vars podem apontar para a conta atual enquanto os testes acontecem.

### 3. PDFs e Orçamentos
- Reutilizar `generate-orcamento-pdf` do Supabase com `mobile/services/communication.ts#getBudgetPdf`. Os botões “Ver PDF” e “Exportar PDF” apenas passam o `order_id` e exibem o link retornado (ou baixam o arquivo diretamente).
- Certificar-se de que os dados do orçamento mostrados no mobile (lista de itens, margem, condições de pagamento, dados fiscais) estão sincronizados com o payload retornado pela API do painel.

### 4. Fluxos transacionais
1. Expor telas detalhadas de orçamento/cliente (lista de itens, status, margens, condições, notas fiscais) que podem acionar `sendEmail`, `sendSms`, `sendWhatsapp` e `getBudgetPdf`.
2. Incluir ações contextuais para “Ver auditoria”, “Exportar fluxo”, “Novo orçamento”, “Filtrar status”, mantendo o mesmo ritmo do painel web.
3. Preparar o fluxo para que, ao aprovar um orçamento, o backend possa disparar as mensagens e gerar o PDF automaticamente sem ajuste adicional no mobile.
