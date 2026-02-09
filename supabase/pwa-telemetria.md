# PWA Telemetria Operacional (S2-07)

Data: 2026-02-08
Objetivo: registrar sinais minimos de operacao PWA/sync sem criar infraestrutura nova.

## Persistencia

- Tabela usada: `audit_logs` (existente).
- Convencao de registro:
  - `entity = 'pwa_telemetry'`
  - `entity_id = <event_name>`
  - `action = 'UPDATE'`
  - `details` contem payload do evento.

## Eventos Minimos

1. `install_prompt_shown`
- Quando dispara:
  - Android: evento `beforeinstallprompt`.
  - iOS: exibicao do fallback de instrucao de instalacao.
- Campos em `details`:
  - `event` (string)
  - `source` (`beforeinstallprompt` | `fallback_instruction`)
  - `platform` (`android` | `ios`)
  - `occurred_at` (ISO string)

2. `app_installed`
- Quando dispara:
  - Evento `appinstalled`.
  - Confirmacao de modo standalone (`display-mode`/`navigator.standalone`).
- Campos em `details`:
  - `event`
  - `source` (`appinstalled_event` | `pwa`)
  - `platform` (`ios` | `web`)
  - `occurred_at`

3. `queue_size`
- Quando dispara:
  - Inicio de `syncAll()`, apos processar fila local.
- Campos em `details`:
  - `event`
  - `total`
  - `processed`
  - `failed_temporary`
  - `failed_permanent`
  - `skipped_backoff`
  - `skipped_duplicate`
  - `skipped_no_processor`
  - `occurred_at`

4. `sync_success`
- Quando dispara:
  - Finalizacao bem-sucedida de `syncAll()`.
- Campos em `details`:
  - `event`
  - `leads_count`
  - `orcamentos_count`
  - `queue_total`
  - `queue_processed`
  - `occurred_at`

5. `sync_error`
- Quando dispara:
  - Falha em `syncAll()`.
- Campos em `details`:
  - `event`
  - `message`
  - `occurred_at`

6. `conflict_detected`
- Quando dispara:
  - Registro de conflito em `logOfflineConflict()`.
- Campos em `details`:
  - `event`
  - `mutation_type`
  - `entity`
  - `idempotency_key`
  - `resolution`
  - `occurred_at`

## Consulta Rapida

Exemplo SQL:

```sql
select
  created_at,
  user_id,
  company_id,
  entity_id as event_name,
  details
from audit_logs
where entity = 'pwa_telemetry'
order by created_at desc
limit 200;
```

## Observacoes

- Telemetria depende de usuario autenticado (usa contexto de `auth` para `user_id/company_id`).
- Eventos com alta chance de duplicidade no mesmo ciclo usam dedupe por `sessionStorage`.
