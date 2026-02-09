# PWA UX/UI Guidelines

Data: 2026-02-08  
Escopo: referencia de UX/UI para novas features do PWA (mobile e desktop), alinhada ao que ja esta implementado em S3/S4.

## 1) Tokens do Sistema Visual

Fonte principal:
- `src/index.css`
- `tailwind.config.js`

### 1.1 Cores semanticas

Usar sempre tokens semanticos; evitar hex solto em componente.

- `success`: estado concluido/sincronizado.
- `warning`: pendencia/atencao.
- `error`: falha/erro bloqueante.
- `offline`: sem conexao.
- `syncing`: sincronizacao em andamento.

Aplicacao recomendada:
- badges/chips de estado (`SystemStatusChip`).
- feedback inline (`SystemStatusInline`).
- estados operacionais (`pwa-state--*`).

### 1.2 Espacamento, raio, sombra e borda

Tokens base:
- `--pwa-space-xs|sm|md|lg`
- `--pwa-radius-card`
- `--pwa-shadow-card`
- `--pwa-border-subtle`
- `--pwa-border-emphasis`

Padrao:
- Cards operacionais devem usar `pwa-surface-card`.
- Conteudo interno deve usar `pwa-surface-pad`.
- Evitar `px/py` arbitrario sem necessidade real.

### 1.3 Tipografia e densidade

Classes padrao:
- `pwa-type-title`
- `pwa-type-subtitle`
- `pwa-type-body`
- `pwa-type-meta`

Densidade:
- `pwa-list-compact`
- `pwa-section-compact`

Regra:
- Tela critica (Leads, Orcamentos, Pipeline, Sync) deve usar essas classes antes de criar variacao local.

## 2) Componentes Canonicos

### 2.1 Status semantico

Fonte:
- `src/components/SystemStatus.tsx`

Estados suportados:
- `pending`
- `synced`
- `failed`
- `offline`
- `syncing`
- `warning`
- `error`

Uso:
- `SystemStatusChip`: estado em listas/cards.
- `SystemStatusInline`: estado compacto em header/linha.

Nao fazer:
- criar chip novo com cor/icone manual para estados ja existentes.

### 2.2 Estados operacionais de tela

Fonte:
- `src/components/OperationalStateCard.tsx`

Estados canonicos:
- `loading`
- `empty`
- `error`
- `offline-empty`
- `synced`

Regra de UX:
- sempre apresentar proximo passo via CTA.
- para erro e offline sem cache, usar mensagem orientada a acao.

### 2.3 Instalacao e update de app

Fontes:
- `src/components/InstallPrompt.tsx`
- `src/components/ServiceWorkerUpdatePrompt.jsx`

Padroes:
- Install:
  - Android: usar `beforeinstallprompt`.
  - iOS: fallback textual "Compartilhar > Adicionar a Tela de Inicio".
- Update de SW:
  - CTA primario: `Atualizar agora`.
  - CTA secundario: `Depois`.

### 2.4 Atalhos operacionais mobile

Fonte:
- `src/components/MobileOpsShortcuts.tsx`

Padrao minimo:
- botao de sync imediato.
- acesso rapido para pendencias/fila.
- contador de fila visivel quando houver itens.

## 3) Padroes de Mensagem

## 3.1 Estrutura de mensagem

Formato recomendado:
- Titulo curto (estado atual).
- Descricao com proximo passo explicito.
- CTA contextual quando aplicavel.

Exemplos de CTA:
- `Tentar novamente`
- `Sincronizar agora`
- `Ver fila`
- `Abrir configuracoes`
- `Descartar selecionados`
- `Reprocessar tudo`

## 3.2 Linguagem

Diretrizes:
- verbo de acao no inicio.
- sem mensagem vaga ("Erro inesperado" isolado nao e suficiente).
- quando offline, informar claramente que a acao sera enfileirada ou depende de reconexao.

## 3.3 Severidade

- `status`/`polite`: sucesso, loading e mudancas nao bloqueantes.
- `alert`/`assertive`: erro e offline sem cache inicial.

Referencias:
- `OperationalStateCard` (papel/aria-live por tipo).
- `SyncStatus` (status dinamico).

## 4) Motion Funcional

Fontes:
- `src/components/OperationalStateCard.tsx`
- `src/components/SyncStatus.tsx`
- `src/pages/app/SyncCenterPage.jsx`

Regra:
- animar apenas mudanca de estado relevante.
- duracao curta (~0.16s-0.20s).
- sem animacao ornamental continua.

Reduced motion:
- respeitar `useReducedMotion()` com transicao minima de opacidade.

## 5) Acessibilidade Base

Checklist minimo por feature:
- foco de teclado visivel.
- ordem de tab coerente.
- labels explicitos para inputs e acoes.
- contraste AA para textos/estados.
- componentes de status com `role` e `aria-live` adequados.

Componentes de referencia:
- `src/components/OperationalStateCard.tsx`
- `src/pages/app/SyncCenterPage.jsx`

## 6) Exemplos de Uso

### 6.1 Estado de erro com acao primaria/secundaria

```tsx
<OperationalStateCard
  kind="error"
  title="Falha ao carregar Leads"
  description="Verifique a conexao ou abra a fila para revisar pendencias."
  onPrimaryAction={retryLoad}
  primaryActionLabel="Tentar novamente"
  onSecondaryAction={() => navigate('/app/sincronizacao')}
  secondaryActionLabel="Ver fila"
/>
```

### 6.2 Chip de status de sincronizacao

```tsx
<SystemStatusChip status="syncing" label="Sincronizando" />
```

### 6.3 Mensagem de erro orientada a acao (toast)

```tsx
toast({
  title: 'Erro ao reprocessar',
  description: 'Tente novamente ou descarte itens com erro permanente.',
  variant: 'destructive',
});
```

## 7) Do/Don't Rapido

Do:
- reutilizar componentes canonicos.
- manter linguagem de acao.
- usar tokens e classes `pwa-*`.
- manter consistencia de cor/icone por estado.

Don't:
- criar novo padrao visual para estado ja existente.
- usar copy generica sem proximo passo.
- quebrar reduced motion com animacoes longas.
- espalhar valores visuais hardcoded em tela.

## 8) Governanca para Novas Features

Fluxo recomendado para cada entrega nova:
1. Mapear estado operacional da feature (loading, vazio, erro, offline-empty, synced).
2. Aplicar componentes canonicos (`OperationalStateCard`, `SystemStatus*`).
3. Revisar mensagens com CTA.
4. Validar acessibilidade minima.
5. Validar em mobile e desktop.

Resultado esperado:
- Toda feature nova entra no app com padrao visual e operacional consistente com este guia.
