// =============================================================================
// BLOG HTML TEMPLATE GENERATOR
// Generates complete standalone HTML files for blog posts and the blog index,
// matching the exact terminal chrome styling used across the site.
// =============================================================================

const fs = require('fs');
const path = require('path');

// --- HTML escaping to prevent XSS in user-provided content ---
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- Shared CSS for blog post pages (extracted verbatim from hello-world.html) ---
const POST_CSS = `    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    :root, [data-theme="dark"] {
      --bg: #0a0a0a; --terminal-bg: #0a0a0a; --header-bg: #111;
      --border: #333; --text: #ccc; --text-dim: #888; --text-muted: #555;
      --accent: #00ff41; --section-border: #1a1a1a; --code-bg: #1a1a1a;
    }
    [data-theme="light"] {
      --bg: #e8e8e8; --terminal-bg: #f5f5f0; --header-bg: #ddd;
      --border: #bbb; --text: #222; --text-dim: #666; --text-muted: #999;
      --accent: #007a1f; --section-border: #ccc; --code-bg: #ddd;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font: 15px/1.7 'Courier New', 'Lucida Console', monospace;
      background: var(--bg); color: var(--text);
      min-height: 100vh;
      display: flex; justify-content: center; align-items: center;
      padding: 24px 16px;
    }
    .terminal {
      max-width: 900px; width: 100%;
      border: 1px solid var(--border);
    }
    .terminal-header {
      background: var(--header-bg);
      border-bottom: 1px solid var(--border);
      padding: 10px 16px;
      display: flex; align-items: center; gap: 8px;
    }
    .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
    .dot.red { background: #ff5f56; }
    .dot.yellow { background: #ffbd2e; }
    .dot.green { background: #27c93f; }
    .terminal-header .title { margin-left: 12px; color: var(--text-dim); font-size: 13px; }
    .theme-toggle {
      margin-left: auto; background: none; border: 1px solid var(--border);
      color: var(--accent); font: inherit; font-size: 12px; padding: 2px 8px; cursor: pointer;
    }
    .terminal-body { padding: 28px 32px; background: var(--terminal-bg); }
    .prompt { color: var(--text-dim); margin: 0 0 16px; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { color: var(--text); }
    .cursor { display: inline-block; color: var(--accent); animation: blink 1s step-end infinite; }
    .footer { margin-top: 24px; color: var(--text-dim); }
    .back-link { margin-bottom: 16px; display: block; }
    .post-title { color: var(--accent); font-weight: bold; font-size: 18px; margin: 0 0 4px; }
    .post-date { color: var(--text-dim); font-size: 13px; margin: 0 0 20px; }
    .post-body p { margin: 12px 0; }
    code {
      background: var(--code-bg); padding: 2px 6px; color: var(--accent);
    }
    @media (max-width: 700px) {
      body { padding: 8px; }
      .terminal-body { padding: 16px; }
    }`;

// --- Shared theme toggle script (extracted verbatim from hello-world.html) ---
const THEME_SCRIPT = `  <script>
    (function() {
      var html = document.documentElement;
      var btn = document.getElementById('theme-toggle');
      var saved = localStorage.getItem('theme');
      if (saved) html.setAttribute('data-theme', saved);
      function updateBtn() {
        var current = html.getAttribute('data-theme') || 'dark';
        btn.textContent = current === 'dark' ? '[light]' : '[dark]';
      }
      updateBtn();
      btn.addEventListener('click', function() {
        var current = html.getAttribute('data-theme') || 'dark';
        var next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateBtn();
      });
    })();
  </script>`;

// =============================================================================
// renderPost — generates a complete blog post HTML file
// =============================================================================
function renderPost({ slug, title, date, body }) {
  const paragraphs = body.split(/\n\n+/)
    .filter(p => p.trim())
    .map(p => `        <p>${escapeHtml(p.trim())}</p>`)
    .join('\n\n');

  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)} - Gerald Jones II</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
${POST_CSS}
  </style>
</head>

<body>
  <div class="terminal">
    <div class="terminal-header">
      <span class="dot red"></span>
      <span class="dot yellow"></span>
      <span class="dot green"></span>
      <span class="title">gerald@rasppi:~/blog</span>
      <button class="theme-toggle" id="theme-toggle">[light]</button>
    </div>

    <div class="terminal-body">
      <a href="/blog/" class="back-link">&lt; cd ~/blog</a>
      <p class="prompt">$ cat ${escapeHtml(slug)}.txt</p>

      <h1 class="post-title">${escapeHtml(title)}</h1>
      <p class="post-date">${escapeHtml(date)}</p>

      <div class="post-body">
${paragraphs}
      </div>

      <p class="footer">$ <span class="cursor">\u2588</span></p>
    </div>
  </div>

${THEME_SCRIPT}
</body>

</html>
`;
}

// --- CSS for the blog index page (slightly different from post pages) ---
const INDEX_CSS = `    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    :root, [data-theme="dark"] {
      --bg: #0a0a0a; --terminal-bg: #0a0a0a; --header-bg: #111;
      --border: #333; --text: #ccc; --text-dim: #888; --text-muted: #555;
      --accent: #00ff41; --section-border: #1a1a1a;
    }
    [data-theme="light"] {
      --bg: #e8e8e8; --terminal-bg: #f5f5f0; --header-bg: #ddd;
      --border: #bbb; --text: #222; --text-dim: #666; --text-muted: #999;
      --accent: #007a1f; --section-border: #ccc;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font: 15px/1.7 'Courier New', 'Lucida Console', monospace;
      background: var(--bg); color: var(--text);
      min-height: 100vh;
      display: flex; justify-content: center; align-items: center;
      padding: 24px 16px;
    }
    .terminal {
      max-width: 900px; width: 100%;
      border: 1px solid var(--border);
    }
    .terminal-header {
      background: var(--header-bg);
      border-bottom: 1px solid var(--border);
      padding: 10px 16px;
      display: flex; align-items: center; gap: 8px;
    }
    .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
    .dot.red { background: #ff5f56; }
    .dot.yellow { background: #ffbd2e; }
    .dot.green { background: #27c93f; }
    .terminal-header .title { margin-left: 12px; color: var(--text-dim); font-size: 13px; }
    .theme-toggle {
      margin-left: auto; background: none; border: 1px solid var(--border);
      color: var(--accent); font: inherit; font-size: 12px; padding: 2px 8px; cursor: pointer;
    }
    .terminal-body { padding: 28px 32px; background: var(--terminal-bg); }
    .prompt { color: var(--text-dim); margin: 0 0 16px; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { color: var(--text); }
    .cursor { display: inline-block; color: var(--accent); animation: blink 1s step-end infinite; }
    .footer { margin-top: 24px; color: var(--text-dim); }
    .post-list { list-style: none; padding: 0; margin: 0; }
    .post-list li { padding: 8px 0; border-bottom: 1px solid var(--section-border); }
    .post-list li:last-child { border-bottom: none; }
    .post-date { color: var(--text-dim); font-size: 13px; margin-right: 12px; }
    .back-link { margin-bottom: 16px; display: block; }
    @media (max-width: 700px) {
      body { padding: 8px; }
      .terminal-body { padding: 16px; }
    }`;

// =============================================================================
// renderIndex — generates the blog listing page from an array of posts
// =============================================================================
function renderIndex(posts) {
  // Sort posts by date descending (newest first)
  const sorted = posts.slice().sort((a, b) => b.date.localeCompare(a.date));

  const listItems = sorted.map(p =>
    `        <li>\n          <span class="post-date">${escapeHtml(p.date)}</span>\n          <a href="/blog/${escapeHtml(p.slug)}.html">${escapeHtml(p.slug)}.txt \u2014 ${escapeHtml(p.title)}</a>\n        </li>`
  ).join('\n');

  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Blog - Gerald Jones II</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
${INDEX_CSS}
  </style>
</head>

<body>
  <div class="terminal">
    <div class="terminal-header">
      <span class="dot red"></span>
      <span class="dot yellow"></span>
      <span class="dot green"></span>
      <span class="title">gerald@rasppi:~/blog</span>
      <button class="theme-toggle" id="theme-toggle">[light]</button>
    </div>

    <div class="terminal-body">
      <a href="/" class="back-link">&lt; cd ~</a>
      <p class="prompt">$ ls -lt blog/</p>

      <ul class="post-list">
${listItems}
      </ul>

      <p class="footer">$ <span class="cursor">\u2588</span></p>
    </div>
  </div>

${THEME_SCRIPT}
</body>

</html>
`;
}

// =============================================================================
// parsePost — extracts title, date, and body text from an existing post HTML file
// =============================================================================
function parsePost(html) {
  const titleMatch = html.match(/<h1 class="post-title">(.*?)<\/h1>/);
  const dateMatch = html.match(/<p class="post-date">(.*?)<\/p>/);
  const bodyMatch = html.match(/<div class="post-body">([\s\S]*?)<\/div>/);

  const title = titleMatch ? titleMatch[1] : '';
  const date = dateMatch ? dateMatch[1] : '';
  let body = '';

  if (bodyMatch) {
    // Extract text from each <p> tag and join with double newlines
    var pRegex = /<p>([\s\S]*?)<\/p>/g;
    var paragraphs = [];
    var m;
    while ((m = pRegex.exec(bodyMatch[1])) !== null) {
      paragraphs.push(
        m[1].trim()
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
      );
    }
    body = paragraphs.join('\n\n');
  }

  return { title, date, body };
}

// =============================================================================
// regenerateIndex — reads all post HTML files and regenerates index.html
// =============================================================================
function regenerateIndex(blogDir) {
  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html');
  const posts = [];

  for (const file of files) {
    const html = fs.readFileSync(path.join(blogDir, file), 'utf8');
    const { title, date } = parsePost(html);
    const slug = file.replace('.html', '');
    posts.push({ slug, title, date });
  }

  const indexHtml = renderIndex(posts);
  fs.writeFileSync(path.join(blogDir, 'index.html'), indexHtml, 'utf8');
}

module.exports = { renderPost, renderIndex, parsePost, regenerateIndex, escapeHtml };
