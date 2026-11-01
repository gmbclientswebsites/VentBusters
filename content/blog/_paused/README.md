# Paused posts

Files in this folder are **not published**. Both build scripts read only
`*.json` directly inside `content/blog/`, and neither recurses, so anything
moved here is skipped on the next deploy.

## Why these are here

The site was repositioned as a dryer vent specialist: air duct cleaning, HVAC
UV light systems and HVAC sanitization were removed from the website on
purpose. A published post targeting one of those keywords works against that,
because it tells Google the site is still a general duct company.

## To publish one again

```
git mv content/blog/_paused/<file>.json content/blog/
```

Then push. The next deploy builds it as normal.

## Currently paused

- `air-duct-cleaning-boca-raton-homeowners-guide.json` — the whole post, its
  title and its slug target "air duct cleaning in Boca Raton", a service the
  site no longer offers.

If the blog topic queue that produced it is still set to generate air duct,
UV light or HVAC sanitization subjects, that queue is worth updating, or posts
like this will keep arriving.
