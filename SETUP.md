# Setup

Deploying Horizon takes about 30–40 minutes the first time. You do not need to know how to code, but you will spend a few minutes in a terminal window copying commands.

Along the way you will collect six values. Keep a scratch note open (Notepad, TextEdit, anything) to paste them into, and **delete that note at the end** — the values are secrets.

**Before you start you will need:** a GitHub account (free), a Vercel account (free, sign in with GitHub), and — only if you want the AI features — an Anthropic account with a small amount of API credit.

---

## Part 1 — Install Node.js

Node.js is only needed on your own computer, to scramble your password into a form that is safe to store. You will not need it again afterwards.

1. Go to **[nodejs.org](https://nodejs.org)**.
2. Click the button offering the **LTS** version.
3. Run the installer and click through it, accepting the defaults.

---

## Part 2 — Generate your three secrets

4. Download this repository as a ZIP (green **Code** button on GitHub → **Download ZIP**) and unzip it somewhere convenient. Avoid folders synced by cloud storage clients (OneDrive, Dropbox, iCloud) — sync tools lock files while the next step is running and cause confusing errors. Your user folder (`C:\Users\yourname\` or `/Users/yourname/`) is a safe choice.

5. Open a terminal **inside that folder**:
   - **Windows** — open the folder in File Explorer, click the address bar, type `cmd`, press Enter.
   - **Mac** — open Terminal, type `cd ` (with a trailing space), drag the folder onto the Terminal window, press Enter.

6. Install the app's dependencies:
   ```
   npm install
   ```
   This takes a minute and prints a lot of text. If it fails with a network error, run it again — interrupted downloads are common on restricted networks, and it resumes.

7. Create your password hash:
   ```
   npm run hash-password
   ```
   Type the password you want to use to log into your app, then press Enter. It prints a line beginning `APP_PASSWORD_HASH=$2a$…`. Copy **everything after the `=`** into your note as `APP_PASSWORD_HASH`, and save the password itself in your password manager.

8. Create two random strings, running this command twice:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Save the first result as `SESSION_SECRET` and the second as `CALENDAR_FEED_KEY`.

9. Delete the `node_modules` folder that appeared inside your project folder. It is large, it is not needed again, and it must not be uploaded.

---

## Part 3 — Create the data repository

This private repository is where your projects will be stored. It starts empty; the app fills it as you use it.

10. On **[github.com](https://github.com)**, click **+** (top right) → **New repository**.
11. Name it `planning-data`, select **Private**, and click **Create repository**.
12. Note in your scratch file: `GITHUB_REPO` = `your-username/planning-data`.

---

## Part 4 — Create an access token

This token lets the app read and write that one repository, and nothing else.

13. Click your profile picture → **Settings** → scroll to the bottom of the left sidebar → **Developer settings**.
14. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
15. Fill in:
    - **Token name:** `horizon`
    - **Expiration:** the longest option offered. GitHub emails you before it expires; when it does, repeat this part and update the value in Vercel.
    - **Repository access:** **Only select repositories** → choose `planning-data`.
    - **Permissions** → **Add permissions** → find and add **Contents**, then set its dropdown to **Read and write**. (A read-only *Metadata* permission is added automatically. That is expected.)
16. **Generate token**. Copy the `github_pat_…` value into your note as `GITHUB_TOKEN` immediately — GitHub shows it only once.

---

## Part 5 — Get an Anthropic API key (optional)

Skip this part if you do not want the AI features; the app works without it, and you can add the key later.

17. Sign in at **[console.anthropic.com](https://console.anthropic.com)**.
18. Add a small amount of prepaid credit under **Billing**. Parsing one document costs a fraction of a cent, so the minimum lasts a long time.
19. Under **API Keys**, create a key and copy it into your note as `ANTHROPIC_API_KEY`. It is also shown only once.

---

## Part 6 — Put the app code on GitHub

20. On GitHub, click **+** → **New repository**. Name it `horizon`, choose **Private** (or public — the code contains no secrets), and create it.
21. On the empty repository page, click the **uploading an existing file** link.
22. Open your unzipped project folder, select everything **inside** it (Ctrl+A / Cmd+A), and drag it onto the upload area. You should see `package.json` and the `app`, `lib`, `public`, and `scripts` folders.
23. Click **Commit changes**.

*(If you know Git, cloning and pushing works too — this route just avoids requiring it.)*

---

## Part 7 — Deploy on Vercel

24. Go to **[vercel.com](https://vercel.com)** → sign up with **Continue with GitHub** → choose the free **Hobby** plan.
25. **Add New…** → **Project** → find `horizon` in the list → **Import**. If it is not listed, follow the prompt to give Vercel access to that repository.
26. Leave **Framework Preset** as **Next.js** and all build settings at their defaults.
27. Open **Environment Variables** and add these, typing each name exactly (capitals and underscores matter) and pasting the matching value:

    | Name | Value |
    |---|---|
    | `APP_PASSWORD_HASH` | from step 7 |
    | `SESSION_SECRET` | from step 8 |
    | `CALENDAR_FEED_KEY` | from step 8 |
    | `GITHUB_TOKEN` | from step 16 |
    | `GITHUB_REPO` | `your-username/planning-data` |
    | `ANTHROPIC_API_KEY` | from step 19, or omit |

28. Click **Deploy** and wait a minute or two.
29. Open the address Vercel gives you (something like `https://horizon-abc123.vercel.app`). You should see a login page. Sign in with your password.

**Delete your scratch note now.** Every value lives in Vercel, and your password is in your password manager.

---

## Part 8 — Subscribe your calendar

30. Build this address, substituting your own app address and calendar key:
    ```
    https://YOUR-APP.vercel.app/api/calendar?key=YOUR_CALENDAR_FEED_KEY
    ```
31. Add it as a subscribed internet calendar:
    - **Outlook web** — Calendar → **Add calendar** → **Subscribe from web** → paste → name it → **Import**.
    - **Google Calendar** — **Other calendars +** → **From URL** → paste.
    - **Apple Calendar** — **File** → **New Calendar Subscription** → paste.

The key in that address is what keeps the feed private, since calendar apps cannot log in with a password. Treat the address as a secret; if it ever leaks, change `CALENDAR_FEED_KEY` in Vercel and re-subscribe.

---

## Part 9 — Install it on your phone

32. Open your app's address in your phone's browser and sign in.
33. **iPhone (Safari):** Share button → **Add to Home Screen**. **Android (Chrome):** ⋮ menu → **Install app**.

It then launches full-screen with its own icon. The login lasts 30 days.

---

## Making changes later

**Changing a secret:** Vercel → your project → **Settings** → **Environment Variables** → edit → then **Deployments** → redeploy the most recent one.

**Changing the code:** edit files on GitHub (or upload replacements via **Add file** → **Upload files**). Vercel redeploys automatically within a minute of each commit.

**Running it on your own machine:** copy `.env.example` to `.env.local`, fill in the same six values, then `npm install` and `npm run dev`, and open `http://localhost:3000`.

---

## Troubleshooting

**"Server not configured" on the login page** — `APP_PASSWORD_HASH` or `SESSION_SECRET` is missing in Vercel. Check for typos in the names, then redeploy.

**Login works but the dashboard shows a GitHub error** — usually one of: `GITHUB_REPO` is not in `owner/name` form; the token was created for the wrong repository; or the token's **Contents** permission is read-only rather than read and write.

**The AI features return an error** — `ANTHROPIC_API_KEY` is missing, mistyped, or the account has no credit.

**Changes do not appear** — check the **Deployments** tab in Vercel. A red build means the deployment failed; click it to read the log. On a phone, close and reopen the installed app to clear cached files.

**`npm install` fails repeatedly** — restricted or proxied networks (offices, universities, campus Wi-Fi) frequently interrupt it. Try a different network, such as a phone hotspot; it is only needed once.

**Windows `EPERM` errors during `npm install`** — a sync client (OneDrive, Dropbox) is locking files. Move the project folder somewhere unsynced, delete the partial `node_modules` folder, and try again.
