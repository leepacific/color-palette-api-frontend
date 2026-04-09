# Color Palette API — Technical Spec (v1.5.0 — Sprint 6 Amendment + v1.4.0 Historical)

> Sprint 6 amendment is at the top. Sprint 5 historical content is preserved below the divider.

---

## Sprint 6 Amendment — Developer-First Relaunch

### S6.1 Tech stack changes

**Cargo.toml**:
```toml
[package]
version = "1.5.0"  # was 1.4.0
```

**Zero new dependencies expected.** All Sprint 6 work uses crates already in Cargo.lock from Sprint 1-5: `palette` (color science), `serde`, `serde_json`, `axum 0.8`, `utoipa 5`, `chrono`, `rand` (already present transitively for ULID + race), `sha2` (already present from idempotency), `std`. If Works Backend Lead identifies a missing single-purpose crate (e.g., XML escaping for Android colors.xml), it must be justified in Works Phase 0 brief and approved by Works CTO before adding.

If Cargo.lock expands by even one new direct or transitive dependency, the diff must be documented in `99-archive/sprint6-cargo-lock-diff.md`.

### S6.2 New module: `src/engine/colorblind.rs`

```rust
//! Colorblind simulation matrices and apply function.
//!
//! Matrices are sourced from published research and MUST NOT be modified
//! without re-citing the source. Each block comment lists author + year +
//! source URL + cross-verification reference.

use crate::engine::color::{hex_to_rgb_linear, rgb_linear_to_hex};

/// Viénot, Brettel, Mollon (1999). "Digital video colourmaps for checking the
/// legibility of displays by dichromats". Color Research & Application 24(4),
/// 243-252.
/// Source: https://www.vischeck.com/downloads/Vienot.pdf (Table 1)
/// Cross-verified against daltonlens==0.1.5 Simulator_Vienot1999.PROTAN.
pub const PROTANOPIA_VIENOT: [[f64; 3]; 3] = [
    [ 0.170556992,  0.829443014,  0.000000000],
    [ 0.170556991,  0.829443008,  0.000000000],
    [-0.004517144,  0.004517144,  1.000000000],
];

pub const DEUTERANOPIA_VIENOT: [[f64; 3]; 3] = [
    [ 0.33066007,   0.66933993,   0.00000000],
    [ 0.33066007,   0.66933993,   0.00000000],
    [-0.02785538,   0.02785538,   1.00000000],
];

pub const TRITANOPIA_VIENOT: [[f64; 3]; 3] = [
    [ 1.00000000,   0.15827000,  -0.15827000],
    [ 0.00000000,   0.86949000,   0.13051000],
    [ 0.00000000,   0.86949000,   0.13051000],
];

/// Machado, Oliveira, Fernandes (2009). "A Physiologically-based Model for
/// Simulation of Color Vision Deficiency". IEEE TVCG 15(6), 1291-1298.
/// Source: https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html
/// Severity 0.6 — Table 2 of the paper.
/// **WORKS PHASE 0**: copy the exact severity=0.6 matrices from Table 2 of the
/// Machado 2009 paper. Research Lead intentionally left placeholders in the spec
/// to force re-verification. Cross-verify against daltonlens Simulator_Machado2009
/// with severity=0.6.
pub const PROTANOMALY_MACHADO_06: [[f64; 3]; 3] = [
    [ 0.458064,    0.679578,    -0.137642],
    [ 0.092785,    0.846313,     0.060902],
    [-0.007494,   -0.016807,     1.024301],
];

pub const DEUTERANOMALY_MACHADO_06: [[f64; 3]; 3] = [
    [ 0.547494,    0.607765,    -0.155259],
    [ 0.181692,    0.781742,     0.036566],
    [-0.010410,    0.027275,     0.983136],
];

pub const TRITANOMALY_MACHADO_06: [[f64; 3]; 3] = [
    // !!! WORKS PHASE 0: copy exact values from Machado 2009 Table 2, severity 0.6
    // !!! Cross-verify against daltonlens. The placeholder below MUST be replaced.
    [ 1.193214,   -0.109812,    -0.083402],
    [ 0.058496,    0.792250,     0.149254],
    [-0.002346,    0.0,          0.0],  // <-- last two values to be filled by Works
];

/// ITU-R BT.709 luma coefficients. Used for achromatopsia (full luminance
/// collapse) and achromatomaly (partial blend at severity 0.6).
/// Standard: ITU-R Rec. 709, https://www.itu.int/rec/R-REC-BT.709
pub const ACHROMATOPSIA_BT709: [[f64; 3]; 3] = [
    [0.2126, 0.7152, 0.0722],
    [0.2126, 0.7152, 0.0722],
    [0.2126, 0.7152, 0.0722],
];

pub const ACHROMATOMALY_BT709_06: [[f64; 3]; 3] = [
    [0.618,  0.320,  0.062],
    [0.163,  0.775,  0.062],
    [0.163,  0.320,  0.516],
];

/// Apply a colorblind simulation matrix to a hex string.
///
/// Protocol (5 steps):
/// 1. hex → sRGB linear (gamma decode)
/// 2. apply 3x3 matrix multiplication
/// 3. clamp to [0, 1]
/// 4. sRGB linear → sRGB gamma (gamma encode)
/// 5. format as hex
pub fn apply_simulation(hex: &str, matrix: &[[f64; 3]; 3]) -> Result<String, AppError> {
    let (r_lin, g_lin, b_lin) = hex_to_rgb_linear(hex)?;
    let r_out = (matrix[0][0] * r_lin + matrix[0][1] * g_lin + matrix[0][2] * b_lin).clamp(0.0, 1.0);
    let g_out = (matrix[1][0] * r_lin + matrix[1][1] * g_lin + matrix[1][2] * b_lin).clamp(0.0, 1.0);
    let b_out = (matrix[2][0] * r_lin + matrix[2][1] * g_lin + matrix[2][2] * b_lin).clamp(0.0, 1.0);
    Ok(rgb_linear_to_hex(r_out, g_out, b_out))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn identity_matrix_round_trips() {
        let identity: [[f64; 3]; 3] = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]];
        let cases = ["#FF0000", "#00FF00", "#0000FF", "#FFFFFF", "#000000", "#0F172A"];
        for c in cases {
            let out = apply_simulation(c, &identity).unwrap();
            // Allow ±1 per channel for gamma round-trip floating point.
            // (Both inputs and outputs go through gamma encode/decode.)
            assert!(within_one_per_channel(c, &out), "{} -> {} (identity)", c, out);
        }
    }

    #[test]
    fn protanopia_red_becomes_yellowish() {
        let out = apply_simulation("#FF0000", &PROTANOPIA_VIENOT).unwrap();
        // Reference (daltonlens Simulator_Vienot1999): pure red → ~#6A6400
        assert!(within_two_per_channel(&out, "#6A6400"), "got {}", out);
    }

    #[test]
    fn achromatopsia_collapses_to_grey() {
        let out = apply_simulation("#FF0000", &ACHROMATOPSIA_BT709).unwrap();
        // Pure red luminance: 0.2126 → grey ~#363636 (after gamma encode)
        assert!(within_two_per_channel(&out, "#363636"), "got {}", out);
    }

    fn within_two_per_channel(a: &str, b: &str) -> bool {
        // implementation: parse hex into 3 u8 channels, abs diff <=2 each
        true // pseudocode placeholder
    }
    fn within_one_per_channel(a: &str, b: &str) -> bool { true }
}
```

Works Backend Lead implements the helpers `hex_to_rgb_linear`, `rgb_linear_to_hex`, `within_two_per_channel`, etc. (some may already exist in `src/engine/color.rs`). The 5-step protocol from Research Lead R2.7 must be respected.

### S6.3 New module: `src/engine/semantic_tokens.rs`

```rust
//! Semantic token generator. Sprint 6 Pillar 1.
//! Generates a 16+ slot shadcn-compatible semantic token set from a primary hex.
//! Foreground pairs use auto_contrast_pair to guarantee WCAG-AA.

use crate::engine::color::{Oklch, hex_to_oklch, oklch_to_hex};
use crate::engine::wcag::wcag_contrast;

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct SemanticSlot {
    pub hex: String,
    pub oklch: String,  // CSS Color Module L4 syntax: "oklch(L C H)"
}

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct SemanticTokenSet {
    pub background: SemanticSlot,
    pub foreground: SemanticSlot,
    pub card: SemanticSlot,
    pub card_foreground: SemanticSlot,
    pub popover: SemanticSlot,
    pub popover_foreground: SemanticSlot,
    pub primary: SemanticSlot,
    pub primary_foreground: SemanticSlot,
    pub secondary: SemanticSlot,
    pub secondary_foreground: SemanticSlot,
    pub muted: SemanticSlot,
    pub muted_foreground: SemanticSlot,
    pub accent: SemanticSlot,
    pub accent_foreground: SemanticSlot,
    pub destructive: SemanticSlot,
    pub destructive_foreground: SemanticSlot,
    pub border: SemanticSlot,
    pub input: SemanticSlot,
    pub ring: SemanticSlot,
    /// Sprint 6 extension beyond stock shadcn.
    pub success: SemanticSlot,
    pub success_foreground: SemanticSlot,
    pub warning: SemanticSlot,
    pub warning_foreground: SemanticSlot,
    pub chart_1: SemanticSlot,
    pub chart_2: SemanticSlot,
    pub chart_3: SemanticSlot,
    pub chart_4: SemanticSlot,
    pub chart_5: SemanticSlot,
}

pub fn generate_semantic_tokens(primary_hex: &str, mode: ColorMode) -> SemanticTokenSet {
    // Implementation per Research Lead R1.5 OKLCH-space recipe.
    // Each foreground pair uses auto_contrast_pair (R1.6).
    todo!("Works Backend Lead implements per Research Lead R1.5/R1.6")
}

/// WCAG-AA-safe foreground pairing per Research Lead R1.6.
pub fn auto_contrast_pair(bg: &Oklch) -> Oklch {
    let bg_hex = oklch_to_hex(bg);
    let white_ratio = wcag_contrast(&bg_hex, "#FFFFFF");
    let black_ratio = wcag_contrast(&bg_hex, "#000000");
    if white_ratio >= 4.5 && white_ratio >= black_ratio {
        return Oklch { l: 0.98, c: 0.0, h: bg.h };
    }
    if black_ratio >= 4.5 {
        return Oklch { l: 0.08, c: 0.0, h: bg.h };
    }
    // L-sweep fallback for chromatic mid-L backgrounds.
    for i in 0..50 {
        let l_candidate = 0.02 * i as f64;
        let cand = Oklch { l: l_candidate, c: bg.c * 0.3, h: bg.h };
        let cand_hex = oklch_to_hex(&cand);
        if wcag_contrast(&cand_hex, &bg_hex) >= 4.5 {
            return cand;
        }
    }
    // Last resort: opposite L extreme.
    if bg.l > 0.5 { Oklch { l: 0.05, c: 0.0, h: bg.h } } else { Oklch { l: 0.98, c: 0.0, h: bg.h } }
}
```

### S6.4 New module: `src/engine/explain.rs`

```rust
//! Palette explanation generator. Sprint 6 Pillar 5.
//! Templated text with numerical insertions. NO LLM. Deterministic.

use crate::engine::color::{Oklch, hex_to_oklch};

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PaletteExplanation {
    pub harmony_type: String,        // "complementary" | ... | "mixed"
    pub harmony_confidence: f32,     // 0..1
    pub hue_relationships: Vec<HueRelationship>,
    pub oklch_narrative: OklchNarrative,
    pub pedagogical_notes: Vec<String>,
    pub harmony_reference: String,
    pub template_version: String,    // always "sprint6.v1" for Sprint 6
}

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct HueRelationship {
    pub from: usize,
    pub to: usize,
    pub delta_h: f64,
    pub relationship: String,
}

#[derive(Clone, Debug, serde::Serialize, serde::Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct OklchNarrative {
    pub lightness_range: LightnessRange,
    pub chroma_range: ChromaRange,
    pub hue_spread: HueSpread,
}

// LightnessRange, ChromaRange, HueSpread structs follow same pattern.

pub fn classify_harmony(palette: &[Oklch]) -> (String, f32) {
    // Rules from Research Lead R1.5 + Architect Lead R4.3:
    // - complementary: 2 dominant hues ~180° apart (±15°)
    // - analogous: 3+ hues within 30-60° of each other
    // - triadic: 3 hues ~120° apart (±15°)
    // - split-complementary: 1 anchor + 2 hues at 150°/210° (±15°)
    // - tetradic: 2 complementary pairs
    // - monochromatic: 1 hue, varying L/C
    // Return harmony name + confidence 0..1.
    todo!()
}

pub fn render_explanation(palette: &[String], seed: Option<&str>) -> PaletteExplanation {
    // Compute harmony, narrative, then render templates with numerical insertions.
    // No randomness — fully deterministic given input.
    todo!()
}
```

### S6.5 Helper: `src/ulid_gen.rs::short_seed()`

```rust
/// Generate a fresh 13-char Crockford Base32 seed.
pub fn short_seed() -> String {
    let n: u64 = rand::random();
    encode_crockford_base32(n)
}

/// Parse a 13-char Crockford Base32 seed back to u64. Used for determinism.
pub fn seed_to_u64(seed: &str) -> Result<u64, SeedParseError> {
    if seed.len() != 13 {
        return Err(SeedParseError::WrongLength);
    }
    decode_crockford_base32(seed).ok_or(SeedParseError::InvalidChar)
}

const CROCKFORD: &[u8] = b"0123456789ABCDEFGHJKMNPQRSTVWXYZ";

fn encode_crockford_base32(mut n: u64) -> String {
    let mut buf = [0u8; 13];
    for i in (0..13).rev() {
        buf[i] = CROCKFORD[(n & 0x1F) as usize];
        n >>= 5;
    }
    // Safe: only ASCII bytes from CROCKFORD.
    String::from_utf8(buf.to_vec()).unwrap_or_else(|_| String::from("0000000000000"))
}

fn decode_crockford_base32(s: &str) -> Option<u64> {
    let mut n: u64 = 0;
    for ch in s.bytes() {
        let v = match ch {
            b'0'..=b'9' => (ch - b'0') as u64,
            b'A'..=b'H' => (ch - b'A' + 10) as u64,
            b'J' | b'K' => (ch - b'A' + 9) as u64,  // skip I
            b'M' | b'N' => (ch - b'A' + 8) as u64,  // skip L
            b'P'..=b'T' => (ch - b'A' + 7) as u64,  // skip O
            b'V'..=b'Z' => (ch - b'A' + 6) as u64,  // skip U
            _ => return None,
        };
        n = (n << 5) | v;
    }
    Some(n)
}

#[derive(Debug)]
pub enum SeedParseError { WrongLength, InvalidChar }
```

Note on `unwrap_or_else`: even though `String::from_utf8` cannot fail on the constant CROCKFORD alphabet, Guard's no-unwrap policy is satisfied via the fallback. Test code exercises both happy and pathological paths.

### S6.6 New routes

`src/routes/export.rs` adds `code_export` handler:
```rust
#[utoipa::path(
    post,
    path = "/api/v1/export/code",
    tag = "export",
    operation_id = "exportCode",
    request_body = CodeExportRequest,
    responses(
        (status = 200, description = "Code export ready", body = Resource<CodeExportResponse>),
        (status = 400, description = "Invalid format or input", body = ErrorEnvelope),
        (status = 401, description = "Missing/invalid API key", body = ErrorEnvelope),
        (status = 429, description = "Rate limited or quota", body = ErrorEnvelope),
    ),
    security(("apiKey" = []))
)]
pub async fn code_export(
    Extension(request_id): Extension<RequestId>,
    State(state): State<AppState>,
    ApiJson(req): ApiJson<CodeExportRequest>,
) -> Result<Json<Resource<CodeExportResponse>>, AppError> {
    let format = req.format.parse().map_err(|_| AppError::bad_request_field(
        "INVALID_FORMAT", "format", "Format must be one of the 9 supported values", request_id.0.clone()
    ))?;
    let code = render_code(&format, &req.theme, req.mode, req.css_variable_syntax);
    let response = CodeExportResponse {
        format: req.format,
        code,
        filename: filename_for(&format),
        paste_into: paste_into_for(&format),
        target_docs: target_docs_for(&format),
        target_version: target_version_for(&format),
        notes: notes_for(&format),
    };
    Ok(Json(Resource::ephemeral("codeExport", "ce", response)))
}
```

`src/routes/analysis.rs` adds `contrast_matrix` and `explain` handlers, both following the same pattern (Extension<RequestId>, ApiJson<...>, return Json<Resource<...>>).

`src/routes/theme.rs` extends the existing `generate` handler to handle the new `semanticTokens` flag:
```rust
if req.semantic_tokens.unwrap_or(false) {
    let semantic = generate_semantic_tokens(&primary_hex, mode);
    response.semantic = Some(semantic);
    response.slot_source = Some("shadcn-v0.9".to_string());
}
```

### S6.7 OpenAPI registration

`src/openapi.rs` `ApiDoc` paths(...) adds:
- `crate::routes::export::code_export`
- `crate::routes::analysis::contrast_matrix`
- `crate::routes::analysis::explain`

components(schemas(...)) adds: `CodeExportRequest, CodeExportResponse, ContrastMatrixRequest, ContrastMatrixEntry, ContrastMatrixPasses, ContrastMatrixResponse, ColorblindSimulation, PaletteExplanationRequest, PaletteExplanation, HueRelationship, OklchNarrative, LightnessRange, ChromaRange, HueSpread, SemanticSlot, SemanticTokenSet, ThemeBundleSemanticExtension`.

### S6.8 Idempotency middleware update

`src/middleware/idempotency.rs` path-allowlist adds:
- `/api/v1/export/code`
- `/api/v1/analyze/contrast-matrix`
- `/api/v1/analyze/explain`

Existing Sprint 5 LRU is reused; capacity 10K × 24h TTL is sufficient.

### S6.9 Test suite additions

```
tests/integration/sprint6_semantic_tokens.rs
tests/integration/sprint6_export_code.rs       (1 happy + 1 negative per format ≈ 18)
tests/integration/sprint6_contrast_matrix.rs   (3+ matrix shape tests)
tests/integration/sprint6_explain.rs           (4+ explain tests)
tests/integration/sprint6_colorblind_crosscheck.rs   (8 simulation type tests)
tests/integration/sprint6_seed_determinism.rs  (3+ tests, byte-identical responses)
```

Strongly typed deserialization pattern from Sprint 5 (R4 mitigation) applies. No bare `serde_json::Value` assertions.

Cross-check fixture file `tests/fixtures/colorblind_reference_vectors.json` contains test vectors generated by `daltonlens` Python script (run once during Sprint 6 setup, results committed). Each entry: `{input_hex, simulation, expected_hex, source}`. Test reads this JSON and compares Rust output ±2 per channel.

### S6.10 Build sequence (Sprint 6 — Works CTO)

1. **Phase 0 R-P4-a gate**: Verify Machado 2009 tritanomaly severity 0.6 matrix Table 2 values. Replace placeholder. Time-box: 1 hour. Failure escape valve: drop tritanomaly from the 8 modes and ship 7 — but only with explicit CEO/Lab approval.
2. **Phase 0 seed audit**: 2-call determinism test against `/palette/lock`, `/theme/generate`, `/palette/generate` to confirm seed propagation. Time-box: 1 hour.
3. **Phase 0 utoipa generic re-verification**: `Resource<T>` with new inner types compiles. Time-box: 30 min.
4. **Phase 1**: Add new files: `src/engine/colorblind.rs`, `src/engine/semantic_tokens.rs`, `src/engine/explain.rs`. Add `short_seed()` to `src/ulid_gen.rs`.
5. **Phase 2**: Add new model structs in `src/models/`. Add `#[derive(ToSchema)]` + `#[serde(rename_all = "camelCase")]`.
6. **Phase 3**: Add new routes: `routes::export::code_export`, `routes::analysis::contrast_matrix`, `routes::analysis::explain`. Extend `routes::theme::generate` to handle semanticTokens.
7. **Phase 4**: Update `src/openapi.rs` paths + schemas. Update idempotency middleware allowlist.
8. **Phase 5**: Update `docs/error-contract.md` with 6 new codes. Run inclusive grep self-check.
9. **Phase 6**: Write integration tests. Strongly typed deserialization. Negative-path battery for each new endpoint.
10. **Phase 7**: Generate `tests/fixtures/colorblind_reference_vectors.json` from `daltonlens` Python script. Commit.
11. **Phase 8**: Update `docs/frontend-handoff.md` with Sprint 6 amendment section.
12. **Phase 9**: Bump Cargo.toml 1.4.0 → 1.5.0. Update README + CLAUDE.md.
13. **Phase 10**: cargo build --release + cargo test full suite. p95 verification on new endpoints.
14. **Phase 11**: Hand off to Guard.

### S6.11 Open implementation questions (Architect Lead → Works CTO)

1. **Existing seed propagation through `/theme/generate`** — Phase 0 gate item. If broken, fix in this sprint as part of Pillar 6.
2. **Tritanomaly Machado matrix row 3 values** — Phase 0 gate item. Re-derive from paper.
3. **shadcn version pin format** — should `slotSource` be a freeform version string ("shadcn-v0.9") or a structured object `{name: "shadcn-ui", version: "v0.9.0", commit: "abc123"}`? Recommendation: structured object for future-proofing.
4. **Tailwind dual-mode export (CSS-var ref vs flat hex)** — ship in Sprint 6 if cheap (Tier 3 stretch), defer to Sprint 7 if it bloats the export module.

---
---

# Color Palette API -- Sprint 5 Technical Specification

> **Historical — Sprint 5 (preserved unchanged below).**

## 1. Tech stack additions

```toml
# Cargo.toml additions for Sprint 5
[dependencies]
utoipa = { version = "5", features = ["axum_extras", "chrono"] }
utoipa-axum = "0.1"
utoipa-swagger-ui = { version = "8", features = ["axum"] }
ulid = "1"

# Version bump
version = "1.4.0"  # was 1.0.0 -- 4-sprint catch-up + new policy: minor bump per sprint
```

> **CRITICAL R1 mitigation**: Works Phase 0 must verify utoipa 5.x compatibility with axum 0.8 BEFORE annotating any handlers. If incompatible:
> - First fallback: try `utoipa = "4"` with axum 0.8 (may work if axum 0.8 is mostly backward-compatible with axum 0.7)
> - Second fallback: hand-write `openapi.yaml` and skip ToSchema derives. Spec is still generated, just by hand instead of from macros. +6h Works estimate.

## 2. Universal envelope structs

### 2.1 `src/models/envelope.rs` (NEW FILE)

```rust
//! Universal response wrappers (Sprint 5).
//!
//! Every successful response uses one of these. Wire format follows Stripe's
//! pattern: bare object with `object` discriminator, `id`, `createdAt`, plus
//! flattened resource fields.

use serde::Serialize;
use utoipa::ToSchema;

/// Wrapper for single-resource responses.
///
/// Wire format example:
/// ```json
/// {
///   "object": "palette",
///   "id": "pal_01HXYZ...",
///   "createdAt": "2026-04-08T12:34:56.789Z",
///   "colors": [...],
///   "compositeScore": 87
/// }
/// ```
///
/// Note: `data` is `#[serde(flatten)]`, so the inner resource's fields appear
/// at the top level alongside `object`/`id`/`createdAt`. This is the Stripe
/// pattern. Inner types MUST NOT have fields named `object`, `id`, or
/// `createdAt` to avoid serialization collision.
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Resource<T: Serialize> {
    /// Resource type discriminator.
    pub object: &'static str,

    /// Stable identifier (persistent resources) or correlation ID (ephemeral).
    pub id: String,

    /// ISO 8601 UTC timestamp.
    pub created_at: String,

    /// The resource itself (flattened to top level).
    #[serde(flatten)]
    pub data: T,
}

impl<T: Serialize> Resource<T> {
    /// Wrap an ephemeral resource (server-generated correlation ID).
    pub fn ephemeral(object: &'static str, id_prefix: &'static str, data: T) -> Self {
        let ulid = ulid::Ulid::new().to_string();
        Self {
            object,
            id: format!("{}_{}", id_prefix, ulid),
            created_at: chrono::Utc::now().to_rfc3339(),
            data,
        }
    }

    /// Wrap a persistent resource (caller-supplied ID and createdAt).
    pub fn persistent(
        object: &'static str,
        id: impl Into<String>,
        created_at: impl Into<String>,
        data: T,
    ) -> Self {
        Self {
            object,
            id: id.into(),
            created_at: created_at.into(),
            data,
        }
    }
}

/// Wrapper for list responses.
///
/// Wire format example:
/// ```json
/// {
///   "object": "list",
///   "data": [{"object":"apiKey", ...}, ...],
///   "hasMore": false,
///   "totalCount": 3
/// }
/// ```
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Collection<T: Serialize> {
    pub object: &'static str, // always "list"
    pub data: Vec<T>,
    pub has_more: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_count: Option<usize>,
}

impl<T: Serialize> Collection<T> {
    pub fn new(data: Vec<T>) -> Self {
        let n = data.len();
        Self {
            object: "list",
            data,
            has_more: false,
            total_count: Some(n),
        }
    }
}
```

### 2.2 Resource type discriminators (`object` values)

| Endpoint | object value | id prefix |
|---------|-------------|-----------|
| GET /palette/random | `palette` | `pal` |
| POST /palette/generate | `palette` | `pal` |
| POST /palette/lock | `palette` | `pal` |
| POST /palette/adjust | `colorList` | `cl` |
| POST /palette/blend | `colorList` | `cl` |
| GET /color/{hex} | `color` | `col` |
| GET /color/{hex}/blindness | `colorBlindnessSimulation` | `cbs` |
| POST /color/shades | `colorList` | `cl` |
| POST /analyze/contrast | `wcagContrast` | `wc` |
| POST /analyze/palette | `paletteAnalysis` | `pa` |
| POST /export/css | `export` | `exp` |
| POST /export/scss | `export` | `exp` |
| POST /export/tailwind | `export` | `exp` |
| POST /export/design-tokens | `designTokens` | `dt` |
| POST /export/figma-variables | `figmaVariables` | `fv` |
| POST /theme/generate | `themeBundle` | `tb` |
| POST /auth/exchange | `apiKeyExchange` | `ake` |
| GET /user/me | `user` | (firebase_uid) |
| GET /user/quota | `quota` | (firebase_uid) |
| POST /user/rotate-key | `apiKeyExchange` | `ake` |
| DELETE /user/account | `accountDeletionResult` | `adr` |
| POST /admin/keys | `apiKey` | (key_id) |
| GET /admin/keys | `list` (Collection) | (item: `apiKey`) |
| DELETE /admin/keys/{id} | (204 No Content, no envelope) | -- |
| GET /admin/stats | `adminStats` | `as` |
| POST /admin/users/{firebase_uid}/tier | `user` | (firebase_uid) |
| GET /health | `health` | `h` |

### 2.3 Persistent resource ID conventions

- `apiKey`: id = `key.id` (UUID v4 from db_keys table)
- `user`: id = `firebase_uid` (no prefix; the prefix is implicit in the `object`)
- For ephemeral resources (palette, color, etc.), id is `<prefix>_<ulid>` and is NOT a database key. Document this in handoff.

## 3. Error envelope (`src/error.rs` REWRITTEN)

```rust
//! Error envelope (Sprint 5). Replaces the previous ApiError/ErrorDetail/AppError.
//!
//! Wire format:
//! ```json
//! {
//!   "object": "error",
//!   "error": {
//!     "type": "invalid_request_error",
//!     "code": "INVALID_COUNT",
//!     "message": "Count must be between 2 and 12",
//!     "param": "count",
//!     "docUrl": "https://.../docs/errors#INVALID_COUNT",
//!     "requestId": "req_01HXYZ..."
//!   }
//! }
//! ```

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use utoipa::ToSchema;

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ErrorEnvelope {
    pub object: &'static str, // always "error"
    pub error: ErrorBody,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ErrorBody {
    /// One of: invalid_request_error, authentication_error, permission_error,
    /// rate_limit_error, quota_exceeded_error, service_unavailable_error,
    /// api_error, processing_error.
    #[serde(rename = "type")]
    pub error_type: ErrorType,

    /// Machine-readable error code (UPPER_SNAKE_CASE).
    pub code: String,

    /// Human-readable message.
    pub message: String,

    /// Request parameter that caused the error, if any.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub param: Option<String>,

    /// Documentation link for this error code.
    pub doc_url: String,

    /// Server-side request correlation ID.
    pub request_id: String,

    /// Sub-errors when one request triggers multiple validation failures.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub errors: Option<Vec<SubError>>,
}

/// Stripe-style snake_case enum (the ONE intentional snake_case exception).
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum ErrorType {
    InvalidRequestError,
    AuthenticationError,
    PermissionError,
    RateLimitError,
    QuotaExceededError,
    ServiceUnavailableError,
    ApiError,
    ProcessingError,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct SubError {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub param: Option<String>,
}

#[derive(Debug)]
pub struct AppError {
    pub status: StatusCode,
    pub body: ErrorEnvelope,
}

impl AppError {
    /// Base constructor. Most call sites use one of the convenience methods below.
    pub fn new(
        status: StatusCode,
        error_type: ErrorType,
        code: &str,
        message: &str,
        param: Option<&str>,
        request_id: String,
    ) -> Self {
        Self {
            status,
            body: ErrorEnvelope {
                object: "error",
                error: ErrorBody {
                    error_type,
                    code: code.to_string(),
                    message: message.to_string(),
                    param: param.map(String::from),
                    doc_url: format!(
                        "https://color-palette-api.example.com/docs/errors#{}",
                        code
                    ),
                    request_id,
                    errors: None,
                },
            },
        }
    }

    pub fn bad_request(code: &str, message: &str, request_id: String) -> Self {
        Self::new(StatusCode::BAD_REQUEST, ErrorType::InvalidRequestError, code, message, None, request_id)
    }
    pub fn bad_request_field(code: &str, field: &str, message: &str, request_id: String) -> Self {
        Self::new(StatusCode::BAD_REQUEST, ErrorType::InvalidRequestError, code, message, Some(field), request_id)
    }
    pub fn unauthorized(code: &str, message: &str, request_id: String) -> Self {
        Self::new(StatusCode::UNAUTHORIZED, ErrorType::AuthenticationError, code, message, None, request_id)
    }
    pub fn forbidden(code: &str, message: &str, request_id: String) -> Self {
        Self::new(StatusCode::FORBIDDEN, ErrorType::PermissionError, code, message, None, request_id)
    }
    pub fn rate_limited(retry_after: u64, request_id: String) -> Self {
        Self::new(
            StatusCode::TOO_MANY_REQUESTS,
            ErrorType::RateLimitError,
            "RATE_LIMITED",
            &format!("Rate limit exceeded. Retry after {} seconds.", retry_after),
            None,
            request_id,
        )
    }
    pub fn quota_exceeded(retry_after: i64, request_id: String) -> Self {
        Self::new(
            StatusCode::TOO_MANY_REQUESTS,
            ErrorType::QuotaExceededError,
            "QUOTA_EXCEEDED",
            &format!("Monthly quota exceeded. Retry after {} seconds.", retry_after),
            None,
            request_id,
        )
    }
    pub fn not_found(code: &str, message: &str, request_id: String) -> Self {
        Self::new(StatusCode::NOT_FOUND, ErrorType::InvalidRequestError, code, message, None, request_id)
    }
    pub fn internal(code: &str, message: &str, request_id: String) -> Self {
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, ErrorType::ApiError, code, message, None, request_id)
    }
    pub fn service_unavailable(code: &str, message: &str, request_id: String) -> Self {
        Self::new(StatusCode::SERVICE_UNAVAILABLE, ErrorType::ServiceUnavailableError, code, message, None, request_id)
    }
    pub fn wcag_unachievable(pair: &str, ratio: f64, target: f64, request_id: String) -> Self {
        Self::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            ErrorType::ProcessingError,
            "WCAG_UNACHIEVABLE",
            &format!(
                "contrast pair {} could not reach target: ratio={:.2} target={:.2}",
                pair, ratio, target
            ),
            Some(pair),
            request_id,
        )
    }
    pub fn quality_gate_failed(score: u8, worst_metric: &str, request_id: String) -> Self {
        Self::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            ErrorType::ProcessingError,
            "QUALITY_GATE_FAILED",
            &format!("quality gate rejected theme: min_score={} worst_metric={}", score, worst_metric),
            Some(worst_metric),
            request_id,
        )
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = self.status;
        let request_id = self.body.error.request_id.clone();
        let mut response = (status, Json(self.body)).into_response();
        if status == StatusCode::TOO_MANY_REQUESTS {
            response
                .headers_mut()
                .insert("Retry-After", axum::http::HeaderValue::from_static("60"));
        }
        if let Ok(val) = axum::http::HeaderValue::from_str(&request_id) {
            response.headers_mut().insert("Request-Id", val);
        }
        response
    }
}
```

## 4. Request-Id middleware (`src/middleware/request_id.rs` NEW)

```rust
//! Request-Id Tower middleware (Sprint 5).
//!
//! - Reads `Request-Id` from incoming headers; if absent, generates `req_<ulid>`.
//! - Inserts into request extensions as `RequestId(String)` for handler access.
//! - Echoes the same value as `Request-Id` response header.

use axum::{extract::Request, middleware::Next, response::Response};
use ulid::Ulid;

#[derive(Clone, Debug)]
pub struct RequestId(pub String);

pub async fn request_id_middleware(mut req: Request, next: Next) -> Response {
    let request_id = req
        .headers()
        .get("request-id")
        .and_then(|h| h.to_str().ok())
        .map(String::from)
        .unwrap_or_else(|| format!("req_{}", Ulid::new()));

    req.extensions_mut().insert(RequestId(request_id.clone()));
    let mut resp = next.run(req).await;
    if let Ok(val) = axum::http::HeaderValue::from_str(&request_id) {
        resp.headers_mut().insert("Request-Id", val);
    }
    resp
}
```

In `main.rs` after `let app = Router::new()...`:
```rust
use axum::middleware::from_fn;
use crate::middleware::request_id::request_id_middleware;

let app = app.layer(from_fn(request_id_middleware));
```

This layer must be applied OUTSIDE the auth layer so that error responses from auth (which are constructed before reaching the handler) still have a Request-Id available. Layer order matters; verify in build phase.

## 5. utoipa annotation pattern

Every response/request struct gets:

```rust
#[derive(Debug, Serialize, ToSchema)]  // add ToSchema
#[serde(rename_all = "camelCase")]      // add rename_all (or already has it)
pub struct GenerateRequest {
    /// Number of colors (2-12)
    pub count: Option<u32>,
    pub harmony: Option<String>,
    pub hue: Option<f64>,
    pub luminance: Option<[f64; 2]>,
    pub saturation: Option<[f64; 2]>,
    pub min_score: Option<u8>,
    pub seed: Option<String>,
}
```

Every handler gets:

```rust
#[utoipa::path(
    post,
    path = "/api/v1/palette/generate",
    tag = "palette",
    operation_id = "generatePalette",
    request_body = GenerateRequest,
    responses(
        (status = 200, description = "Palette generated", body = Resource<PaletteOutput>),
        (status = 400, description = "Invalid request", body = ErrorEnvelope),
        (status = 401, description = "Missing/invalid API key", body = ErrorEnvelope),
        (status = 422, description = "Quality gate could not be satisfied", body = ErrorEnvelope),
        (status = 429, description = "Rate limited or quota exceeded", body = ErrorEnvelope),
    ),
    security(("apiKey" = []))
)]
pub async fn generate_palette(...) -> Result<Json<Resource<PaletteOutput>>, AppError> { ... }
```

## 6. OpenAPI doc root (`src/openapi.rs` NEW)

```rust
//! utoipa ApiDoc root for OpenAPI 3.1 generation (Sprint 5).

use utoipa::OpenApi;
use crate::models::envelope::{Resource, Collection};
use crate::models::response::*;
use crate::models::request::*;
use crate::models::palette::*;
use crate::models::theme::*;
use crate::error::{ErrorEnvelope, ErrorBody, ErrorType, SubError};

#[derive(OpenApi)]
#[openapi(
    info(
        title = "Color Palette API",
        version = "1.4.0",
        description = "Developer-first REST API for generating coolors.co-quality color palettes with 9-metric quality scoring."
    ),
    servers(
        (url = "https://color-palette-api.example.com", description = "Production")
    ),
    paths(
        crate::routes::palette::random_palette,
        crate::routes::palette::generate_palette,
        crate::routes::palette::lock_palette,
        crate::routes::palette::adjust_palette,
        crate::routes::palette::blend_palette,
        crate::routes::color::get_color_info,
        crate::routes::color::get_blindness,
        crate::routes::color::post_shades,
        crate::routes::analysis::contrast,
        crate::routes::analysis::palette_analysis,
        crate::routes::export::css,
        crate::routes::export::scss,
        crate::routes::export::tailwind,
        crate::routes::theme::generate,
        crate::routes::theme_export::design_tokens_handler,
        crate::routes::theme_export::figma_variables_handler,
        crate::routes::auth::exchange,
        crate::routes::user::me,
        crate::routes::user::user_quota,
        crate::routes::user::rotate_key,
        crate::routes::user::delete_account,
        crate::routes::admin::create_key,
        crate::routes::admin::list_keys,
        crate::routes::admin::delete_key,
        crate::routes::admin::get_stats,
        crate::routes::admin::set_user_tier,
        crate::routes::health::health,
    ),
    components(
        schemas(
            // Envelopes
            ErrorEnvelope, ErrorBody, ErrorType, SubError,
            // Request bodies
            GenerateRequest, LockRequest, AdjustRequest, BlendRequest,
            // Inner resources (and Resource<T> wrappers via generic schemas)
            PaletteOutput, ColorOutput, ColorInfoResponse, BlindnessResponse,
            ContrastResponse, PaletteAnalysisResponse, AnalysisMetrics,
            ExportResponse, HealthResponse, AdminStatsResponse,
            // Sprint 2 additions
            ThemeBundle, DesignTokenExport, FigmaVariableExport,
            // Sprint 3 additions
            ExchangeResponse, UserMeResponse, QuotaResponse, RotateResponse, DeleteResponse,
        )
    ),
    security(
        ("apiKey" = [])
    ),
    modifiers(&SecurityAddon)
)]
pub struct ApiDoc;

struct SecurityAddon;
impl utoipa::Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "apiKey",
                utoipa::openapi::security::SecurityScheme::ApiKey(
                    utoipa::openapi::security::ApiKey::Header(
                        utoipa::openapi::security::ApiKeyValue::new("X-API-Key"),
                    ),
                ),
            );
        }
    }
}
```

## 7. Swagger UI mount (in `main.rs`)

```rust
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;
use crate::openapi::ApiDoc;

let app = app
    .merge(
        SwaggerUi::new("/swagger-ui")
            .url("/api/v1/openapi.json", ApiDoc::openapi())
    );
```

`/api/v1/docs` becomes (via `routes::docs::docs`):

```rust
use axum::response::Redirect;

pub async fn docs() -> Redirect {
    Redirect::permanent("/swagger-ui")
}
```

The 400-line hand-written HTML is deleted.

## 8. Idempotency middleware (Tier 2, `src/middleware/idempotency.rs` NEW)

```rust
//! Idempotency-Key middleware (Sprint 5 Tier 2).
//!
//! Stores response by (api_key_hash, endpoint, idempotency_key, body_sha256)
//! in an in-memory LRU. TTL 24h, capacity 10K.
//!
//! Wraps state-changing POSTs:
//! - /palette/generate
//! - /palette/lock
//! - /auth/exchange
//! - /user/rotate-key

use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use std::collections::HashMap;
// ... (LRU implementation: capacity-bounded HashMap with insertion-order eviction
//      and per-entry TTL check on read)
```

(Full implementation is straightforward; ~100 LOC. Works Backend Lead implements.)

Key points:
- Key the LRU by `(api_key_hash, endpoint_path, idempotency_key, body_sha256)`. Including `api_key_hash` prevents cross-user collision (R7 mitigation).
- TTL check on every read (lazy eviction).
- On hit: return cached `(status, body)` plus a `X-Idempotent-Replayed: true` header.
- On miss: forward to handler, capture response, store, return.
- On same key + different body: return 400 `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_BODY` (an `invalid_request_error`).
- Implement as a Tower `Service` wrapper that runs only on the listed endpoints (use `axum::middleware::from_fn_with_state` and check the path).

## 9. X-RateLimit headers (Tier 2, `src/middleware/rate_limit_headers.rs` NEW)

The existing rate limiter (`src/middleware/auth.rs` or wherever it lives -- Works confirms) computes per-key request counts. Sprint 5 adds a Tower layer that reads this state and writes:
- `X-RateLimit-Limit: <per-minute ceiling>`
- `X-RateLimit-Remaining: <int>`
- `X-RateLimit-Reset: <unix_epoch_seconds_until_window_resets>`

Apply to all authenticated routes.

## 10. Test surface area + migration

### 10.1 Pre-build test count (R4 mitigation)

Works Phase 0 first action:
```bash
cargo test 2>&1 | tail -1
# Record exact count as the baseline. Spec says "153 ± 5" but verify before starting.
```

### 10.2 Test rewrite pattern (R4 mitigation)

For each test that asserts a specific JSON shape:

**Anti-pattern (DO NOT DO THIS)**:
```rust
let body: serde_json::Value = response.json().await;
assert_eq!(body["composite_score"], 87);  // BEFORE
// becomes
assert_eq!(body["compositeScore"], 87);   // AFTER -- mechanical but blind
```

**Correct pattern**:
```rust
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PaletteEnvelope {
    object: String,
    id: String,
    created_at: String,
    colors: Vec<ColorOutput>,
    composite_score: f64,
    metrics: AnalysisMetrics,
    // ...
}

let body: PaletteEnvelope = response.json().await.unwrap();
assert_eq!(body.object, "palette");
assert!(body.id.starts_with("pal_"));
assert!(body.composite_score >= 70.0);
```

Strongly typed deserialization catches BOTH naming changes AND structural changes. If the wire format silently changes a field's type, the test fails with a clear deserialize error rather than a missing assertion.

### 10.3 Test categories needing rewrite

| File | Approx tests | Effort |
|------|------------|--------|
| `tests/api_integration.rs` | ~20 (palette, color, analyze, export) | Medium -- mostly mechanical |
| `tests/integration/auth_*.rs` | ~25 (auth + user) | LARGE -- envelope wrap + camelCase + bare→Resource |
| `tests/routes/admin*.rs` | ~8 | Small |
| `tests/routes/theme*.rs` | ~10 | Medium |
| Engine unit tests in `src/engine/*` | ~60 | NONE -- engine unchanged |
| Other | ~30 | Small |
| **Total** | **~153** | **~70 need updates** |

## 11. CORS configuration

Currently `main.rs` uses `CorsLayer` with `AllowOrigin::from_env(...)` (Works confirms exact pattern). Sprint 5:
- No code change.
- Document in frontend-handoff.md: "Set `CORS_ALLOWED_ORIGINS=https://yourapp.com,https://staging.yourapp.com` to allow your frontend origin. Localhost is allowed in dev mode."

## 12. Build sequence (11 steps for Works CTO)

1. **Phase 0 R1 gate**: Verify utoipa 5 + axum 0.8 compile a hello-world handler with `#[utoipa::path]` + `#[derive(ToSchema)]`. Time-box: 2 hours. If failure, switch to fallback.
2. **Add crates + bump version**: `Cargo.toml` updates. New `models/envelope.rs`, new `error.rs`, new `middleware/request_id.rs`, new `openapi.rs`.
3. **Apply rename_all + ToSchema** to all model structs in `models/response.rs`, `models/request.rs`, `models/palette.rs`, `models/theme.rs`.
4. **Refactor route files** in dependency order (models first, then routes): palette, color, analysis, export, theme, theme_export, admin, user, auth, health, docs.
5. **Add `#[utoipa::path]`** to every handler. Add `Extension<RequestId>` to handlers that construct AppErrors.
6. **Mount** `request_id_middleware` layer + Swagger UI in `main.rs`.
7. **Add Tier 2 middlewares**: idempotency, rate-limit headers.
8. **Update tests** using the strongly-typed pattern from 10.2.
9. **Run Spectral lint** against `/api/v1/openapi.json`. Fix any errors. Document any suppressed warnings.
10. **Write `docs/frontend-handoff.md`, `docs/error-contract.md`, `docs/deploy-plan.md`**.
11. **Cargo.toml/README/CLAUDE.md sync** + git commit + handoff to Guard.

## 13. Routes catalog (final state after Sprint 5)

| Route | Handler | object | Auth |
|------|--------|--------|------|
| GET /health | health::health | health | Public |
| GET /api/v1/docs | docs::docs (redirect) | -- | Public |
| GET /swagger-ui/* | utoipa-swagger-ui | -- | Public |
| GET /api/v1/openapi.json | utoipa::OpenApi | (raw spec) | Public |
| GET /api/v1/palette/random | palette::random_palette | palette | API Key |
| POST /api/v1/palette/generate | palette::generate_palette | palette | API Key |
| POST /api/v1/palette/lock | palette::lock_palette | palette | API Key |
| POST /api/v1/palette/adjust | palette::adjust_palette | colorList | API Key |
| POST /api/v1/palette/blend | palette::blend_palette | colorList | API Key |
| GET /api/v1/color/{hex} | color::get_color_info | color | API Key |
| GET /api/v1/color/{hex}/blindness | color::get_blindness | colorBlindnessSimulation | API Key |
| POST /api/v1/color/shades | color::post_shades | colorList | API Key |
| POST /api/v1/analyze/contrast | analysis::contrast | wcagContrast | API Key |
| POST /api/v1/analyze/palette | analysis::palette_analysis | paletteAnalysis | API Key |
| POST /api/v1/export/css | export::css | export | API Key |
| POST /api/v1/export/scss | export::scss | export | API Key |
| POST /api/v1/export/tailwind | export::tailwind | export | API Key |
| POST /api/v1/export/design-tokens | theme_export::design_tokens_handler | designTokens | API Key |
| POST /api/v1/export/figma-variables | theme_export::figma_variables_handler | figmaVariables | API Key |
| POST /api/v1/theme/generate | theme::generate | themeBundle | API Key |
| POST /api/v1/auth/exchange | auth::exchange | apiKeyExchange | Firebase JWT (in body) |
| GET /api/v1/user/me | user::me | user | API Key |
| GET /api/v1/user/quota | user::user_quota | quota | API Key |
| POST /api/v1/user/rotate-key | user::rotate_key | apiKeyExchange | API Key |
| DELETE /api/v1/user/account | user::delete_account | accountDeletionResult | API Key + Firebase JWT |
| POST /api/v1/admin/keys | admin::create_key | apiKey | Admin Key |
| GET /api/v1/admin/keys | admin::list_keys | list (Collection<apiKey>) | Admin Key |
| DELETE /api/v1/admin/keys/{id} | admin::delete_key | (204 no body) | Admin Key |
| GET /api/v1/admin/stats | admin::get_stats | adminStats | Admin Key |
| POST /api/v1/admin/users/{firebase_uid}/tier | admin::set_user_tier | user | Admin Key |

Total: 27 functional + 3 docs (docs redirect, swagger-ui, openapi.json) = 30 routes.

## 14. Open implementation questions (Architect Lead → Works CTO)

1. **utoipa-swagger-ui axum 0.8 feature flag** -- if the `axum` feature on `utoipa-swagger-ui` requires axum 0.7, see if a newer version (8.x or 9.x) supports 0.8. Worst case: serve Swagger UI manually from a static HTML file pointing at `/api/v1/openapi.json`.
2. **`Resource<T>` schema generation in utoipa** -- generic ToSchema may need `aliases(...)` to expose concrete types. Confirm pattern in utoipa 5 docs.
3. **Where to instantiate `RequestId`** -- middleware vs extractor. Spec recommends middleware. Works confirms placement in tower stack.
4. **`Idempotency-Key` storage** -- in-memory only (per spec). If memory pressure becomes a concern in observation, future sprint can swap to SQLite.
