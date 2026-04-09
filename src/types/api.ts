// Hand-written API types mirroring v1.5.0 contract.
// Source: docs/frontend-handoff.md + docs/error-contract.md

export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };
export type Oklch = { l: number; c: number; h: number };

export interface Color {
  hex: string;
  rgb: Rgb;
  hsl: Hsl;
  oklch: Oklch;
  name?: string;
}

export interface PaletteMetrics {
  harmony: number;
  distinctness: number;
  lightnessDistribution: number;
  temperatureCoherence: number;
  saturationCoherence: number;
  gamutSpread: number;
  uiUtility: number;
  colorBlindSafety: number;
  accessibility: number;
}

export interface PaletteResource {
  object: 'palette';
  id: string;
  createdAt: string;
  colors: Color[];
  compositeScore: number;
  metrics: PaletteMetrics;
  harmonyType: string;
  iterations?: number;
  seed?: string;
}

export type CodeExportFormat =
  | 'tailwind-config'
  | 'css-vars-hex'
  | 'css-vars-oklch'
  | 'shadcn-globals'
  | 'scss'
  | 'mui-palette'
  | 'swift-uicolor'
  | 'android-xml'
  | 'dtcg-json';

export interface CodeExportRequest {
  format: CodeExportFormat;
  theme: { primary: string; colors?: Record<string, string> };
  mode?: 'light' | 'dark' | 'both';
  cssVariableSyntax?: 'hsl' | 'oklch';
  seed?: string;
}

export interface CodeExportResponse {
  object: 'codeExport';
  id: string;
  createdAt: string;
  format: string;
  code: string;
  filename: string;
  pasteInto: string;
  targetDocs: string;
  targetVersion: string;
  notes: string;
  seed?: string;
}

export interface ContrastMatrixEntry {
  fgIndex: number;
  bgIndex: number;
  fgHex: string;
  bgHex: string;
  ratio: number;
  passes: {
    aaNormal: boolean;
    aaLarge: boolean;
    aaaNormal: boolean;
    aaaLarge: boolean;
  };
}

export interface ContrastMatrixResource {
  object: 'contrastMatrix';
  id: string;
  createdAt: string;
  palette: string[];
  matrix: ContrastMatrixEntry[];
  colorblind?: {
    protanopia: string[];
    deuteranopia: string[];
    tritanopia: string[];
    protanomaly: string[];
    deuteranomaly: string[];
    tritanomaly: string[];
    achromatopsia: string[];
    achromatomaly: string[];
  };
  matricesSource: { dichromacy: string; anomalous: string; achromatic: string };
}

export interface PaletteExplanationResource {
  object: 'paletteExplanation';
  id: string;
  createdAt: string;
  palette: string[];
  seed: string;
  harmonyType: string;
  harmonyConfidence: number;
  hueRelationships: Array<{
    from: number;
    to: number;
    deltaH: number;
    relationship: string;
  }>;
  oklchNarrative: {
    lightnessRange: { min: number; max: number; span: number };
    chromaRange: { min: number; max: number; mean: number };
    hueSpread: { min: number; max: number; span: number };
  };
  pedagogicalNotes: string[];
  harmonyReference: string;
  templateVersion: 'sprint6.v1';
}

export interface SemanticTokenBundle {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  'chart-1': string;
  'chart-2': string;
  'chart-3': string;
  'chart-4': string;
  'chart-5': string;
}

export interface ApiErrorEnvelope {
  object: 'error';
  error: {
    type:
      | 'invalid_request_error'
      | 'authentication_error'
      | 'permission_error'
      | 'rate_limit_error'
      | 'quota_exceeded_error'
      | 'service_unavailable_error'
      | 'api_error'
      | 'processing_error';
    code: string;
    message: string;
    param?: string;
    docUrl: string;
    requestId: string;
    retryAfterSeconds?: number;
    errors?: unknown[];
  };
}

export type ColorblindMode =
  | 'none'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'protanomaly'
  | 'deuteranomaly'
  | 'tritanomaly'
  | 'achromatopsia'
  | 'achromatomaly';

export const COLORBLIND_MODES: ColorblindMode[] = [
  'none',
  'protanopia',
  'deuteranopia',
  'tritanopia',
  'protanomaly',
  'deuteranomaly',
  'tritanomaly',
  'achromatopsia',
  'achromatomaly',
];

export const CODE_EXPORT_FORMATS: CodeExportFormat[] = [
  'tailwind-config',
  'css-vars-hex',
  'css-vars-oklch',
  'shadcn-globals',
  'scss',
  'mui-palette',
  'swift-uicolor',
  'android-xml',
  'dtcg-json',
];
