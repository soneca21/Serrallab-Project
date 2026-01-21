# Serrallab Mobile (Expo)

Protótipo progressivo do aplicativo mobile para clientes e equipes do SaaS. Replica a identidade escura do painel web, mas prioriza navegação por toque, cards informativos e indicadores essenciais (KPIs, pipeline e notificações).

## Como começar

```bash
# dentro da pasta mobile
npm install
npm run start
```

O `npm run start` abre o painel do Expo. Os comandos nativos (`npm run android` / `npm run ios`) exigem o SDK correspondente:

* **Android** – instale o Android SDK (pelo Android Studio), defina `ANDROID_HOME` apontando para a instalação e certifique-se de que `adb` esteja no `PATH`.
* **iOS** – use um macOS com Xcode configurado.

Por ora estamos trabalhando na versão web/resposiva; quando os SDKs estiverem disponíveis, basta rodar os scripts acima.

## Estrutura atual

- `App.tsx` – controla a barra de status e renderiza o `AppNavigator`.
- `navigation/` – `BottomTabNavigator` com as telas principais (Dashboard, Clientes, Orçamentos, Agenda, Notificações).
- `screens/` – cada tela inclui conteúdo estratégico (cards, alertas, filtros) pensado para o cliente SaaS.
- `components/` – componentes reutilizáveis (`KpiCard`, `SectionHeader`, `StatusBadge`) que mantêm consistência visual.
- `theme.ts` – paleta de cores e bordas compartilhadas com o painel web.

## Próximos passos

1. Conectar cada tela aos dados reais (Supabase + Twilio/SendGrid), mantendo o mesmo modelo do painel web.
2. Expandir os serviços/hooks para envio de SMS/WhatsApp via Twilio e notificações push via Supabase.
3. Quando o Android/iOS SDK estiver pronto, ativar `npm run android`/`npm run ios` para validar o app nativo.

## QA e demonstração

* Verifique que todos os cards usem as cores e bordas do design principal (`mobile/theme.ts`) e que os textos respeitem o espaçamento padrão (cards com padding 14/16).  
* Teste os touch targets (botões `ActionButton`, abas do navigator e badges) em telas pequenas; use animações leves (status message fade-in, efeito `TouchableOpacity`) ao disparar ações importantes.  
* Garanta fluidez ao alternar tabs; o expo web deve refletir o mesmo comportamento do painel de desktop.  
* Documente qualquer ajuste visual ou funcional no `mobile/notes/QA.md` antes do deploy e compartilhe o passo a passo para a demo final.
