// =============================================================================
// UPTIME COUNTER
// Calculates how long the site has been live by comparing the current time
// against a hardcoded launch date, then displays the result as
// "X days, Y hrs, Z min" in the #uptime element.
// Runs once on page load (no live ticking — just a snapshot).
// =============================================================================
(function updateUptime() {
  var launch = new Date('2026-02-09T00:00:00');
  var now = new Date();
  var diff = now - launch;
  var days = Math.floor(diff / 86400000);        // ms in a day
  var hours = Math.floor((diff % 86400000) / 3600000);  // ms in an hour
  var mins = Math.floor((diff % 3600000) / 60000);      // ms in a minute
  var el = document.getElementById('uptime');
  if (el) el.textContent = days + ' days, ' + hours + ' hrs, ' + mins + ' min';
})();

// =============================================================================
// LIVE STATS FETCHER
// Fetches /stats.json (generated every minute by the stats.sh cron job on the
// Raspberry Pi) and updates the CPU temp, load average, and memory usage
// displayed on the page. Runs immediately on load, then polls every 60 seconds
// to stay in sync with the cron schedule. Silently ignores fetch errors so the
// page still works if stats.json is unavailable.
// =============================================================================
(function fetchStats() {
  function load() {
    fetch('/stats.json')
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var temp = document.getElementById('cpu-temp');
        var load = document.getElementById('cpu-load');
        var mem = document.getElementById('mem-usage');
        if (temp && d.cpu_temp) temp.textContent = d.cpu_temp + '°C';
        if (load && d.load) load.textContent = d.load;
        if (mem && d.mem_used && d.mem_total)
          mem.textContent = d.mem_used + ' / ' + d.mem_total + ' MB';
      })
      .catch(function() {}); // Fail silently — stats are non-critical
  }
  load();                    // Fetch immediately on page load
  setInterval(load, 60000);  // Then re-fetch every 60 seconds
})();

// =============================================================================
// THEME TOGGLE (Dark / Light)
// Reads the saved theme from localStorage on load and applies it to the
// <html data-theme="..."> attribute (which controls all CSS custom properties).
// The toggle button switches between "dark" and "light", persists the choice
// to localStorage, and updates its own label text accordingly.
// =============================================================================
(function initTheme() {
  var html = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  var saved = localStorage.getItem('theme');
  if (saved) {
    html.setAttribute('data-theme', saved); // Apply saved preference
  }
  // Update button text to show the *opposite* theme (i.e. what you'd switch to)
  function updateBtn() {
    var current = html.getAttribute('data-theme') || 'dark';
    btn.textContent = current === 'dark' ? '[light]' : '[dark]';
  }
  updateBtn();
  btn.addEventListener('click', function() {
    var current = html.getAttribute('data-theme') || 'dark';
    var next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);     // Persist choice across sessions
    updateBtn();
  });
})();

// =============================================================================
// KONAMI CODE EASTER EGG — Matrix Rain
// Listens for the classic Konami Code key sequence:
//   Up Up Down Down Left Right Left Right B A
// When the full sequence is entered, triggers a Matrix-style "digital rain"
// animation on a full-screen canvas overlay.
// =============================================================================
(function initKonami() {
  // Konami Code key sequence (arrow keys + B + A)
  var code = [38,38,40,40,37,39,37,39,66,65];
  var pos = 0; // Tracks how far through the sequence the user has typed

  document.addEventListener('keydown', function(e) {
    if (e.keyCode === code[pos]) {
      pos++;
      if (pos === code.length) {
        pos = 0;       // Reset for next activation
        matrixRain();  // Trigger the animation
      }
    } else {
      pos = 0; // Wrong key — reset progress
    }
  });

  // Creates a full-screen canvas and renders falling green characters
  // (Japanese katakana + hex digits) for ~150 frames, then fades out.
  function matrixRain() {
    // Create a full-viewport canvas overlay (non-interactive)
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:10000;pointer-events:none;';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize one "drop" per column (16px wide), starting at random negative
    // offsets so characters appear to stream in at different times
    var cols = Math.floor(canvas.width / 16);
    var drops = [];
    for (var i = 0; i < cols; i++) {
      drops[i] = Math.random() * -100;
    }

    // Character set: Japanese katakana + hex digits for the Matrix look
    var chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
    var frame = 0;
    var maxFrames = 150; // Animation duration in frames (~2.5 seconds at 60fps)

    function draw() {
      // Semi-transparent black fill creates the trailing/fading effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00ff41'; // Matrix green
      ctx.font = '14px monospace';

      // Draw one random character per column at the current drop position
      for (var i = 0; i < drops.length; i++) {
        var ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * 16, drops[i] * 16);
        // Reset drop to top once it passes the bottom (with randomness for variety)
        if (drops[i] * 16 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(draw); // Keep animating
      } else {
        // Fade out the canvas then remove it from the DOM
        var opacity = 1;
        function fadeOut() {
          opacity -= 0.05;
          canvas.style.opacity = opacity;
          if (opacity > 0) {
            requestAnimationFrame(fadeOut);
          } else {
            document.body.removeChild(canvas);
          }
        }
        fadeOut();
      }
    }
    draw(); // Start the animation loop
  }
})();
