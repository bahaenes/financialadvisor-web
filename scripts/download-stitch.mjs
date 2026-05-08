/**
 * Downloads all Global Market UI Kit screens from Google Stitch.
 * Requires STITCH_API_KEY in environment (or .env.local).
 *
 * Usage:
 *   node scripts/download-stitch.mjs
 *
 * Outputs:
 *   public/screens/{slug}.png   — preview screenshots
 *   stitch-exports/{slug}.html  — Stitch HTML/CSS code
 */

import { createWriteStream, mkdirSync } from "fs";
import { pipeline } from "stream/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Load .env.local manually (Next.js doesn't expose it to Node scripts)
try {
  const { readFileSync } = await import("fs");
  const envLines = readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n");
  for (const line of envLines) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  }
} catch {
  // .env.local not found — rely on pre-set env vars
}

const PROJECT_ID = "6733049212564833953";

const SCREENS = [
  {
    slug: "design-system-1",
    id: "asset-stub-assets-14b14e61fede4ce5a843086299ce77a7-1778257238725",
    label: "Design System",
    isAssetStub: true,
  },
  {
    slug: "market-overview",
    id: "d91dbd3a07c0441e8716c5a282006fa6",
    label: "Market Overview Dashboard",
  },
  {
    slug: "historical-chart",
    id: "d055a198f0744a9a874c220ff0f79bad",
    label: "Historical Chart & Analysis",
  },
  {
    slug: "news-sentiment",
    id: "d2f6fadef5924d6082310c9ebf5da432",
    label: "News Sentiment Feed",
  },
  {
    slug: "ai-prediction",
    id: "c4741c2263bb49b9a56cc89b5154d767",
    label: "AI Prediction Insights",
  },
  {
    slug: "design-system-2",
    id: "asset-stub-assets-865091f8c73f459da27e702fdd7be0f3-1778257406771",
    label: "Design System (2)",
    isAssetStub: true,
  },
  {
    slug: "market-overview-dark",
    id: "87a714ec68c1406bbe185cde2f1a8979",
    label: "Market Overview Dashboard (Dark Mode)",
  },
  {
    slug: "news-sentiment-dark",
    id: "2f9eef4e9ed84f66a517d181fdb714e0",
    label: "News Sentiment Feed (Dark Mode)",
  },
  {
    slug: "historical-chart-dark",
    id: "50bd954726f246a48927a4e3e8f89c29",
    label: "Historical Chart & Analysis (Dark Mode)",
  },
  {
    slug: "ai-prediction-dark",
    id: "3e0c7c0e65bc457da4b0558e1fa01eaa",
    label: "AI Prediction Insights (Dark Mode)",
  },
];

async function downloadUrl(url, destPath) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const out = createWriteStream(destPath);
  await pipeline(res.body, out);
}

async function main() {
  if (!process.env.STITCH_API_KEY) {
    console.error("ERROR: STITCH_API_KEY is not set.");
    console.error("Add it to .env.local or export it before running this script.");
    process.exit(1);
  }

  const { stitch } = await import("@google/stitch-sdk");
  const project = stitch.project(PROJECT_ID);

  mkdirSync(path.join(ROOT, "public/screens"), { recursive: true });
  mkdirSync(path.join(ROOT, "stitch-exports"), { recursive: true });

  const results = [];

  for (const screen of SCREENS) {
    process.stdout.write(`\n[${screen.label}]`);

    let imageUrl = null;
    let htmlUrl = null;

    try {
      if (screen.isAssetStub) {
        // Asset stubs are design-system exports; try getScreen but expect possible failure
        process.stdout.write(" (asset stub) ");
      }

      const s = await project.getScreen(screen.id);
      [imageUrl, htmlUrl] = await Promise.all([s.getImage(), s.getHtml()]);
    } catch (err) {
      console.warn(`\n  ⚠  getScreen failed for ${screen.slug}: ${err.message}`);
      results.push({ slug: screen.slug, label: screen.label, image: false, html: false });
      continue;
    }

    // Download image
    const imgPath = path.join(ROOT, "public/screens", `${screen.slug}.png`);
    try {
      await downloadUrl(imageUrl, imgPath);
      process.stdout.write(" ✓ image");
    } catch (err) {
      console.warn(`\n  ⚠  Image download failed: ${err.message}`);
    }

    // Download HTML
    const htmlPath = path.join(ROOT, "stitch-exports", `${screen.slug}.html`);
    try {
      await downloadUrl(htmlUrl, htmlPath);
      process.stdout.write(" ✓ html");
    } catch (err) {
      console.warn(`\n  ⚠  HTML download failed: ${err.message}`);
    }

    results.push({ slug: screen.slug, label: screen.label, image: true, html: true });
  }

  console.log("\n\n--- Summary ---");
  for (const r of results) {
    const img = r.image ? "✓" : "✗";
    const html = r.html ? "✓" : "✗";
    console.log(`  [img:${img}] [html:${html}]  ${r.slug}`);
  }

  const successful = results.filter((r) => r.image || r.html).length;
  console.log(`\nDone. ${successful}/${SCREENS.length} screens downloaded.`);
  console.log("  images  → public/screens/");
  console.log("  html    → stitch-exports/");
}

main().catch((err) => {
  console.error("\nFatal:", err);
  process.exit(1);
});
