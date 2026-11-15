# DESIGN-TOKENS.md — visual design v1.0 "Pedra & Luz"

Source: Mission logo (stained-glass blue, heart red), the Mission building (light stone, sky), the colour palette.

## Colours
| Token | Value | Use |
|---|---|---|
| ink | #1A2340 | text, headings, selected chip |
| blue | #2D66B0 | accent: links, active menu, buttons, "TODAY" label, logo subline |
| sky | #D9ECFF | top of the page background gradient, placeholder gradient |
| sky-light | #F8FBFF | page background |
| stone | #EFEBE4 | tags, footer, placeholder gradient end |
| stone-line | #E6E1D8 | card borders |
| mid | #5B6478 | secondary text |
| soft | #B9C3D6 | chip borders |
| red | #D7263D | only for cancellations (badge, dashed alerts border) |
| white | #FFFFFF | cards |

Background: linear-gradient(180deg, sky 0 → sky-light 260px → #F7F4EF).
Placeholder: linear-gradient(180deg, sky → stone).

## Type (system font)
| Token | Size |
|---|---|
| body | 14 px |
| small / meta | 11–12 px |
| h1 | 20 px |
| h2 | 16 px |
| hero title | 17 px (mobile) / 22 px (desktop) |
| logo text | 12.5 px bold + 10.5 px subline (desktop 14 / 11.5) |

## Shape & spacing
- Radius: cards 12 px, chips 15 px (pill), buttons 20 px.
- Shadows: cards 0 2px 10px rgba(26,35,64,.05); hero 0 8px 24px rgba(59,120,200,.15).
- Page padding 16 px (mobile) / 32 px (desktop); section gap 14 px; card gap 6–8 px.
- Touch targets ≥ 24 px (chips 30 px).

## Contrast (WCAG AA)
- ink on white 15.4:1 · blue on white/sky-light 5.6:1 · white on blue 5.6:1 (palette #3B78C8 darkened to #2D66B0 for AA contrast) · red on white 5.3:1 · mid on white 6.0:1.
