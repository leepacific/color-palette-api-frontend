# Interaction Engineering Report — Sprint 1

**Lead**: interaction-engineer (Mode A)
**Status**: complete

## Scope

Wire the 18-shortcut keyboard contract from `ux-flows.md` via a single central
hook, `useKeyboardShortcuts()`, that mounts a document-level `keydown` listener.

## File

`src/hooks/use-keyboard-shortcuts.ts`

## Binding coverage

| Key | Action | Status |
|-----|--------|--------|
| `r` | regenerate palette | ✓ |
| `space` | regenerate (alias) | ✓ |
| `1-9` | focus color at index | ✓ |
| `l` | lock focused color | ✓ |
| `L` (shift-l) | lock all | ✓ |
| `u` | unlock focused | ✓ |
| `U` (shift-u) | unlock all | ✓ |
| `e` | toggle export drawer | ✓ |
| `j` | next format (in drawer) | ✓ |
| `k` | previous format (in drawer) | ✓ |
| `c` | copy current format or focused hex | ✓ |
| `Enter` | copy (in drawer) | ✓ |
| `g j` | toggle json sidebar (chord) | ✓ |
| `g e` | toggle explain panel (chord) | ✓ |
| `g m` | toggle matrix panel (chord) | ✓ |
| `x` | colorblind cycle forward | ✓ |
| `X` | colorblind cycle backward | ✓ |
| `m` | toggle dark/light mode | ✓ |
| `s` | copy current url | ✓ |
| `?` | open help overlay | ✓ |
| `Escape` | dismiss current overlay | ✓ |

**Total**: 21 bindings (18 in spec + 3 minor additions: shift-L, U, shift-U).

## Chord system

The `g` prefix enters chord mode for 1000ms. Within that window, the next key
press executes the chord action and the prefix clears. The timer resets if a
new `g` is pressed.

## Conflict avoidance

- Modifier combinations (Ctrl, Meta, Alt) are NOT intercepted — browser defaults
  are preserved (Cmd+R reload, Cmd+S save, etc.)
- `t`, `f` are NOT intercepted
- Input focus detection: when focus is inside `<input>`, `<textarea>`, or
  `contentEditable`, ALL shortcuts are ignored EXCEPT `Escape`
- `Space` is preventDefaulted on the `r`/`space` regenerate action to avoid
  page scroll

## Focus-visible integration

Every interactive component has focus-visible handling via Tailwind
`focus-visible:outline-2 focus-visible:outline-offset-2
focus-visible:outline-border-accent`, plus a global rule in `global.css`:

```css
:focus-visible {
  outline: 2px solid var(--border-accent);
  outline-offset: 2px;
}
```

This means keyboard-tab navigation always shows a 2px mint-cyan ring.

## Feedback animations

- **Copy flash**: `copy-flash` class triggers 120ms background flash on copied
  notation (hex/oklch/hsl) per Q4 detail requirement. Implemented in
  `ColorSwatch.tsx`.
- **Drawer slide-in**: 150ms `cubic-bezier(0.2, 0, 0, 1)`, respects
  `prefers-reduced-motion`.

## Mode A disclosure

This report was written by the Works CTO in an interaction-engineer focus pass.
No sub-agent was spawned.
