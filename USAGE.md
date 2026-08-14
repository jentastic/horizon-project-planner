# Usage

How to use Horizon once it is deployed. If it is not deployed yet, start with [SETUP.md](SETUP.md).

---

## First five minutes

1. **Sign in.** One password; the session lasts 30 days.
2. **Set up your domains.** Go to **Settings**. Domains are your categories — the starter set (Work, Writing, People, Projects, Personal) is meant to be replaced. Rename them to whatever divides your work naturally, pick a colour for each from the palette swatches, and delete any you will not use. Five or six is a good number; the colour coding stops helping much beyond that.
3. **Create a project.** **New project** → give it a name, a domain, a deadline, and a few steps.

Everything else can wait until you need it.

---

## The home screen

**Filter chips** across the top switch between all projects and a single domain. The filter applies to both the cards and the timeline.

**Project cards** each show the domain badge, the deadline, days remaining, a progress bar, and — most usefully — the next incomplete step. A small red dot in the corner means the project has at least one overdue step. Click anywhere on a card to open it.

**The timeline** below the cards puts one row per domain and one diamond per deadline along a monthly axis, starting from the current month. Hovering a diamond shows the full project name and date; clicking it opens the project. Overdue deadlines get a ring around the diamond. If your deadlines run far into the future the timeline scrolls sideways rather than squeezing everything together.

**This week** lists every step target and project deadline falling between today and Friday, plus anything already overdue. **Peek at next week** expands the following week without leaving the page. If Friday has passed, the list has already rolled forward to the coming week — which is usually what you want on a Sunday evening.

---

## Working with a project

Open a project to get its full checklist. Everything on this page saves automatically about a second after you stop typing; the indicator at the top right reads *Saving…* and then *Saved*.

**Steps** are an ordered list. Check them off, click any step to edit its wording, set a target date, and reorder with the ↑ and ↓ buttons. Order carries meaning: it is how dependencies are expressed. If step 4 cannot start until step 3 is finished, put it after step 3 — there is no formal dependency system to configure, and that is deliberate.

Overdue steps get a soft amber background and a coloured left edge. They do not jump to the top of the list or nag you; they are just visible.

**Target dates are soft.** They exist to spread work across the weeks before a deadline and to populate the *This week* list. Missing one is information, not failure.

**Notes** hold whatever you would otherwise lose: portal logins to request, the programme officer's name, the panel you are applying to, why you chose a particular framing.

**Files and links** sit at the bottom. Upload files up to 3 MB directly — the call PDF, a template, a form. Anything bigger, or anything already stored elsewhere, goes in the link list with a label. Uploaded files are downloaded back through the app, so they stay behind your password; because the data repo is a Git repository, replaced files keep their old versions in its history.

**Archive** when a project is finished. It disappears from the dashboard but keeps every step and completion date, which makes annual reporting much less painful. **Delete** is permanent and also removes the project's attachments — archiving is almost always the better choice.

---

## Generating a plan from a call document

If you configured an Anthropic API key:

1. **New project** → **Generate from grant call**.
2. Paste the call text, or upload the call as a PDF.
3. **Generate plan.**

Claude reads the document and proposes a project name, the submission deadline, notes on requirements, and an ordered set of steps with backdated target dates — allowing more lead time for things that depend on other people (budgets, letters, institutional sign-off) and leaving a buffer before the deadline itself.

The result lands in an ordinary editable form. **Nothing is saved until you press Create**, so treat the output as a first draft: fix the dates that do not match your reality, delete steps that do not apply, and add the ones only you would know about.

This works on anything with a deadline and requirements — journal submission guidelines, conference calls, fellowship applications, tender documents.

To change how it plans (longer lead times, different standard steps, a different tone), edit the prompt in `app/api/parse/route.js`.

---

## Recurring meetings

Recurring meetings deliberately do not auto-generate. Instead you define a template once and spawn a prep task when you actually need one.

**Set up a template:** Settings → **Recurring meetings** → **Add meeting**. Give it a name, the weekday it falls on, a domain, and a standard checklist — the things you do before every occurrence, one per line.

**Spawn a prep task:** on the home screen, click **New prep task** next to the meeting. You can optionally paste the transcript or notes from the *last* meeting; Claude extracts the action items and adds them as steps on top of your standard checklist. The new task is an ordinary project, dated to the next occurrence of that weekday, and you edit or archive it like any other.

---

## The calendar feed

Once subscribed (SETUP.md, Part 8), your calendar shows:

- `DUE: <project>` — a project deadline
- `<project> — <step>` — a step target date

Both appear as all-day events. Completed steps disappear from the feed on the next refresh. Subscribed calendars refresh on their own schedule, often only every few hours, so treat the feed as ambient awareness rather than a live view — the app itself is always current.

---

## On your phone

The installed app behaves like the desktop version with a layout adapted to a narrow screen: cards stack in one column, step text wraps beside its checkbox rather than being cut off, and the date and action buttons move to a second line.

It is best for checking what is due and ticking things off. Longer editing — restructuring a plan, writing notes — is more comfortable on a computer.

---

## Habits that make it work

**Let steps be small.** "Write the proposal" is not a step; it is a project. "Draft the one-page summary" is a step. If a step cannot be finished in a sitting or two, split it.

**Date the steps that matter, skip the rest.** Only dated steps appear in *This week* and the calendar feed, so dating everything floods both. Date the things that must happen by a certain time, especially anything involving other people.

**Check the timeline monthly, not daily.** It is for spotting the month when three deadlines collide, while there is still time to do something about it.

**Treat the AI output as a draft.** It is good at extracting requirements from documents and producing a plausible schedule. It does not know your institution, your collaborators, or how long things actually take you.

**Archive rather than delete.** The archive is a record of what you did and when, and it costs nothing to keep.

---

## Where your data lives

In your private `planning-data` repository on GitHub. You can browse it there at any time, and every change is a commit, so nothing is truly lost — an accidentally deleted project can be recovered from the repository history.

To back up everything, download that repository as a ZIP. To leave the app entirely, keep the ZIP: it is plain JSON files, readable by anything.
