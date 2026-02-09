# PWA Push QA (S2-05 / S2-06)

Data: 2026-02-08
Escopo: notificacoes push de alto valor, deep-link, preferencias por tipo, token e comportamento foreground/background.

## Resultado Geral

- Status: **Aprovado tecnicamente (codigo + build)**
- Pendencia: **validacao E2E em device real com push remoto**

## Checklist Tecnico

- [x] Build de producao concluido (`npx vite build`)
- [x] SW compila e gera `dist/service-worker.js`
- [x] Registro de token push reutiliza subscription existente
- [x] Suporte a `VITE_VAPID_PUBLIC_KEY` no registro push
- [x] Preferencias de push sincronizadas para SW (`PUSH_PREFS_UPDATE`)
- [x] Filtro por tipo/nivel aplicado no app (foreground)
- [x] Filtro por tipo/nivel aplicado no SW (background)
- [x] SW evita notificacao duplicada quando app esta focado/visivel
- [x] `notificationclick` foca/abre app e direciona para rota alvo (deep-link)

## Evidencias de Implementacao

- `src/lib/notifications.ts`
  - snapshot padrao de preferencias
  - mapeamento `event_type/level -> preference key`
  - `registerPushToken()` com `getSubscription()` + VAPID key
  - `syncPushPreferencesToServiceWorker()`
- `src/hooks/usePushNotifications.ts`
  - sincronizacao de preferencias do perfil para SW
  - filtro de payload no foreground
  - tratamento de `PUSH_NAVIGATE` para navegar no app
- `src/service-worker.ts`
  - normalizacao de payload push
  - filtro por preferencias persistidas localmente
  - logica foreground/background para evitar duplicidade
  - `notificationclick` com focus/open + deep-link

## Limites da Validacao Atual

- Nao houve disparo real de push por provedor externo neste ciclo.
- Recomenda-se smoke test manual final em:
  - Android Chrome (PWA instalado)
  - iOS Safari (quando aplicavel para comportamento equivalente de notificacao/webpush no ambiente suportado)
  - Desktop Chrome
