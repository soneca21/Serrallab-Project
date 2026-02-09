# Plano de Implementacao - Modo PWA (Serrallab)

## Objetivo
Entregar o modo PWA com foco em operacao de campo: app instalavel, uso offline confiavel, sincronizacao automatica e notificacoes relevantes.

## Etapas de Implementacao

1. Descoberta tecnica e criterios de aceite
- Mapear requisitos de negocio para uso sem internet (quais telas e quais acoes sao criticas).
- Definir criterios de aceite por fluxo: instalacao, leitura offline, escrita offline, sincronizacao e push.
- Definir metas iniciais (ex.: taxa de instalacao, sucesso de sync, erros por sessao).

2. Fundacao PWA (instalabilidade e shell)
- Integrar corretamente o registro do Service Worker no bootstrap da aplicacao.
- Garantir geracao/injecao do Service Worker no build de producao.
- Revisar `manifest.json` (name, short_name, start_url, display, icons, theme/background).
- Validar comportamento de instalacao em Android (beforeinstallprompt) e iOS (instrucoes de adicionar a tela inicial).

3. Estrategia de cache e navegacao offline
- Definir politica de cache por tipo de recurso:
  - App shell e assets estaticos.
  - Imagens.
  - Requests de API de leitura.
- Garantir fallback de navegacao para rotas SPA em modo offline.
- Definir expiracao e limpeza de caches para evitar crescimento sem controle.

4. UX de conectividade e estado de sincronizacao
- Exibir estado global: online, offline, sincronizando, erro de sincronizacao.
- Exibir ultima atualizacao por contexto (ex.: Leads/Orcamentos/Pipeline).
- Criar estado de vazio offline para primeiro acesso sem cache.
- Padronizar mensagens de erro de rede com acao de tentar novamente.

5. Offline-first de leitura (dados essenciais)
- Consolidar cache local de Leads, Orcamentos e Pipeline em IndexedDB.
- Definir ordem de carregamento: cache local primeiro, rede depois (quando disponivel).
- Garantir consistencia de transformacoes (ex.: `pipeline_stage_name`) tambem no modo offline.
- Cobrir refresh manual e refresh automatico ao recuperar conexao.

6. Escrita offline com fila local (prioridade alta)
- Definir quais mutacoes entram no MVP (ex.: criar lead, atualizar etapa do pipeline, atualizar status de orcamento).
- Implementar fila local de mutacoes pendentes com metadata de controle (idempotency_key, created_at, retry_count).
- Exibir ao usuario quais itens estao pendentes de envio.
- Reprocessar fila automaticamente ao voltar conexao.

7. Reconciliacao e conflitos
- Definir politica de conflito para v1 (ex.: ultima escrita vence + alerta de divergencia).
- Registrar conflitos em log tecnico para suporte.
- Criar UI minima para reprocessar/descartar item com erro permanente.

8. Sync resiliente (retry e observabilidade)
- Implementar retry com backoff para falhas temporarias.
- Diferenciar falha temporaria vs falha permanente.
- Registrar metricas operacionais: pendencias, taxa de sucesso, tempo medio de sincronizacao, conflitos.
- Criar painel simples (ou logs estruturados) para acompanhamento pos-lancamento.

9. Push notifications (valor real para o usuario)
- Revisar permissao e assinatura push com token por usuario/dispositivo.
- Definir eventos de alto valor (lead novo, orcamento aprovado, tarefas/agenda).
- Permitir configuracao de preferencia por tipo de notificacao.
- Garantir clique da notificacao abrindo a rota correta no app.

10. QA PWA e testes de regressao
- Rodar auditoria Lighthouse (PWA + Performance + Best Practices).
- Executar checklist manual em cenarios reais:
  - primeira instalacao,
  - abertura offline,
  - reconexao,
  - envio de fila pendente,
  - push em foreground/background.
- Validar comportamento em Android Chrome, iOS Safari e desktop Chrome.

11. Rollout controlado
- Liberar para grupo piloto de usuarios.
- Monitorar metricas e erros por 3 a 7 dias.
- Ajustar politicas de cache/sync com base em dados reais.
- Expandir rollout gradualmente para 100% da base.

12. Pos-lancamento (hardening)
- Tratar lacunas de UX detectadas no piloto.
- Revisar performance de startup e tamanho de cache.
- Evoluir para suporte completo a mutacoes offline em mais modulos.
- Documentar runbook de incidentes de sincronizacao.

## Backlog inicial sugerido (P0, P1, P2)

P0
- Registro/integacao correta de Service Worker no app.
- Manifest e instalacao funcionando de ponta a ponta.
- Cache de leitura para Leads/Orcamentos/Pipeline.
- Indicadores de status offline/sync.
- Fila offline para 3 mutacoes criticas.

P1
- Politica de conflito com UI minima de resolucao.
- Retry com backoff e telemetria operacional.
- Push com eventos de alto valor e deep-link.

P2
- Expansao da fila offline para mais fluxos.
- Dashboard operacional dedicado de sincronizacao.
- Otimizacoes finas de cache e performance.

## Definicao de pronto (DoD) para v1
- App instalavel e abrindo como standalone.
- App abre sem internet apos primeiro carregamento.
- Usuario consulta Leads, Orcamentos e Pipeline offline.
- Usuario realiza mutacoes P0 offline e sincroniza ao reconectar.
- Conflitos e falhas visiveis para o usuario e para suporte tecnico.

## Planejamento de Sprint (2 semanas)

### Premissas de estimativa
- Time base: 1 dev fullstack.
- Capacidade alvo: ~60 horas por sprint (5 dias uteis, 12h/dia bruto com multitarefa).
- Escala: S (2-4h), M (6-10h), L (12-16h).

### Sprint 1 - Fundacao PWA + Offline de leitura
Objetivo: app instalavel e consulta offline confiavel para Leads, Orcamentos e Pipeline.

| ID | Prioridade | Tarefa | Estimativa | Dependencias | Resultado esperado |
|---|---|---|---|---|---|
| S1-01 | P0 | Registrar Service Worker no bootstrap e no build de producao | M (8h) | Nenhuma | SW ativo em producao com ciclo de atualizacao previsivel |
| S1-02 | P0 | Revisar manifest e fluxo de instalacao (Android + iOS) | M (6h) | S1-01 | Instalacao consistente e app abrindo em modo standalone |
| S1-03 | P0 | Definir politicas de cache (shell, assets, imagens, API leitura) | L (12h) | S1-01 | Navegacao offline funcional e cache controlado |
| S1-04 | P0 | UX de conectividade e sync (online/offline/sincronizando/ultima atualizacao) | M (8h) | S1-03 | Estado de rede visivel e compreensivel ao usuario |
| S1-05 | P0 | Consolidar leitura offline para Leads/Orcamentos/Pipeline (cache-first + refresh) | L (12h) | S1-03 | Dados essenciais acessiveis sem internet |
| S1-06 | P1 | Fallback de primeiro acesso offline sem cache | S (4h) | S1-05 | Mensagem clara sem tela quebrada |
| S1-07 | P1 | QA PWA (Lighthouse + checklist manual Android/iOS/Desktop) | M (8h) | S1-06 | Validacao tecnica para fechar sprint |

Total estimado Sprint 1: 58h

### Sprint 2 - Escrita offline + Sync resiliente + Push
Objetivo: permitir operacao offline com fila local, reconciliacao e notificacoes de alto valor.

| ID | Prioridade | Tarefa | Estimativa | Dependencias | Resultado esperado |
|---|---|---|---|---|---|
| S2-01 | P0 | Modelar fila local de mutacoes (idempotency_key, retry_count, timestamps, status) | L (12h) | S1 concluida | Base de escrita offline padronizada |
| S2-02 | P0 | Executor da fila com retry/backoff e reprocessamento ao reconectar | L (12h) | S2-01 | Entrega automatica das pendencias |
| S2-03 | P0 | Integrar 3 mutacoes criticas no modo offline (MVP) | L (14h) | S2-02 | Usuario consegue operar sem internet em fluxos essenciais |
| S2-04 | P1 | Politica de conflitos v1 + UI minima (reprocessar/descartar) | M (8h) | S2-03 | Tratamento previsivel para divergencias |
| S2-05 | P1 | Push notifications de alto valor + deep-link para rotas | M (8h) | S1-02 | Notificacao util e navegacao correta ao clicar |
| S2-06 | P1 | Preferencias de notificacao por tipo de evento | M (6h) | S2-05 | Controle de ruido para usuario |
| S2-07 | P1 | Telemetria operacional (sync_success, sync_error, conflito, pendencias) | M (8h) | S2-02 | Visibilidade de operacao para suporte e produto |

Total estimado Sprint 2: 68h

### Ajuste de capacidade recomendado
- Sprint 2 esta acima da capacidade alvo (~68h vs ~60h).
- Opcoes para caber no prazo:
  - mover S2-06 (preferencias de notificacao) para Sprint 3;
  - reduzir escopo de S2-03 para 2 mutacoes criticas no MVP;
  - manter tudo com buffer menor e risco maior de carry-over.

### Criterios de encerramento por sprint
- Sprint 1 encerrada quando: app instala, abre offline apos primeiro uso, e carrega Leads/Orcamentos/Pipeline via cache local.
- Sprint 2 encerrada quando: usuario executa mutacoes P0 offline, sincroniza ao reconectar, e conflitos/falhas ficam visiveis.

### Sprint 3 (opcional, hardening)
- Expandir mutacoes offline para modulos secundarios.
- Melhorar dashboard operacional de sincronizacao.
- Ajustar performance de startup e politicas de cache com dados reais.

## Prompts para execucao no Codex

Use na ordem abaixo.

1.
```text
Leia `supabase/pwa-modo-campo-implementacao.md` e crie um plano executavel em `supabase/pwa-implementacao-status.md` com checklist S1/S2/S3.
Mapeie o estado atual do PWA e identifique gaps reais no codigo (principalmente SW, manifest, install, offline/sync).
Nao implemente ainda; so diagnostico tecnico com arquivos afetados e ordem de execucao.
```

2.
```text
Implemente a tarefa S1-01 (fundacao PWA): integrar registro real do Service Worker em producao e garantir build funcional.
Se necessario, adote `vite-plugin-pwa` e adapte o SW para Vite.
Arquivos alvo: `vite.config.js`, `src/main.jsx`, `src/service-worker.ts` (ou `src/sw.ts`).
No final rode build e atualize `supabase/pwa-implementacao-status.md` com o que foi feito e pendencias.
```

3.
```text
Implemente S1-02: manifest e instalacao.
Ajuste `public/manifest.json`, meta tags PWA em `index.html`, fluxo de instalacao Android em `src/hooks/usePWA.ts` e UX em `src/components/InstallPrompt.tsx`.
Inclua fallback de instrucao para iOS (sem beforeinstallprompt).
Finalize com validacao manual e atualizacao de status em `supabase/pwa-implementacao-status.md`.
```

4.
```text
Implemente S1-03: estrategia de cache offline no Service Worker.
Defina politicas para app shell, assets, imagens e leitura de API.
Nao cacheie mutacoes (POST/PUT/PATCH/DELETE) nem respostas sensiveis de auth.
Inclua fallback de navegacao SPA offline.
Finalize com build + teste local e registre decisoes em `supabase/pwa-implementacao-status.md`.
```

5.
```text
Implemente S1-04: UX de conectividade e sincronizacao.
Crie estado global consistente para online/offline/sincronizando/ultima sincronizacao, evitando multiplos gatilhos de sync em paralelo.
Atualize os componentes visuais ja existentes para usar esse estado central.
Atualize `supabase/pwa-implementacao-status.md` com comportamento final.
```

6.
```text
Implemente S1-05: offline-first de leitura para Leads, Orcamentos e Pipeline.
Carregue cache local primeiro e depois rede quando disponivel; mantenha consistencia das transformacoes (ex.: stage do pipeline).
Revise `src/lib/offline.ts`, `src/lib/sync.ts` e telas mobile relacionadas.
Inclua tratamento para dados vazios e erros de leitura.
```

7.
```text
Implemente S1-06 e S1-07: fallback de primeiro acesso offline + QA PWA.
Crie tela/estado claro para "sem cache inicial".
Rode checklist tecnico e gere um relatorio em `supabase/pwa-qa-sprint1.md` com resultados (build, installability, offline nav, dados offline).
Atualize `supabase/pwa-implementacao-status.md`.
```

8.
```text
Implemente S2-01: fila local de mutacoes offline em IndexedDB.
Modele stores e tipos para pendencias com `idempotency_key`, `retry_count`, `created_at`, `last_error`, `status`.
Crie API utilitaria para enfileirar, listar, atualizar status e remover item processado.
Documente schema em `supabase/pwa-offline-queue.md`.
```

9.
```text
Implemente S2-02: processador da fila com retry/backoff.
Dispare processamento ao voltar conexao e em inicializacao quando online.
Classifique falhas temporarias vs permanentes e mantenha logs uteis.
Evite envios duplicados usando idempotencia.
Atualize status em `supabase/pwa-implementacao-status.md`.
```

10.
```text
Implemente S2-03: integrar 3 mutacoes criticas no modo offline (MVP).
Escolha e implemente: criar lead, atualizar etapa de pipeline e atualizar status de orcamento.
Quando offline: enfileira. Quando online: executa direto e mantem consistencia local.
Adicione feedback de "pendente/sincronizado/falhou" na UI.
```

11.
```text
Implemente S2-04: politica de conflitos v1.
Aplique regra clara (ex.: ultima escrita vence) e registre divergencias.
Crie UI minima para reprocessar ou descartar itens com erro permanente.
Gere notas tecnicas em `supabase/pwa-conflitos-v1.md`.
```

12.
```text
Implemente S2-05 e S2-06: push notifications de alto valor + preferencias.
Garanta deep-link correto ao clicar na notificacao e preferencias por tipo de evento.
Revise integracao com token push e comportamento foreground/background.
Atualize `supabase/pwa-implementacao-status.md` e adicione checklist em `supabase/pwa-push-qa.md`.
```

13.
```text
Implemente S2-07: telemetria operacional de PWA/sync.
Registrar eventos minimos: install_prompt_shown, app_installed, sync_success, sync_error, queue_size, conflict_detected.
Persistir de forma simples e consultar via logs/tabela existente (sem overengineering).
Criar documento `supabase/pwa-telemetria.md` com eventos e campos.
```

14.
```text
Faca fechamento tecnico da iniciativa PWA.
Rode build final, verifique regressoes criticas e gere relatorio final em `supabase/pwa-release-report.md` com:
- o que foi entregue
- o que ficou pendente
- riscos conhecidos
- proximos passos (Sprint 3 hardening)
Atualize `supabase/pwa-implementacao-status.md` para 100% ou com pendencias claras.
```
