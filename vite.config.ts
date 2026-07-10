import { defineConfig, loadEnv } from "vite";

const DEFAULT_SITE_URL = "https://hotchocshowdown2026.netlify.app";

function siteUrlFromEnv(mode: string): string {
  const env = loadEnv(mode, process.cwd(), "");
  const raw = env.VITE_SITE_URL || process.env.URL || DEFAULT_SITE_URL;
  return raw.replace(/\/$/, "");
}

export default defineConfig(({ mode }) => {
  const siteUrl = siteUrlFromEnv(mode);

  return {
    plugins: [
      {
        name: "inject-social-meta",
        transformIndexHtml(html) {
          return html.replaceAll("__SITE_URL__", siteUrl);
        },
      },
    ],
  };
});
