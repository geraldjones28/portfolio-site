#!/bin/bash
# Writes live Raspberry Pi stats to site/stats.json
# Run via cron: * * * * * /home/raspjones/portfolio-site/stats/stats.sh

OUT="/home/raspjones/portfolio-site/site/stats.json"

# CPU temperature
temp=$(awk '{printf "%.1f", $1/1000}' /sys/class/thermal/thermal_zone0/temp 2>/dev/null || echo "N/A")

# Load average (1 min)
load=$(awk '{print $1}' /proc/loadavg 2>/dev/null || echo "N/A")

# Memory (MB)
mem_total=$(awk '/MemTotal/ {printf "%d", $2/1024}' /proc/meminfo 2>/dev/null || echo "0")
mem_avail=$(awk '/MemAvailable/ {printf "%d", $2/1024}' /proc/meminfo 2>/dev/null || echo "0")
mem_used=$((mem_total - mem_avail))

printf '{"cpu_temp":"%s","load":"%s","mem_used":"%s","mem_total":"%s"}\n' \
  "$temp" "$load" "$mem_used" "$mem_total" > "$OUT"
