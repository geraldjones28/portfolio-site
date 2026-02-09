# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static HTML/CSS portfolio site for Gerald Jones II, served via Nginx in Docker on a Raspberry Pi home-lab.

## Architecture

- **`site/index.html`** — Single-page static site (HTML + embedded CSS, no JavaScript)
- **`nginx/default.conf`** — Nginx config with security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) and gzip compression
- **`docker-compose.yml`** — Docker Compose v3.9 running `nginx:alpine`, maps port 8080→80, mounts `site/` and nginx config as read-only volumes

## Running Locally

```bash
docker compose up -d        # start the container (port 8080)
docker compose down          # stop
docker compose restart       # restart after changes
```

The site is available at `http://localhost:8080`. There is no build step — edit `site/index.html` directly and restart the container (or Nginx will serve changes on next request since the volume is bind-mounted).

## Deployment Context

- Runs on a Raspberry Pi alongside other services
- Protected by Cloudflare TLS tunneling, UFW firewall, SSH key auth, and fail2ban
- Nginx security headers are intentionally strict — changes to CSP or other headers in `nginx/default.conf` should preserve the security posture
