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

## Decisions

1. **Clean break** (confirmed): drop legacy-format handling in `read` where it only serves old links; simplify to one format.
2. **Hybrid types encoding:** add a 1-byte format header to `t`; bit 7 selects format (0 = bitfield, as today; 1 = sorted varint id list, 1 byte per id since all ids < 128). Encoder emits the smaller of the two; decoder branches on the header.
3. **Compact meta parameter:** pack the small, fixed-range values (grade, arrangement, pages, presentationColumns, taskMode) into one base64url byte/string under a single param (e.g. `m`). Saves multiple `&key=` overheads. `n` (taskCount, 1–300, variable length) and `h` (worksheetTitle, arbitrary string) remain separate params. Replaces separate `calc` flag and `col`→`k` rename.
4. **Keep padding-stripped base64url**, default-value elision, and sparse weights (skip weight==1).
5. **Weights bit-packing (optional/lower priority):** pack index (7 bits) + weight (4 bits) = 11 bits/entry instead of 2 bytes/entry. Helps only when ≥2 weights set.

## Ordered tasks

1. `js/modules/share-link.js`: design `m` param layout (bit-packed grade/arrangement/pages/columns/mode), add `encodeMeta`/`decodeMeta`.
2. `js/modules/share-link.js`: rewrite `encode`/`decode` for `t` with format header (bitfield vs varint list), emit smaller form.
3. `js/modules/share-link.js`: update `encodeWeights`/`decodeWeights` to optional 11-bit-per-entry bit-packed format (keep `.` prefix).
4. `js/modules/share-link.js` `write`: emit single `m` param instead of separate `c`/`a`/`p`/`col`/`mode`; keep `n` and `h` separate; keep default elision.
5. `js/modules/share-link.js` `read`: parse `m` → grade/arrangement/pages/columns/taskMode; parse `n` and `h` separately; keep `t`/`w` decoding for new formats only.
6. `generator/app.js` and `quiz-auto/quiz-auto.js`: no changes needed if they only pass through `write`/`read` (verify `taskMode`/`presentationColumns` flow).
7. Validation: round-trip (write→read) representative configs for default and calculator modes; compare URL char count vs baseline; confirm all registry ids < 128 invariant holds.

## Risks

- Format header changes `t` output for every link (clean break accepted).
- `m` byte layout must be documented; adding a new field later requires a version bit or layout change.
- Bit-packed weights must round-trip exactly for weights 1–9 and ids 0–82.
- `n` as separate param keeps variable-length overhead; acceptable since it appears only when non-default.

## Open questions

None blocking. Weights bit-packing is optional; implement if round-trip tests show meaningful savings, else skip.
