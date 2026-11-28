# X-08 inventory: hardcoded business identity in the original demo

Taken from `index.html` on main (commit 35845ce) before the refactor. Every
value below was hardcoded in the page; the right column is the config field
in `config/best-electric.json` that now carries it. The template
(`template/index.html`) contains none of these values.

## Business identity

| Hardcoded value | Where it appeared | Config field |
| --- | --- | --- |
| Best Electric | title, meta description, demo bar, header brand, services lede, gallery lede and alt texts, form note, thanks text, hiring text, footer name | `businessName` |
| Electricians (title, hero kicker) | title, kicker line | `tradePlural` |
| Modesto and Merced, CA | title | `titleArea` |
| Modesto and Merced | meta description, gallery caption | `areaShort` |
| Modesto \| Merced | header brand sub-line | `brandSub` |
| Demo redesign for Best Electric: licensed electricians serving... (full sentence) | meta description | `metaDescription` |
| Content and photos from bestelectric.us. | footer credit | `sourceCredit` |

## License

| Hardcoded value | Where it appeared | Config field |
| --- | --- | --- |
| License #392737 (C10) | hero kicker, about paragraph, footer | `licenseLabel` |
| C10 License #392737 | trust band | `licenseShort` (composed as "C10 {{licenseShort}}") |

## Phones and locations

| Hardcoded value | Where it appeared | Config field |
| --- | --- | --- |
| (209) 569-0120 / +12095690120 | emergency bar, header call button, hero call button, location card, form thanks text, hiring text, footer, sticky call bar | `locations[0].phoneDisplay` / `locations[0].phoneTel` |
| (209) 723-2061 / +12097232061 | emergency bar, header call button, location card, form thanks text, footer, sticky call bar | `locations[1].phoneDisplay` / `locations[1].phoneTel` |
| Modesto, 1322 7th St, Modesto, CA 95354 | location card, footer, form location dropdown | `locations[0].name` / `locations[0].address` |
| Merced, 2160 Wardrobe Ave, Merced, CA 95341 | location card, footer, form location dropdown | `locations[1].name` / `locations[1].address` |
| 24/7 Emergency Service | emergency bar, footer highlights | `emergencyLabel`, `footerHighlights` |

## Services and sectors

| Hardcoded value | Where it appeared | Config field |
| --- | --- | --- |
| 10 services with blurbs: Troubleshooting, Repairs, Installations, Upgrades, Remodeling, New Construction, Improvements, High Voltage, Solar Installation, Fire Alarm & Security | services grid, estimate form service dropdown | `services[]` (`name`, `blurb`) |
| Emergency Service, Something else | extra options in the estimate form dropdown | `estimateExtraOptions` |
| 4 sectors with blurbs: Residential, Commercial, Industrial, Agricultural | sectors band | `sectors[]` (`name`, `blurb`) |
| Services, sectors, locations and estimate lede paragraphs | section intros | `servicesLede`, `sectorsLede`, `locationsLede`, `estimateLede` |

## Photos

| Hardcoded value | Where it appeared | Config field |
| --- | --- | --- |
| truck-hero.jpg | hero background, gallery | `heroImage`, `gallery[]` |
| bolt-logo.jpg | header brand logo | `logo` (`src`, `alt`) |
| work-panels.jpg, work-agriculture.jpg, work-meters.jpg, work-bucket-truck.jpg, work-crew.jpg, work-meter-install.jpg, work-kitchen.jpg, truck-pano.jpg | gallery, each with alt text and caption | `gallery[]` (`src`, `alt`, `caption`) |
| work-crew.jpg | about section photo | `aboutImage` (`src`, `alt`) |
| now-hiring.png | hiring section photo | `hiring.image` (`src`, `alt`) |

## Remaining copy blocks

| Hardcoded value | Config field |
| --- | --- |
| Headline "Go with someone who's been there." | `headline` |
| Tagline "Skilled Craftsmanship, Professional Quality Service, Impeccable Performance & Competitive Pricing." | `tagline` |
| "Rated 4.7 stars from 44 customer reviews." | `ratingLine` (optional; omit for no line) |
| Trust band pairs: 24/7 Emergency Service, Free Estimates, Senior Discounts Available, Licensed C10 License #392737 | `trustItems[]` (`big`, `small`) |
| About heading and both about paragraphs | `aboutHeading`, `aboutParagraphs[]` |
| "Two Locations, One Call Away" | `locationsHeading` |
| Form message placeholder, form note, thanks text | `messagePlaceholder`, `formNote`, `thanksText` |
| Hiring heading and body | `hiring.heading`, `hiring.bodyHtml` (optional section) |
| Footer highlights line "24/7 Emergency Service \| Senior Discounts \| Free Estimates" | `footerHighlights` |

## Not parameterized (template defaults, noted for honesty)

- The color palette (navy #0e2a47, orange #ff8a00) and all layout CSS live in
  the template. They were Best Electric's demo styling and are now the
  template's default theme for every trade.
- Generic interface labels stay in the template: nav links (Services, Our
  Work, About, Locations, Free Estimate), section headings (Our Services,
  Who We Serve, Recent Work, Request a Free Estimate), form field labels and
  the demo bar framing ("Demo website prepared for ... by Fullstacks.").
- `Dockerfile` still lists the Best Electric photo files by name; it deploys
  the Best Electric build at the repo root and was left unchanged. A future
  prospect deployment would generate its own file list from its config.
