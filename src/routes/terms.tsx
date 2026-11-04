import { createFileRoute } from "@tanstack/react-router";
import { Header, Page } from "@/components/AppShell";
import { TermsText } from "@/components/Terms";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions — Dooars Khabar" },
      { name: "description", content: "The rules for using the Dooars Khabar news app and website." },
      { property: "og:title", content: "Terms and Conditions — Dooars Khabar" },
      { property: "og:description", content: "The rules for using Dooars Khabar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <>
      <Header title="Terms and Conditions" />
      <Page><div className="p-5"><TermsText /></div></Page>
    </>
  ),
});
