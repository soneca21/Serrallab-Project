# PWA Offline Queue (S2-01)

Data: 2026-02-08

## Objetivo

Definir a fila local de mutacoes offline em IndexedDB para suportar escrita offline com controle de reprocessamento.

## Banco e Store

- Banco IndexedDB: `serrallab-db`
- Versao: `2`
- Store: `offline_mutation_queue`
- KeyPath: `id`

## Schema do Item de Fila

Arquivo de tipos: `src/types/pwa.ts`  
Tipo: `OfflineMutationQueueItem`

Campos:
- `id: string`
- `created_at: string` (ISO)
- `updated_at: string` (ISO)
- `idempotency_key: string`
- `mutation_type: string`
- `entity: string`
- `payload: unknown`
- `retry_count: number`
- `last_error: string | null`
- `status: 'pending' | 'processing' | 'failed' | 'processed'`

## Indices

- `by_status` (nao unico)
- `by_created_at` (nao unico)
- `by_idempotency_key` (unico)

## API Utilitaria

Arquivo: `src/lib/offlineQueue.ts`

### Enfileirar
- `enqueueOfflineMutation(input)`
- Comportamento:
  - se `idempotency_key` ja existir, retorna item existente (evita duplicado).
  - se nao existir, cria item com timestamps e status inicial (`pending` por padrao).

### Listar
- `listOfflineMutations(options?)`
- Opcoes:
  - `status` para filtrar
  - `limit` para limitar retorno
- Ordenacao: `created_at` ascendente.

### Atualizar status
- `updateOfflineMutationStatus(id, status, params?)`
- Atualiza:
  - `status`
  - `updated_at`
  - opcionalmente `retry_count` e `last_error`

### Incrementar retry
- `incrementOfflineMutationRetry(id, errorMessage?)`
- Regra:
  - incrementa `retry_count`
  - marca item como `failed`
  - atualiza `last_error`

### Remover processado
- `removeOfflineMutation(id)`
- Remove item por ID.

### Limpeza em lote
- `clearProcessedOfflineMutations()`
- Remove todos os itens com status `processed`.

### Contagem
- `countOfflineMutations(status?)`
- Retorna quantidade total ou por status.

## Observacoes de design

- O schema inclui os campos obrigatorios solicitados:
  - `idempotency_key`
  - `retry_count`
  - `created_at`
  - `last_error`
  - `status`
- A idempotencia local e garantida pelo indice unico em `idempotency_key`.
- O modulo foi separado (`offlineQueue.ts`) para isolamento da responsabilidade de fila.
