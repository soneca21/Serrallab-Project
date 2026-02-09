# PWA QA Sprint 1

Data: 2026-02-08  
Escopo: validacao tecnica de S1-01 ate S1-07 (build, installability, offline nav e dados offline).

## Checklist Tecnico

| Item | Status | Evidencia | Resultado |
|---|---|---|---|
| Build de producao | PASS | `npx vite build` | Build concluido sem erros; artefatos gerados em `dist/`. |
| Service Worker emitido | PASS | `dist/service-worker.js` | SW presente e compilado no bundle final. |
| Manifest e icones no build | PASS | `dist/manifest.json`, `dist/pwa-192x192.png`, `dist/pwa-512x512.png`, `dist/apple-touch-icon.png` | Arquivos de installability presentes no output. |
| Meta tags PWA no HTML final | PASS | `dist/index.html` | `manifest`, `theme-color`, `apple-mobile-web-app-*`, `mobile-web-app-capable` encontrados. |
| Navegacao offline SPA (fallback) | PASS | `dist/service-worker.js` | Handler `navigate` com fallback para `/index.html` confirmado. |
| Cache policies (shell/assets/imagens/API leitura) | PASS | `dist/service-worker.js` | Regras presentes: app shell precache, assets SWR, imagem cache-first, API leitura network-first. |
| Exclusao de mutacoes e auth sensivel do cache | PASS | `dist/service-worker.js` | Nao cacheia `POST/PUT/PATCH/DELETE` e ignora `authorization`, `/auth/v1`, `/token`. |
| Offline-first dados (Leads/Orcamentos/Pipeline) | PASS | `src/pages/app/LeadsMobile.tsx`, `src/pages/app/OrcamentosMobile.tsx`, `src/pages/app/PipelineMobile.tsx` | Fluxo cache primeiro + sync online + reload de cache aplicado nas 3 telas. |
| Fallback de primeiro acesso offline sem cache | PASS | `src/components/OfflineEmptyState.tsx`, telas mobile | Estado claro "Sem cache inicial ..." com acao de retry implementado. |

## Evidencias Coletadas

### 1) Build
- Comando executado: `npx vite build`
- Resultado: `vite v4.5.5` build finalizado com sucesso.

### 2) Installability
- Arquivos confirmados em `dist/`:
  - `manifest.json`
  - `pwa-192x192.png`
  - `pwa-512x512.png`
  - `apple-touch-icon.png`
  - `service-worker.js`
- `dist/index.html` contem:
  - `link rel="manifest"`
  - `meta name="theme-color"`
  - `meta name="apple-mobile-web-app-capable"`
  - `meta name="mobile-web-app-capable"`
  - `link rel="apple-touch-icon"`

### 3) Offline Navigation
- SW compilado (`dist/service-worker.js`) contem:
  - branch para `request.mode === "navigate"`
  - fallback para `"/index.html"` em falha de rede

### 4) Dados Offline
- Leituras mobile aplicam o padrao:
  1. `loadFromCache()`
  2. se online: `sync()`
  3. `loadFromCache()` novamente
- Pipeline usa agrupamento consistente via `groupOrdersByPipelineStage` (`src/lib/sync.ts`).

## Limites desta QA

- Teste manual em hardware real (Android Chrome e iOS Safari) ainda pendente para:
  - prompt nativo de instalacao Android,
  - fluxo iOS "Adicionar a Tela de Inicio",
  - comportamento de runtime offline em dispositivo fisico.

## Conclusao Sprint 1

Sprint 1 concluida tecnicamente no repositorio (S1-01 a S1-07), com pendencia apenas de validacao manual em device real para fechamento operacional final.
