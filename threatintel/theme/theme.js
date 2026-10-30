// Loaded in <head> so a saved theme applies before the page paints.
// Page structure is added here rather than by matching HTML in Nginx, so markup
// changes in the Azure app can't leave the page half-wrapped. Each step skips
// anything it can't find.
(function() {
  var html = document.documentElement;

  // The cookie is shared across *.geraldjonesii.dev; localStorage is per-subdomain
  function getSavedTheme() {
    var match = document.cookie.match(/(?:^|; )theme=(dark|light)/);
    return match ? match[1] : localStorage.getItem('theme');
  }
  function saveTheme(theme) {
    localStorage.setItem('theme', theme);
    document.cookie = 'theme=' + theme + '; Domain=geraldjonesii.dev; Path=/; Max-Age=31536000; Secure; SameSite=Lax';
  }

  var saved = getSavedTheme();
  if (saved) html.setAttribute('data-theme', saved);

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  // --- Terminal Chrome ---
  function addChrome() {
    var terminal = el('div', 'terminal');
    var header = el('div', 'terminal-header');
    ['red', 'yellow', 'green'].forEach(function(color) {
      header.appendChild(el('span', 'dot ' + color));
    });
    header.appendChild(el('span', 'title', 'gerald@azure:~/threat-intel'));
    var btn = el('button', 'theme-toggle');
    btn.type = 'button';
    header.appendChild(btn);

    var body = el('div', 'terminal-body');
    var back = el('a', 'back-link', '< cd ~/projects');
    back.href = 'https://portfolio.geraldjonesii.dev/projects.html';
    body.appendChild(back);
    body.appendChild(el('p', 'prompt', '$ ./threat-intel --tryit'));
    while (document.body.firstChild) body.appendChild(document.body.firstChild);

    var footer = el('p', 'footer', '$ ');
    footer.appendChild(el('span', 'cursor', '█'));
    body.appendChild(footer);

    terminal.appendChild(header);
    terminal.appendChild(body);
    document.body.appendChild(terminal);

    function updateBtn() {
      var current = html.getAttribute('data-theme') || 'dark';
      btn.textContent = current === 'dark' ? '[light]' : '[dark]';
    }
    updateBtn();
    btn.addEventListener('click', function() {
      var current = html.getAttribute('data-theme') || 'dark';
      var next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      saveTheme(next);
      updateBtn();
    });
  }

  // --- Service Layout ---
  // Splits each service's list into description, reference details and the input area
  function wrap(dl, className, nodes) {
    if (!nodes.length) return;
    var group = el('div', className);
    dl.insertBefore(group, nodes[0]);
    nodes.forEach(function(node) { group.appendChild(node); });
  }
  function groupService(dl) {
    var kids = Array.prototype.slice.call(dl.children);
    var tryIndex = -1;
    kids.forEach(function(kid, i) {
      if (tryIndex < 0 && kid.tagName === 'DD' && kid.querySelector('input')) tryIndex = i - 1;
    });
    if (tryIndex < 0) return;
    kids[tryIndex + 1].classList.add('input-row');
    var hasDescription = kids[0].textContent.trim() === 'Description';
    var specStart = hasDescription ? 2 : 0;
    wrap(dl, 'tryit', kids.slice(tryIndex));
    wrap(dl, 'spec', kids.slice(specStart, tryIndex));
    if (hasDescription) wrap(dl, 'desc', kids.slice(0, 2));
  }

  // --- Result Formatting ---
  // Results arrive as lines separated by <br>. Text is only ever set with
  // textContent, because it comes from outside data (news sites, CVE records).
  function formatResult(result) {
    if (!result.firstChild || result.classList.contains('error')) return;
    var lines = [''];
    Array.prototype.forEach.call(result.childNodes, function(node) {
      if (node.nodeName === 'BR') lines.push('');
      else lines[lines.length - 1] += node.textContent;
    });
    result.textContent = '';
    lines.forEach(function(line) {
      line = line.trim();
      if (!line) return;
      var row = el('div', 'result-line');
      var fields = line.split(' | ');
      if (fields.length > 1) {
        row.appendChild(el('span', 'result-key', fields[0]));
        row.appendChild(el('span', 'result-meta', fields.slice(1).join(' · ')));
      } else if (/^https?:\/\//.test(line)) {
        var link = el('a', '', line);
        link.href = line;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        row.appendChild(link);
      } else {
        row.textContent = line;
      }
      result.appendChild(row);
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    if (saved) saveTheme(saved);  // Share a preference saved before the cookie existed
    document.title = 'Threat-Intel Digest';
    addChrome();
    Array.prototype.forEach.call(document.querySelectorAll('.service dl'), groupService);
    Array.prototype.forEach.call(document.querySelectorAll('.result'), formatResult);
  });
})();
