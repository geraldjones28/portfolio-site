// =============================================================================
// BLOG API SERVER
// Lightweight Express API for managing blog posts (CRUD) from the admin UI.
// Reads/writes blog HTML files on disk and regenerates the blog index page.
// Authenticated via password login + JWT bearer tokens.
// =============================================================================

const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { renderPost, parsePost, regenerateIndex } = require('./template');

const app = express();
app.use(express.json());

const BLOG_DIR = process.env.BLOG_DIR || '/app/blog';
const PASSWORD_HASH = process.env.BLOG_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRY = '24h';

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

// Only allow lowercase letters, numbers, and hyphens in slugs
const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

function isValidSlug(slug) {
  return slug && slug.length >= 2 && slug.length <= 100 && SLUG_RE.test(slug);
}

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

// Generate a URL-safe slug from a title
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

// =============================================================================
// AUTH MIDDLEWARE
// Verifies JWT bearer token from the Authorization header.
// =============================================================================
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// =============================================================================
// WRITE LOCK
// Simple mutex to serialize file write operations and prevent race conditions.
// =============================================================================
let writeLock = Promise.resolve();

function withWriteLock(fn) {
  const prev = writeLock;
  let resolve;
  writeLock = new Promise(r => { resolve = r; });
  return prev.then(fn).finally(resolve);
}

// =============================================================================
// POST /api/blog/login — Authenticate with password, receive JWT
// =============================================================================
app.post('/api/blog/login', async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }
  if (!PASSWORD_HASH) {
    return res.status(500).json({ error: 'Server not configured — BLOG_PASSWORD_HASH missing' });
  }
  try {
    const match = await bcrypt.compare(password, PASSWORD_HASH);
    if (!match) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    res.json({ token });
  } catch (e) {
    res.status(500).json({ error: 'Authentication error' });
  }
});

// =============================================================================
// GET /api/blog/posts — List all blog posts
// =============================================================================
app.get('/api/blog/posts', auth, (req, res) => {
  try {
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html') && f !== 'index.html');
    const posts = files.map(file => {
      const html = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
      const { title, date } = parsePost(html);
      return { slug: file.replace('.html', ''), title, date };
    });
    // Sort by date descending
    posts.sort((a, b) => b.date.localeCompare(a.date));
    res.json(posts);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list posts' });
  }
});

// =============================================================================
// GET /api/blog/posts/:slug — Get a single post's content for editing
// =============================================================================
app.get('/api/blog/posts/:slug', auth, (req, res) => {
  const { slug } = req.params;
  if (!isValidSlug(slug)) {
    return res.status(400).json({ error: 'Invalid slug' });
  }

  const filePath = path.join(BLOG_DIR, slug + '.html');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Post not found' });
  }

  try {
    const html = fs.readFileSync(filePath, 'utf8');
    const { title, date, body } = parsePost(html);
    res.json({ slug, title, date, body });
  } catch (e) {
    res.status(500).json({ error: 'Failed to read post' });
  }
});

// =============================================================================
// POST /api/blog/posts — Create a new blog post
// =============================================================================
app.post('/api/blog/posts', auth, (req, res) => {
  const { title, date, body } = req.body;

  if (!title || !title.trim()) return res.status(400).json({ error: 'Title required' });
  if (!date || !isValidDate(date)) return res.status(400).json({ error: 'Valid date required (YYYY-MM-DD)' });
  if (!body || !body.trim()) return res.status(400).json({ error: 'Body required' });

  const slug = req.body.slug || slugify(title);
  if (!isValidSlug(slug)) return res.status(400).json({ error: 'Invalid slug' });

  const filePath = path.join(BLOG_DIR, slug + '.html');
  if (fs.existsSync(filePath)) {
    return res.status(409).json({ error: 'A post with this slug already exists' });
  }

  withWriteLock(() => {
    try {
      const html = renderPost({ slug, title: title.trim(), date, body: body.trim() });
      fs.writeFileSync(filePath, html, 'utf8');
      regenerateIndex(BLOG_DIR);
      res.status(201).json({ slug, title: title.trim(), date });
    } catch (e) {
      res.status(500).json({ error: 'Failed to create post' });
    }
  });
});

// =============================================================================
// PUT /api/blog/posts/:slug — Update an existing blog post
// =============================================================================
app.put('/api/blog/posts/:slug', auth, (req, res) => {
  const { slug } = req.params;
  if (!isValidSlug(slug)) return res.status(400).json({ error: 'Invalid slug' });

  const filePath = path.join(BLOG_DIR, slug + '.html');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const { title, date, body } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title required' });
  if (!date || !isValidDate(date)) return res.status(400).json({ error: 'Valid date required (YYYY-MM-DD)' });
  if (!body || !body.trim()) return res.status(400).json({ error: 'Body required' });

  withWriteLock(() => {
    try {
      const html = renderPost({ slug, title: title.trim(), date, body: body.trim() });
      fs.writeFileSync(filePath, html, 'utf8');
      regenerateIndex(BLOG_DIR);
      res.json({ slug, title: title.trim(), date });
    } catch (e) {
      res.status(500).json({ error: 'Failed to update post' });
    }
  });
});

// =============================================================================
// DELETE /api/blog/posts/:slug — Delete a blog post
// =============================================================================
app.delete('/api/blog/posts/:slug', auth, (req, res) => {
  const { slug } = req.params;
  if (!isValidSlug(slug)) return res.status(400).json({ error: 'Invalid slug' });

  const filePath = path.join(BLOG_DIR, slug + '.html');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Post not found' });
  }

  withWriteLock(() => {
    try {
      fs.unlinkSync(filePath);
      regenerateIndex(BLOG_DIR);
      res.json({ message: 'Post deleted' });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete post' });
    }
  });
});

// =============================================================================
// START SERVER
// =============================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Blog API listening on :${PORT}`);
});
