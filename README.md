# Türkçe in 2 Hours — a work-trip Turkish course

**Live:** https://rkarim25.github.io/turkish/ · **Owner:** Reza (rkarim25 / rkarim88@gmail.com) · **Maintainer:** Claude (any chat session)

This README is the canonical guide: a chat session should be able to understand, verify, and extend the whole project from this file. Built 2026-07-05 in one day, on request, while Reza was leaving for a Turkey business trip.

## What it is

A self-contained offline course: **9 modules ≈ 2 hours** of the highest-value Turkish for a work trip, a **26-line mock conversation**, the **Core 31** (one story carrying the grammatical core), a **10-minute spaced refresh**, miss drills, an ears round, a 12-question final check, and a searchable cheat sheet. Everything — including all audio — works in plane mode after one online visit.

## The learner (design constraints — do not violate)

- **Native English AND Bengali speaker, actively learning Arabic.** Mnemonics and cognate hooks draw on all three (hesap = Arabic حساب = Bengali হিসাব; hava = হাওয়া; saat = ساعة; çay = চা). Turkish is full of Perso-Arabic loanwords — always check for one before inventing a mnemonic.
- **Mnemonics must be "ridiculous but not tenuous"** — his words. If the sound-link is weak, omit it entirely.
- **Tables, never flashcards.** All practice is reveal-and-mark-the-missed tables. Recall-then-show. Minimal clicking.
- **Studies in public** — all coaching copy says *silently mouth it* (subvocal articulation), never only "say it out loud".
- **Honesty over flattery** in any progress claim (same rule as his Arabic site).

## Architecture

Three moving parts, no build step, no dependencies, no external requests (system fonts only):

| File | Role |
|---|---|
| `index.html` | The entire app: CSS + data + logic inline (~2,000 lines). Hash-routed SPA. |
| `sw.js` | Service worker: **cache-first with background refresh** (stale-while-revalidate). Precaches CORE + all audio on install. A new deploy is picked up one load later. Bump `CACHE` (`tk-vN`) on every deploy **and keep its `MODS` count list in sync with the data**. |
| `audio/` | 330 pre-generated mp3s (~7 MB): every item, conversation line, and Core-31 sentence in **two speeds** (`<id>-<i>.mp3` normal, `<id>-<i>-slow.mp3`). |

### Data structures (all inline in index.html)

- `MODULES` — 9 modules, ~108 items. Item fields: `tr`, `en`, `say` (pronunciation respelling), `note?`, `parts?` (word-by-word breakdown, shown with 🧩), `mn?` (mnemonic, shown with 💡).
- `CONVO` — 26 dialogue lines (`who`: you/d/r/w; you = Ahmet voice, others = Emel). Reza's 13 lines join the review pool as `conv:i` after he plays his role.
- `CORE31` — exactly 31 sentences: **"Kayıp Cüzdan" (The Lost Wallet)** story. Covers to-be (-im), var/yok possession, present -iyor, past -dı, future -ecek, ability -abil-, want-to (-mek istiyorum), all case endings, negation -m-, -ci agent, reduplication. Keys `core:i`.

### Views (hash routes)

`#home` · `#m/<id>` study · `#t/<id>` module test · `#review` 10-min refresh · `#ears` sound-first round · `#final` 12 MCQs (10+ = 🏅 trip-ready) · `#all` cheat sheet · `#conv` / `#conv-play` conversation + play-your-role · `#core31` / `#core31-play` story + tell-it-yourself. `drillLoop(pairs)` re-tests only missed items round after round until clean — reachable from every finish screen.

### Spaced repetition (invisible; the UX stays mark-the-missed)

`tk-cards[key] = { miss, seen, reps, streak }` in localStorage. Clean pass: `streak++`, miss count decays; miss: `streak = 0`, `miss++`. Due when `now - seen > INTERVALS[min(streak,4)]` (10 min → 1 d → 3 d → 7 d → 14 d). Refresh queue (cap 40): misses first → due items → least-recently-seen strong words rotating back in. `dueCount()` drives the honest "N due" badge on home. **Never replace this UX with flashcards.**

### Offline model

1. SW `install` precaches everything (`Promise.allSettled` so one miss can't block install).
2. `ensureOffline()` runs on every page load, **2.5 s after paint**: verifies all ~340 files against the cache (no network), then fetches only gaps **4 at a time**, and shows an honest ✅/⚠️ count on home. It must never fire a download storm — that made loads feel slow once (fixed in tk-v6).
3. Serving is cache-first with background refresh — instant loads; never blocks on the network.

### Audio pipeline (regenerating / adding content)

Generated with `edge-tts` (pip). Voices: `tr-TR-EmelNeural` (module items, locals), `tr-TR-AhmetNeural` (Reza's conversation lines, Core 31 — it's his story). Rates: items −15 %, conversation/story −10 %, **slow variants −40 %**. Pattern:

```python
import edge_tts, asyncio
asyncio.run(edge_tts.Communicate("Merhaba", "tr-TR-EmelNeural", rate="-15%").save("audio/polite-0.mp3"))
```

When adding ANY item: (1) add to the data structure, (2) generate both mp3 speeds with the right file name (`<modId>-<index>[-slow].mp3`), (3) update `MODS` counts in `sw.js`, (4) bump the sw `CACHE` version. `offlineFileList()` in index.html derives its list from the data, so it follows automatically.

## Deploy & verify

GitHub Pages from branch **`master`** (not main), path `/`. No build step: commit + push = deploy (~1 min).

⚠️ **Pages deploys on this repo have flaked** (build succeeds, deploy job fails — the site silently keeps serving the old version). After every push: watch the workflow run conclusion (`gh api repos/rkarim25/turkish/actions/runs`), rerun failed jobs if needed, and only trust `curl -s https://rkarim25.github.io/turkish/sw.js | grep tk-vN` showing the new cache version.

Local dev: any static server (`npx http-server -p 8735 -c-1`). Syntax check: `node --check sw.js` plus `new Function()` over the inline `<script>` block. Sanity: sw `MODS` counts must equal the data array lengths.

## Progress storage

localStorage only, no accounts, no cloud: `tk-done` (completed units incl. `conv`, `core31`), `tk-cards` (SRS state), `tk-meta` (`lastRefresh`, `pass` = final-check badge). Progress is per-device by design.

## History / context

Reza also has an Arabic-learning site (`rkarim25/arabiclanguage`) with the same design philosophy; this project borrows its table-based recall patterns and service-worker approach. Course design rationale: phonetics first (Turkish is fully phonetic — 8 minutes unlocks all signage), then politeness → survival → money (incl. *fatura* for expense receipts) → taxi → hotel → food/çay culture → business etiquette (FirstName + Bey/Hanım) → grammar patterns; the conversation and Core 31 sit on top as integrative layers. Honest outcome statement: completing everything ≈ transactional A1 — a self-sufficient, charming guest, not a conversationalist.

## Roadmap ideas (not committed)

More scenario dialogues (airport security, pharmacy), a second story (Core 31 level 2, past-tense heavy), listening comprehension test à la the Arabic site's cold listen, word-level tap-audio inside the conversation lines.
