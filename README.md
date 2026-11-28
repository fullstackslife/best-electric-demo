# Best Electric Demo

Demo redesign of bestelectric.us prepared by Fullstacks as a sales demo for Best Electric, an electrical contractor in Modesto and Merced, CA.

Static site served by Caddy (Dockerfile + Caddyfile), deployed to Railway as a repo-connected service.

All copy, phone numbers, addresses, license number and photos come from the company's own website at bestelectric.us. Photos are self-hosted in this repo. The estimate form is a front-end demo only and does not send data.

## Trades demo template (X-08, X-59)

This repo is also a parameterized trades-demo template. The page design lives
in `template/index.html` with no business identity in it; everything about a
business lives in one JSON config file, and `build.js` (Node, no
dependencies) renders a complete demo site from a config.

- `config/best-electric.json` renders the original Best Electric demo.
  Running `npm run build` regenerates the root `index.html` from it. The
  regenerated page is identical to the hand-written original except for one
  cosmetic source difference: the estimate form's service dropdown lists its
  options one per line instead of packed three per line. The options, their
  order and all visible text are unchanged.
- `config/samples/` holds three sample configs (HVAC, plumbing, roofing)
  with placeholder businesses clearly marked as samples and 555 placeholder
  phone numbers. They exist to prove a new prospect demo is produced by
  config alone, with no code changes.
- `docs/INVENTORY.md` lists every place the business identity was hardcoded
  before the refactor and the config field that carries it now.

Commands:

```sh
npm run build          # render the Best Electric demo into the repo root
npm run build:samples  # render the three sample demos into dist/
npm run check          # render-check every config (identity, phones,
                       # license, services, no leaked real-business data
                       # in the samples)
```

Photo handling: a config references photo files by name and the build copies
them next to the rendered page. A config with no photos (like the samples)
simply omits the gallery section, the hero photo and the logo, and still
renders a complete page. The hiring section is likewise optional.

To make a demo for a new prospect: copy a config, replace the business name,
services, phones, locations, license line and copy with the prospect's own
material, drop their photos in the repo root, and run
`node build.js <new-config> --out dist/<slug>`.
