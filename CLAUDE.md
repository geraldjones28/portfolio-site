# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static HTML/CSS portfolio site for Gerald Jones II, served via Nginx in Docker on a Raspberry Pi home-lab. Accessible at https://portfolio.geraldjonesii.dev

## Architecture

- **`site/index.html`** — Main page with neofetch-inspired layout (ASCII art + key-value stats). Uses CSS custom properties for dark/light theming, CRT power-on animation, and animated color bar
- **`site/main.js`** — All client-side JS: uptime counter, live stats fetcher, theme toggle (localStorage), Konami code easter egg (matrix rain canvas)
- **`site/blog/`** — Blog section with separate HTML pages. `index.html` is the listing page, each post is its own file (e.g. `hello-world.html`). All pages share the same terminal chrome styling
- **`stats/stats.sh`** — Cron job (every minute) that writes `site/stats.json` with CPU temp, load average, and RAM from the Pi. The JSON is fetched by `main.js`
- **`nginx/default.conf`** — Nginx config with security headers (CSP, XFO, XCTO, Referrer-Policy, Permissions-Policy), gzip, and no-cache on `stats.json`
- **`docker-compose.yml`** — Docker Compose v3.9 running `nginx:alpine`, maps port 8080→80, mounts `site/` and nginx config as read-only volumes

## Running Locally

```bash
docker compose up -d        # start the container (port 8080)
docker compose down          # stop
docker compose restart       # restart after changes
```

The site is available at `http://localhost:8080`. There is no build step — edit files in `site/` directly. Changes are served immediately since `site/` is bind-mounted.

## Style Guide

The site uses a neofetch-inspired terminal aesthetic with CSS custom properties for theming.

- **Theme variables**: Defined on `:root`/`[data-theme="dark"]` and `[data-theme="light"]`. Use `var(--accent)`, `var(--text)`, `var(--bg)`, etc. — never hardcode colors
- **Font**: `'Courier New', 'Lucida Console', monospace`
- **Neofetch rows**: `<p class="info-row"><span class="info-label">Key: </span><span class="info-value">value</span></p>`
- **Sections**: `.info-section` with `.info-section-title` header
- **Lists**: `<ul class="info-list">` — items auto-prefixed with `- ` via CSS
- **Progress bars**: `.cert-item` with `.progress-bar` > `.progress-fill` (set width via inline style)
- **Blog pages**: Reuse terminal chrome (header, dots, theme toggle). Each page has its own inline theme toggle script

## Adding a Blog Post

1. Create `site/blog/your-post-slug.html` — copy structure from `hello-world.html`
2. Add a `<li>` entry in `site/blog/index.html` with date and link

## Deployment Context

- Runs on a Raspberry Pi alongside other services
- Protected by Cloudflare TLS tunneling, UFW firewall, SSH key auth, and fail2ban
- CSP: `default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'`
- `stats.json` is auto-generated — do not commit it (listed in `.gitignore`)
- Cron job: `* * * * * /home/raspjones/portfolio-site/stats/stats.sh`
