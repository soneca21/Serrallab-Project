# PWA Conflitos v1 (S2-04)

Data: 2026-02-08

## Politica de Conflitos (v1)

Regra aplicada: **Last Write Wins (LWW)**.

- Quando a mutacao offline for processada, ela sempre pode sobrescrever o valor remoto no campo alvo.
- Antes de aplicar a escrita, o processador consulta snapshot remoto (`updated_at` + campo alvo).
- Se detectar que o remoto foi atualizado depois da criacao da mutacao offline e diverge do valor local:
  - registra divergencia em log local (`offline_conflicts`);
  - aplica LWW mesmo assim.

## Escopo desta v1

Conflitos monitorados nas mutacoes MVP:
- `order.update_pipeline_stage`
- `order.update_status`

Mutacao `lead.create` nao usa comparacao de conflito de campo (usa idempotencia por `id`/`idempotency_key`).

## Registro de Divergencias

Store local: `offline_conflicts` (IndexedDB `serrallab-db`, versao `3`)

Campos registrados:
- `id`
- `created_at`
- `mutation_type`
- `entity`
- `idempotency_key`
- `local_snapshot`
- `remote_snapshot`
- `resolution` (`last_write_wins`)
- `note`

Uso:
- rastreabilidade tecnica;
- apoio ao suporte para diagnostico de sobrescritas.

## Erros Temporarios vs Permanentes

Classificacao implementada no processador de fila:
- Temporario: rede/timeout/`408`/`429`/`5xx`.
- Permanente: demais falhas.

Comportamento:
- Temporario: permanece em fila para retry automatico com backoff exponencial.
- Permanente: marcado com `failure_type: 'permanent'` e nao entra em retry automatico.

## UI Minima para Falha Permanente

Componente: `src/components/OfflineQueueErrors.tsx`

Funcionalidades:
- Lista pendencias com erro permanente.
- Acoes por item:
  - `Reprocessar` (requeue manual para `pending` e tentativa de sync se online).
  - `Descartar` (remove da fila).

Integracao:
- `src/layouts/MobileLayout.tsx`
- `src/layouts/AppLayout.jsx`

## Limitacoes da v1

- Nao ha merge semantico de campos; apenas sobrescrita LWW.
- Regras de conflito ainda focadas nas mutacoes MVP de pedidos.
- UI de conflitos e minima e operacional (nao traz timeline detalhada).
