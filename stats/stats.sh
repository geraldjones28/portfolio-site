#!/bin/bash
# =============================================================================
# LIVE STATS GENERATOR
# Collects real-time Raspberry Pi hardware stats and writes them to stats.json.
# This JSON file is served by Nginx and fetched by main.js to display live
# CPU temperature, load average, and memory usage on the portfolio site.
#
# Intended to run via cron every minute:
#   * * * * * /home/raspjones/portfolio-site/stats/stats.sh
# =============================================================================

# Output path — served directly from the site/ directory by Nginx
OUT="/home/raspjones/portfolio-site/site/stats.json"

# CPU temperature: read from the thermal zone sensor (millidegrees) and
# convert to degrees Celsius with one decimal place (e.g. "45.2")
temp=$(awk '{printf "%.1f", $1/1000}' /sys/class/thermal/thermal_zone0/temp 2>/dev/null || echo "N/A")

# Load average: grab the 1-minute load average from /proc/loadavg
load=$(awk '{print $1}' /proc/loadavg 2>/dev/null || echo "N/A")

# Memory usage: calculate used MB from total minus available
mem_total=$(awk '/MemTotal/ {printf "%d", $2/1024}' /proc/meminfo 2>/dev/null || echo "0")
mem_avail=$(awk '/MemAvailable/ {printf "%d", $2/1024}' /proc/meminfo 2>/dev/null || echo "0")
mem_used=$((mem_total - mem_avail))

# Write all stats as a single-line JSON object
printf '{"cpu_temp":"%s","load":"%s","mem_used":"%s","mem_total":"%s"}\n' \
  "$temp" "$load" "$mem_used" "$mem_total" > "$OUT"
