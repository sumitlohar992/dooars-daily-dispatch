# Dooars Khabar — live video, reels and partner program

## 1. Live broadcasting
- Connect your LiveKit account using securely stored project credentials. A camera preview is not a broadcast; only show “Live” after the broadcast connects successfully.
- Add start/end broadcast, front/back camera switch, microphone mute, camera on/off, connection/error status and fullscreen viewing.
- Add a list of active broadcasts and a viewer screen. Stop camera and microphone access when a broadcast ends or its screen closes.
- Restrict broadcasting to signed-in users; viewers receive view-only access.

**Needed from you:** LiveKit project URL, API key and API secret, collected through a secure form rather than chat. LiveKit usage may incur provider charges.

## 2. Screen fitting and video playback
- Fit layouts to phone, tablet and desktop widths and changing screen orientation, with dynamic viewport height and safe-area clearance.
- Keep video proportions intact without stretching or horizontal page overflow. Reels use the available screen height; articles retain natural media proportions.
- Automatically play the video currently visible, muted and inline; pause it when offscreen or the app is backgrounded. Include sound and playback controls and a manual-play fallback when the phone blocks autoplay.

## 3. Reels
- Add a Reels button on Home and a dedicated vertically scrolling short-news feed with play/pause, sound, author, caption, follow and story link.
- Add a Reel option when uploading video so short news is explicitly classified, rather than treating every existing video as a reel.
- Reuse automatic video thumbnails and show loading, empty and playback-error states.

## 4. Owner removal controls
- Add “Permanently remove” beside users in your owner dashboard, with a required violation reason and a destructive-action confirmation.
- Validate owner permission on the server and prevent self-removal.
- Remove the selected account and its posts, comments and associated records; record the banned email so the same email cannot sign up again. Check cleanup errors instead of silently ignoring them.
- Handle partner earnings according to the violation policy, while keeping only legally necessary financial/audit records. Email banning cannot prevent someone returning under an unrelated identity.

## 5. Partner program
### Eligibility and revenue rules
- Retain **500 followers** and require account age **greater than 30 days**, approved KYC, **10 published posts in the calendar month**, and moderation score **at least 90%**.
- Use **30%** of net revenue initially, **40% at 2,000 followers**, and **50% at 5,000 followers**, interpreting your follower targets as the tier milestones.
- Net revenue deducts transaction fees and taxes. Earnings use recorded revenue, not invented revenue per view.
- Minimum withdrawal **₹500**; earnings remain pending for **30 days**; eligible requests are processed monthly. Display no exact payout date until the processing day is configured.

### Screens and controls
- Eligibility tracker: age, monthly posts, followers, verified KYC and moderation rating, plus total views as an informational metric. “Apply Now” is enabled only when all requirements pass.
- Earnings overview: estimated monthly earnings, cleared balance, hold dates and payout status; per-post revenue/deductions/share breakdown.
- Private payout settings: UPI or bank details and government-ID uploads. Sensitive identity documents must not use long-lived shareable URLs.
- Owner review: approve/reject KYC, review moderation scores and revenue records, set early-access earning caps, review payout requests and record payment references.
- Monthly processing initially uses owner-approved payments. Automatic money transfers require a payout provider and your business verification; do not claim payouts are automated before that connection exists.

### Terms and announcement
- Add a plain-English Partner Terms page covering eligibility, tiers, deductions, holding period, monthly processing, ₹500 minimum, prohibited artificial engagement/copyright violations, bans and earnings forfeiture, and earning caps.
- Require acceptance before applying; give **30 days’ advance notice** for future partner-term changes. Draft terms should receive legal review before launch.
- Add an inspiring announcement with a headline, three bullets and “View partner eligibility” CTA. Clearly label early access; do not announce active earnings until revenue recording and payment operations are enabled.
- Apply your sky-blue/deep-blue/white theme to partner screens using shared theme tokens.

## Technical details
- Keep TanStack routing and existing client-side React Query reads with row-level security.
- Add LiveKit token issuance as an authenticated server function, with publisher/viewer permissions derived server-side; isolate provider secrets from browser code.
- Add broadcast sessions, reel classification, partner profiles, private verification/payout details, per-content earnings and payout requests through additive migrations with explicit grants and policies.
- Users may read only their financial/identity records and submit allowed applications/settings. They cannot approve KYC, change tiers, invent revenue or mark payments paid. Owner actions require server-validated admin permission.
- Make payout requests atomic to prevent duplicate withdrawals; enforce eligibility, holds, share calculations, earning caps and forfeiture consistently in trusted database/server logic.
- Keep government IDs in private storage with short-lived authorized access. Do not publish them in public profiles or article media.

## Verification
- Add concrete tests for 500/2,000/5,000 followers, >30-day account age, 10 monthly posts, 90% moderation, ₹500 withdrawals, 30-day holds, net-revenue shares and owner-only removal.
- Verify phone/tablet/desktop and orientation layouts, offscreen pause and autoplay fallback, reel upload/readback, owner confirmation and partner settings.
- Verify a real two-session broadcast (publisher and viewer) after LiveKit credentials are connected. No claim of active streaming without that check.
- Verify permission boundaries and payout request concurrency; do not delete your actual owner account during testing.