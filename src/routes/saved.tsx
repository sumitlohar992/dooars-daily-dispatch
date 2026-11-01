import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Header, Page } from "@/components/AppShell";
import { SavedList } from "@/components/SavedList";
import { SignInPrompt } from "@/components/SignInPrompt";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved stories — dooars News" },
      { name: "description", content: "News stories you saved to read later." },
      { property: "og:title", content: "Saved — dooars News" },
      { property: "og:description", content: "Your saved stories on dooars News." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { user, loading } = useAuth();
  return (
    <>
      <Header title="Saved" />
      <Page>{loading ? null : user ? <SavedList userId={user.id} /> : <SignInPrompt message="Sign in to see your saved stories." />}</Page>
    </>
  );
}
