// MSW stub data — response shapes mirror docs/frontend-handoff.md Sprint 6 Amendment.
// Used when VITE_USE_MSW=true (default during Sprint 1 build).

import type {
  Color,
  CodeExportResponse,
  ContrastMatrixResource,
  PaletteExplanationResource,
  PaletteResource,
  ThemeBundleResource,
  ThemeRamp,
} from '@/types/api';
import { hexToHsl, hexToOklch, hexToRgb, contrastRatio } from '@/lib/color-math';

const SEED_PALETTES: string[][] = [
  ['#0F172A', '#64748B', '#F1F5F9', '#EF4444', '#22C55E'],
  ['#D00000', '#F77F00', '#FCBF49', '#EAE2B7', '#003049'],
  ['#1A1A2E', '#16213E', '#0F3460', '#E94560', '#53354A'],
  ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'],
  ['#6A4C93', '#1982C4', '#8AC926', '#FFCA3A', '#FF595E'],
  ['#222E50', '#439A86', '#BCD8C1', '#E9D985', '#F7B267'],
  ['#03071E', '#370617', '#6A040F', '#9D0208', '#D00000'],
];

const NAMES = ['Primary', 'Secondary', 'Tertiary', 'Accent', 'Highlight'];

let counter = 0;

function ulid(prefix: string): string {
  counter++;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36).padStart(4, '0')}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function stubPalette(opts: {
  locked?: string[];
  seed?: string;
  semanticTokens?: boolean;
} = {}): PaletteResource {
  const hexes = SEED_PALETTES[Math.floor(Math.random() * SEED_PALETTES.length)];
  const merged = [...hexes];
  if (opts.locked) {
    opts.locked.forEach((hex, i) => {
      if (hex) merged[i] = hex;
    });
  }
  return {
    object: 'palette',
    id: ulid('pal'),
    createdAt: nowIso(),
    seed: opts.seed,
    colors: merged.map((hex, i) => ({
      hex,
      rgb: hexToRgb(hex),
      hsl: hexToHsl(hex),
      oklch: hexToOklch(hex),
      name: NAMES[i] ?? `Color${i + 1}`,
    })),
    compositeScore: Math.round(72 + Math.random() * 22),
    metrics: {
      harmony: 84.2,
      distinctness: 91.5,
      lightnessDistribution: 78.3,
      temperatureCoherence: 66.1,
      saturationCoherence: 72.4,
      gamutSpread: 58.9,
      uiUtility: 88.0,
      colorBlindSafety: 92.4,
      accessibility: 71.8,
    },
    harmonyType: opts.locked?.length ? 'constrained' : 'analogous',
    iterations: opts.seed ? 1 : 4,
  };
}

// Loop 3 FR-4: MSW stub for /theme/generate must mirror the LIVE themeBundle
// shape so tests exercise the same code path as production. Before Loop 3 this
// handler returned a hand-crafted PaletteResource, which masked the type
// mismatch — Guard Loop 1 missed it because MSW was on during verification.
function makeColor(hex: string, name: string): Color {
  return {
    hex,
    rgb: hexToRgb(hex),
    hsl: hexToHsl(hex),
    oklch: hexToOklch(hex),
    name,
  };
}

function stubRamp(baseHex: string, label: string): ThemeRamp {
  // Not a real perceptual ramp — just 11 distinct-enough hexes so the adapter
  // and consumers have valid Color objects to work with in MSW mode. Live
  // backend returns a proper ramp; this is only for tests.
  const steps: Array<'50'|'100'|'200'|'300'|'400'|'500'|'600'|'700'|'800'|'900'|'950'> =
    ['50','100','200','300','400','500','600','700','800','900','950'];
  const ramp = {} as ThemeRamp;
  steps.forEach((step) => {
    ramp[step] = makeColor(baseHex, `${label}-${step}`);
  });
  return ramp;
}

export function stubThemeBundle(opts: {
  primary?: string;
  seed?: string;
  mode?: 'light' | 'dark' | 'both';
} = {}): ThemeBundleResource {
  const primaryHex = opts.primary ?? '#0F172A';
  const secondaryHex = '#64748B';
  const accentHex = '#7AE4C3';
  const neutralHex = '#94A3B8';
  return {
    object: 'themeBundle',
    id: ulid('tb'),
    createdAt: nowIso(),
    mode: opts.mode ?? 'both',
    seed: opts.seed,
    primaryInput: makeColor(primaryHex, 'Primary Input'),
    primitive: {
      primary: stubRamp(primaryHex, 'primary'),
      secondary: stubRamp(secondaryHex, 'secondary'),
      accent: stubRamp(accentHex, 'accent'),
      neutral: stubRamp(neutralHex, 'neutral'),
    },
    quality: {
      minScore: 82,
      perMetric: {
        primary_composite: 84,
        secondary_composite: 80,
        accent_composite: 82,
      },
    },
    wcag: {
      enforced: true,
      target: 'AA',
      pairsChecked: 20,
      pairsAdjusted: 0,
      adjustedPairs: [],
    },
    warnings: [],
    framework: 'stub',
    generatedAt: nowIso(),
  };
}

export function stubContrastMatrix(palette: string[]): ContrastMatrixResource {
  const matrix = [];
  for (let fgI = 0; fgI < palette.length; fgI++) {
    for (let bgI = 0; bgI < palette.length; bgI++) {
      const fgHex = palette[fgI];
      const bgHex = palette[bgI];
      const ratio = fgI === bgI ? 1 : contrastRatio(fgHex, bgHex);
      matrix.push({
        fgIndex: fgI,
        bgIndex: bgI,
        fgHex,
        bgHex,
        ratio: Number(ratio.toFixed(2)),
        passes: {
          aaNormal: ratio >= 4.5,
          aaLarge: ratio >= 3,
          aaaNormal: ratio >= 7,
          aaaLarge: ratio >= 4.5,
        },
      });
    }
  }
  return {
    object: 'contrastMatrix',
    id: ulid('mtx'),
    createdAt: nowIso(),
    palette,
    matrix,
    colorblind: {
      protanopia: palette,
      deuteranopia: palette,
      tritanopia: palette,
      protanomaly: palette,
      deuteranomaly: palette,
      tritanomaly: palette,
      achromatopsia: palette,
      achromatomaly: palette,
    },
    matricesSource: {
      dichromacy: 'Brettel 1997',
      anomalous: 'Machado 2009',
      achromatic: 'luminance fallback',
    },
  };
}

export function stubExplanation(
  palette: string[],
  seed?: string,
): PaletteExplanationResource {
  return {
    object: 'paletteExplanation',
    id: ulid('exp'),
    createdAt: nowIso(),
    palette,
    seed: seed ?? 'ABCDEFGHJKMNP',
    harmonyType: 'analogous',
    harmonyConfidence: 0.82,
    hueRelationships: [
      { from: 0, to: 1, deltaH: 24, relationship: 'adjacent' },
      { from: 1, to: 2, deltaH: 31, relationship: 'adjacent' },
      { from: 0, to: 3, deltaH: 178, relationship: 'complementary' },
    ],
    oklchNarrative: {
      lightnessRange: { min: 0.22, max: 0.94, span: 0.72 },
      chromaRange: { min: 0.02, max: 0.18, mean: 0.1 },
      hueSpread: { min: 12, max: 210, span: 198 },
    },
    pedagogicalNotes: [
      'the lightness span is wide — this gives strong typographic contrast options.',
      'chroma is moderate; most colors are muted rather than saturated.',
      'hue cluster 0-2 forms an analogous triad; color 3 anchors the complement.',
      'the last color is a bridge hue — it softens the complementary tension.',
    ],
    harmonyReference: 'https://en.wikipedia.org/wiki/Color_scheme#Analogous_colors',
    templateVersion: 'sprint6.v1',
  };
}

const EXPORT_CODE_SNIPPETS: Record<string, { code: string; filename: string; pasteInto: string }> = {
  'tailwind-config': {
    code: `// tailwind.config.js extension
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#0F172A',
        secondary: '#64748B',
        muted: '#F1F5F9',
        destructive: '#EF4444',
        success: '#22C55E',
      },
    },
  },
};`,
    filename: 'tailwind.config.js',
    pasteInto: 'tailwind.config.js under theme.extend.colors',
  },
  'css-vars-hex': {
    code: `:root {
  --primary: #0F172A;
  --secondary: #64748B;
  --muted: #F1F5F9;
  --destructive: #EF4444;
  --success: #22C55E;
}`,
    filename: 'palette.css',
    pasteInto: 'app/globals.css :root block',
  },
  'css-vars-oklch': {
    code: `:root {
  --primary: oklch(0.22 0.04 264);
  --secondary: oklch(0.58 0.03 259);
  --muted: oklch(0.96 0.01 253);
  --destructive: oklch(0.64 0.22 26);
  --success: oklch(0.74 0.19 146);
}`,
    filename: 'palette-oklch.css',
    pasteInto: 'app/globals.css :root block (modern browsers)',
  },
  'shadcn-globals': {
    code: `@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --primary: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --border: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
}`,
    filename: 'globals.css',
    pasteInto: 'app/globals.css @layer base',
  },
  scss: {
    code: `$primary: #0F172A;
$secondary: #64748B;
$muted: #F1F5F9;
$destructive: #EF4444;
$success: #22C55E;`,
    filename: '_palette.scss',
    pasteInto: 'src/styles/_palette.scss',
  },
  'mui-palette': {
    code: `import { PaletteOptions } from '@mui/material';

export const palette: PaletteOptions = {
  primary: { main: '#0F172A' },
  secondary: { main: '#64748B' },
  error: { main: '#EF4444' },
  success: { main: '#22C55E' },
};`,
    filename: 'mui-palette.ts',
    pasteInto: 'src/theme/palette.ts',
  },
  'swift-uicolor': {
    code: `import SwiftUI

extension Color {
    static let primary = Color(red: 0.06, green: 0.09, blue: 0.16)
    static let secondary = Color(red: 0.39, green: 0.45, blue: 0.55)
}`,
    filename: 'Palette+Color.swift',
    pasteInto: 'Sources/Theme/Palette+Color.swift',
  },
  'android-xml': {
    code: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="primary">#0F172A</color>
    <color name="secondary">#64748B</color>
    <color name="muted">#F1F5F9</color>
    <color name="destructive">#EF4444</color>
    <color name="success">#22C55E</color>
</resources>`,
    filename: 'colors.xml',
    pasteInto: 'res/values/colors.xml',
  },
  'dtcg-json': {
    code: `{
  "palette": {
    "primary": { "$value": "#0F172A", "$type": "color" },
    "secondary": { "$value": "#64748B", "$type": "color" },
    "destructive": { "$value": "#EF4444", "$type": "color" },
    "success": { "$value": "#22C55E", "$type": "color" }
  }
}`,
    filename: 'tokens.json',
    pasteInto: 'tokens/palette.json',
  },
};

export function stubCodeExport(format: string): CodeExportResponse {
  const snippet = EXPORT_CODE_SNIPPETS[format] ?? EXPORT_CODE_SNIPPETS['shadcn-globals'];
  return {
    object: 'codeExport',
    id: ulid('exp'),
    createdAt: nowIso(),
    format,
    code: snippet.code,
    filename: snippet.filename,
    pasteInto: snippet.pasteInto,
    targetDocs: 'https://color-palette-api.example.com/docs/export',
    targetVersion: 'v1.5.0',
    notes: `paste into: ${snippet.pasteInto}. verify with your build before committing.`,
  };
}
