# Color Palette API — PRD (v1.5.0 — Sprint 6 Amendment + v1.4.0 Historical)

> This PRD has two layers: the **Sprint 6 Amendment** (top, current sprint) and the **Sprint 5 Historical** (preserved unchanged below the divider). Sprint 6 is **additive** — no v1-v5 endpoint shape, error envelope, or auth flow is changed.

---

## Sprint 6 Amendment — Developer-First Relaunch

### 이사회 요약 (Executive Summary)

#### 한 줄 요약
v1-v5는 frontend에 줄 단일 source of truth (Stripe envelope + camelCase + OpenAPI 3.1)를 완성했고, Sprint 6은 그 토대 위에 **6가지 backend pillar**를 더해 color-palette-api를 "designer를 위한 또 다른 Coolors"가 아니라 **junior/mid 개발자 + 학생을 위한 code-first palette + design-system tooling**으로 재포지셔닝한다.

#### 당신이 결정할 것
1. **진행 여부**: Sprint 6 PRD 이대로 Works에 넘길까요? (승인 / 수정 요청 / 거절)
2. **Pillar 우선순위 동의**: Lab 권고는 6 pillar 모두 1 sprint에서 ship. fallback 순서는 P5(explain) → P2 일부 format. 동의하지 않으면 알려주세요.
3. **Colorblind matrix verification 게이트 동의**: Research Lead가 Viénot/Machado/BT.709 매트릭스를 인용했고, Guard는 `daltonlens` Python 패키지로 독립 검증한다. 매트릭스 한 값이라도 어긋나면 Guard FAIL — 동의하시면 진행.

#### 수치
| 항목 | 값 |
|------|---|
| 예상 비용 (런타임/인프라) | $0 (기존 Railway, 새 외부 서비스 없음) |
| 예상 비용 (개발) | ~74h 활성 (Lab 8 + Works 54 + Guard 10 + Retro 2) |
| 예상 토큰 | ~213K (Sprint 5 +37%, soft cap 250K 이내) |
| 예상 스프린트 수 | 1 (이번 Sprint 6) |
| 새 외부 의존성 | **0** (matrices는 hard-coded constants) |
| 새 API 엔드포인트 | **3 추가** (`/export/code`, `/analyze/contrast-matrix`, `/analyze/explain`) + **1 확장** (`/theme/generate` semanticTokens flag) |
| 새 응답 schema 변경 | 0 (BREAKING 0건) |
| 영향받는 기존 테스트 | 0 (existing 259 tests untouched) |
| 새 테스트 | ~30+ |
| 주요 리스크 수 | 10개 (HIGH 1, MEDIUM 4, LOW 5) |
| 리스크 수준 | 중하 (Sprint 5보다 낮음) |
| Cargo.toml 버전 | 1.4.0 → 1.5.0 (minor bump per sprint policy) |

#### 권고
**진행 권고.** Sprint 6은 v1-v5의 API contract를 0건 깨면서도 product positioning을 결정적으로 개선한다. 단일 HIGH risk(P4 colorblind matrix hallucination)는 Research Lead의 명시적 인용 + Guard의 독립 Python 재구현 게이트로 surgical하게 mitigated. Sprint 5보다 active engineering이 적고(54h vs 57h), 새 외부 의존성 0개, infra 변경 0개. 이 sprint는 현재 사용자 0명/2 키 상태의 활주로에서 Coolors 대비 **개발자 차별화 7개**를 한 번에 배포할 수 있는 cheapest moment.

---

### Sprint 6 § 1. Goals

#### Primary (Tier 1 PASS gate)
1. **Pillar 1 — Semantic Token System**: `/theme/generate`에 `semanticTokens: true` flag 추가 시 16-slot shadcn 호환 semantic token set 응답 (background, foreground, primary, primary-foreground, secondary, secondary-foreground, muted, muted-foreground, accent, accent-foreground, destructive, destructive-foreground, border, input, ring, success(extension), warning(extension)). Foreground는 `auto_contrast_pair` 알고리즘으로 WCAG-AA 보장.
2. **Pillar 2 — Multi-Format Code Export**: `POST /api/v1/export/code` 신규 엔드포인트, `format` enum으로 9개 target (tailwind-config, css-vars-hex, css-vars-oklch, shadcn-globals, scss, mui-palette, swift-uicolor, android-xml, dtcg-json) 지원. 응답에 `pasteInto` + `targetDocs` + `targetVersion` + `notes` 포함 → "30초 안에 paste".
3. **Pillar 3 — Live Preview Data**: 새 endpoint 없음. Pillar 1 semantic tokens가 충분하다는 것을 `docs/frontend-handoff.md` Sprint 6 amendment의 slot→shadcn-component 매핑 표로 문서화.
4. **Pillar 4 — WCAG Contrast Matrix + Colorblind Simulation**: `POST /api/v1/analyze/contrast-matrix` 신규 엔드포인트. 입력 palette의 모든 색 쌍에 대해 WCAG ratio + AA/AAA 라벨 + 8가지 colorblind 시뮬레이션 (protanopia, deuteranopia, tritanopia, protanomaly, deuteranomaly, tritanomaly, achromatopsia, achromatomaly) 반환. 응답에 `matricesSource` 포함 (Viénot 1999 / Machado 2009 / BT.709).
5. **Pillar 5 — Explain Mode**: `POST /api/v1/analyze/explain` 신규 엔드포인트. harmony type + hue relationships (degrees) + OKLCH narrative + pedagogical notes (templated, deterministic, NOT free-form LLM prose). `templateVersion: "sprint6.v1"` 필드로 향후 템플릿 진화에도 seed 재현성 유지.
6. **Pillar 6 — Deterministic Seed**: `src/ulid_gen.rs`에 `short_seed()` 헬퍼 추가 (Crockford Base32, 13 chars). 모든 Sprint 6 신규 엔드포인트가 `seed: Option<String>`을 받고 응답에 echo. `(seed, request body)`가 같으면 응답 body는 `id`/`createdAt` 제외 byte-identical.

#### Secondary (Tier 2)
7. 모든 9개 export format이 target ecosystem에서 round-trip 검증 통과 (Tailwind config는 v3.x project에서 load, shadcn-globals는 shadcn starter에 paste, CSS vars validate, etc.).
8. 모든 16개 semantic foreground/background pair가 WCAG-AA contrast ≥ 4.5 (Guard가 `/analyze/contrast`로 매 pair 검증).
9. p95 latency for 모든 신규 endpoint ≤ 200ms (5-call median pipelined curl, release build).
10. Frontend Simulation Lead가 Sprint 6 amended `docs/frontend-handoff.md`만 읽고 새 endpoint TS wrapper를 zero blocker로 작성.
11. `/analyze/explain` 출력은 같은 seed + palette에서 byte-identical.

#### Tier 3 (stretch)
12. Explain mode 학생 가독성 — 비전문가가 harmony type + 한 가지 design decision을 추가 검색 없이 식별 가능.
13. Sprint 6이 Cargo.lock에 새 dependency 0개로 ship.
14. Tailwind export가 CSS-var reference (`hsl(var(--primary))`)와 flat hex (`primary: "#..."`) 두 모드 모두 지원.

#### Out of scope (Sprint 6)
- Frontend 구현 (Frontend-Builder가 Step 8.5 파이프라인에서 처리, Sprint 6 backend가 PASS된 후)
- 새 인증 메커니즘
- 새 데이터 모델 / 마이그레이션
- I18n (Sprint 6 explain 모드는 영어 전용)
- 새 색상 알고리즘 (palette 엔진 unchanged)
- Streaming / SSE / GraphQL / 새 webhook
- Persistent idempotency storage (in-memory LRU 유지)
- Radix Colors 12-step scale 자동 생성 (defer to Sprint 7+)
- Material 3 HCT 색공간 (defer)
- 동적 preview spec endpoint (Sprint 7+에서 필요시)
- Multi-language explain mode
- FB-003 auth IP throttle backlog (still backlog)
- Pricing tier 변경

---

### Sprint 6 § 2. User stories

#### US-S6-1: Junior dev gets a shadcn theme into their project in 30 seconds (P0)

> AS a junior developer using shadcn/ui, I WANT to call one API and paste the result directly into my `globals.css`, SO THAT I get a complete light + dark semantic token set with WCAG-AA-safe foregrounds without writing CSS by hand.

**Success criteria**:
- `POST /api/v1/theme/generate` with `{primary, semanticTokens:true, mode:"both"}` returns 16 semantic slots × 2 modes.
- `POST /api/v1/export/code` with `format: "shadcn-globals"` returns a complete `@layer base { :root {...} .dark {...} }` block paste-ready into shadcn starter `globals.css`.
- Guard Frontend Simulation Lead times the workflow (read docs → make 2 API calls → paste) at ≤ 30 seconds.

#### US-S6-2: Student learns from a palette explanation (P0)

> AS a design student, I WANT a structured explanation of why a palette works (harmony type, hue relationships, OKLCH narrative), SO THAT I can learn color theory from concrete examples.

**Success criteria**:
- `POST /api/v1/analyze/explain` returns `harmonyType`, `hueRelationships` array, `oklchNarrative` object, and `pedagogicalNotes` (3+ sentences with numerical insertions).
- Same `(palette, seed)` returns byte-identical text (excluding envelope `id`/`createdAt`).
- A non-expert reader can identify the harmony type from the response without further research.

#### US-S6-3: Accessibility-conscious dev gets contrast + colorblind in one call (P0)

> AS a developer building for diverse users, I WANT one API call that gives me pairwise WCAG contrast + 8-mode colorblind simulation for my palette, SO THAT accessibility audit happens by default, not as an afterthought.

**Success criteria**:
- `POST /api/v1/analyze/contrast-matrix` returns matrix with n*(n-1) entries, each containing AA-normal, AA-large, AAA-normal, AAA-large flags.
- 8 colorblind simulation types in the same response.
- `matricesSource` field cites Viénot 1999 + Machado 2009 + BT.709.
- Guard verifies each colorblind output against `daltonlens` Python reference within ±2 per channel.

#### US-S6-4: Dev shares a reproducible palette via short URL (P0)

> AS a developer collaborating with teammates, I WANT to send a 13-character seed string that fully reproduces my palette, SO THAT palettes are git-diffable, code-reviewable, and shareable in chat.

**Success criteria**:
- `short_seed()` helper emits 13-character Crockford Base32 strings.
- All Sprint 6 generation endpoints accept and echo `seed`.
- Same seed + same params = byte-identical response (excluding `id`/`createdAt`).

#### US-S6-5: Dev exports palette to native frameworks (P0)

> AS a developer using MUI / Swift / Android / Tailwind / SCSS / shadcn, I WANT one endpoint that converts my palette to the target framework's exact format, SO THAT I do not have to translate hex values manually.

**Success criteria**:
- `POST /api/v1/export/code` supports 9 format enum values.
- Each format output is round-trip validated by Guard in its target ecosystem (compile / load / parse).
- Each response carries `pasteInto`, `targetDocs`, `targetVersion`, `notes`.

#### US-S6-6: Existing v1.4.0 client experiences zero regression (P0)

> AS the existing project owner with 2 active API keys + a frontend integration plan based on Sprint 5 docs, I WANT Sprint 6 to add nothing breaking, SO THAT current curl scripts and the frontend-handoff TypeScript types continue to work.

**Success criteria**:
- Every existing 27 endpoint returns the same shape as Sprint 5.
- Existing `Resource<T>` envelope, camelCase, error taxonomy, Request-Id, Idempotency-Key all unchanged.
- Negative-path envelope battery from Sprint 5 still passes for ALL endpoints (existing + Sprint 6).
- Cargo.toml bumps 1.4.0 → 1.5.0.

#### US-S6-7: Dev sees sources behind colorblind simulation (P1)

> AS a developer who cares about whether my accessibility tooling is using real research, I WANT the response to surface the academic sources behind the colorblind matrices, SO THAT I can trust the simulation and cite it in my own documentation.

**Success criteria**:
- `/analyze/contrast-matrix` response includes `matricesSource: { dichromacy, anomalous, achromatic }` with author + year strings.
- `src/engine/colorblind.rs` block comments include source URLs.

---

### Sprint 6 § 3. Functional requirements

#### FR-S6-1: /theme/generate semanticTokens extension (P0)

When `semanticTokens: true` is in the request, the response includes a `semantic` sub-object containing both light and dark token sets (or just one if `mode: "light" | "dark"`). Each slot is an object `{hex, oklch}` where `oklch` is the CSS Color Module Level 4 syntax `oklch(L C H)`. Slots: background, foreground, card, card-foreground, popover, popover-foreground, primary, primary-foreground, secondary, secondary-foreground, muted, muted-foreground, accent, accent-foreground, destructive, destructive-foreground, border, input, ring, success, success-foreground, warning, warning-foreground, plus chart-1..chart-5 from shadcn (24 slots total counting chart series; 14 stock semantic + 4 Sprint 6 extensions + 5 chart + 1 ring = arithmetic exact list per Research Lead R1.2).

Foreground slots are computed via `auto_contrast_pair` (Research Lead R1.6) and MUST achieve WCAG-AA contrast ≥ 4.5 against their paired background.

The response includes `slotSource: "shadcn-v0.9"` (or whichever version Works pins in Phase 0) for traceability.

#### FR-S6-2: POST /api/v1/export/code (P0)

New handler `routes::export::code_export`. Path-allowlisted in idempotency middleware. Uses `ApiJson<CodeExportRequest>` extractor.

Request body schema (camelCase):
```
format: enum (9 values, see Architect Lead R4.4)
theme: ThemeBundle (accepts envelope or body)
mode: enum ("light" | "dark" | "both")
cssVariableSyntax: enum ("hsl" | "oklch") — only used by Tailwind / shadcn-globals
seed: Option<String>
```

Response:
```
object: "codeExport"
id: "ce_<ulid>"
createdAt: <iso>
format: <echoed format>
code: <generated code as string>
filename: <suggested filename>
pasteInto: <suggested target file path>
targetDocs: <URL>
targetVersion: <version pin>
notes: <human-readable instruction>
```

Errors: INVALID_FORMAT (400), INVALID_PALETTE_SIZE (400 — if theme is missing or empty), INVALID_CSS_VAR_SYNTAX (400).

#### FR-S6-3: POST /api/v1/analyze/contrast-matrix (P0)

New handler `routes::analysis::contrast_matrix`. Path-allowlisted in idempotency. Uses `ApiJson<ContrastMatrixRequest>`.

Request body schema:
```
palette: Vec<String> (1..=16 hex strings)
includeColorblind: Option<bool> (default true)
severity: Option<f32> (default 0.6, range 0..=1)
```

Response:
```
object: "contrastMatrix"
id: "cm_<ulid>"
createdAt: <iso>
palette: [<echoed hex array>]
matrix: [{fgIndex, bgIndex, fgHex, bgHex, ratio, passes:{AA-normal, AA-large, AAA-normal, AAA-large}}, ...]  // n*(n-1) entries
colorblind: {protanopia: [hex...], deuteranopia: [hex...], ..., achromatomaly: [hex...]}  // 8 keys, each value is Vec<String> of length n
matricesSource: {dichromacy, anomalous, achromatic}
```

Errors: INVALID_PALETTE_SIZE (400), INVALID_SEVERITY (400).

Engine: new file `src/engine/colorblind.rs` containing the 8 matrices as `const [[f64; 3]; 3]` with block-comment citations. `apply_simulation(hex: &str, matrix: [[f64;3];3]) -> String` runs the 5-step protocol from R2.2 (sRGB gamma → linear → 3x3 multiply → clamp → linear → gamma).

#### FR-S6-4: POST /api/v1/analyze/explain (P0)

New handler `routes::analysis::explain`. Path-allowlisted in idempotency. Uses `ApiJson<PaletteExplanationRequest>`.

Request body schema:
```
palette: Vec<String> (3..=10 hex strings — explain mode requires at least 3 colors for harmony classification)
harmonyType: Option<String> (hint; default "auto")
seed: Option<String>
```

Response:
```
object: "paletteExplanation"
id: "pe_<ulid>"
createdAt: <iso>
palette: [<echoed hex>]
seed: <echoed or generated>
harmonyType: enum (one of: complementary, analogous, triadic, split-complementary, tetradic, monochromatic, mixed)
harmonyConfidence: f32 (0..1)
hueRelationships: [{from, to, deltaH, relationship}, ...]
oklchNarrative: {lightnessRange, chromaRange, hueSpread}
pedagogicalNotes: [String, String, String, ...]   // 3-5 templated sentences
harmonyReference: <URL>
templateVersion: "sprint6.v1"
```

Engine: new file `src/engine/explain.rs` containing harmony classification rules (Architect Lead R4.3) + template renderer with numeric insertion.

Errors: INVALID_PALETTE_SIZE (400), UNKNOWN_HARMONY_HINT (400 — if `harmonyType` is not "auto" or one of the 6 known types).

#### FR-S6-5: short_seed() helper (P0)

New helper in `src/ulid_gen.rs`:
- `short_seed() -> String` — emits 13-character Crockford Base32 of a random u64.
- `seed_to_u64(&str) -> Result<u64, SeedParseError>` — round-trip parse.

Used by all Sprint 6 endpoints when `seed: None`. When `seed: Some(s)` is provided, parsed via `seed_to_u64`. Invalid seed → INVALID_REQUEST error code with `param: "seed"`.

#### FR-S6-6: New error codes (P0)

Added to `docs/error-contract.md` and emittable from new handlers (see Architect Lead R4.5):
- `INVALID_FORMAT`
- `INVALID_PALETTE_SIZE`
- `INVALID_SEVERITY`
- `INVALID_CSS_VAR_SYNTAX`
- `UNKNOWN_HARMONY_HINT`
- `SEMANTIC_TOKEN_GENERATION_FAILED`

Inclusive grep verification (per promoted Guard pattern).

#### FR-S6-7: utoipa annotation surface (P0)

Every new struct: `#[derive(Debug, Serialize, Deserialize, ToSchema)] #[serde(rename_all = "camelCase")]`.
Every new handler: `#[utoipa::path(...)]` with full request/response/error schemas.
`src/openapi.rs` `ApiDoc`: append all new paths and schemas to the existing list. Swagger UI auto-renders.

#### FR-S6-8: Cargo.toml + README + CLAUDE.md sync (P0)

Cargo.toml `version = "1.5.0"`. README mentions Sprint 6 features. Project CLAUDE.md "현재 단계" updated to "Sprint 6 Released" after Guard PASS + retrospective.

#### FR-S6-9: docs/frontend-handoff.md amendment (P0)

Append a `## Sprint 6 Amendment` section to `docs/frontend-handoff.md` with:
- 4 new endpoint descriptions (theme/generate extension, /export/code, /analyze/contrast-matrix, /analyze/explain) with curl examples.
- Slot → shadcn component mapping table (Pillar 3 substitute for an endpoint).
- 9 export format catalog with paste targets.
- Note on `semanticTokens` opt-in flag for backward compatibility.
- Updated TS type definitions for new responses.

---

### Sprint 6 § 4. Non-functional requirements

| NFR | Requirement |
|-----|-------------|
| Performance | Each new endpoint p95 ≤ 200ms (release build, pipelined curl, 5-call median). |
| Backwards compat | Zero breaks. All 27 existing endpoints unchanged. Existing tests pass without modification. |
| Test coverage | ~30+ new tests including: 9 format tests (one per export format), 8 colorblind cross-check tests (one per simulation type), 6 semantic token tests, 4 explain mode tests, 3 seed determinism tests. |
| Documentation | Sprint 6 amendment to `docs/frontend-handoff.md`. New error codes in `docs/error-contract.md`. Inclusive grep verified. |
| Deployment | Zero-downtime Railway deploy. No DB schema change. No env var change. |
| Binary size | <1% increase. Matrices = 576 bytes hard-coded. |
| Dependencies | Zero new crates expected. Any new crate requires Works CTO justification. |
| Code hygiene | No `.unwrap()` / `.expect()` in request path code (per Guard policy). Clippy clean. |

---

### Sprint 6 § 5. Priority matrix

| Feature | Priority |
|---------|----------|
| Pillar 1 — Semantic Token System extension on /theme/generate | P0 |
| Pillar 2 — POST /export/code with 9 formats | P0 |
| Pillar 3 — Slot→component doc table (no endpoint) | P0 |
| Pillar 4 — POST /analyze/contrast-matrix | P0 |
| Pillar 5 — POST /analyze/explain | P0 |
| Pillar 6 — short_seed() + seed propagation | P0 |
| Cargo.toml 1.5.0 + README + CLAUDE.md | P0 |
| New error codes in docs/error-contract.md | P0 |
| utoipa annotation on all new structs/handlers | P0 |
| docs/frontend-handoff.md Sprint 6 amendment | P0 |
| Idempotency-Key path allowlist for new endpoints | P0 |
| Round-trip validation per export format | P1 |
| Foreground pair WCAG-AA verification | P1 |
| 5-call median p95 perf check | P1 |
| Frontend Simulation re-run for new endpoints | P1 |
| Tailwind dual-mode export (CSS var ref vs flat hex) | P2 |
| Explain mode student readability check | P2 |
| Zero new crates target | P2 |
| sprint6-notes.md with shadcn version pin record | P2 |

---

### Sprint 6 § 6. Domain validation test cases (DOM-S6)

| Test ID | Input | Expected output | Verification |
|---------|-------|----------------|--------------|
| DOM-S6-001 | `POST /theme/generate {"primary":"#0f172a","semanticTokens":true,"mode":"both"}` | `semantic.light.primary.hex` exists, `semantic.dark.background.hex` exists, all 16+ slots present | jq path assertions |
| DOM-S6-002 | Same as above; for each `*-foreground` slot, call `/analyze/contrast` against its paired background | All ratios ≥ 4.5 | Pairwise contrast verify |
| DOM-S6-003 | `POST /export/code {"format":"shadcn-globals", "theme": <theme from DOM-S6-001>}` | Response `code` contains `@layer base`, `:root {`, `.dark {`, all 16 slots, both light and dark | grep + structural assertions |
| DOM-S6-004 | `POST /analyze/contrast-matrix {"palette":["#000000","#FFFFFF","#FF0000"]}` | `matrix` length 6 (3*2), pair (0,1) ratio = 21.0 (max), `colorblind.protanopia[0]` close to `#000000`, `colorblind.protanopia[1]` close to `#FFFFFF` | Ratio compute + reference cross-check |
| DOM-S6-005 | Same as DOM-S6-004; cross-check protanopia output against `daltonlens` Python `Simulator_Vienot1999` for `Deficiency.PROTAN` | Channel diff ≤2 per channel | Independent Python re-run |
| DOM-S6-006 | `POST /analyze/explain {"palette":["#0f172a","#64748b","#f1f5f9","#ef4444","#22c55e"],"seed":"abc123xyz45q9"}` then call again | Two responses, byte-identical except `id`/`createdAt` | diff after `jq 'del(.id, .createdAt)'` |
| DOM-S6-007 | `POST /theme/generate {"primary":"#0f172a","semanticTokens":true,"seed":"AAAAAAAAAAAAA"}` then again | Same — byte-identical except envelope metadata | diff after jq |
| DOM-S6-008 | `POST /export/code {"format":"invalid-format-xyz",...}` | 400 with error.code=`INVALID_FORMAT`, error.type=`invalid_request_error`, envelope shape | Negative-path battery |
| DOM-S6-009 | `POST /analyze/contrast-matrix {"palette":[]}` | 400 with error.code=`INVALID_PALETTE_SIZE`, envelope shape | Negative-path battery |
| DOM-S6-010 | `POST /analyze/contrast-matrix` with `Content-Type: text/plain` body | 415 or 400 with envelope shape (NOT plain text) | ApiJson extractor verification |

Guard runs all 10 tests as part of Sprint 6 verification. DOM-S6-005 is the most critical (matrix integrity).

---

### Sprint 6 § 7. Acceptance criteria (Guard PASS gate)

See `success-metrics.md` Tier 1 (10 items). Plus the **Frontend Simulation Gate** for the Sprint 6 amendment (Frontend Simulation Lead reads Sprint 6 amended `docs/frontend-handoff.md` and produces a TS wrapper for each new endpoint).

---

### Sprint 6 § 8. Risks (summary; full matrix in feasibility.md)

| ID | Risk | Severity |
|----|------|---------|
| **R-P4-a** | Colorblind matrix hallucination | **HIGH** (gated) |
| R-P2-a | Multi-format export string bugs | MEDIUM |
| R-P5-a | Explain text quality | MEDIUM |
| R-P4-b | sRGB linear vs gamma confusion | MEDIUM |
| R-P1-a | auto_contrast_pair fallback edge case | LOW-MED |
| R-P6-a | Seed propagation gap | LOW-MED |
| R-P1-b | shadcn version drift | LOW |
| R-P2-b | Format version drift | LOW |
| R-P5-b | Harmony classification ties | LOW |
| R-Sprint6-env | Windows-gnu dlltool (carry from Sprint 5) | LOW |

Sprint 5 had HIGH:2, MED:4, LOW:3. Sprint 6 has HIGH:1, MED:4, LOW:5 — slightly less risky.

---

### Sprint 6 § 9. Open questions for human

1. **Pillar order non-negotiable?** Lab recommends shipping all 6. If Works overruns, fallback drop order is P5 → P2 partial. Confirm.
2. **`matricesSource` field surfaces academic citations to consumer.** Lab recommends YES (reinforces educational differentiation). Confirm.
3. **shadcn pinned version**: Lab recommends `shadcn-v0.9+` with the OKLCH CSS variable convention as default + `cssVariableSyntax: "hsl"` opt-in for older shadcn projects. Confirm.

---

### Sprint 6 § 10. Self-Eval (Lab CEO)

| Check | Status |
|-------|--------|
| 모든 user story (US-S6-1..7)에 성공 기준 | PASS |
| 모호한 표현 ("적절히" 등) | PASS — none |
| In Scope / Out of Scope | PASS |
| 우선순위 P0/P1/P2 모든 기능 할당 | PASS |
| API 엔드포인트마다 Request/Response/Error 스키마 | PASS (FR-S6-1..4 + tech-spec.md Sprint 6) |
| 데이터 모델 모든 필드 | PASS (architect-lead-report.md R4.3) |
| 외부 의존성 목록 | PASS — zero new |
| 기술 스택 선택 근거 | PASS (existing v1-v5 stack continues) |
| 컴포넌트 다이어그램 + 데이터 흐름 | PASS (architecture.md Sprint 6) |
| 외부 서비스 연동 포인트 | PASS — none new |
| 리스크 1+ 식별, 각 리스크에 mitigation | PASS (10 risks, see feasibility.md Sprint 6) |
| 비용 추정 | PASS (~213K tokens, ~74h active engineering, $0 infra) |
| Domain validation test cases ≥3 (도메인 로직 있음) | PASS (DOM-S6-001..010, 10 cases) |

**Self-Eval result**: PASS on first attempt (1/3 tries used).

### Sprint 6 § 11. 미결 사항

- Machado 2009 tritanomaly severity 0.6 matrix row 3 last value — Research Lead deliberately leaves a placeholder; Works Phase 0 verifies from the paper Table 2.
- Existing seed propagation through `/palette/lock` and `/theme/generate` (without semanticTokens) — Works Phase 0 audits with 2-call determinism tests.
- Exact shadcn ref version pin — Works fetches main branch `globals.css` in Phase 0 and records the commit hash in `slotSource` field.

### Sprint 6 § 12. Knowledge candidates from this sprint

See `context/kickoff/knowledge-candidates.md` — 7 candidates pending retrospective validation: colorblind matrix baseline, semantic token recipe, short seed scheme, templated explain mode, additive sprint amendment pattern, auto-pair algorithm, Guard 2nd-language constant verification extension.

---
---

# Color Palette API -- Sprint 5 PRD: Frontend Handoff Prep (API Consistency + Documentation)

> **Historical — Sprint 5 (preserved unchanged below).**


## 이사회 요약 (Executive Summary)

### 한 줄 요약
Sprint 1-4를 거치며 누적된 응답 envelope, 네이밍, 에러 포맷의 4가지 정합성 문제를 한 번에 정리하고, 다음 단계인 frontend 재구축을 위한 단일 source of truth (`docs/frontend-handoff.md` + 자동 생성 OpenAPI 3.1 spec)를 마련한다.

### 당신이 결정할 것
1. **진행 여부**: 이대로 Works에 넘길까요? (승인 / 수정 요청 / 거절)
2. **Backwards compatibility 전략**: Lab 권고 = **HARD CUTOVER** (Stripe 초기와 동일 패턴, 현재 활성 사용자 = 본인 2개 키만). URL versioning (/api/v2)을 영구 유지비 떠안고 채택할 이유가 없다고 판단. 동의하지 않으면 알려주세요. (별도 결정 항목)
3. **응답 envelope의 `success` 불리언 제거 동의**: Stripe / GitHub / OpenAI / Twilio 어느 곳도 success boolean을 사용하지 않는다 (HTTP status가 진실). 기존 `{success, data, meta}` 래퍼를 Stripe-style `{object, id, createdAt, ...flatten}`로 교체. 동의하지 않으면 알려주세요.

### 수치
| 항목 | 값 |
|------|---|
| 예상 비용 (런타임) | $0 (기존 인프라 그대로, utoipa는 빌드 타임만) |
| 예상 비용 (개발) | ~30시간 단일 엔지니어 (Backend Lead 25h + Test Lead 5h) |
| 예상 스프린트 수 | 1 (이번 Sprint 5) |
| 새 외부 의존성 | utoipa 5.x + utoipa-axum + utoipa-swagger-ui + ulid (모두 빌드/런타임 비용 무시할 수준) |
| 새 API 엔드포인트 | 0 (정합성 정리 + 3개 docs 라우트: `/swagger-ui`, `/api/v1/openapi.json`은 추가) |
| 응답 스키마 변경 | 27/27 엔드포인트 (BREAKING) |
| 영향받는 테스트 | ~70 / 153 (45%) -- 모두 assertion 업데이트 |
| 주요 리스크 수 | 9개 (HIGH 2, MEDIUM 4, LOW 3) -- feasibility.md 참조 |
| 리스크 수준 | 중 (utoipa axum 0.8 호환이 단일 최대 미지수) |
| Frontend-builder DX 개선 (정량) | 첫 통합까지 ~3.5시간 절약 (≈ 85% 감소) |
| Cargo.toml 버전 | 1.0.0 → 1.4.0 (4 sprint 누적 minor bump) |

### 권고
**진행 권고.** Sprint 1-4 동안 누적된 정합성 부채는 frontend 재구축 직전인 지금 청산하는 것이 가장 비용이 낮다. 결정 1-3는 모두 mainstream API의 대다수 또는 Stripe/OpenAI 양쪽에 의해 backed되며, 사용자 수가 사실상 0인 현재 상태에서 hard cutover가 합리적이다. 가장 큰 리스크 1개(R1: utoipa+axum 0.8 호환)는 Works Phase 0에서 즉시 검증하도록 명시했고, 실패 시 fallback (hand-written openapi.yaml)도 정의되어 있다.

---

## 1. Goals

### Primary
1. **27/27 엔드포인트가 단일 응답 envelope 사용** (Stripe-style: bare object + `object` discriminator + `id` + `createdAt` + flattened resource).
2. **모든 JSON 필드 camelCase 통일** (`#[serde(rename_all = "camelCase")]` 구조체 단위 적용).
3. **`/api/v1/docs`가 27/27 엔드포인트 모두 표시** (자동 생성 Swagger UI로 교체, 하드코딩 HTML 제거).
4. **OpenAPI 3.1 spec 생성** (`utoipa`를 통한 컴파일 타임 자동 생성, Spectral lint 통과).
5. **에러 응답 통일**: Stripe-style nested error object + 8개 `error.type` 분류 + `Request-Id` echo.
6. **`docs/frontend-handoff.md` 작성**: frontend-builder가 다른 문서를 보지 않고 4가지 작업을 수행할 수 있는 단일 source of truth.
7. **`docs/error-contract.md` 작성**: 코드베이스에서 emit되는 모든 에러 코드 카탈로그.

### Secondary (Tier 2)
8. `X-RateLimit-Limit/Remaining/Reset` 헤더 노출.
9. Stripe-style `Idempotency-Key` 헤더 (POST /palette/generate, /palette/lock, /auth/exchange, /user/rotate-key).
10. `Request-Id` 헤더 echo (클라이언트가 보내면 그대로, 없으면 ULID 생성).
11. Cargo.toml 1.4.0 bump + minor-per-sprint 정책 명시.
12. CI에 Spectral lint 추가.

### Out of scope
- 새 비즈니스 로직, 새 엔드포인트
- 새 인증 메커니즘 (Firebase 그대로)
- 새 색상 알고리즘
- 새 데이터베이스 변경
- Frontend 구현 (다음 sprint 이후 별도 프로젝트)
- FB-003 (auth IP throttle 백로그)
- Streaming/SSE/GraphQL/Webhooks
- Persistent idempotency storage (in-memory LRU로 충분)

---

## 2. User stories

### US-1: Frontend builder can integrate in <30 minutes (P0)

> As a frontend-builder agent (or human), I want to read a single document and have all the information I need to write a TypeScript fetch wrapper, an authentication flow, a /palette/generate call, and an error code-to-message mapping, so that I do not have to read the source code or guess at field names.

**Success criteria**:
- `docs/frontend-handoff.md` exists with all 8 required sections (base URL, endpoints, auth flow, tier model, response format, error format, CORS, rate-limit headers).
- Guard's Frontend-Builder Simulation Lead reads the doc cold and produces a working TS fetch wrapper without consulting source code.
- The simulation completes the 4 listed tasks (TS wrapper, auth flow, generate call, error mapping) without blockers.

### US-2: API consumer experiences identical envelope on every endpoint (P0)

> As an API consumer, I want every endpoint to return the same envelope shape so that my response parser is generic.

**Success criteria**:
- All 27 endpoints return either `Resource<T>` (item) or `Collection<T>` (list) or `ErrorEnvelope` (error). No bare objects.
- Deserialization in TS via a single generic `<T>` type works for every endpoint.
- Spectral lint confirms via OpenAPI spec inspection.

### US-3: API consumer experiences identical naming convention everywhere (P0)

> As an API consumer, I want every JSON field to be camelCase so that I do not have to mix `firebaseUid` and `firebase_uid` styles in the same codebase.

**Success criteria**:
- Every field in the OpenAPI spec is camelCase.
- A grep over the generated `openapi.json` finds zero snake_case identifiers (excluding `error.type` enum values which are intentionally snake_case per Stripe convention).

### US-4: Existing API keys continue to work after Sprint 5 deploy (P0)

> As the project owner with 2 active API keys, I want my keys to continue to authenticate after the Sprint 5 release.

**Success criteria**:
- `X-API-Key` header semantics unchanged.
- Both keys (admin + Sprint 4 verification) successfully call `/health` with valid envelope post-deploy.

### US-5: API consumer can map every error code to a UX action (P0)

> As an API consumer, I want a complete error code catalog so that I can map every possible error to a user-facing message and a frontend action.

**Success criteria**:
- `docs/error-contract.md` lists every code emitted in `src/`.
- Guard verifies via grep diff: no code appears in source that is missing from the catalog.
- 8 `error.type` values map to 8 frontend UX actions (also documented).

### US-6: API consumer can dedup state-changing requests via Idempotency-Key (P1)

> As an API consumer, I want to send `Idempotency-Key` on POST /palette/generate so that a network retry does not consume two quota units.

**Success criteria**:
- Sending the same `Idempotency-Key` + same body → same response, with `X-Idempotent-Replayed: true` header.
- Sending the same `Idempotency-Key` + different body → 400 with `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_BODY`.
- 24h TTL.

### US-7: Sprint version policy is documented and applied (P1)

> As a project maintainer, I want a clear minor-bump-per-sprint policy so that Cargo.toml version drift does not happen again.

**Success criteria**:
- `Cargo.toml` version is `1.4.0`.
- README + project CLAUDE.md updated.
- `docs/frontend-handoff.md` "Versioning policy" section explains the rule.

---

## 3. Functional requirements

### FR-1: Response envelope (P0)

Every successful single-resource response uses:
```json
{
  "object": "<resource_type>",
  "id": "<prefix>_<ulid>",
  "createdAt": "<iso_8601_utc>",
  "<...flattened resource fields in camelCase...>"
}
```

Every successful collection response uses:
```json
{
  "object": "list",
  "data": [ <Resource>, <Resource>, ... ],
  "hasMore": false,
  "totalCount": <int>?
}
```

Resource type discriminators (`object` values), one per endpoint family:
- `palette` (palette/random, generate, lock)
- `colorList` (palette/blend, color/shades)
- `color` (color/{hex})
- `colorBlindnessSimulation` (color/{hex}/blindness)
- `wcagContrast` (analyze/contrast)
- `paletteAnalysis` (analyze/palette)
- `export` (export/css, scss, tailwind)
- `designTokens` (export/design-tokens)
- `figmaVariables` (export/figma-variables)
- `themeBundle` (theme/generate)
- `apiKeyExchange` (auth/exchange, user/rotate-key)
- `user` (user/me, admin/users/{uid}/tier)
- `quota` (user/quota)
- `accountDeletionResult` (user/account DELETE)
- `apiKey` (admin/keys POST, item in admin/keys GET list)
- `adminStats` (admin/stats)
- `health` (health)

### FR-2: Naming convention (P0)

Every JSON field in every response, request body, and error body uses **camelCase**.
- Implementation: `#[serde(rename_all = "camelCase")]` at struct level on every public Serialize/Deserialize struct.
- Per-field `#[serde(rename = "...")]` is removed unless the wire name truly differs from the camelCase'd Rust name.
- The single intentional exception: `error.type` enum values use snake_case (Stripe convention; documented in error-contract.md).

### FR-3: Error envelope (P0)

Every error response (4xx, 5xx) uses:
```json
{
  "object": "error",
  "error": {
    "type": "<error_type_enum>",
    "code": "<UPPER_SNAKE_CASE_CODE>",
    "message": "Human-readable message",
    "param": "<request_field_name>",
    "docUrl": "https://.../docs/errors#<CODE>",
    "requestId": "req_<ulid>",
    "errors": [ <SubError>, ... ]
  }
}
```
- `param` is optional.
- `errors` array is present only on multi-field validation failure.
- `requestId` is always present and matches the `Request-Id` response header.
- 8 `error.type` enum values: `invalid_request_error`, `authentication_error`, `permission_error`, `rate_limit_error`, `quota_exceeded_error`, `service_unavailable_error`, `api_error`, `processing_error`.

### FR-4: Request-Id propagation (P1)

- Incoming request has optional `Request-Id` header.
- Tower middleware extracts it; if absent, generates `req_<ulid>`.
- Stored in request extensions as `RequestId(String)`.
- Echoed in `Request-Id` response header on every response (success and error).
- Embedded in `error.requestId` field on error responses.

### FR-5: OpenAPI 3.1 spec generation (P0)

- `utoipa` derives the spec at compile time from `#[derive(ToSchema)]` + `#[utoipa::path(...)]` annotations.
- Exposed at `GET /api/v1/openapi.json` (machine-readable, public, no auth).
- Swagger UI exposed at `GET /swagger-ui` (HTML, public, no auth).
- `GET /api/v1/docs` becomes a redirect to `/swagger-ui`.
- Spec passes Spectral default ruleset lint with 0 errors.

### FR-6: Frontend handoff documentation (P0)

`docs/frontend-handoff.md` MUST include all 8 sections (see Tier 1 success metric #5). Outline in `architecture.md`.

### FR-7: Error contract documentation (P0)

`docs/error-contract.md` MUST contain every error code emitted in `src/`. Verified by Guard via grep diff.

### FR-8: Idempotency-Key (P1, Tier 2)

- Client sends `Idempotency-Key: <client_uuid>` on POST /palette/generate, /palette/lock, /auth/exchange, /user/rotate-key.
- Server stores the response in an in-memory LRU keyed by `(api_key_hash, endpoint, idempotency_key, body_sha256)`.
- TTL 24 hours, capacity 10K entries.
- Identical replay returns the cached response with `X-Idempotent-Replayed: true`.
- Same key + different body returns 400 `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_BODY`.

### FR-9: X-RateLimit-* headers (P1, Tier 2)

On every authenticated response:
- `X-RateLimit-Limit: <per-minute ceiling>`
- `X-RateLimit-Remaining: <int>`
- `X-RateLimit-Reset: <unix_epoch_seconds>`

On 429 only:
- `Retry-After: <seconds>` (existing, unchanged)

### FR-10: Versioning (P1)

- `Cargo.toml` version `1.4.0`.
- README, project CLAUDE.md updated to reference 1.4.0.
- Sprint policy documented in frontend-handoff.md "Versioning policy" section.

---

## 4. Non-functional requirements

| NFR | Requirement |
|-----|-------------|
| Performance | Envelope wrapping adds < 1µs per response. Cold build time increases by < 30s due to utoipa derives. |
| Backwards compat (auth) | `X-API-Key` header semantics unchanged. Both existing keys must continue to authenticate. |
| Backwards compat (response shape) | BREAKING by design (hard cutover). Mitigation: pre-deploy notice + tagged rollback target + 24h post-deploy monitoring. |
| Test coverage | All 153 tests green after assertion updates. Net count drift ≤ ±5. |
| Documentation | OpenAPI is single source of truth. Hand-written HTML drift impossible after Sprint 5. |
| Deployment | Zero-downtime via Railway. No DB schema change. No env var requirement change. |

---

## 5. Priority matrix

| Feature | Priority |
|---------|----------|
| Response envelope unification | P0 |
| Naming convention unification | P0 |
| Error envelope unification | P0 |
| Cargo.toml 1.4.0 + version policy | P0 |
| OpenAPI 3.1 generation via utoipa | P0 |
| Swagger UI mount + /docs redirect | P0 |
| docs/frontend-handoff.md | P0 |
| docs/error-contract.md | P0 |
| docs/deploy-plan.md (with hard cutover decision recorded) | P0 |
| Test assertion rewrites | P0 |
| Spectral lint 0 errors | P0 |
| Request-Id middleware + echo | P1 |
| X-RateLimit-* headers | P1 |
| Idempotency-Key middleware | P1 |
| CI Spectral lint integration | P1 |
| TypeScript client gen guide | P2 |
| Postman collection generation | P2 |
| frontendActionHint optional field on error | P2 (Architect Lead's discretion) |

---

## 6. Acceptance criteria (Guard's PASS gate)

See `success-metrics.md` Tier 1 (10 criteria). Summary:

1. ✅ 27/27 endpoints use single envelope
2. ✅ 27/27 endpoints use camelCase
3. ✅ 27/27 endpoints documented (Swagger UI from utoipa)
4. ✅ openapi.yaml passes Spectral default ruleset
5. ✅ docs/frontend-handoff.md complete (8 sections)
6. ✅ docs/error-contract.md complete (every code in src/ catalogued)
7. ✅ Curl samples for 11 P0 endpoints in handoff doc
8. ✅ Cargo.toml 1.4.0
9. ✅ 153 tests green (count drift ≤ ±5)
10. ✅ Backwards compat strategy documented in deploy-plan.md and human-approved

Plus the **Frontend-Builder Simulation Gate**: Guard's simulation lead reads ONLY frontend-handoff.md and produces a working TS wrapper + auth flow + generate call + error mapping. Zero blockers required for PASS.

---

## 7. Risks (summary; full matrix in feasibility.md)

| ID | Risk | Severity |
|----|------|---------|
| R1 | utoipa version incompatible with axum 0.8 | HIGH |
| R4 | Test assertion rewrites mask a real regression | HIGH |
| R2 | utoipa ToSchema derive fails on complex generics | MEDIUM |
| R5 | frontend-handoff.md missing one of the 8 sections | MEDIUM |
| R7 | Idempotency-Key key collision across users | MEDIUM |
| R8 | `#[serde(flatten)]` collides with future field names | MEDIUM |
| R3 | Hard cutover breaks unknown undocumented script | LOW |
| R6 | Spectral lint warnings | LOW |
| R9 | Cold build time regression from utoipa | LOW |

---

## 8. Open questions for human

1. **Backcompat strategy = HARD CUTOVER OK?** Lab + Architect + Analyst all converged on this. If you want URL versioning instead, say so now.
2. **Drop `success` boolean OK?** No mainstream API uses it. Existing clients (your 2 keys' curl scripts) must update parser.
3. **Idempotency-Key (Tier 2) -- ship this sprint or defer to Sprint 6?** Lab includes it in Sprint 5 scope but it can be cut to a backlog item if Works runs over time.

---

## 9. Self-Eval (Lab CEO)

| Check | Status |
|-------|--------|
| 모든 사용자 스토리에 성공 기준 | PASS (US-1 to US-7) |
| 모호한 표현 ("적절히", "필요시", "등") 없음 | PASS |
| In Scope / Out of Scope 명확 | PASS |
| 우선순위 P0/P1/P2 모든 기능 할당 | PASS |
| API 엔드포인트마다 Request/Response/Error 스키마 | DEFERRED to tech-spec.md (전체 27개의 individual schema는 architecture.md + tech-spec.md에 정리) |
| 데이터 모델 모든 필드에 타입 + 제약 | PASS (Resource<T>, Collection<T>, ErrorEnvelope all in tech-spec.md) |
| 외부 의존성 목록 완전 | PASS (utoipa, utoipa-axum, utoipa-swagger-ui, ulid) |
| 기술 스택 선택 근거 | PASS (research-lead-report.md cites mainstream API survey) |
| 컴포넌트 다이어그램 + 데이터 흐름 | PASS (architecture.md) |
| 외부 서비스 연동 포인트 | PASS (Firebase 그대로) |
| 리스크 1+ 식별, 각 리스크에 완화 방안 | PASS (9-item matrix, all with mitigations, in feasibility.md) |
| 비용 추정 | PASS (~155K tokens, $0 infra) |

**Self-Eval result: PASS on first attempt (1/3 tries used).**

## 10. 미결 사항

- utoipa 5.x ↔ axum 0.8 정확한 버전 호환성 -- Works Phase 0 첫 2시간 내에 검증 필수 (R1 위험 완화).
- `frontendActionHint` 옵션 필드 (선택적 차별화 실험) -- Architect Lead 재량.
- Test count baseline 153은 근사치이며 Works Phase 0에서 `cargo test 2>&1 | tail -1`로 정확한 baseline 측정 필요.

## Knowledge candidates from this sprint

See `context/kickoff/knowledge-candidates.md` -- 7 candidate items pending retrospective validation.
