// Site launch date
var launch = new Date('2026-02-09T00:00:00');
var now = new Date();
var diff = now - launch;
var days = Math.floor(diff / 86400000);
var hours = Math.floor((diff % 86400000) / 3600000);
var mins = Math.floor((diff % 3600000) / 60000);
var el = document.getElementById('uptime');
if (el) el.textContent = days + ' days, ' + hours + ' hours, ' + mins + ' minutes';
