# Plan: Shorten share-link URLs (`js/modules/share-link.js`)

**Goal:** Minimize character count of generated share URLs in both `default` and `calculator` modes.
**Constraint (decided):** Clean break — no backward compatibility with legacy `t`/`w` encodings; old shared links need not keep resolving.

## Context (baseline)

- `js/modules/share-link.js:7` `createCodec(typeRegistry)` exports `read`/`write`.
- `generator/task-types.js:26-109` — 82 task types, `shareLinkId` 0–82 (all < 128). `maxIndex = 82`.
- Consumers: `generator/app.js:60` (default + calculator, full param set) and `quiz-auto/quiz-auto.js:15` (quiz mode, grade+types only).
- Current `t` (types): bitfield over id 0..82 → up to 11 bytes → ≤15 base64url chars; trimmed to last non-zero byte. Tiny for dense low ids, bad for sparse/high ids (single id 82 → 15 chars).
- Current `w` (weights): sparse, skips weight==1; 2 bytes/entry → 3 base64url chars each, `.` prefix.
- `mode=calculator` costs 18 chars incl. `&`; only ever emitted as `calculator` (standard is default/omitted).
- Param names already short (`c`,`t`,`n`,`a`,`p`,`w`,`h`); `col` is 3 chars.
- Hash views: `worksheet` (10), `presentation` (12), `worksheet-builder` (16), `quiz` (4), `home` (4). Only non-default views appear in links.

## All measures (summary)

| # | Measure | Saves | Status |
|---|---------|-------|--------|
| 1 | **Meta param `m`** — merge `c`/`a`/`p`/`col`/`n` into one plain-text param (NOT base64) | ~12–16 chars | Confirmed layout |
| 2 | **Hybrid `t` encoding** — 1-byte format header, emit smaller of bitfield vs. varint list | up to ~12 chars (sparse high ids) | Planned |
| 3 | **Calculator flag `c`** — bare boolean flag instead of `mode=calculator` | ~13 chars | Confirmed |
| 4 | **Short hash codes** — `#p`/`#b`/`#q` instead of `#presentation`/`#worksheet-builder`/`#quiz` | 9–15 chars | Confirmed |
| 5 | **Default elision** — omit params at default values (already done) | variable | Keep |

**Skipped (confirmed):**
- Weights bit-packing (11 bits/entry) — skip, keep current 2 bytes/entry format.
- Base85 encoding for `t`/`w` byte streams — skip, keep base64url.

## Confirmed `m` layout (plain-text, fixed positions + variable tail)

```
m=<grade><arr><pages><cols>[<taskCount>]
```

- **grade** (1 char): `4`=GS, `5`=5, `6`=6, `7`=7, `8`=8, `9`=9, `0`=10 (default 10 → `0`)
- **arr** (1 char): `o`=ordered, `r`=random, `x`=random-ordered (default ordered → `o`)
- **pages** (1 char): `1`=1, `2`=2 (default 2 → `2`)
- **cols** (1 char): `1`=1, `2`=2 (default 2 → `2`)
- **taskCount** (variable, optional tail): decimal digits 1–300, appended directly after `cols` with no separator. Omitted when default (20).

**Calculator mode** is a separate bare flag `?c` (no value); standard mode omits it entirely.

Example: grade 6, ordered, 1 page, 2 columns, 17 tasks → `m=6o1217`

## Hash short codes (recommended)

| Old | New | Loads | Saves |
|-----|-----|-------|-------|
| `#worksheet` | *(empty)* | worksheet | — |
| `#presentation` | `#p` | presentation | −11 |
| `#worksheet-builder` | `#b` | worksheet-builder (Customizer) | −15 |
| `#quiz` | `#q` | **worksheet** (mapped, as today) | −3 |
| `#home` | *(empty)* | worksheet | — |

**Semantics:** `#p` and `#b` load their views directly. `#q` still maps to `worksheet` (preserving existing behavior in `generator/app.js:1003` `getShareableView`). `#home` and empty hash both load `worksheet`.

## Additional param found during review

`js/modules/task-generation.js:123` sets `url.searchParams.set('p', '1')` directly for print/export links — this must be updated to use the new `m` layout (append `1` as the pages position) so generated links stay consistent with the new format.

## Ordered tasks

1. `js/modules/share-link.js`: define `m` plain-text layout (fixed positions for grade/arrangement/pages/columns + variable taskCount tail), add `encodeMeta`/`decodeMeta`. Calculator handled as separate `c` flag in `write`/`read`.
2. `js/modules/share-link.js`: rewrite `encode`/`decode` for `t` with format header (bitfield vs varint list), emit smaller form.
3. `js/modules/share-link.js` `write`: emit single `m` param (with optional taskCount tail) instead of separate `c`/`a`/`p`/`col`/`n`; emit `c` flag for calculator; keep `h` separate; keep default elision.
4. `js/modules/share-link.js` `read`: parse `m` → grade/arrangement/pages/columns/taskCount; parse `c` flag → taskMode; parse `h` separately; keep `t`/`w` decoding for new formats only (weights unchanged — keep current 2 bytes/entry format).
5. `js/modules/task-generation.js:123`: replace `url.searchParams.set('p', '1')` with logic that appends `1` as the pages position in the `m` param (or calls `shareLink.write` to rebuild consistently).
6. `generator/app.js`: update `syncUrlWithView` to emit short hash codes (`p`/`b`/`q`); update `getViewFromUrl` to map `p`→presentation, `b`→worksheet-builder, `q`→worksheet (mapped, as today). Keep `getShareableView` mapping for `quiz` only.
7. `generator/app.js` and `quiz-auto/quiz-auto.js`: verify `taskMode`/`presentationColumns` flow through `write`/`read` unchanged.
8. Validation: round-trip (write→read) representative configs for default and calculator modes; compare URL char count vs baseline; confirm all registry ids < 128 invariant holds.

## Risks

- Format header changes `t` output for every link (clean break accepted).
- `m` plain-text layout must be documented; adding a new field later changes positions.
- `n` moved into `m` tail — decoder must distinguish taskCount digits from the fixed `cols` position (cols is always 1 or 2; taskCount starts at position 5 if present).
- Hash short codes change routing semantics — verify `#quiz`/`#worksheet-builder` now load their own views instead of mapping to worksheet.