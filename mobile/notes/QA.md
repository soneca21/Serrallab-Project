## Checklist de QA / Demonstração

1. **Consistência visual**
   * Verifique que todas as cores seguem `mobile/theme.ts` (laranja `#f97316`, fundo escuro, bordas suaves).  
   * Confirme que os cards usam mesma tipografia (Helvetica/Roboto) e padding (14/16).  
   * Garanta que os badges e listas tenham espaçamento uniforme e radius 12–16.

2. **Responsividade e toque**
   * Teste o `BottomTabNavigator` em telas pequenas; cada aba deve manter ícone + label legível e o touch target >= 48dp.  
   * Botões como “Enviar proposta”, “Filtrar” e “Ver auditoria” precisam do feedback `TouchableOpacity` e largura suficiente para o polegar.  
   * Ao alternar tabs, observe se a rolagem volta ao topo (scroll-to-top) e se os headers permanecem fixos.

3. **Estado/Feedback**
   * Simule falha no Supabase (por exemplo, removendo a url ou forçando erro) e confirme que mensagens de erro aparecem e o badge troca para “Supabase Desativado”.  
   * Drag and drop de status (loading → sucesso) deve mostrar texto de status (ex: “Preparando exportação...”) e desaparecer quando o processo termina.

4. **Fluxos transacionais**
   * Valide `Quotes` com dados reais: envie propostas, gere PDF e verifique as chamadas das Edge Functions.
   * Teste os botões “Enviar proposta”/“Ver PDF”/“Exportar PDF” com mocks ou ambiente de QA, documentando os logs relevantes no console.  
   * Registre nos logs (ou no relatório) quaisquer falhas de Twilio/SendGrid e capture os env vars usados (sem expor secrets) para referência futura.

5. **Demonstração**
   * Prepare uma gravação curta (ou roteiro escrito) mostrando: ① dashboard operacional com alertas e pipeline, ② lista de clientes com filtros, ③ envio de proposta + PDF, ④ agenda e notificações sincronizadas.  
   * Inclua passos para validar `Supabase Operacional` em verde/erro e para reemitir um alerta (ex: novo evento no Supabase).  
   * Documente o checklist no README e atrele o `mobile/notes/QA.md` como referência para QA e deploy.
