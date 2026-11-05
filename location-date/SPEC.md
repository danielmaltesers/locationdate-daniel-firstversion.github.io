# SPEC.md — Portuguese Catholic Mission Cologne · Event tracker (version 1)

> Student project "Location date" (KISD, 2026). Not an official site of the Missão Católica de Expressão Portuguesa.
> Facts from the PDF bulletin Sep–Dec 2026, Instagram @missaoportuguesacolonia and missaoportuguesa.com (checked Nov 2026).
> The prototype is in **English** for the class review. The final app would be in Portuguese.

## 1. The gap (gap statement)

A **Portuguese-speaking churchgoer or newcomer in Cologne** checking on a Sunday morning or while planning the week
wants to know **whether the Mass is on, when and where the next community events are, and what happens at them**
— but the information is **fragmented** across a 4-month multi-city PDF bulletin, Instagram posts and stories
and a WhatsApp group; last-minute changes only appear in 24-hour stories, and most events have **no description**.

## 2. Situations (from the situation cards)

| # | Who | Situation | Key questions |
|---|---|---|---|
| 1 (main) | Beatriz, regular churchgoer | Sunday morning, at home or in the tram, little time, poor signal | Q01, Q02, Q04 |
| 2 | João, member near Burscheid | Planning the weekend at home, a few days ahead | Q03, Q10 |
| 3 | Mariana, newcomer | Evening, browsing on the phone, deciding whether an event is worth going to | Q05, Q06, Q07 |

## 3. Questions, with priority

| # | Question | Often? | Needed now? |
|---|---|---|---|
| Q01 | Is Mass still on today, or was it changed / cancelled? | often | now |
| Q02 | What time and in which church is Mass? | often | now |
| Q03 | Which Sunday is the Burscheid Mass this month? | often | plan ahead |
| Q04 | Is there something after Mass today? | sometimes | now |
| Q05 | What is coming up this month? | often | plan ahead |
| Q06 | What actually happens at this event? | often | plan ahead |
| Q07 | Is it in Portuguese, English or German? | sometimes | plan ahead |
| Q08 | Is it for me / my age / my kids? | sometimes | plan ahead |
| Q09 | Do I have to sign up – until when, how? | often | plan ahead (blocker) |
| Q10 | What is on in my community (Bonn / Neuss / Burscheid)? | often | plan ahead |
| Q11 | When are the Christmas / Easter Masses? | often (seasonal) | plan ahead |
| Q12 | Do I need to bring something? | sometimes | plan ahead |
| Q13 | Where exactly is the room? | sometimes | now |
| Q14 | Who can I ask if I'm unsure? | rarely | now |
| Q15 | Where is the link for the online session? | rarely | now |

## 4. Structure (the tree) — build exactly these pages and labels

| Level | Page | File | Label (link text) | Answers | Content from |
|---|---|---|---|---|---|
| 1 | Homepage | `index.html` | **Today** | Q01, Q02, Q04 (+ Q09 teaser) | `data/masses.json`, `data/events.json` |
| 2 | Masses | `masses.html` | **Masses** | Q02, Q03, Q10, Q11 | `data/masses.json`, `data/info.json` |
| 2 | Events | `events.html` | **Events** | Q05, Q09, Q10 | `data/events.json` |
| 2 | Create event | `create.html` | **+ Create** | (feeds Q05–Q08) | form only, simulated |
| 3 | Event page | `event.html?id=…` | — (title of the event) | Q06, Q07, Q08, Q09, Q12, Q13, Q15 | `data/events.json` |
| every page | Footer | — | Office · Official site · "Student project" | Q14 | `data/info.json` |

Main menu on every page, in this order: **Today · Masses · Events · + Create**.
Mobile: fixed bottom bar. Desktop (≥ 900 px): top menu, "+ Create event" as a highlighted button.
No other pages.

## 5. The homepage (from the wireframe), top to bottom

1. Name of the place + community chooser (Köln · Bonn · Neuss · Burscheid). The choice is remembered on this device.
2. **"Next Mass"** for the chosen community, computed from today's date and `masses.json`:
   - Default: date · time · church. No badge — a Mass is assumed to happen.
   - Only if `status` is `cancelled` or `postponed`: show **"Cancelled"** / **"Postponed"** with the note.
   - Special Masses (e.g. Bishop's visit) show their name and note.
3. **Alerts**: cancellations in **any** community within the next 7 days (e.g. "Neuss: no Mass on Sun 8 Nov").
4. **This week**: events in the next 7 days (all communities, community shown on the card).
5. **Fold** (360 × 640 px): items 1–3 must be above it.
6. Below the fold: **Sign-ups open** (events with `signup`), link "See all events".
7. Footer.

## 6. Every page

- Shows the name of the place at the top and the main menu (people also arrive from a search or a QR code).
- Missing information is shown honestly ("Not confirmed yet"), never invented.
- Past Masses and events are not shown.

## 7. Entry by QR code

A QR code on the notice board at Ursulagartenstraße 18 opens `index.html?c=koeln` (Köln preselected).
Other communities: `?c=bonn`, `?c=neuss`, `?c=burscheid`.

## 8. Testing with a fixed date

`?today=YYYY-MM-DD` overrides today's date (for testing and demos), e.g. `index.html?today=2026-11-08`.

## 9. Acceptance criteria (how we test it)

- [ ] Situation 1: on a 360 × 640 px phone, the next Mass in Köln (Q01, Q02) is visible on the homepage **without a tap and without scrolling**.
- [ ] With `?today=2026-11-08`, the homepage shows the alert "Neuss: no Mass" for Sunday 8 Nov.
- [ ] Setting a Mass in `masses.json` to `"status": "cancelled"` makes "Cancelled" appear on the homepage and on Masses — without changing any HTML.
- [ ] Situation 2: the next Burscheid Mass with its exact date is reached in **max. 2 taps** (Masses → Burscheid).
- [ ] Situation 3: an event description (what happens, language, for whom) is reached in **max. 2 taps** (Events → event).
- [ ] The create form cannot be sent without a description; after sending it says the office will confirm.
- [ ] Menu labels match section 4 exactly, on every page.
- [ ] No fact on any page that is not in `data/`.
- [ ] Grey rule respected (see AGENTS.md).
