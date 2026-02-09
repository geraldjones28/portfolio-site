# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static HTML/CSS portfolio site for Gerald Jones II, served via Nginx in Docker on a Raspberry Pi home-lab.

## Architecture

- **`site/index.html`** — Single-page static site (HTML + embedded CSS, no JavaScript). Terminal/CLI aesthetic — content is presented as shell commands (`$ whoami`, `$ cat skills.log`) with green-on-black monospace styling, scanline overlay, and blinking cursor. New sections should follow this pattern: add a `<p class="prompt">command</p>` followed by output markup
- **`nginx/default.conf`** — Nginx config with security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) and gzip compression
- **`docker-compose.yml`** — Docker Compose v3.9 running `nginx:alpine`, maps port 8080→80, mounts `site/` and nginx config as read-only volumes

## Running Locally

```bash
docker compose up -d        # start the container (port 8080)
docker compose down          # stop
docker compose restart       # restart after changes
```

The site is available at `http://localhost:8080`. There is no build step — edit `site/index.html` directly. Changes are served immediately since `site/` is bind-mounted read-only into the container.

## Style Guide

The site uses a terminal emulator aesthetic. Key CSS conventions:
- **Colors**: `#00ff41` (primary green), `#00cc33` (dim green), `#fff` (emphasis), `#0a0a0a` (background)
- **Font**: `'Courier New', 'Lucida Console', monospace`
- **Sections**: Use `<p class="prompt">command-name</p>` (auto-prefixed with `$ `) followed by output elements
- **Lists**: `<ul>` inside `.section` div — items are auto-prefixed with `[✓]` via CSS
- **No external resources**: Everything must be inline/self-hosted to comply with the strict CSP (`default-src 'self'`)

## Deployment Context

- Runs on a Raspberry Pi alongside other services
- Protected by Cloudflare TLS tunneling, UFW firewall, SSH key auth, and fail2ban
- Nginx security headers are intentionally strict — changes to CSP or other headers in `nginx/default.conf` should preserve the security posture
