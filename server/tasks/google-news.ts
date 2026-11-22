import { defineTask } from "nitro/task";
import { importGoogleNews } from "../../src/lib/google-news.server";

export default defineTask({
  meta: {
    name: "google-news",
    description: "Import new Dooars-region stories from Google News.",
  },
  async run() {
    const result = await importGoogleNews();
    console.info("Google News import completed", result);
    return { result };
  },
});
