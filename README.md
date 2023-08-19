This project implements a web-based interface for the Cracking the Cryptic (CTC) catalogue of YouTube videos. The source of this data is the fan-created [Cracking the Cryptic Catalogue]("https://docs.google.com/spreadsheets/d/1rVqAjm-l_Urjd3TNmIc3SmTmz_OlgSoBuhY7RPgiuRg/edit?usp=sharing").

The [Datasette](https://datasette.io) tool is used to provide the interactive web interface for the catalogue database.

The high-level components of this application are:
1. The `build-ctc-db` sub-project is a Node.js project that loads the Google Sheets version of the [Cracking the Cryptic Catalogue]("https://docs.google.com/spreadsheets/d/1rVqAjm-l_Urjd3TNmIc3SmTmz_OlgSoBuhY7RPgiuRg/edit?usp=sharing") into a [SQLite](https://www.sqlite.org/index.html) database.
2. The `build-ctc-db` sub-project packages the resulting SQLite database and a customized Datasette configuration into a Docker image.
3. The Docker image is hosted as an app on the [fly.io](fly.io) platform.
4. The [ctc-catalogue.com website](https://ctc-catalogue.com) is hosted on Cloudflare to provide DNS and caching services in front of the fly.io app.

# Deplyment Details
This section describes the key details of how the application is deployed and managed, starting with the Cloudflare front door and working down the stack.

## Cloudflare Configuration (ctc-catalogue.com)

### DNS
DNA `A` and `AAAA` records for `ctc-catalogue.com` are managed by Cloudflare, and traffic is proxied to the app on fly.io to provide caching.

### TLS
TLS between Cloudflare and fly.io is set to `Full (Strict)`, which requires a trusted certificate on the fly.io app. Fly.io provisions the trusted certificate automatically after verifying ownership of the `ctc-catalogue.com` domain.

### Caching
Cloudflare caches static assets (such as `.js` and `.css`) by default. Cloudflare adds response headers so that browser will cache these assets for 4 hours.

Note that some Datasette assets do not use a unique URL that changes in a Datasette update. Therefore, a Datasette upgrade may require a cache purge on the CDN. This specifically effects the `table.js` asset.

Because the Datasette database is read-only, dynamic content rendered by Datasette can also be cached on the edge. A caching rule is configured to cache all request URIs that begin with `ctc-catalogue-`. These requests are safe to cache because Datasette adds a database content hash _after_ the `/ctc-catalogue-` dash in the URI. Everytime the database is regenerated and deployed, the dynamic URLs will change as a result of this hash.

## Fly.io Deployment

The application is deployed as a single Docker container on the Fly.io platform, with a single node in each of 3 geographic regions. The Docker image contains both the Datasette utility, and the SQLite database containing the catalogue.

The app is configured with a custom domain and certificate for `ctc-catalogue.com`. This allows Cloudflare to communicate with the app using the `Full (Strict)` TLS mode..y

### Deploying with Github Actions

The application is deployed to fly.io by GitHub Actions scheduled on a trigger. The action builds an up-to-date SQLite database of the catalogue, creates the Docker image, and deploys to the fly.io app.

The GitHub action, `deploy_fly_io` is defined in:
> .github/workflows/main.yml

# Datasette Customization

The Datasette application has been configured to provide custom content, to fine-tune the user experience, and to optimize for performance.

## Datasette Content Customization

The Datasette `metadata.json` file provides friendly table names, descriptions, and data sources for this project.

The home page template -- `templates\index.html` -- has been customized to provide details about the project and to provide links into the main tables of interest to users.

## Datasette UX Adjustments

The Datasette `datasette-json-html` plugin is used to render images and hyperlinks inline in the table data views. This allows the YouTube video thumbnails to be shown directly inline in the catalogue.

A custom plugin -- `plugins\render_cell_json_array.py` -- is used to pretty-print JSON string arrays.
* Default behavior: `["Element 1", "Element 2", ...]`
* Custom behavior:  `Element 1, Element 2, ...`

The tables template -- `templates\table.html` -- has been customized to remove some elements that are not needed by this project.

The facet experience has been heavily customized in the `templates\_facet_results.html` template. The key changes and configurations are described below:
* Automatic facet suggesions are disabled, and all facets are specified in the project `metadata.json` file.
* Facet size is set to a large limit (1,200) so that all facet options are returned on initial page load.
* Selected facets are displayed normally, and up to 5 un-selected facets are also displayed normally.
* Remaining facets can be accessed through an input field with autocomplete driven by a data-list.
* **Note**: If a user adds a facet directly from a table column, it may exceed the 1,000 row limit and result in not all options for the facet being available for the user to select. The current facet UX does not provide a way to override this limit and load the full list for the facet.

## Datasette Performance Tuning

Datasette runs in _immutable_ mode (`-i flag`), which allows it to cache more information because it can rely on the database not being modified.

Row counts are pre-computed with the `datasette inspect` command to avoid needing to calculate these values every time the app is started.

The `datasette-hashed-urls` plugin is used to add a hash computed from the database contents to dynamic content URLs. This allows these URIs to be safely cached by Cloudflare, and by client browsers. When the database contents change, the database hash in the URI will change, and this prevents prior cached pages from being served as stale results.