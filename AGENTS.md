<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Data is read client-side via the browser Supabase client + React Query (all news tables are public-read with RLS); no server functions yet — keeps the app simple and fast on mobile.
- Media lives in the private `media` bucket (public buckets are blocked by workspace policy); uploads store a 10-year signed URL on the article row.
- Shared mobile chrome (header, bottom nav) lives in src/components/AppShell.tsx; bottom nav is mounted once in __root.
