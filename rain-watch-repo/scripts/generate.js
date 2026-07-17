// Rain Watch — generates an .ics file with events only for hours where
// rain probability crosses a threshold, merged into contiguous blocks.
// Data source: api.weather.gov (National Weather Service, free, no key needed).
// Runs on Node 18+ (uses global fetch).

const fs = require('fs');
const path = require('path');

const LAT = process.env.LAT || '41.2898';
const LON = process.env.LON || '-73.9204';
const THRESHOLD = parseInt(process.env.THRESHOLD || '40', 10);
const OUT_PATH = process.env.OUT_PATH || path.join(__dirname, '..', 'docs', 'rain-watch.ics');

function pad(n) { return String(n).padStart(2, '0'); }

function toICSDate(d) {
  return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' +
         pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
}

function buildBlocks(periods, threshold) {
  const blocks = [];
  let current = null;

  periods.forEach(p => {
    const prob = (p.probabilityOfPrecipitation && p.probabilityOfPrecipitation.value) || 0;
    const start = new Date(p.startTime);
    const end = new Date(p.endTime);

    if (prob >= threshold) {
      if (current && current.end.getTime() === start.getTime()) {
        current.end = end;
        current.maxProb = Math.max(current.maxProb, prob);
      } else {
        if (current) blocks.push(current);
        current = { start, end, maxProb: prob };
      }
    } else {
      if (current) { blocks.push(current); current = null; }
    }
  });
  if (current) blocks.push(current);
  return blocks;
}

function buildICS(blocks, place, threshold) {
  const now = new Date();
  let lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rain Watch//NWS Rain Blocks//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Rain Watch',
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    'X-PUBLISHED-TTL:PT6H'
  ];
  blocks.forEach((b, i) => {
    const uid = 'rainwatch-' + b.start.getTime() + '-' + i + '@rainwatch.local';
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + uid);
    lines.push('DTSTAMP:' + toICSDate(now));
    lines.push('DTSTART:' + toICSDate(b.start));
    lines.push('DTEND:' + toICSDate(b.end));
    lines.push('SUMMARY:Rain likely (' + b.maxProb + '%)');
    lines.push('DESCRIPTION:Probability of precipitation reaches ' + b.maxProb + '% (threshold ' + threshold + '%) for ' + place + '. Source: National Weather Service hourly forecast.');
    lines.push('TRANSP:TRANSPARENT');
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

async function main() {
  const pointRes = await fetch(`https://api.weather.gov/points/${LAT},${LON}`, {
    headers: { 'User-Agent': 'rain-watch-script (personal use)' }
  });
  if (!pointRes.ok) throw new Error('Point lookup failed: ' + pointRes.status);
  const pointData = await pointRes.json();
  const hourlyUrl = pointData.properties.forecastHourly;
  const relLoc = pointData.properties.relativeLocation && pointData.properties.relativeLocation.properties;
  const place = relLoc ? (relLoc.city + ', ' + relLoc.state) : (LAT + ',' + LON);

  const hourlyRes = await fetch(hourlyUrl, {
    headers: { 'User-Agent': 'rain-watch-script (personal use)' }
  });
  if (!hourlyRes.ok) throw new Error('Hourly forecast fetch failed: ' + hourlyRes.status);
  const hourlyData = await hourlyRes.json();
  const periods = hourlyData.properties.periods;

  const blocks = buildBlocks(periods, THRESHOLD);
  const ics = buildICS(blocks, place, THRESHOLD);

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, ics);
  console.log(`Wrote ${blocks.length} block(s) to ${OUT_PATH} for ${place} (threshold ${THRESHOLD}%).`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
