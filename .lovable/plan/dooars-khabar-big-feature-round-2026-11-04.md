# Dooars Khabar — big feature round

Built in four rounds so each one can be tested before the next.

## Round 1 — Account & owner controls

- Terms & Conditions screen on first open (your text, app name filled in, contact sumitlohar992@gmail.com, West Bengal law). Must accept to continue; also shown in Settings.
- Delete my account (Settings): permanently removes the account, posts, comments.
- Owner can permanently ban/remove a user from the dashboard user list.
- Edit / delete / save on your own posts (title, text, photo, video).
- Refresh button on Home for new stories (plus pull-to-refresh feel).
- "My dashboard": my posts, views, likes, followers, earnings status, account links.
- New app icon from your photo (logo, home-screen icon, favicon).

## Round 2 — Social

- Follow / unfollow on profiles; follower counts.
- Private chat between people who follow each other (either direction): text, photos, videos, documents, live updates.

## Round 3 — AI + owner extras

- Help chatbot (free to users) for app questions.
- "Ask about Dooars" box: answers only from published stories, with links to them.
- Owner-only slide titles (add / edit / remove) shown on Home.
- "Download the app" button on the website (Android APK link + add-to-home-screen).
- Short startup sound with the splash (muted toggle; phones may block sound until first tap).
- Google News auto-import moves from hourly to every 30 minutes.

## Round 4 — Partner program, live & video calls

- Partner program unlocks at 500 followers. Earnings from reads using the 60/40 pool split, ₹ minimum payout threshold, Net-30 schedule.
- Real automatic payouts need a payout provider (e.g. RazorpayX for India) plus your business verification — I'll set it up once you have that account; until then earnings are tracked and you approve payouts.
- Go Live and video calls: built once you send keys for a video service (LiveKit or Agora).

## Documents (saved to Files, not the app)

- Creator revenue formula + worked example (50,000 reads, 120 hours).
- Creator Monetization Agreement.
- Partner Analytics Dashboard layout + microcopy.
- Outreach email to journalists.

## Not included

- Mobile-number sign-in (you chose to skip).

## Technical notes

- New tables: terms_acceptances, follows, conversations/messages (+ realtime, private media paths), slides, banned_users, article_views, partner_earnings/payouts.
- Owner actions via admin-checked server functions; account deletion via server function using admin client.
- AI via Lovable AI Gateway server routes (streaming), default model.
