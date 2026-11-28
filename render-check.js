#!/usr/bin/env node
/*
 * Render check (X-59): renders a config through the X-08 template and
 * asserts the output is complete and clean.
 *
 * Usage:
 *   node render-check.js <config.json>            checks for any config
 *   node render-check.js <config.json> --sample   extra checks for the
 *                                                 sample configs: the name
 *                                                 must be marked (Sample),
 *                                                 phones must be 555
 *                                                 placeholders, and no Best
 *                                                 Electric identity may leak
 *
 * Exit code 0 when every check passes, 1 otherwise.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { loadConfig, render } = require('./build');

const file = process.argv[2];
const sample = process.argv.includes('--sample');
if (!file) { console.error('usage: node render-check.js <config.json> [--sample]'); process.exit(2); }

const cfg = loadConfig(file);
const template = fs.readFileSync(path.join(__dirname, 'template', 'index.html'), 'utf8');

let failures = 0;
function check(label, ok) {
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label);
  if (!ok) failures++;
}

let html = '';
try {
  html = render(template, cfg);
  check('renders without error', true);
} catch (e) {
  check('renders without error (' + e.message + ')', false);
  process.exit(1);
}

check('no unresolved {{...}} tokens in output', !html.includes('{{'));
check('business name present: ' + cfg.businessName, html.includes(cfg.businessName));
check('license label present: ' + cfg.licenseLabel, html.includes(cfg.licenseLabel));
check('title names the business', html.includes('<title>' + cfg.businessName + ' |'));
for (const loc of cfg.locations || []) {
  check('location phone shown: ' + loc.phoneDisplay, html.includes(loc.phoneDisplay));
  check('location tel link present: ' + loc.phoneTel, html.includes('href="tel:' + loc.phoneTel + '"'));
  check('location address shown: ' + loc.address, html.includes(loc.address));
}
for (const svc of cfg.services || []) {
  check('service listed: ' + svc.name, html.includes('<h3>' + svc.name + '</h3>'));
}
if (Array.isArray(cfg.gallery) && cfg.gallery.length) {
  check('gallery section rendered (config has photos)', html.includes('<section id="work">'));
} else {
  check('gallery section omitted (config has no photos)', !html.includes('<section id="work">'));
}
if (cfg.hiring) {
  check('hiring section rendered (config enables it)', html.includes('<section id="hiring">'));
} else {
  check('hiring section omitted (config leaves it out)', !html.includes('<section id="hiring">'));
}

if (sample) {
  check('sample name is marked as a sample', cfg.businessName.includes('(Sample)'));
  const forbidden = ['Best Electric', 'bestelectric', '392737', '569-0120', '723-2061',
    'Modesto', 'Merced', '7th St', 'Wardrobe', 'truck-hero', 'work-crew', 'bolt-logo'];
  for (const f of forbidden) {
    check('no real-business leak: "' + f + '" absent', !html.includes(f));
  }
  for (const loc of cfg.locations || []) {
    check('placeholder phone (555): ' + loc.phoneDisplay,
      loc.phoneDisplay.includes('(555)') && loc.phoneTel.startsWith('+1555'));
  }
}

console.log(failures === 0 ? 'ALL CHECKS PASSED for ' + file : failures + ' CHECK(S) FAILED for ' + file);
process.exit(failures === 0 ? 0 : 1);
