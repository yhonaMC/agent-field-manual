import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";

export default defineConfig({
  site: "https://agent-field-manual.vercel.app",
  integrations: [react(), mdx()],
});
