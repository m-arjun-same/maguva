# MAGUVA — website

One-page website for **MAGUVA** (women's ethnic wear, Kukatpally, Hyderabad — since 1999).
Plain HTML, CSS and JavaScript. No build step, nothing to install.

## Folder map

```
index.html                  ← the page itself (the only page)
frontend/
  css/landing-page.css      ← all the styles for the page
  js/landing-page.js        ← all the page's behaviour (scroll, animations, open/closed status)
  js/vendor/                ← animation libraries the page uses (GSAP) — don't edit these
assets/
  images/                   ← the photos shown on the page
  fonts/                    ← the two typefaces (Fraunces + Archivo)
wrangler.toml               ← Cloudflare Pages settings (project name + this folder as the site root)
```

Rule of thumb: page content lives in `index.html`, looks live in
`frontend/css/landing-page.css`, movement lives in `frontend/js/landing-page.js`,
and every picture or font the page loads sits in `assets/`.

## Open it locally

```
python3 -m http.server 8000
```

Then visit http://localhost:8000 — or just double-click `index.html`.

## Deploy (Cloudflare Pages)

The site root is this folder (`pages_build_output_dir = "."` in `wrangler.toml`),
so it deploys as-is:

```
npx wrangler pages deploy . --project-name maguva
```

It is also live on GitHub Pages from this same repo — both hosts serve the
identical files.
