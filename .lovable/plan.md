

## Confirm: Rei and Arubaito Are NOT Fully Split

The previous decoupling was incomplete. Here's the remaining coupling:

### Still Coupled (Arubaito frontend → Rei tables)

| File | Reads/writes Rei table |
|------|----------------------|
| `ReiEarningsHub.tsx` | `rei_registry` |
| `ReiPointsCard.tsx` | `rei_registry` |
| `AdminReiRegistrySection.tsx` | `rei_registry` |
| `AdminJobsSection.tsx` | `jobs` |
| `AdminCommunitySection.tsx` | `community_submissions` |
| `PostToRei.tsx` | `jobs`, `tasks` |
| `Community.tsx` (page) | `community_submissions` |

### Rei Files Still in This Repo

**Pages:** `Rei.tsx`, `JoinRei.tsx`
**Components:** `ReiChatbot.tsx`, `ReiEarningsHub.tsx`, `ReiPointsCard.tsx`, `PostToRei.tsx`, `AudioRecorder.tsx`, `VideoRecorder.tsx`, entire `joinrei/` folder (11 files), `chat/` folder (4 files)
**Assets:** `rei-logo.png`, `rei-split.png`, `bg-rei1.webp`, `rei-logo-eye.png`, `rei-usp-*.png`, `rei-button.png`, entire `joinrei/` asset folder
**Edge Functions:** `rei-chat`, `submit-rei-registration`, `check-rei-registration`, `analyze-rei-profile`, `match-jobs-to-talent`, `match-talent-to-jobs`, `search-jobs`, `oracle-tweet-tracker`, `ingest-job-signals`, `ingest-rss-feeds`, `submit-community-opportunity`, `review-community-submission`
**Admin sections:** `AdminReiRegistrySection.tsx`, `AdminJobsSection.tsx`, `AdminCommunitySection.tsx`

---

## Plan: Export Rei to New Lovable Project and Remove from Arubaito

### Phase 1 — Create New Rei Project

Create a new Lovable project for Rei. Manually copy over (via cross-project tools) all Rei-specific files:

- **Pages:** `Rei.tsx`, `JoinRei.tsx`, `Community.tsx`
- **Components:** `ReiChatbot.tsx`, `ReiEarningsHub.tsx`, `ReiPointsCard.tsx`, `PostToRei.tsx`, `AudioRecorder.tsx`, `VideoRecorder.tsx`, `chat/*`, `joinrei/*`
- **Assets:** all `rei-*` and `joinrei/` assets
- **Edge Functions:** all 12 Rei edge functions listed above
- **Shared utilities** that Rei needs (wallet providers, UI components, etc.)

The new project will need its own Lovable Cloud backend with its own tables (`rei_registry`, `jobs`, `tasks`, `task_drafts`, `job_drafts`, `job_sources`, `talent_views`, `skill_categories`, `community_submissions`, `chat_conversations`, `chat_messages`).

### Phase 2 — Remove Rei from Arubaito

**Delete files:**
- `src/pages/Rei.tsx`, `src/pages/JoinRei.tsx`
- `src/components/ReiChatbot.tsx`, `ReiEarningsHub.tsx`, `ReiPointsCard.tsx`, `PostToRei.tsx`
- `src/components/AudioRecorder.tsx`, `VideoRecorder.tsx`
- `src/components/chat/` (entire folder)
- `src/components/joinrei/` (entire folder)
- Rei assets: `rei-logo.png`, `rei-split.png`, `bg-rei1.webp`, `rei-logo-eye.png`, `rei-usp-*.png`, `rei-button.png`, `src/assets/joinrei/`
- `public/ascii/rei.html`
- 12 Rei edge functions from `supabase/functions/`

**Edit files:**
- `src/App.tsx` — remove `/rei`, `/joinrei`, `/community` routes and imports
- `src/components/admin/index.ts` — remove `AdminReiRegistrySection`, `AdminJobsSection`, `AdminCommunitySection` exports
- `src/pages/Admin.tsx` — remove Rei admin tabs
- `src/components/Navigation.tsx` — remove Rei nav links
- `src/pages/Index.tsx` — remove any Rei references/links

**Delete deployed edge functions** using the delete tool for the 12 Rei functions.

### Phase 3 — Data Migration

The Rei tables and data currently live in Arubaito's backend. The new Rei project will have its own backend, so data will need to be exported and imported. This is a manual step after the code split:
1. Export Rei table data from current backend
2. Create matching tables in new Rei project's backend
3. Import data

### Important Notes

- This is a large operation (~40+ files deleted, ~5 files edited, new project scaffolded)
- The new Rei project will need its own secrets configured (Twitter keys, OpenAI, Helius, etc.)
- Recommend doing this in two messages: first create the new project, then clean Arubaito

