# Horizon

A single-user planning app for work that unfolds over months rather than days — grant applications, manuscripts, thesis chapters, any project with a distant deadline and a lot of small steps in between.

It runs entirely on free tiers. Your data lives as JSON files in a private GitHub repository you own, so every edit becomes a commit and nothing is locked inside someone else's database.

- **[SETUP.md](SETUP.md)** — step-by-step deployment, written for people who have never deployed anything before.
- **[USAGE.md](USAGE.md)** — how to actually use the app day to day.

---

## What it does

**Projects, not just tasks.** Each project has a hard deadline, a domain (a category you define), notes, and an ordered checklist of steps with their own target dates. The home screen shows them as cards with progress and the next thing to do.

**A weekly view that answers "what now?"** Below the cards sits a list of everything due between today and Friday, with a peek at next week. Overdue items surface there in a muted red rather than shouting.

**A long-range timeline.** One row per domain, one diamond per deadline, months along the axis. It answers "is October going to hurt?" at a glance.

**AI-assisted planning (optional).** Paste a call for proposals or a set of submission guidelines and the app asks Claude to extract the deadline and propose a backdated schedule of steps — drafts, budgets, required attachments, internal review, submission buffer. You edit the result before anything is saved. The same feature turns meeting notes into a prep checklist for the next meeting.

**Recurring meetings.** Define a template with a weekday and a standard checklist, then spawn a fresh prep task whenever you need one — optionally seeded with action items pulled from the last meeting's transcript.

**Files and links.** Attach small files (up to 3 MB) directly to a project, or add labelled links to anything living elsewhere — cloud storage, submission portals, shared drives.

**Calendar feed.** Subscribe from Outlook, Google Calendar, or Apple Calendar to see deadlines and step targets alongside your meetings.

**Archive.** Completed projects keep their step completion dates — useful when you need to reconstruct what you actually did during a given year.

**Installable.** It's a progressive web app, so phones can install it to the home screen and run it full-screen like a native app.

---

## How it's built

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | Pages and API routes in one deployable unit |
| Hosting | Vercel free tier | Zero-config deploys straight from GitHub |
| Database | A private GitHub repo | Free, versioned, portable, and yours |
| Auth | One password → signed cookie | No user accounts to manage for a single-user app |
| AI | Anthropic API (optional) | Pennies per month at realistic usage |
| Styling | Plain CSS with custom properties | No build tooling, no framework to learn |

There is no ORM, no state library, and no component library. The whole thing is a few hundred lines of React plus a thin wrapper around the GitHub contents API.

### Repository layout

```
app/
  page.js                     Dashboard: cards, timeline, this-week list
  login/page.js               Password entry
  new/page.js                 Create a project (blank or AI-generated)
  project/[id]/page.js        Checklist, notes, files, links
  archive/page.js             Completed projects
  settings/page.js            Domains and recurring-meeting templates
  api/
    auth/login | logout       Session cookie issue and clear
    data/bootstrap            Config + templates + all projects in one request
    data/project/...          Project CRUD and attachments
    data/config | recurring   Settings persistence
    parse                     Claude calls (grant calls, transcripts)
    calendar                  ICS feed
lib/
  github.js                   The "database" — reads and writes the data repo
  session.js                  HMAC-signed session tokens (Web Crypto)
  palette.js                  Colour palette shared by CSS and SVG
  ui.js                       Shared components and date helpers
  Timeline.js                 The domain-swimlane SVG timeline
middleware.js                 Blocks every route without a valid session
```

### Data shape

Each project is one file, `projects/<id>.json`, in the data repo:

```json
{
  "id": "example-grant-2027",
  "name": "Example Grant 2027",
  "domain": "work",
  "deadline": "2027-10-14",
  "created": "2026-08-11",
  "notes": "Panel notes, contacts, anything worth remembering",
  "links": [{ "label": "Call page", "url": "https://example.org/call" }],
  "steps": [
    { "id": "s1", "text": "Draft synopsis", "target": "2027-08-25", "done": true, "completedOn": "2027-08-20" },
    { "id": "s2", "text": "Budget with finance office", "target": "2027-09-08", "done": false }
  ]
}
```

Step order is the dependency order — there is no dependency graph, deliberately. Alongside `projects/`, the data repo holds `config.json` (your domains), `recurring.json` (meeting templates), `archive/` (completed projects), and `files/<project-id>/` (attachments).

---

## Design

The interface uses a ten-colour palette, defined once in `app/globals.css` and mirrored in `lib/palette.js`:

| Name | Hex | | Name | Hex |
|---|---|---|---|---|
| Yale Blue | `#174b63` | | Golden Bronze | `#d5a751` |
| Pacific Cyan | `#268c9e` | | Bronze | `#ce853b` |
| Tropical Teal | `#36adaf` | | Spicy Paprika | `#c96334` |
| Ash Grey | `#b3d1c7` | | Blushed Brick | `#be4d43` |
| Sand Dune | `#e2dac2` | | Dusty Mauve | `#b04d50` |

Yale Blue carries text, Pacific Cyan marks focus, Dusty Mauve flags anything overdue, and a warm off-white derived from Sand Dune forms the background. Domain colours are picked from the same palette in Settings, so cards, badges, and timeline diamonds stay coherent.

To change the whole look, edit the `:root` block in `app/globals.css` and the matching values in `lib/palette.js`.

---

## Costs

| | |
|---|---|
| Vercel Hobby | Free |
| GitHub private repositories | Free |
| Anthropic API | Pay-as-you-go; parsing a document costs a fraction of a cent. Skip the API key entirely and the app still works — you just lose the two AI features. |

---

## Limitations worth knowing

- **Single user.** One password, no accounts, no sharing. Two people editing at once will overwrite each other.
- **Saves are commits**, so they take a second or so and are debounced. That is a fair trade for free version history, but it is not instant.
- **3 MB attachment ceiling**, imposed by serverless request limits. Larger files go in the links list.
- **No notifications.** The calendar feed is how deadlines reach you, and subscribed calendars refresh on their own schedule — often only every few hours.
- **No recurring-task engine.** Recurring meetings spawn ordinary one-off projects on demand, by design.

---

## Licence

MIT — see [LICENSE](LICENSE). Use it, fork it, change it.
