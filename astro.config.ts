import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://brucey-rgb.github.io",
  base: "/my-blog",
  trailingSlash: "always",
  outDir: "./dist",
  publicDir: "./astro-public",
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false,
      wrap: true,
    },
  },
});
