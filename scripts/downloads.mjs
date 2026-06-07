// Report GitHub Release download counts per asset and in total.
//
// Usage:
//   node scripts/downloads.mjs <owner>/<repo>
//   GITHUB_TOKEN=ghp_xxx node scripts/downloads.mjs owner/repo   (higher rate limit)

const repo = process.argv[2];
if (!repo || !repo.includes("/")) {
  console.error("Usage: node scripts/downloads.mjs <owner>/<repo>");
  process.exit(1);
}

const headers = { Accept: "application/vnd.github+json" };
if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

const res = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=100`, {
  headers,
});
if (!res.ok) {
  console.error(`GitHub API error ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const releases = await res.json();
let grand = 0;
for (const r of releases) {
  const assets = (r.assets || []).filter((a) => a.download_count >= 0);
  if (assets.length === 0) continue;
  const subtotal = assets.reduce((n, a) => n + a.download_count, 0);
  grand += subtotal;
  console.log(`\n${r.tag_name}${r.draft ? " (draft)" : ""} — ${subtotal} downloads`);
  for (const a of assets) {
    console.log(`  ${a.download_count.toString().padStart(6)}  ${a.name}`);
  }
}
console.log(`\nTotal downloads across all releases: ${grand}`);
