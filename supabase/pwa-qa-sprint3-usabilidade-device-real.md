# PWA QA Sprint 3 - Usabilidade em Device Real (S3-06)

Data: 2026-02-08  
Escopo: validacao manual de usabilidade operacional em ambiente real (Android Chrome PWA instalado, iOS Safari, Desktop Chrome).

## Status desta rodada

- Resultado: **pendente de execucao em device real**
- Motivo: o ambiente atual nao possui acesso a hardware/dispositivos reais para captura de evidencia operacional.
- Evidencia tecnica disponivel nesta rodada:
  - build de producao concluido com sucesso (`npm run build`);
  - artefatos PWA confirmados em `dist/` (`manifest.json`, `service-worker.js`, icones);
  - metadados PWA confirmados no `dist/index.html` (manifest, theme-color, apple tags);
  - fluxos S3-01..S3-05 e S4-01..S4-06 implementados e compilando sem erro.
- Observacao de ambiente:
  - tentativa de `vite preview` bloqueada por permissao do ambiente (`spawn EPERM`);
  - validacao runtime em navegador local neste ambiente ficou limitada a checagem de build/artefatos.

## Criterio de aceite (S3-06)

- Checklist aprovado com evidencias por plataforma.
- Sem bloqueios P0/P1 abertos nos fluxos principais.

## Checklist Manual por Plataforma

Legenda:
- `OK`: aprovado
- `NOK`: falhou
- `N/A`: nao aplicavel
- `PEND`: nao executado

### 1) Android Chrome (PWA instalado)

| Item | Resultado | Evidencia |
|---|---|---|
| Install prompt aparece e instala corretamente | PEND | screenshot/video |
| App abre em modo standalone apos instalacao | PEND | screenshot |
| Fluxo de update SW mostra aviso e atualiza com "Atualizar agora" | PEND | video curto |
| Navegacao teclado (quando aplicavel com teclado BT) sem bloqueio | PEND | anotacao |
| Centro de Sincronizacao (`/app/sincronizacao`) exibe fila/ultimo sync/erros | PEND | screenshot |
| Acao "Reprocessar tudo" funciona e atualiza estado | PEND | screenshot antes/depois |
| Acao "Descartar selecionados" funciona | PEND | screenshot antes/depois |
| Estados padronizados (loading/vazio/erro/offline sem cache/sincronizado) coerentes em Leads/Orcamentos/Pipeline | PEND | screenshots |
| Mensagens com CTA contextual (Tentar novamente/Ver fila/Sincronizar agora) | PEND | screenshot |
| Push click abre rota correta (deep-link) | PEND | video curto |

### 2) iOS Safari

| Item | Resultado | Evidencia |
|---|---|---|
| Instrucoes de instalacao iOS exibidas corretamente | PEND | screenshot |
| Fluxo de abertura "Adicionar a Tela de Inicio" compreensivel | PEND | anotacao |
| Navegacao por toque e teclado externo sem bloqueios obvios | PEND | anotacao |
| Estados padronizados em Leads/Orcamentos/Pipeline | PEND | screenshots |
| Centro de Sincronizacao com acoes de resolucao de pendencia | PEND | screenshot |
| Sem regressao visual critica de contraste em cards/status/alertas | PEND | screenshot + anotacao |

### 3) Desktop Chrome

| Item | Resultado | Evidencia |
|---|---|---|
| Navegacao por teclado (Tab/Shift+Tab/Enter/Esc) sem travas | PEND | video curto |
| Ordem de foco coerente no Centro de Sincronizacao | PEND | anotacao |
| Skip link funciona e move foco para tabela de pendencias | PEND | video curto |
| Leitor de tela anuncia status/alertas (NVDA/VoiceOver) | PEND | anotacao |
| Tabela de pendencias possui labels claras para selecao | PEND | screenshot |
| Toats/banners de erro orientam proximo passo com CTA | PEND | screenshot |

## Registro de Bloqueios P0/P1

- P0 abertos: **PENDENTE (aguardando execucao em device real)**
- P1 abertos: **PENDENTE (aguardando execucao em device real)**

Preencher apos execucao:
- `P0`: [listar ids/descricao]
- `P1`: [listar ids/descricao]

## Evidencias Minimas para Aprovar S3-06

1. 1 screenshot por item principal aprovado em cada plataforma.
2. 1 video curto para:
   - update do app (S3-01),
   - fluxo de resolucao no Centro de Sincronizacao (S3-02),
   - navegacao por teclado no desktop (S3-05 + S3-06).
3. Lista final de P0/P1 = vazio.

## Execucao Assistida Recomendada (para fechar criterio 5)

1. Subir app local em modo producao (`npm run build` + `npm run preview`) ou ambiente de homologacao.
2. Rodar checklist Android Chrome (PWA instalado) e anexar evidencias na tabela.
3. Rodar checklist iOS Safari e anexar evidencias na tabela.
4. Rodar checklist Desktop Chrome (teclado/foco/leitor) e anexar evidencias na tabela.
5. Preencher `P0` e `P1` como vazio e marcar itens `OK`.
6. Atualizar `supabase/pwa-implementacao-status.md`:
   - marcar criterio 5 como `[x]`;
   - registrar data da validacao real-device e responsavel.

## Conclusao

- S3-06 permanece **pendente** ate execucao manual real em Android Chrome, iOS Safari e Desktop Chrome com evidencias anexadas.
- Do ponto de vista tecnico (build, artefatos PWA e implementacao), a base esta pronta para rodada final de aceitacao em dispositivo real.
