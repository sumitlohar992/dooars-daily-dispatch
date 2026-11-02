import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Header, Page } from "@/components/AppShell";
import { SavedList } from "@/components/SavedList";
import { SignInPrompt } from "@/components/SignInPrompt";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved stories — Dooars Khabar" },
      { name: "description", content: "News stories you saved to read later." },
      { property: "og:title", content: "Saved — Dooars Khabar" },
      { property: "og:description", content: "Your saved stories on Dooars Khabar." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { user, loading } = useAuth();
  return (
    <>
      <Header title="saved" />
      <Page>{loading ? null : user ? <SavedList userId={user.id} /> : <SignInPrompt message="Sign in to see your saved stories." />}</Page>
    </>
  );
}
