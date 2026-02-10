# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portfolio site for Gerald Jones II with a neofetch-inspired terminal aesthetic, served via Nginx in Docker on a Raspberry Pi home-lab. Includes a blog with a browser-based admin panel for managing posts. Accessible at https://portfolio.geraldjonesii.dev

## Architecture

- **`site/index.html`** — Main page with neofetch-inspired layout (ASCII art + key-value stats). Uses CSS custom properties for dark/light theming, CRT power-on animation, and animated color bar
- **`site/main.js`** — All client-side JS: uptime counter, live stats fetcher, theme toggle (localStorage), Konami code easter egg (matrix rain canvas)
- **`site/blog/`** — Blog section with separate HTML pages. `index.html` is the listing page, each post is its own file (e.g. `hello-world.html`). All pages share the same terminal chrome styling
- **`site/admin/index.html`** — Blog admin panel (single-page app). Login, create/edit/delete posts from the browser. Talks to the blog API
- **`blog-api/`** — Node.js Express API for blog management (CRUD). Runs in its own Docker container
  - **`server.js`** — Express server with JWT auth, CRUD endpoints for blog posts
  - **`template.js`** — HTML template generator for blog posts and index page (matches existing terminal styling)
  - **`Dockerfile`** — Node 20 Alpine container, runs as non-root `node` user
- **`stats/stats.sh`** — Cron job (every minute) that writes `site/stats.json` with CPU temp, load average, and RAM from the Pi. The JSON is fetched by `main.js`
- **`nginx/default.conf`** — Nginx config with security headers (CSP, XFO, XCTO, Referrer-Policy, Permissions-Policy), gzip, no-cache on `stats.json`, and reverse proxy for `/api/blog/` to the blog API container
- **`docker-compose.yml`** — Two services: `web` (nginx:alpine on port 8080→80) and `blog-api` (Node.js Express on internal port 3000). Blog API only has write access to `site/blog/`
- **`.env`** — `BLOG_PASSWORD_HASH` (bcrypt) and `JWT_SECRET` for blog admin auth (not committed — in `.gitignore`)

## Running Locally

```bash
docker compose up -d --build   # build and start all containers (port 8080)
docker compose down             # stop all containers
docker compose restart          # restart after changes
docker compose logs blog-api    # view blog API logs
```

The site is available at `http://localhost:8080`. The admin panel is at `http://localhost:8080/admin/`. There is no build step for the static site — edit files in `site/` directly. Changes are served immediately since `site/` is bind-mounted. The blog API container must be rebuilt after changes to `blog-api/`:

```bash
docker compose up -d --build blog-api
```

## Blog Admin Panel

The admin panel at `/admin/` provides browser-based blog management:

- **Login**: Password-protected with bcrypt + JWT (24h token expiry, stored in sessionStorage)
- **Create**: Title, date, slug (auto-generated from title), and body text. Generates a standalone HTML file matching the terminal styling
- **Edit**: Load existing post content, modify, and save
- **Delete**: Remove post file with confirmation prompt

All changes automatically regenerate `site/blog/index.html` to keep the blog listing in sync.

### Blog API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/blog/login` | No | Password → JWT token |
| GET | `/api/blog/posts` | Yes | List all posts |
| GET | `/api/blog/posts/:slug` | Yes | Get post for editing |
| POST | `/api/blog/posts` | Yes | Create new post |
| PUT | `/api/blog/posts/:slug` | Yes | Update existing post |
| DELETE | `/api/blog/posts/:slug` | Yes | Delete post |

### Changing the Admin Password

```bash
node -e "require('bcryptjs').hash('NEW_PASSWORD', 10).then(console.log)"
```

Update `BLOG_PASSWORD_HASH` in `.env` (escape `$` as `$$`), then restart:

```bash
docker compose restart blog-api
```

## Style Guide

The site uses a neofetch-inspired terminal aesthetic with CSS custom properties for theming.

- **Theme variables**: Defined on `:root`/`[data-theme="dark"]` and `[data-theme="light"]`. Use `var(--accent)`, `var(--text)`, `var(--bg)`, etc. — never hardcode colors
- **Font**: `'Courier New', 'Lucida Console', monospace`
- **Neofetch rows**: `<p class="info-row"><span class="info-label">Key: </span><span class="info-value">value</span></p>`
- **Sections**: `.info-section` with `.info-section-title` header
- **Lists**: `<ul class="info-list">` — items auto-prefixed with `- ` via CSS
- **Progress bars**: `.cert-item` with `.progress-bar` > `.progress-fill` (set width via inline style)
- **Blog pages**: Reuse terminal chrome (header, dots, theme toggle). Each page has its own inline theme toggle script
- **Admin page**: Same terminal chrome. Form inputs use `var(--code-bg)` background with `var(--accent)` text

## Adding a Blog Post

**Via admin panel (preferred):** Go to `/admin/`, log in, and click `[new post]`.

**Manually:**
1. Create `site/blog/your-post-slug.html` — copy structure from `hello-world.html`
2. Add a `<li>` entry in `site/blog/index.html` with date and link

## Deployment Context

- Runs on a Raspberry Pi alongside other services
- Protected by Cloudflare TLS tunneling, UFW firewall, SSH key auth, and fail2ban
- CSP: `default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'`
- `stats.json` is auto-generated — do not commit it (listed in `.gitignore`)
- `.env` contains secrets — do not commit it (listed in `.gitignore`)
- Cron job: `* * * * * /home/raspjones/portfolio-site/stats/stats.sh`
- Blog API container only has write access to `site/blog/` (least privilege)
- Blog API is not exposed to the host — only accessible through Nginx reverse proxy
