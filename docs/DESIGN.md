# Design

Minimalistic, futuristic, user-oriented. Responsive. Dark navy only.

## Palette (draft, to confirm in Figma)
| Token | Use | Value |
|---|---|---|
| bg | App background | #0A1128 |
| surface | Cards, sheets | #121B3A |
| border | Dividers | #1F2B52 |
| text | Primary text | #E6ECFF |
| text-muted | Secondary | #8C9AC4 |
| accent | Primary actions | #3DA5FF |

## Functional colors (color follows function)
| State | Color |
|---|---|
| Weak / error / delete | Red #FF5C6C |
| Fair / warning | Amber #FFB84D |
| Good | Cyan #3DD6D0 |
| Strong / success | Green #3DDC97 |

## Rules
- Mobile-first, scale up to tablet/desktop.
- Large tap targets, one primary action per screen.
- Never show passwords by default; reveal on tap, re-hide automatically.
- Define colors as tokens only, no hard-coded hex in components.
