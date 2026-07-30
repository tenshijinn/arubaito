# Public Waitlist Status API for Hermes

Yes — this is straightforward. The waitlist card's data (blocks remaining, time remaining, progress, and open-window minutes left) already exists inside the `check-block-clock` function; we expose it as a cached, public, read-only endpoint plus a periodic refresh job.

## What gets built

**1. Snapshot table `block_clock_status`** (single row, id = 1)
Stores the last computed status: current block, target block, blocks remaining, estimated seconds/human-readable time remaining, progress %, state (`countdown` | `open` | `closed`), unlocked_at, signup window minutes, minutes remaining in the open window, and `updated_at`.
Access rules: anyone (including signed-out visitors and external agents) can read it; only backend jobs can write it.

**2. Refresh function `refresh-block-clock-status`** (no auth required, called by cron)
Reuses the same Solana slot + config logic as the existing waitlist card, computes the fields above, and upserts the snapshot row.

**3. Public endpoint `block-clock-status`** (no auth required, GET)
Returns the snapshot as JSON with CORS open and a `stale: true` flag if the snapshot is older than expected. Hermes just does a `GET` — no keys needed.

Example response:
```text
{
  "state": "countdown",
  "current_block": 351240112,
  "target_block": 352240112,
  "blocks_remaining": 999888,
  "seconds_remaining": 399955,
  "time_remaining_human": "4d 15h 5m",
  "progress_percent": 0.01,
  "signup_open": false,
  "signup_window_minutes": 60,
  "signup_minutes_remaining": 0,
  "unlocked_at": null,
  "updated_at": "2026-07-30T17:00:00Z",
  "stale": false
}
```

**4. Cron schedule** (pg_cron + pg_net)
- Hourly: refresh always.
- Every 5 minutes: refresh only when the state is `open` (the job checks the snapshot state first and exits early otherwise, so it stays cheap).

## Technical notes

- Both functions registered with `verify_jwt = false` in `supabase/config.toml`, matching existing public functions.
- Table gets explicit grants: read for `anon` + `authenticated`, full access for `service_role`.
- The refresh function does not mutate `block_clock_config` (no unlock/reset side effects) — it only reads and snapshots, so it can't interfere with the live waitlist gate.
- Timing math mirrors `useBlockClock` (400ms/block) so the API and the on-site card never disagree.
- Endpoint URL will be `https://<backend>/functions/v1/block-clock-status`; I'll give you the exact URL after deploy.
