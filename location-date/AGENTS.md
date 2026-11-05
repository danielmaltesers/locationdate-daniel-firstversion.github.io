# AGENTS.md — rules for the AI assistant

This file tells any coding agent (Claude Code, GitHub Copilot, …) HOW to build in this project.
WHAT to build is in `SPEC.md`. WHAT IS TRUE is in `data/`.

## Stack
- Plain HTML, CSS and a little vanilla JavaScript. No frameworks, no build step, no npm packages.
- One HTML file per page (see SPEC.md §4), one shared `style.css`, one shared `app.js`. Data lives in `data/*.json`.
- Must work when opened from GitHub Pages. No external fonts, no CDNs, no tracking.

## Content
- Never invent content. Every date, time, place, rule or description must come from `data/`.
- If a value in `data/` is `null`, show "Not confirmed yet" — never guess.
- A Mass is assumed to happen. Only show a status when `data/` says `cancelled` or `postponed`.
- Page language for the prototype: English (class review). Keep Portuguese names of places, churches and the Mission.
- Build exactly the pages and labels listed in `SPEC.md` — no extra pages, no renamed labels.
- The create form is simulated: it never sends or stores data anywhere.

## Design (the grey rule)
- System font only, greys only (black, white, greys), no images, no icons, no animations.
- Mobile first: design for a 360 px wide phone, then let it grow (desktop layout from 900 px).
- Large touch targets (at least 44 px), good contrast, readable without zoom, readable outside.

## Code quality
- Semantic HTML (header, nav, main, section, h1–h3, lists, buttons for actions, links for navigation).
- Accessible: meaningful headings, `lang="en"`, labels for inputs, visible focus.
- Small, readable files with short comments in English.
- Wrap `localStorage` in try/catch; the page must work without it.

## How you work with me
- Before writing code, tell me your plan in a few bullet points.
- After each change, explain in two sentences what you did and why.
- Change only what I asked for. If a request breaks a rule in this file, say so and ask before doing it.
