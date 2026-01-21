# Serrallab Mobile (Expo)

Protótipo inicial do aplicativo mobile focado nos clientes do SaaS. Usa Expo/React Native para reproduzir a identidade escura do dashboard.

## Como começar

```bash
# dentro da pasta mobile
npm install
npm run start
```

O `npm run start` abre o Expo. Use `npm run android` ou `npm run ios` para emular.

## Estrutura sugerida

- `App.tsx` – tela principal com cards de KPIs.
- `screens/` – futuras telas (Dashboard, Clientes, Orçamentos, Agenda, Mensagens).
- `components/` – cards reutilizáveis, botões e indicadores.
- `services/` – integração com Supabase/Twilio/SendGrid (mesmas funções do painel).
- `theme.ts` – cores e espaçamentos compartilhados com o painel web.

## Próximos passos

1. Criar `navigation/` com bottom tabs (Dashboard, Clientes, Orçamentos, Agenda).  
2. Implementar `hooks/` para consumir as funções existentes (`supabase/functions`, Twilio).  
3. Sincronizar notificações push (Twilio/Supabase) e cadastros offline leves.
