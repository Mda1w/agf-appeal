# AGF Ban Appeal — Vercel App

## Deploy to Vercel

1. Upload this folder to a GitHub repo
2. Go to vercel.com → New Project → Import your repo
3. In **Environment Variables**, add:
   - `BOT_API` = `http://46.62.230.81:5015`
   - `NEXT_PUBLIC_BOT_API` = `http://46.62.230.81:5015`
4. Deploy

## After deploying

1. Copy your Vercel URL (e.g. `https://agf-appeal.vercel.app`)
2. Go to AGF Dashboard → Ban Appeals → paste the URL in **Vercel App URL**
3. Save

Now when someone gets banned, their DM will contain:
`Appeal your ban: https://agf-appeal.vercel.app/appeal/[userId]`

## How it works

- `/appeal/[userId]` — fetches ban data from your bot at `BOT_API/api/appeal/record/[userId]`
- User fills in the form and submits to `BOT_API/api/appeal/submit`
- Bot sends the appeal to your log channel with Accept/Deny buttons
