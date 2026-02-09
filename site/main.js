// === Uptime ===
(function updateUptime() {
  var launch = new Date('2026-02-09T00:00:00');
  var now = new Date();
  var diff = now - launch;
  var days = Math.floor(diff / 86400000);
  var hours = Math.floor((diff % 86400000) / 3600000);
  var mins = Math.floor((diff % 3600000) / 60000);
  var el = document.getElementById('uptime');
  if (el) el.textContent = days + ' days, ' + hours + ' hrs, ' + mins + ' min';
})();

// === Live Stats ===
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
      .catch(function() {});
  }
  load();
  setInterval(load, 60000);
})();

// === Theme Toggle ===
(function initTheme() {
  var html = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  var saved = localStorage.getItem('theme');
  if (saved) {
    html.setAttribute('data-theme', saved);
  }
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

// === Konami Code → Matrix Rain ===
(function initKonami() {
  var code = [38,38,40,40,37,39,37,39,66,65];
  var pos = 0;

  document.addEventListener('keydown', function(e) {
    if (e.keyCode === code[pos]) {
      pos++;
      if (pos === code.length) {
        pos = 0;
        matrixRain();
      }
    } else {
      pos = 0;
    }
  });

  function matrixRain() {
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:10000;pointer-events:none;';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var cols = Math.floor(canvas.width / 16);
    var drops = [];
    for (var i = 0; i < cols; i++) {
      drops[i] = Math.random() * -100;
    }

    var chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
    var frame = 0;
    var maxFrames = 150;

    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00ff41';
      ctx.font = '14px monospace';

      for (var i = 0; i < drops.length; i++) {
        var ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(ch, i * 16, drops[i] * 16);
        if (drops[i] * 16 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(draw);
      } else {
        // Fade out
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
    draw();
  }
})();
