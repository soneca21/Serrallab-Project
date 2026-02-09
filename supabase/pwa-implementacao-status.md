# PWA Implementacao Status (Diagnostico Tecnico)

Data do diagnostico: 2026-02-08
Escopo: diagnostico tecnico apenas (sem implementacao), com foco em SW, manifest, install, offline e sync.

## Resumo Executivo

Status geral atual: **Sprint 1 concluida tecnicamente (S1-01 a S1-07), com pendencia de validacao operacional em device real**.

Principais bloqueios reais:
- Installability base (manifest + metatags + icones + prompt/fallback) foi concluida (S1-02), faltando validacao em device real.
- Offline de leitura para mobile foi endurecida com cache-first + rede depois + fallback sem cache inicial.
- Offline de escrita (fila local, retry, conflito, idempotencia) **nao existe ainda**.

## Estado Atual Mapeado

### 1) Service Worker / Build

Estado:
- Arquivo SW presente em `src/service-worker.ts`.
- Projeto usa Vite com entrada dedicada para SW em `vite.config.js` e registro de SW no bootstrap (`src/main.jsx`).

Gaps reais:
- SW agora possui politicas por classe de recurso (S1-03), com fallback SPA offline.
- Fluxo de update UX implementado (S3-01), pendente validacao em publicacao real com versao nova.

Impacto:
- Base de cache/app shell + assets + imagens + API de leitura agora existe e build gera `service-worker.js`.
- Ainda faltam controles de sync global, fila de mutacoes e conflitos.

Arquivos afetados (S1):
- `vite.config.js`
- `src/main.jsx`
- `src/service-worker.ts` (ou migracao para `src/sw.ts`)
- `package.json` (dependencia/plugin PWA, se adotado)

### 2) Manifest / Installability

Estado:
- Manifest existe em `public/manifest.json`.
- Hook de install existe em `src/hooks/usePWA.ts`.
- UI de install existe em `src/components/InstallPrompt.tsx` e aparece no mobile via `src/layouts/MobileLayout.tsx`.
- Metatags PWA e links do manifest/icon estao no `index.html`.

Gaps reais:
- `start_url` esta `/app`; ainda precisa validar comportamento de login/rota em primeiro boot offline no device real.
- Falta validacao manual em iOS Safari e Android Chrome em hardware real.

Impacto:
- Base tecnica para installability esta pronta.
- Risco residual de diferencas por navegador/dispositivo ate concluir QA manual dedicado.

Arquivos afetados (S1):
- `index.html`
- `public/manifest.json`
- `public/pwa-192x192.png` (novo)
- `public/pwa-512x512.png` (novo)
- `public/apple-touch-icon.png` (novo)
- `src/hooks/usePWA.ts`
- `src/components/InstallPrompt.tsx`

### 3) Offline Leitura / Sync

Estado:
- IndexedDB de leitura existe em `src/lib/offline.ts` (stores: leads, orcamentos, pipeline).
- Sync de leitura existe em `src/lib/sync.ts`.
- Hook de sync existe em `src/hooks/useOfflineSync.ts`.
- Telas mobile usam cache local (`LeadsMobile`, `OrcamentosMobile`, `PipelineMobile`).

Gaps reais:
- `registerBackgroundSync()` registra tag, mas SW atual nao processa fila real.
- Sync em `src/lib/sync.ts` depende de leitura de rede sem persistencia de metadados operacionais (`last_sync`, erros por entidade, queue size).

Impacto:
- UX inconsistente de conectividade/sincronizacao.
- Mais carga e chamadas redundantes.
- Offline funciona de forma oportunista, nao com garantias de produto.

Arquivos afetados (S1):
- `src/hooks/useOfflineSync.ts`
- `src/components/OfflineIndicator.tsx`
- `src/components/SyncStatus.tsx`
- `src/layouts/MobileLayout.tsx`
- `src/layouts/AppLayout.jsx`
- `src/lib/offline.ts`
- `src/lib/sync.ts`
- `src/pages/app/LeadsMobile.tsx`
- `src/pages/app/OrcamentosMobile.tsx`
- `src/pages/app/PipelineMobile.tsx`

### 4) Offline Escrita / Fila / Conflito

Estado:
- Nao ha estrutura de fila de mutacoes offline no client.
- Nao ha idempotency key local, retry_count, status de item, nem reconciliacao.

Gaps reais:
- Sem MVP de mutacoes offline (criar lead, mover pipeline, atualizar status orcamento).
- Sem retry/backoff, sem classificacao erro temporario/permanente.
- Sem UI para pendencias/falhas/conflitos.

Impacto:
- Operacao de campo offline fica somente consulta, sem confiabilidade para escrita.

Arquivos provaveis afetados (S2):
- `src/lib/offline.ts` (evolucao de schema ou novo modulo)
- `src/lib/sync.ts`
- `src/types/pwa.ts` (novos tipos de fila/sync)
- `src/pages/app/LeadsMobile.tsx`
- `src/pages/app/OrcamentosMobile.tsx`
- `src/pages/app/PipelineMobile.tsx`
- `src/pages/app/PipelinePage.jsx`
- novo: `src/lib/offlineQueue.ts` (recomendado)

### 5) Push Notifications

Estado:
- Base tecnica parcial existe: `src/lib/notifications.ts`, `src/hooks/usePushNotifications.ts`, handlers no SW.

Gaps reais:
- `usePushNotifications()` nao esta integrado em fluxo de app (hook sem uso).
- Sem preferencia por tipo de evento na UI.
- Sem validacao de deep-link de notificacao para rotas de negocio.
- Chave VAPID hardcoded em codigo.

Impacto:
- Push nao e funcional de forma confiavel em producao.

Arquivos afetados (S2/S3):
- `src/hooks/usePushNotifications.ts`
- `src/lib/notifications.ts`
- `src/service-worker.ts` (ou `src/sw.ts`)
- `src/pages/app/NotificacoesPage.jsx` (provavel integracao de preferencias)

## Checklist Executavel S1 / S2 / S3

Legenda:
- `[ ]` nao iniciado
- `[~]` parcial
- `[x]` concluido

### S1 - Fundacao PWA + Offline Leitura

- `[x]` S1-01 SW integrado no build e no bootstrap de producao
Arquivos: `vite.config.js`, `src/main.jsx`, `src/service-worker.ts` (ou `src/sw.ts`), `package.json`
DoD: SW ativo em producao, com update lifecycle previsivel.

- `[x]` S1-02 Manifest + metatags + install Android/iOS
Arquivos: `index.html`, `public/manifest.json`, `src/hooks/usePWA.ts`, `src/components/InstallPrompt.tsx`, assets em `public/`
DoD: app instalavel em Android; instrucao iOS visivel quando aplicavel.

- `[x]` S1-03 Politica de cache offline (shell/assets/imagens/API leitura)
Arquivos: `src/service-worker.ts` (ou `src/sw.ts`)
DoD: navegacao offline SPA + politicas de expiracao e limpeza.

- `[x]` S1-04 Estado global de conectividade e sincronizacao
Arquivos: `src/hooks/useOfflineSync.ts`, `src/components/OfflineIndicator.tsx`, `src/components/SyncStatus.tsx`, layout(s)
DoD: status unico online/offline/sincronizando/ultima sync sem duplicidade.

- `[x]` S1-05 Leitura offline Leads/Orcamentos/Pipeline
Arquivos: `src/lib/offline.ts`, `src/lib/sync.ts`, telas mobile
Gap atual: concluido para fluxo cache-first + rede depois nas telas mobile.
DoD: cache-first + rede-depois + refresh consistente + tratamento de vazio/erro.

- `[x]` S1-06 Fallback de primeiro acesso offline sem cache
Arquivos: telas mobile e componentes de estado vazio
DoD: mensagem explicita sem tela quebrada.

- `[x]` S1-07 QA sprint 1 (build/install/offline nav/offline data)
Arquivos: `supabase/pwa-qa-sprint1.md`
DoD: checklist tecnico preenchido e aprovado.

### S2 - Escrita Offline + Sync Resiliente + Push Base

- `[x]` S2-01 Fila local de mutacoes em IndexedDB (schema + API utilitaria)
- `[x]` S2-02 Processador de fila com retry/backoff + reconexao
- `[x]` S2-03 Integrar 3 mutacoes criticas no modo offline (MVP)
- `[x]` S2-04 Politica de conflitos v1 + UI minima (reprocessar/descartar)
- `[x]` S2-05 Push de alto valor com deep-link correto
- `[x]` S2-06 Preferencias de notificacao por tipo
- `[x]` S2-07 Telemetria operacional de sync/PWA

### S3 - Hardening e Expansao

- `[x]` S3-01 Fluxo de atualizacao do app (Service Worker update UX)
- `[x]` S3-02 Centro de sincronizacao
- `[x]` S3-03 Estados de interface padronizados (Leads/Orcamentos/Pipeline)
- `[x]` S3-04 Mensagens orientadas a acao (toasts/banners/erros de fila e rede)
- `[x]` S3-05 Acessibilidade base nos fluxos PWA
- `[~]` S3-06 QA de usabilidade em device real (checklist consolidado, execucao manual pendente)
- `[ ]` Expandir mutacoes offline para modulos secundarios
- `[ ]` Melhorar observabilidade operacional (painel/queries)
- `[ ]` Ajustar politicas de cache por dados reais de uso
- `[ ]` Validacao cruzada Android Chrome / iOS Safari / Desktop Chrome
- `[x]` Fechamento tecnico e release report (`supabase/pwa-release-report.md`)

### S4 - Design Visual e Consistencia

- `[x]` S4-01 Sistema visual PWA (tokens)
- `[x]` S4-02 Tipografia e hierarquia de leitura
- `[x]` S4-03 Componentes visuais de status unificados
- `[x]` S4-04 Refino da navegacao mobile
- `[x]` S4-05 Motion funcional (sync/fila/transicoes de estado + reduced motion)
- `[x]` S4-06 Guia visual final (tokens/componentes/mensagens/exemplos)

## Ordem de Execucao Recomendada (bloqueios e dependencias)

1. S1-01 (bloqueador raiz): sem SW no build/bootstrap, o restante fica instavel.
2. S1-02: installability depende de manifest/metadados/assets corretos.
3. S1-03: consolidar estrategia de cache e fallback offline em cima do SW ativo.
4. S1-04: centralizar estado de conectividade/sync para evitar comportamento duplicado.
5. S1-05: endurecer leitura offline com fluxo cache-first completo.
6. S1-06: tratar primeiro acesso offline sem cache.
7. S1-07: QA completo de Sprint 1 antes de entrar em escrita offline.
8. S2-01 ate S2-04: fila local, processador, mutacoes MVP e conflitos.
9. S2-05 ate S2-07: push util, preferencias e telemetria operacional.
10. S3: hardening, expansao e fechamento.

## Riscos Tecnicos Atuais (prioridade)

Alta:
- Multiplicacao de hooks de sync com possivel retrabalho e sincronizacao redundante.

Media:
- Offline leitura sem fallback dedicado no primeiro uso sem cache.
- Push parcial, sem integracao de produto end-to-end.

Baixa:
- Ajustes de expiracao fina de cache e telemetria avancada (pos fundacao).

## Atualizacao S1-01 (executado em 2026-02-08)

Entregue:
- Registro real de Service Worker em producao no bootstrap (`src/main.jsx`) com `navigator.serviceWorker.register('/service-worker.js')`.
- Build do Vite adaptado para emitir entrada dedicada do SW como arquivo estavel (`service-worker.js`) via `rollupOptions.input/output` em `vite.config.js`.
- SW adaptado para Vite sem dependencias de injecao (`src/service-worker.ts`), removendo uso de `self.__WB_MANIFEST` e `process.env.PUBLIC_URL`.
- Build validado com sucesso via `npx vite build`, com artefato confirmado:
  - `dist/service-worker.js`

Pendencias apos S1-01:
- S1-02: resolvida nesta rodada (manifest, metatags, icones e fallback iOS implementados).
- S1-03: resolvida nesta rodada (politicas por tipo de recurso + exclusoes de mutacao/auth + fallback SPA).
- S1-04: resolvida nesta rodada (estado global + lock de sync em paralelo + UI conectada ao estado central).

## Atualizacao S1-02 (executado em 2026-02-08)

Entregue:
- Manifest revisado em `public/manifest.json` com `id`, `scope` e metadata PWA coerente para instalacao.
- Meta tags PWA adicionadas em `index.html`:
  - `link rel="manifest"`
  - `meta name="theme-color"`
  - `apple-mobile-web-app-*`
  - `mobile-web-app-capable`
  - `apple-touch-icon`
- Fluxo Android mantido com `beforeinstallprompt` e tipagem explicita no hook em `src/hooks/usePWA.ts`.
- Fallback iOS adicionado em `src/hooks/usePWA.ts` e `src/components/InstallPrompt.tsx` com instrucao "Compartilhar -> Adicionar a Tela de Inicio".
- Icones criados em `public/`:
  - `public/pwa-192x192.png`
  - `public/pwa-512x512.png`
  - `public/apple-touch-icon.png`

Validacao manual tecnica executada:
- Build de producao concluido com sucesso (`npx vite build`).
- Artefatos confirmados em `dist/`: `manifest.json`, `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`, `service-worker.js`.
- Verificacao manual do `dist/index.html` confirmou presença das meta tags e links PWA.

Pendencias apos S1-02:
- Validacao manual em device real Android Chrome e iOS Safari ainda pendente (prompt nativo e fluxo "Adicionar a Tela de Inicio").
- S1-04: resolvida nesta rodada (estado global + lock de sync em paralelo + UI conectada ao estado central).

## Atualizacao S1-03 (executado em 2026-02-08)

Arquivos alterados:
- `src/service-worker.ts`

Decisoes de estrategia de cache:
- App shell: pre-cache de `/, /index.html, /manifest.json` e icones principais na instalacao.
- Navegacao SPA: `network-first` para requests `navigate`, com fallback offline para `index.html`.
- Assets (CSS/JS/worker/font): `stale-while-revalidate` com limite de entradas.
- Imagens: `cache-first` com limite de entradas.
- API de leitura Supabase: `network-first` + fallback em cache para GET de `/rest/v1/` e `/storage/v1/object/public/`.
- Exclusoes de seguranca:
  - Nao intercepta/cacheia mutacoes (`POST/PUT/PATCH/DELETE`).
  - Nao cacheia requests com sinal sensivel de auth (`authorization` header, `/auth/v1`, `/token`).

Build + teste local:
- Build de producao validado com sucesso via `npx vite build`.
- Artefato do SW confirmado em `dist/service-worker.js`.
- Verificacao local do bundle confirmou regras de mutacao/auth e fallback SPA no SW compilado.

Pendencias apos S1-03:
- S1-04: resolvida nesta rodada (estado global + lock de sync em paralelo + UI conectada ao estado central).
- Validacao manual em dispositivos reais (Android/iOS) permanece recomendada para fechamento operacional.

## Atualizacao S1-04 (executado em 2026-02-08)

Arquivos alterados:
- `src/hooks/useOfflineSync.ts`
- `src/layouts/MobileLayout.tsx`
- `src/layouts/AppLayout.jsx`

Comportamento final implementado:
- Estado global unico para:
  - `isOnline`
  - `isSyncing`
  - `lastSync`
- Evita sync paralelo:
  - lock via `syncPromise` compartilhada no store global.
  - chamadas concorrentes reutilizam a mesma execucao.
- Evita multiplos gatilhos:
  - listeners `online/offline` e registro de `backgroundSync` inicializados uma unica vez.
  - sync inicial disparado uma unica vez quando online.
- Componentes visuais existentes passaram a refletir o estado central:
  - `OfflineIndicator` e `SyncStatus` continuam usando `useOfflineSync`, agora centralizado.
  - `SyncStatus` foi conectado ao layout mobile (`MobileLayout`) e desktop (`AppLayout` header).

Build + teste local:
- Build de producao validado com sucesso via `npx vite build`.
- Teste local tecnico: verificacao de que o hook nao depende mais de `usePWA` para conectividade e usa store global compartilhado.

Pendencias apos S1-04:
- S1-05: resolvida nesta rodada (cache-first + rede depois + tratamento de vazio/erro nas telas mobile).
- S1-06/S1-07: resolvidas nesta rodada (fallback sem cache inicial + relatorio QA sprint 1).

## Atualizacao S1-05 (executado em 2026-02-08)

Arquivos alterados:
- `src/lib/offline.ts`
- `src/lib/sync.ts`
- `src/pages/app/LeadsMobile.tsx`
- `src/pages/app/OrcamentosMobile.tsx`
- `src/pages/app/PipelineMobile.tsx`

Comportamento final implementado (offline-first leitura):
- Cache local primeiro:
  - telas mobile carregam imediatamente dados do IndexedDB no primeiro paint util.
- Rede depois (quando online):
  - telas disparam `sync()` centralizado e recarregam cache apos sincronizacao.
- Consistencia de transformacoes:
  - `src/lib/sync.ts` agora centraliza `resolvePipelineStageName` e `groupOrdersByPipelineStage`.
  - Pipeline mobile usa o mesmo agrupamento/ordem do sync para evitar divergencia entre cache e rede.
- Persistencia local endurecida:
  - `saveLeadsOffline` e `saveOrcamentosOffline` agora fazem replace completo de store (clear + put), evitando itens stale removidos no servidor.
  - leitura local ordenada por `created_at` desc para previsibilidade.
- Tratamento de vazio e erro:
  - Leads/Orcamentos/Pipeline mobile exibem mensagem clara para:
    - erro de leitura local,
    - falha de sync sem cache,
    - cenario offline sem dados iniciais.
  - acao de retry adicionada nas tres telas.

Pendencias apos S1-05:
- S1-06: resolvida nesta rodada (estado claro de "sem cache inicial" nas telas mobile).
- S1-07: resolvida nesta rodada (checklist tecnico consolidado em `supabase/pwa-qa-sprint1.md`).

## Atualizacao S1-06 (executado em 2026-02-08)

Arquivos alterados:
- `src/components/OfflineEmptyState.tsx`
- `src/pages/app/LeadsMobile.tsx`
- `src/pages/app/OrcamentosMobile.tsx`
- `src/pages/app/PipelineMobile.tsx`

Comportamento final:
- Criado estado/tela explicita de primeiro acesso offline sem cache inicial:
  - "Sem cache inicial para Leads/Orcamentos/Pipeline".
- Estado exibido quando:
  - dispositivo offline e
  - cache local vazio no primeiro carregamento.
- Acao de retry disponivel no proprio estado.

## Atualizacao S1-07 (executado em 2026-02-08)

Relatorio QA gerado:
- `supabase/pwa-qa-sprint1.md`

Checklist tecnico executado:
- Build de producao.
- Installability tecnica (manifest, metatags, icones, SW).
- Validacao tecnica de navegacao offline SPA no SW.
- Validacao tecnica de fluxo offline-first de dados em Leads/Orcamentos/Pipeline.

Pendencia residual de QA:
- Validacao manual em device real (Android Chrome e iOS Safari) permanece recomendada para fechamento operacional.

## Atualizacao S2-01 (executado em 2026-02-08)

Arquivos alterados:
- `src/types/pwa.ts`
- `src/lib/offline.ts`
- `src/lib/offlineQueue.ts`
- `supabase/pwa-offline-queue.md`

Entregue:
- Store `offline_mutation_queue` modelada em IndexedDB (`serrallab-db`, versao `2`).
- Campos obrigatorios implementados na fila:
  - `idempotency_key`
  - `retry_count`
  - `created_at`
  - `last_error`
  - `status`
- Indices criados:
  - `by_status`
  - `by_created_at`
  - `by_idempotency_key` (unico)
- API utilitaria criada:
  - `enqueueOfflineMutation`
  - `listOfflineMutations`
  - `updateOfflineMutationStatus`
  - `incrementOfflineMutationRetry`
  - `removeOfflineMutation`
  - `clearProcessedOfflineMutations`
  - `countOfflineMutations`
- Documentacao de schema/API em `supabase/pwa-offline-queue.md`.

## Atualizacao S2-02 (executado em 2026-02-08)

Arquivos alterados:
- `src/lib/offlineQueueProcessor.ts`
- `src/lib/sync.ts`

Entregue:
- Processador da fila local implementado com:
  - leitura de itens `pending` e `failed`;
  - retry com backoff exponencial (`5s` base, teto `5min`);
  - classificacao de falhas:
    - temporarias: rede/timeout/408/429/5xx;
    - permanentes: demais casos;
  - logs uteis com contexto (`id`, `mutation_type`, `entity`, `retry_count`, classificacao).
- Disparo automatico do processamento:
  - em inicializacao online e ao voltar conexao via ciclo existente de `syncAll()` + `useOfflineSync`.
- Evita envios duplicados com idempotencia:
  - deduplicacao por `idempotency_key` no batch;
  - lock in-memory de chaves em processamento (`inFlightIdempotencyKeys`);
  - idempotencia persistente ja garantida por indice unico `by_idempotency_key`.
- Integracao no fluxo de sync:
  - `syncAll()` agora processa fila antes de sincronizar leituras de Leads/Orcamentos/Pipeline.

## Atualizacao S2-03 (executado em 2026-02-08)

Arquivos alterados:
- `src/lib/offlineMutations.ts`
- `src/main.jsx`
- `src/pages/app/LeadsMobile.tsx`
- `src/pages/app/PipelinePage.jsx`
- `src/pages/app/OrcamentoFormPage.jsx`

Mutacoes MVP integradas:
- Criar lead (`lead.create`)
- Atualizar etapa do pipeline (`order.update_pipeline_stage`)
- Atualizar status de orcamento (`order.update_status`)

Comportamento implementado:
- Quando offline:
  - mutacao entra na fila local (IndexedDB) com `idempotency_key`;
  - cache local e atualizado imediatamente para manter consistencia visual.
- Quando online:
  - executa direto no backend;
  - em caso de falha temporaria, cai para fila automaticamente.
- Idempotencia:
  - chave por mutacao (`lead:create:*`, `order:pipeline:*`, `order:status:*`);
  - processors registrados para reexecucao via fila.

Feedback de UI (pendente/sincronizado/falhou):
- Leads mobile: indicador de estado da criacao de lead e formulario de novo lead.
- Pipeline desktop: feedback por card apos mover etapa.
- Orcamento form: feedback do envio/atualizacao de status.

Observacao:
- Os processors da fila sao registrados no bootstrap (`src/main.jsx` via import de `src/lib/offlineMutations.ts`) para processamento automatico em inicializacao online/reconexao.

## Atualizacao S2-04 (executado em 2026-02-08)

Arquivos alterados:
- `src/lib/offlineMutations.ts`
- `src/lib/offlineQueueProcessor.ts`
- `src/lib/offlineQueue.ts`
- `src/lib/offlineConflicts.ts`
- `src/lib/offline.ts`
- `src/types/pwa.ts`
- `src/components/OfflineQueueErrors.tsx`
- `src/layouts/MobileLayout.tsx`
- `src/layouts/AppLayout.jsx`
- `supabase/pwa-conflitos-v1.md`

Entregue:
- Politica de conflitos v1 aplicada:
  - regra `last_write_wins` para mutacoes de pedido (`pipeline_stage` e `status`).
- Registro de divergencias:
  - store local `offline_conflicts` em IndexedDB;
  - log com `local_snapshot`, `remote_snapshot`, `idempotency_key` e resolucao aplicada.
- Falha temporaria vs permanente:
  - `failure_type` persistido no item da fila;
  - falhas permanentes nao entram em retry automatico.
- UI minima para erro permanente:
  - componente `OfflineQueueErrors` com acoes por item:
    - `Reprocessar`
    - `Descartar`
  - integrado em layout mobile e desktop.
- Notas tecnicas geradas:
  - `supabase/pwa-conflitos-v1.md`.

## Atualizacao S2-05 e S2-06 (executado em 2026-02-08)

Arquivos alterados:
- `src/service-worker.ts`
- `src/lib/notifications.ts`
- `src/hooks/usePushNotifications.ts`
- `src/App.jsx`
- `supabase/pwa-push-qa.md`

Entregue:
- Push de alto valor com deep-link consistente:
  - payload normalizado no SW (`title`, `body`, `event_type`, `level`, `route`);
  - clique em notificacao abre/foca app e navega para rota de destino.
- Comportamento foreground/background:
  - SW sempre envia evento `PUSH_NOTIFICATION` para clientes abertos;
  - quando existe janela focada/visivel, evita notificar em duplicidade no sistema;
  - quando app nao esta em foreground, mostra notificacao do sistema.
- Preferencias por tipo de evento e nivel:
  - preferencias do perfil sincronizadas para o SW via `PUSH_PREFS_UPDATE`;
  - filtro aplicado tanto no foreground (hook React) quanto no background (SW).
- Token push:
  - reutiliza subscription existente antes de criar nova;
  - suporta `VITE_VAPID_PUBLIC_KEY` para assinatura Web Push.

Validacao:
- Build de producao executado com sucesso via `npx vite build`.
- Checklist tecnico de push consolidado em `supabase/pwa-push-qa.md`.

Pendencias residuais:
- Validacao E2E em dispositivo real com push remoto (foreground/background) ainda recomendada para fechamento operacional.

## Atualizacao S2-07 (executado em 2026-02-08)

Arquivos alterados:
- `src/lib/pwaTelemetry.ts`
- `src/hooks/usePWA.ts`
- `src/lib/sync.ts`
- `src/lib/offlineConflicts.ts`
- `supabase/pwa-telemetria.md`

Entregue:
- Telemetria operacional minima implementada com persistencia em tabela existente (`audit_logs`), sem infraestrutura nova.
- Eventos registrados:
  - `install_prompt_shown`
  - `app_installed`
  - `sync_success`
  - `sync_error`
  - `queue_size`
  - `conflict_detected`
- Padrão de persistencia:
  - `entity='pwa_telemetry'`
  - `entity_id=<event_name>`
  - `details` com campos de contexto do evento.

Pontos de instrumentacao:
- Instalacao PWA:
  - `beforeinstallprompt` e fallback iOS em `usePWA`.
  - evento `appinstalled` + deteccao standalone em `usePWA`.
- Sincronizacao:
  - `queue_size`, `sync_success` e `sync_error` em `syncAll`.
- Conflitos:
  - `conflict_detected` em `logOfflineConflict`.

Documentacao:
- Especificacao de eventos/campos e query de consulta em `supabase/pwa-telemetria.md`.

## Fechamento Tecnico (executado em 2026-02-08)

Validacao final executada:
- Build final de release com sucesso via `npx vite build`.
- Artefatos PWA confirmados em `dist/` (`service-worker.js`, `manifest.json`, icones).
- Checagem de regressao critica realizada em:
  - registro SW/build (`src/main.jsx`, `vite.config.js`);
  - installability (`index.html`, `public/manifest.json`, `usePWA`);
  - offline/cache/sync (`src/service-worker.ts`, `src/lib/sync.ts`);
  - fila/retry/conflitos (`src/lib/offlineQueue*.ts`, `src/lib/offlineConflicts.ts`);
  - push/deep-link/preferencias (`src/service-worker.ts`, `src/hooks/usePushNotifications.ts`, `src/lib/notifications.ts`);
  - telemetria (`src/lib/pwaTelemetry.ts`).

Status consolidado:
- Sprint 1 (S1-01..S1-07): **100% concluida**
- Sprint 2 (S2-01..S2-07): **100% concluida**
- Sprint 3 (hardening/expansao): **pendente**

Pendencias claras para fechamento total da iniciativa:
- Executar Sprint 3 (hardening/expansao).
- Concluir validacao E2E em dispositivos reais (Android/iOS/Desktop) para aceite operacional.

Relatorio final:
- `supabase/pwa-release-report.md`

## Atualizacao S3-01 (executado em 2026-02-08)

Arquivos alterados:
- `src/service-worker.ts`
- `src/components/ServiceWorkerUpdatePrompt.jsx`
- `src/App.jsx`

Entregue:
- UX de atualizacao de app com aviso claro quando novo SW fica disponivel.
- Banner/toast com duas acoes:
  - `Atualizar agora`: envia `SKIP_WAITING` para o SW em espera e aplica nova versao.
  - `Depois`: fecha aviso sem forcar refresh imediato.
- Troca de versao controlada:
  - SW deixa de ativar automaticamente no install de update.
  - app escuta `controllerchange` e recarrega somente apos ativacao da nova versao.

Validacao tecnica:
- Build de producao validado com sucesso (`npx vite build`).

Pendencia residual:
- Validar em publicacao real (versao N -> N+1) para confirmar UX no fluxo de update em ambiente produtivo.

## Atualizacao S3-02 (executado em 2026-02-08)

Arquivos alterados:
- `src/pages/app/SyncCenterPage.jsx`
- `src/App.jsx`
- `src/layouts/AppLayout.jsx`

Entregue:
- Tela/painel operacional `Centro de Sincronizacao` em `/app/sincronizacao` com:
  - tamanho atual da fila;
  - ultimo sync consolidado;
  - status online/offline;
  - total de itens com erro permanente.
- Lista de itens com erro permanente com selecao por checkbox.
- Acoes de resolucao em lote:
  - `Reprocessar tudo`: move erros permanentes para `pending` e dispara sync quando online.
  - `Descartar selecionados`: remove itens selecionados da fila local.
- Navegacao adicionada no menu principal para acesso direto do usuario.

Validacao tecnica:
- Build de producao validado com sucesso (`npx vite build`).

## Atualizacao S3-03 (executado em 2026-02-08)

Arquivos alterados:
- `src/components/OperationalStateCard.tsx`
- `src/pages/app/LeadsMobile.tsx`
- `src/pages/app/OrcamentosMobile.tsx`
- `src/pages/app/PipelineMobile.tsx`

Entregue:
- Padrao unico de estados operacionais nas tres telas criticas com mesma linguagem, hierarquia visual e acao primaria:
  - `loading`
  - `vazio`
  - `erro`
  - `offline sem cache`
  - `sucesso/sincronizado`
- Componente reutilizavel `OperationalStateCard` centraliza copy, icones, visual e CTA.
- Leads, Orcamentos e Pipeline agora exibem feedback consistente de sync (`Dados sincronizados` + `Sincronizar agora`) e recuperacao (`Tentar novamente`).

Validacao tecnica:
- Build de producao validado com sucesso (`npx vite build`).

## Atualizacao S3-04 (executado em 2026-02-08)

Arquivos alterados:
- `src/components/OperationalStateCard.tsx`
- `src/pages/app/LeadsMobile.tsx`
- `src/pages/app/OrcamentosMobile.tsx`
- `src/pages/app/PipelineMobile.tsx`
- `src/pages/app/SyncCenterPage.jsx`
- `src/components/OfflineQueueErrors.tsx`

Entregue:
- Revisao de mensagens de erro/rede/fila com orientacao explicita de proximo passo.
- CTA contextual aplicada nos fluxos criticos:
  - `Tentar novamente`
  - `Ver fila` (abre `/app/sincronizacao`)
  - `Sincronizar agora`
  - `Abrir configuracoes` (quando reprocessamento ocorre offline)
- Estados visuais padronizados passaram a aceitar CTA secundaria para reduzir ambiguidade em cenarios de erro e offline sem cache.
- Toasts de mutacao offline (ex.: criacao de lead) agora orientam acao imediata e oferecem acesso direto ao Centro de Sincronizacao.

Validacao tecnica:
- Build de producao validado com sucesso (`npx vite build`).

## Atualizacao S3-05 (executado em 2026-02-08)

Arquivos alterados:
- `src/components/OperationalStateCard.tsx`
- `src/components/SyncStatus.tsx`
- `src/components/OfflineQueueErrors.tsx`
- `src/pages/app/SyncCenterPage.jsx`
- `src/pages/app/LeadsMobile.tsx`

Entregue:
- Estados e alertas com semantica para leitor de tela:
  - `role="status"` e `aria-live="polite"` em status de sync.
  - `role="alert"` e `aria-live="assertive"` para erros/offline sem cache.
  - `aria-atomic` em mensagens dinamicas.
- Melhorias de navegacao por teclado:
  - skip link no Centro de Sincronizacao para ir direto a tabela de pendencias.
  - controle expandir/ocultar com `aria-expanded` e `aria-controls` no bloco de erros de fila.
- Labels e semantica em formulario critico:
  - `Label htmlFor` + `Input id` no dialog de novo lead.
- Tabela de pendencias com descricoes mais claras para leitores de tela:
  - rótulos de selecao (`Selecionar todas as pendencias`, `Selecionar pendencia ...`).

Validacao tecnica:
- Build de producao validado com sucesso (`npx vite build`).

Pendencia residual:
- Auditoria dedicada de contraste AA em device real e leitor de tela (NVDA/VoiceOver) recomendada para fechamento operacional completo.

## Atualizacao S3-06 (executado em 2026-02-08)

Arquivos alterados:
- `supabase/pwa-qa-sprint3-usabilidade-device-real.md`

Entregue:
- Relatorio dedicado de QA manual em device real com checklist por plataforma:
  - Android Chrome (PWA instalado)
  - iOS Safari
  - Desktop Chrome
- Estrutura de evidencias exigidas por item (screenshot/video/anotacao).
- Criterio de aceite objetivo com controle de bloqueios P0/P1.

Status real da rodada:
- Execucao manual em hardware real: **pendente** (nao disponivel neste ambiente).
- Evidencia tecnica compilada:
  - build de producao validado.
  - implementacoes S3-01..S3-05 presentes e compilando.

Pendencia residual:
- Rodar checklist manual em dispositivos reais e anexar evidencias para aprovar S3-06 sem P0/P1 abertos.

## Atualizacao S4-01 (executado em 2026-02-08)

Arquivos alterados:
- `tailwind.config.js`
- `src/index.css`
- `src/components/OperationalStateCard.tsx`
- `src/components/SyncStatus.tsx`
- `src/components/OfflineQueueErrors.tsx`
- `src/pages/app/LeadsMobile.tsx`
- `src/pages/app/OrcamentosMobile.tsx`
- `src/pages/app/PipelineMobile.tsx`
- `src/pages/app/SyncCenterPage.jsx`

Entregue:
- Tokens centralizados no tema para uso PWA:
  - cor semantica: `success`, `warning`, `error`, `offline`, `syncing`;
  - espacamento: `--pwa-space-*`;
  - raio: `--pwa-radius-card`;
  - sombra: `--pwa-shadow-card`;
  - borda: `--pwa-border-subtle` e `--pwa-border-emphasis`.
- Classes de sistema visual PWA criadas em `index.css`:
  - superfícies (`pwa-surface-card`, `pwa-surface-pad`);
  - estados (`pwa-state--loading|empty|error|offline-empty|synced`);
  - chips de status (`pwa-status-chip--pending|synced|failed`).
- Componentes críticos migrados para consumo de tokens, removendo cores/estilos hardcoded nos fluxos principais de sync/offline.
- Tailwind atualizado para mapear cores semânticas e incluir `ts/tsx` no scan de classes.

Validacao tecnica:
- Build de producao validado com sucesso (`npx vite build`).

## Atualizacao S4-02 (executado em 2026-02-08)

Arquivos alterados:
- `src/index.css`
- `src/components/MobileHeader.tsx`
- `src/components/OperationalStateCard.tsx`
- `src/pages/app/LeadsMobile.tsx`
- `src/pages/app/OrcamentosMobile.tsx`
- `src/pages/app/PipelineMobile.tsx`
- `src/pages/app/SyncCenterPage.jsx`

Entregue:
- Escala tipografica PWA definida e centralizada:
  - `pwa-type-title`
  - `pwa-type-subtitle`
  - `pwa-type-body`
  - `pwa-type-meta`
- Densidade visual padronizada para leitura em campo:
  - tokens `--pwa-density-card-padding`, `--pwa-density-list-gap`, `--pwa-density-section-gap`;
  - utilitarios `pwa-list-compact` e `pwa-section-compact`.
- Telas foco (Leads, Orcamentos, Pipeline e Centro de Sincronizacao) migradas para a escala tipografica e densidade padronizada, removendo combinacoes dispersas de tamanhos/pesos.
- Header mobile alinhado a hierarquia de leitura com `pwa-type-subtitle`.

Validacao tecnica:
- Build de producao validado com sucesso (`npx vite build`).

## Atualizacao S4-03 (executado em 2026-02-08)

Arquivos alterados:
- `src/components/SystemStatus.tsx`
- `src/index.css`
- `src/components/SyncStatus.tsx`
- `src/components/OfflineQueueErrors.tsx`
- `src/pages/app/LeadsMobile.tsx`
- `src/pages/app/PipelinePage.jsx`
- `src/pages/app/OrcamentoFormPage.jsx`
- `src/pages/app/SyncCenterPage.jsx`

Entregue:
- Camada unificada de status criada em `SystemStatus` com semantica central:
  - estados: `pending`, `synced`, `failed`, `offline`, `syncing`, `warning`, `error`;
  - mesmo mapeamento de cor, icone e linguagem por estado.
- Componentes reutilizaveis aplicados:
  - `SystemStatusChip` para badges/chips;
  - `SystemStatusInline` para indicadores compactos (sync/offline).
- Fluxos criticos migrados:
  - indicador de sincronizacao (`SyncStatus`);
  - chips de mutacao em Leads mobile;
  - chips de feedback em Pipeline desktop;
  - chips de status em envio de Orcamento;
  - status de erro permanente no Centro de Sincronizacao e no alerta de fila.
- Tokens complementares adicionados:
  - `pwa-status-chip--offline`
  - `pwa-status-chip--syncing`

Validacao tecnica:
- Build de producao validado com sucesso (`npx vite build`).

## Atualizacao S4-04 (executado em 2026-02-08)

Arquivos alterados:
- `src/components/MobileOpsShortcuts.tsx`
- `src/layouts/MobileLayout.tsx`
- `src/pages/app/OrcamentosMobile.tsx`
- `src/pages/app/PipelineMobile.tsx`

Entregue:
- Atalho operacional global no mobile (disponivel em qualquer tela via `MobileLayout`):
  - `Sincronizar agora` (acao direta, com fallback orientado quando offline);
  - `Pendencias` com contador da fila offline em tempo real.
- Acesso rapido consolidado para:
  - sincronizacao (um toque);
  - pendencias offline/centro de sincronizacao (um toque).
- CTA critica adicionada nas telas principais que faltavam:
  - Orcamentos mobile: `Novo orcamento`;
  - Pipeline mobile: `Novo orcamento`.
- Resultado pratico:
  - menos toques para tarefas frequentes de campo (sincronizar, abrir pendencias e iniciar novo orcamento).

Validacao tecnica:
- Build de producao validado com sucesso (`npx vite build`).

## Atualizacao S4-05 (executado em 2026-02-08)

Arquivos alterados:
- `src/components/OperationalStateCard.tsx`
- `src/components/SyncStatus.tsx`
- `src/pages/app/SyncCenterPage.jsx`

Entregue:
- Motion funcional aplicado em pontos operacionais criticos, sem animacoes decorativas:
  - transicao entre estados (`loading`, `vazio`, `erro`, `offline sem cache`, `sincronizado`) no `OperationalStateCard`;
  - mudancas de status de conectividade/sync no `SyncStatus`;
  - feedback de sucesso/erro das acoes de fila (`Reprocessar tudo`, `Descartar selecionados`) no `SyncCenterPage`.
- Feedback de fila com mensagem transiente e auto-dismiss para reduzir ruido visual apos operacoes.
- Fallback de acessibilidade/performance para usuarios com `prefers-reduced-motion`:
  - transicoes reduzidas para mudancas minimas de opacidade, sem deslocamentos perceptiveis.

Validacao tecnica:
- Build de producao validado com sucesso (`npx vite build`).

## Atualizacao S4-06 (executado em 2026-02-08)

Arquivos alterados:
- `supabase/pwa-ux-ui-guidelines.md`

Entregue:
- Guia visual final publicado com padroes consolidados para proximas features PWA:
  - tokens de cor semantica, espacamento, raio, sombra e borda;
  - componentes canonicos (`SystemStatus*`, `OperationalStateCard`, prompts de install/update, atalhos mobile);
  - padroes de mensagem orientada a acao (toasts, banners e estados);
  - exemplos de uso em codigo e checklist de governanca para novas entregas.
- Guia alinhado ao estado real implementado no projeto (S3/S4), sem criar padrao paralelo.

Criterio de aceite:
- Guia publicado e pronto para uso como referencia oficial de UX/UI nas proximas features.

## Definicao de Pronto S3 + S4 (status em 2026-02-08)

- `[x]` Usuario entende e controla sincronizacao sem suporte tecnico.
- `[x]` Estados de erro/offline/sucesso sao consistentes em telas criticas.
- `[x]` Fluxo mobile principal reduz atrito operacional.
- `[x]` Sistema visual e guia de padroes estabelecidos para evolucao continua.
- `[~]` Validacao real-device concluida sem bloqueios P0/P1.

Bloqueio atual para aceite total:
- Execucao manual do checklist em device real ainda pendente (Android Chrome PWA instalado, iOS Safari e Desktop Chrome), conforme `supabase/pwa-qa-sprint3-usabilidade-device-real.md`.

Atualizacao tecnica desta rodada:
- Build de producao reexecutado com sucesso (`npm run build`).
- Artefatos PWA confirmados em `dist/` (`manifest.json`, `service-worker.js`, icones e metadados no `dist/index.html`).
- Tentativa de validacao runtime local via `vite preview` bloqueada por permissao do ambiente (`spawn EPERM`), sem impacto no bundle final.
