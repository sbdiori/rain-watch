# Rain Watch

Publishes a live-updating `.ics` calendar feed that only contains events for
the hours where rain probability crosses a threshold (default 40%), merged
into contiguous blocks. Runs entirely on GitHub's free infrastructure —
nothing to install, no server to maintain.

## One-time setup (about 5 minutes)

1. **Create a new GitHub repository.**
   Go to github.com → New repository → give it any name (e.g. `rain-watch`) →
   keep it Public (required for free GitHub Pages) → Create repository.
   (If you don't have a GitHub account yet, signing up is free at github.com/signup.)

2. **Upload these files.**
   On your new repo's page, click "Add file" → "Upload files", then drag in
   this entire folder (or drag the `.github`, `scripts`, and `docs` folders
   individually — most browsers preserve the folder structure on drop).
   Commit the files to the `main` branch.

3. **Set your location.**
   Open `.github/workflows/update.yml` in the GitHub web editor (click the
   pencil icon), and edit the `LAT` and `LON` values near the top to your
   coordinates. Change `THRESHOLD` if you want a different percentage than 40.
   Commit the change.

4. **Turn on GitHub Pages.**
   Go to Settings → Pages. Under "Build and deployment", set Source to
   "Deploy from a branch", branch `main`, folder `/docs`. Save.
   GitHub will show you a URL like:
   `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/rain-watch.ics`

5. **Run it once manually.**
   Go to the "Actions" tab → "Update Rain Watch Calendar" → "Run workflow" →
   Run workflow. Wait ~30 seconds, then refresh — `docs/rain-watch.ics`
   should now be updated with real forecast data. After this, it runs
   automatically every 6 hours (edit the `cron` line in the workflow file to
   change that).

6. **Subscribe in your calendar app.**
   - **Apple Calendar (Mac):** File → New Calendar Subscription → paste the
     URL from step 4.
   - **iPhone/iPad:** Settings → Calendar → Accounts → Add Account →
     Other → Add Subscribed Calendar → paste the URL.
   - **Google Calendar:** Other calendars (+) → From URL → paste the URL.

From then on, the feed refreshes itself — no manual re-downloading.

## Notes

- NWS hourly forecasts only extend about 7 days out, so the feed will
  always just show "the next week" — that's a National Weather Service
  limitation, not something this script can extend.
- US locations only (NWS coverage).
- Calendar apps typically poll a subscribed URL every few hours themselves,
  independent of how often this workflow runs — so a 6-hour refresh cycle
  here is already faster than most calendar apps check anyway.
