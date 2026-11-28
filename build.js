#!/usr/bin/env node
/*
 * Trades demo builder (X-08).
 *
 * Renders template/index.html from a single JSON config file.
 *
 * Usage:
 *   node build.js <config.json> [--out DIR]   render + write index.html, copy
 *                                             referenced photo assets and the
 *                                             Caddyfile into DIR (default:
 *                                             dist/<config slug>)
 *   node build.js <config.json> --print       render to stdout only
 *
 * Template syntax (deliberately tiny, no dependencies):
 *   {{path}}                 scalar lookup, dotted paths and array indexes
 *                            work ({{locations.0.phoneDisplay}}); {{.}} is the
 *                            current item inside {{#each}}
 *   {{#each path}}...{{/each}}     repeat per array item; inside, {{@index}},
 *                            {{@first}} and {{@last}} are available
 *   {{#if path}}...{{else}}...{{/if}}     empty arrays/strings count as false
 *   {{#unless path}}...{{/unless}}
 *
 * Config string values may reference other config values with the same
 * {{path}} syntax; those cross-references are resolved against the root
 * config before rendering, so a fact like the license label is written once.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

/* ---------- config loading + cross-reference resolution ---------- */

function lookup(root, dotted) {
  let cur = root;
  for (const part of String(dotted).split('.')) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[part];
  }
  return cur;
}

function resolveCrossRefs(config) {
  let cfg = JSON.parse(JSON.stringify(config));
  for (let pass = 0; pass < 10; pass++) {
    let changed = false;
    const walk = (node) => {
      if (typeof node === 'string') {
        return node.replace(/\{\{([^#/][^}]*)\}\}/g, (m, p) => {
          const v = lookup(cfg, p.trim());
          if (v === undefined || typeof v === 'object') {
            throw new Error('config cross-reference {{' + p + '}} does not resolve to a scalar');
          }
          changed = true;
          return String(v);
        });
      }
      if (Array.isArray(node)) return node.map(walk);
      if (node && typeof node === 'object') {
        const o = {};
        for (const k of Object.keys(node)) o[k] = walk(node[k]);
        return o;
      }
      return node;
    };
    cfg = walk(cfg);
    if (!changed) break;
  }
  return cfg;
}

function loadConfig(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  return resolveCrossRefs(raw);
}

/* ---------- template parsing ---------- */

function parse(template) {
  const tokens = template.split(/(\{\{[^}]+\}\})/g).filter((t) => t !== '');
  const rootNode = { type: 'root', children: [] };
  const stack = [rootNode];
  const top = () => stack[stack.length - 1];
  const target = () => (top().inElse ? top().elseChildren : top().children);
  for (const tok of tokens) {
    const m = tok.match(/^\{\{([\s\S]*)\}\}$/);
    if (!m) { target().push({ type: 'text', value: tok }); continue; }
    const inner = m[1].trim();
    if (inner.startsWith('#each ')) {
      const n = { type: 'each', path: inner.slice(6).trim(), children: [], elseChildren: null, inElse: false };
      target().push(n); stack.push(n);
    } else if (inner.startsWith('#if ')) {
      const n = { type: 'if', path: inner.slice(4).trim(), children: [], elseChildren: null, inElse: false };
      target().push(n); stack.push(n);
    } else if (inner.startsWith('#unless ')) {
      const n = { type: 'unless', path: inner.slice(8).trim(), children: [], elseChildren: null, inElse: false };
      target().push(n); stack.push(n);
    } else if (inner === 'else') {
      if (!top().elseChildren) top().elseChildren = [];
      top().inElse = true;
    } else if (inner.startsWith('/')) {
      const kind = inner.slice(1).trim();
      const n = stack.pop();
      if (!n || n.type !== kind) throw new Error('template: mismatched closing tag {{/' + kind + '}}');
    } else {
      target().push({ type: 'var', path: inner });
    }
  }
  if (stack.length !== 1) throw new Error('template: unclosed block tag');
  return rootNode.children;
}

/* ---------- rendering ---------- */

function truthy(v) {
  if (v === undefined || v === null || v === false || v === '') return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

function resolveVar(pathStr, frames, root) {
  if (pathStr === '.') return frames.length ? frames[frames.length - 1].item : root;
  if (pathStr.startsWith('@')) {
    const f = frames[frames.length - 1];
    if (!f) return undefined;
    if (pathStr === '@index') return f.index;
    if (pathStr === '@first') return f.index === 0;
    if (pathStr === '@last') return f.index === f.length - 1;
    return undefined;
  }
  const parts = pathStr.split('.');
  for (let i = frames.length - 1; i >= -1; i--) {
    const scope = i === -1 ? root : frames[i].item;
    if (scope && typeof scope === 'object' && parts[0] in Object(scope)) {
      const v = lookup(scope, pathStr);
      if (v !== undefined) return v;
    }
  }
  return lookup(root, pathStr);
}

function renderNodes(nodes, frames, root) {
  let out = '';
  for (const n of nodes) {
    if (n.type === 'text') { out += n.value; continue; }
    if (n.type === 'var') {
      const v = resolveVar(n.path, frames, root);
      if (v === undefined || v === null || typeof v === 'object') {
        throw new Error('template: {{' + n.path + '}} did not resolve to a scalar value');
      }
      out += String(v);
      continue;
    }
    if (n.type === 'each') {
      const arr = resolveVar(n.path, frames, root);
      if (!Array.isArray(arr)) throw new Error('template: {{#each ' + n.path + '}} is not an array');
      arr.forEach((item, idx) => {
        frames.push({ item, index: idx, length: arr.length });
        out += renderNodes(n.children, frames, root);
        frames.pop();
      });
      continue;
    }
    if (n.type === 'if' || n.type === 'unless') {
      let t = truthy(resolveVar(n.path, frames, root));
      if (n.type === 'unless') t = !t;
      out += renderNodes(t ? n.children : (n.elseChildren || []), frames, root);
      continue;
    }
    throw new Error('template: unknown node type ' + n.type);
  }
  return out;
}

function render(template, config) {
  const nodes = parse(template);
  const out = renderNodes(nodes, [], config);
  if (out.includes('{{')) throw new Error('render: unresolved {{...}} token left in output');
  return out;
}

/* ---------- build ---------- */

function collectAssets(cfg) {
  const assets = new Set();
  if (cfg.heroImage) assets.add(cfg.heroImage);
  if (cfg.logo && cfg.logo.src) assets.add(cfg.logo.src);
  if (cfg.aboutImage && cfg.aboutImage.src) assets.add(cfg.aboutImage.src);
  if (cfg.hiring && cfg.hiring.image && cfg.hiring.image.src) assets.add(cfg.hiring.image.src);
  if (Array.isArray(cfg.gallery)) for (const g of cfg.gallery) if (g.src) assets.add(g.src);
  return [...assets];
}

function build(configFile, outDir) {
  const cfg = loadConfig(configFile);
  const template = fs.readFileSync(path.join(ROOT, 'template', 'index.html'), 'utf8');
  const html = render(template, cfg);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  const copied = [];
  for (const asset of collectAssets(cfg)) {
    const src = path.join(ROOT, asset);
    const dest = path.join(outDir, asset);
    if (path.resolve(src) === path.resolve(dest)) continue;
    if (!fs.existsSync(src)) throw new Error('build: config references missing asset file ' + asset);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    copied.push(asset);
  }
  const caddySrc = path.join(ROOT, 'Caddyfile');
  const caddyDest = path.join(outDir, 'Caddyfile');
  if (path.resolve(caddySrc) !== path.resolve(caddyDest)) fs.copyFileSync(caddySrc, caddyDest);
  return { cfg, html, copied };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const configFile = args[0];
  if (!configFile) { console.error('usage: node build.js <config.json> [--out DIR | --print]'); process.exit(2); }
  const cfgRaw = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  if (args.includes('--print')) {
    const cfg = loadConfig(configFile);
    const template = fs.readFileSync(path.join(ROOT, 'template', 'index.html'), 'utf8');
    process.stdout.write(render(template, cfg));
  } else {
    const oi = args.indexOf('--out');
    const outDir = oi >= 0 ? path.resolve(args[oi + 1]) : path.join(ROOT, 'dist', cfgRaw.slug || 'demo');
    const result = build(configFile, outDir);
    console.log('built ' + (result.cfg.slug || configFile) + ': ' + result.html.length + ' bytes of HTML, ' + result.copied.length + ' assets copied -> ' + outDir);
  }
}

module.exports = { loadConfig, render, build, collectAssets, lookup };
