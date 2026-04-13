# CSS architecture

The CSS uses `@layer` for specificity management, OKLCH for colors, and self-hosted fonts. No preprocessor, no build step.

## Layer order

Defined in `css/global.css`:

```css
@layer reset, base, components, utilities;
```

Layers are processed in order — later layers override earlier ones regardless of selector specificity. Utility classes always win over component styles, and component styles always win over base styles.

## File organization

| File | Layer | Purpose |
|---|---|---|
| `global.css` | (unlayered) | Layer declaration, design tokens (spacing, font stacks, radii, max-width) |
| `reset.css` | `reset` | Browser reset (box-sizing, margin, media hygiene) |
| `colors.css` | (unlayered) | OKLCH color primitives + semantic token mapping |
| `base.css` | `base` | Default element styles (body, headings, links) + `@font-face` declarations |
| `layout.css` | `components` | Page layout (`.container` max-width, safe-area padding) |
| `nav.css` | `components` | Header navigation links |
| `buttons.css` | `components` | Button styles (`.btn`, `.btn--primary`, `.btn--secondary`) + `.controls` layout |
| `breath-circle.css` | `components` | Breath-circle animation (keyframes + state classes) |
| `pose-card.css` | `components` | Current-pose card (`.pose-card`, `.pose-card__name`, etc.) |
| `progress.css` | `components` | Progress bar + time display |
| `practice.css` | `components` | Practice view layout (idle view, completed message, pose list preview) |
| `about.css` | `components` | About page styling |
| `settings.css` | `components` | Voice/rate/pitch settings disclosure panel |
| `utilities.css` | `utilities` | Utility classes (`.visually-hidden`) |
| `index.css` | — | Imports all CSS files in order |

`@font-face` declarations and `@keyframes` live **outside** `@layer` blocks (in `base.css` and `breath-circle.css` respectively) to avoid cascade-layer ordering surprises.

## Color system

Colors use the OKLCH color space. Primitives are defined as bare LCH triples in custom properties, then wrapped in `oklch()` for semantic tokens.

### Primitives (in `css/colors.css`)

```css
--lch-bg-deep: 21.9% 0.043 261.6;       /* deep navy */
--lch-bg-mid: 25.8% 0.059 266.0;        /* mid navy */
--lch-text-primary: 90.3% 0.021 72.1;   /* warm cream */
--lch-text-secondary: 68.5% 0.043 258.8; /* muted blue-grey */
--lch-text-dim: 49.9% 0.050 263.3;      /* dim blue-grey */
--lch-accent-warm: 75.4% 0.085 67.1;    /* warm amber */
--lch-accent-glow: 85.2% 0.064 74.5;    /* soft gold */
--lch-accent-breath: 70.3% 0.064 240.8; /* cool blue */
```

### Semantic tokens

```css
/* Surfaces */
--color-bg-deep       /* page background */
--color-bg-mid        /* card/section backgrounds */
--color-bg-card       /* translucent card overlay */
--color-border        /* subtle borders */

/* Text */
--color-text          /* primary text (warm cream) */
--color-text-secondary /* secondary text (blue-grey) */
--color-text-dim      /* de-emphasized text */

/* Accents */
--color-accent-warm   /* warm highlight (amber) */
--color-accent-glow   /* soft highlight (gold) */
--color-accent-breath /* breath-circle color (blue) */
```

Translucent accent variants (for glows, gradients, focus states) are derived from the base accents with `/alpha` syntax.

### Why OKLCH

OKLCH is perceptually uniform — equal steps in lightness look equal to the eye. This makes it easy to derive hover states, translucent overlays, and gradient stops that look intentional. The primitives were converted from the original hex values using `node scripts/hex-to-oklch.js`.

## Design tokens

Defined in `css/global.css`:

```css
/* Spacing */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;

/* Typography */
--font-serif: "Cormorant Garamond", Georgia, "Times New Roman", serif;
--font-sans: "Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

/* Borders */
--radius: 16px;
--radius-pill: 100px;

/* Layout */
--max-width: 520px;
```

## Fonts

Both typefaces are self-hosted in `fonts/` as TTF files with `font-display: swap`. No requests to Google Fonts CDN — privacy is a real value here.

- **Cormorant Garamond** — serif, used for headings and the app title
- **Nunito** — sans-serif, used for body text and UI elements

## Class naming

BEM-ish, matching the charity calc convention:

- Block: `.pose-card`, `.breath-circle`, `.settings`
- Element: `.pose-card__name`, `.pose-card__label`, `.settings__inner`
- Modifier: `.btn--primary`, `.btn--secondary`

Loose naming where the structure is obvious (`.container`, `.controls`, `.idle-message`).

## Where to add new styles

- **New component** — create `css/<component>.css`, wrap styles in `@layer components { }`, add `@import "<component>.css";` to `css/index.css` (before `utilities.css`)
- **New utility class** — add to `css/utilities.css`
- **New color** — add an LCH primitive + semantic mapping in `css/colors.css`
- **New design token** — add to `:root` in `css/global.css`
