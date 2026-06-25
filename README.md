# Agape LifeCast

Church presentation console — manage songs, Bible verses, media, and slide decks from a single operator screen and push them live to a second display.

---

## Requirements

Install these before doing anything else.

| Software | Version | Notes |
|---|---|---|
| [Laragon](https://laragon.org/download/) | Full (not Lite) | Bundles Apache, PHP, MySQL, Composer |
| PHP | 8.3 or 8.4 | Included with Laragon Full |
| MySQL | 8.x | Included with Laragon Full |
| [Node.js](https://nodejs.org/) | 20 LTS or newer | Install separately |
| [GhostScript](https://www.ghostscript.com/releases/gsdnld.html) | 10.x 64-bit | For PDF → slide conversion |
| Composer | 2.x | Included with Laragon Full |

---

## 1. Clone / Copy the Project

Place the project folder inside Laragon's `www` directory:

```
C:\laragon\www\agape-lifecast\
```

---

## 2. Install GhostScript

1. Download **Ghostscript 64-bit for Windows** from [ghostscript.com/releases](https://www.ghostscript.com/releases/gsdnld.html)
2. Run the installer — default path is `C:\Program Files\gs\gs10.x.x\`
3. Note the exact version folder name (e.g. `gs10.07.1`) — you will need it in the `.env`

---

## 3. Create the Database

Open **Laragon** → click **Database** (or open HeidiSQL from the menu).

Create a new database:

```sql
CREATE DATABASE agapelc_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Laragon's default MySQL credentials are `root` with no password.

---

## 4. Set Up the Environment File

Copy the example file:

```bash
cp .env.example .env
```

Then open `.env` and fill in these values:

```env
APP_NAME="Agape LifeCast"
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=agapelc_database
DB_USERNAME=root
DB_PASSWORD=

QUEUE_CONNECTION=database

# Update the version number to match your GhostScript install folder
GHOSTSCRIPT_PATH="C:/Program Files/gs/gs10.07.1/bin/gswin64c.exe"

# Bible API — get a free key at https://scripture.api.bible
BIBLE_API_KEY=your_key_here
BIBLE_NIV_ID=78a9f6124f344018-01
BIBLE_TCB_ID=3f67e6d09c94c02e-01
BIBLE_GNT_ID=61fd76eafa1577c2-02
```

> **GhostScript path:** Use forward slashes `/` not backslashes `\`. Backslashes cause a dotenv parse error.

> **APP_URL must match your actual URL.** Image URLs are built from `APP_URL`. If you run the app via `composer dev` / `php artisan serve`, use `http://localhost:8000`. If you access it through a Laragon virtual host (e.g. `http://agape-lifecast.test`), use that URL instead. A mismatch makes all uploaded images appear black even after `storage:link`.

> **Bible API:** Register a free account at [scripture.api.bible](https://scripture.api.bible), create an app, copy the API key. The Bible IDs above are already correct for NIV, Tagalog (TCB), and Good News Translation (GNT).

### ⚠️ Running via Laragon's Apache (subfolder mode)

If you access the app through Laragon's Apache at a subfolder URL like `http://localhost/AgapeLifeCast/public/`, you must set `APP_URL` to match that exact path:

```env
APP_URL=http://localhost/AgapeLifeCast/public
```

Then clear the config cache after saving:

```bash
php artisan config:clear
```

Failure to do this is the most common cause of images appearing black — the `src` URL in the browser will point to the wrong host/path.

---

## 5. Install Dependencies

Open a terminal inside the project folder (`C:\laragon\www\agape-lifecast`):

```bash
composer install
php artisan key:generate
npm install
```

---

## 6. Run Migrations and Seed

```bash
php artisan migrate
php artisan db:seed
```

The seeder creates:
- A default admin account (`admin@lcmi.org` / `password`)
- Sample songs (Amazing Grace, How Great Is Our God, etc.)
- 4 built-in themes (Dark Forest, Midnight, Pure Black, Deep Blue)
- A default Sunday Service schedule

---

## 7. Create the Storage Link

Media files and slide images are stored in `storage/app/public`. Run this once to make them accessible from the browser:

```bash
php artisan storage:link
```

> **Windows / Laragon users:** Always run `php artisan storage:link` from **Command Prompt (cmd) as Administrator**, not Git Bash. Git Bash creates a POSIX-style symlink that Apache cannot follow, which causes all uploaded images to return 404. To verify the link was created correctly, run `dir public\storage` in cmd — it should show `<JUNCTION>` in the output.

---

## 8. Running the App

Use the single dev command — it starts the Laravel server, queue worker, and Vite all at once:

```bash
composer dev
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

> If you prefer to run them separately in three terminal windows:
> ```bash
> php artisan serve
> php artisan queue:listen --tries=1
> npm run dev
> ```

---

## 9. Login

| Field | Value |
|---|---|
| Email | `admin@lcmi.org` |
| Password | `password` |

Change the password after first login.

---

## 10. Building for Production

```bash
npm run build
```

Then serve through Laragon's Apache (point a virtual host at the `public/` folder) instead of `php artisan serve`.

---

## 11. One-Click Launcher for Operators

Two `.cmd` files are included in the project root so non-technical operators can run the app without touching a terminal.

### `lifecast-build.cmd` — Developer only

Run this **after any code change** to compile the frontend assets into static files.
Operators never need to run this.

```
double-click  lifecast-build.cmd
```

What it does: runs `npm run build` and tells you when it's done.

---

### `lifecast-start.cmd` — Operators run this daily

```
double-click  lifecast-start.cmd
```

What it does, in order:

1. Starts Laragon (database) if it isn't already running
2. Opens a minimized **Lifecast Web Server** window (`php artisan serve`)
3. Opens a minimized **Lifecast Worker** window (`php artisan queue:work`)
4. Waits 4 seconds for the server to boot
5. Opens `http://localhost:8000` in the default browser

> **Important:** Two minimized windows will appear in the taskbar. Do **not** close them — they keep the app running. Minimize them if they're in the way.

To stop the app completely, close all three windows (the launcher window + the two minimized ones).

---

### Optional: Auto-start Laragon on Windows login

If Laragon starts automatically with Windows, the launcher skips step 1 and opens the browser even faster.

1. Open Laragon
2. Right-click the tray icon → **Auto Start**
3. Enable **Auto Start on System Startup**

---

## How the Queue Worker is Used

The queue worker (`php artisan queue:listen`) is required for **PDF slide conversion**. When you upload a PDF in the Slides tab, GhostScript runs in the background to convert each page to a PNG image. The deck shows `processing` status until the job finishes, then switches to `ready` with thumbnails.

If you restart the computer, you need to restart `composer dev` (or the queue listener separately) for PDF uploads to work again.

---

## Feature Overview

| Tab | What it does |
|---|---|
| **Songs** | Library of songs with tagged lyrics (Verse / Chorus / Bridge / etc.), organized in folders. Click a song to load it in the preview. |
| **Bible** | Search verses by reference (e.g. `John 3:16`) or enter them manually. Save verses to folders. |
| **Media** | Upload images, audio (MP3), and video files. Images and audio play in the console preview. Videos open in a new browser tab — full-screen that tab on the live monitor. |
| **Slides** | Upload a PDF (exported from PowerPoint / Google Slides / Keynote) or individual images. PDF pages are converted to slide images by GhostScript. Click any thumbnail to send it live. |

### Two-screen workflow

1. Open the console on the **operator's screen**
2. Drag the browser window (or a second browser window) to the **projector / live monitor**
3. Click **Send Live** on any item to push it to the live screen
4. The live screen shows the current slide/image full-screen; the operator sees a preview

---

## Troubleshooting

**PDF upload stays on "processing" forever**
- Make sure the queue worker is running (`composer dev` or `php artisan queue:listen`)
- Check the GhostScript path in `.env` — use forward slashes and the exact version folder

**Images / uploaded files return 404**
- Run `php artisan storage:link` — the symlink from `public/storage` to `storage/app/public` is missing
- On Windows, always run this from **cmd as Administrator**, not Git Bash (see Step 7 above)

**Images show as black / broken even after running `storage:link`**
- Check `APP_URL` in `.env` — it must exactly match the URL you use in the browser
  - Using `php artisan serve` → `APP_URL=http://localhost:8000`
  - Using Laragon Apache subfolder → `APP_URL=http://localhost/AgapeLifeCast/public`
  - Using a virtual host → `APP_URL=http://agape-lifecast.test`
- After fixing `APP_URL`, run `php artisan config:clear`
- Right-click a broken image in the browser → **Inspect** → check the `src` URL to confirm it matches your `APP_URL`
- On Windows, the Git Bash symlink silently fails — Apache cannot follow it. Open cmd as Administrator and re-run `php artisan storage:link`, then verify with `dir public\storage` (should show `<JUNCTION>`)
- On a fresh clone, the database has records but `storage/app/public/` is empty — no files were ever uploaded to this machine. Copy that folder from the original PC or re-upload the files

**"SQLSTATE: no such table" errors**
- Run `php artisan migrate`

**Blank page on first load**
- Run `npm run dev` or `npm run build` — the Vite assets have not been compiled yet

**"Class not found" PHP errors**
- Run `composer install`
