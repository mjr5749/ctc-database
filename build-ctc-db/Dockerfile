# syntax=docker/dockerfile:1

ARG DATASETTE_VERSION=0.64.3

FROM datasetteproject/datasette:${DATASETTE_VERSION}

ARG DATASETTE_FORCE_HTTPS_URLS=1

# Install Datasette plugins
RUN ["datasette", "install", "datasette-json-html"]
RUN ["datasette", "install", "datasette-hashed-urls"]

# Copy custom Datasette plugins
COPY ./plugins /plugins

# Add database of CTC Catalogue
COPY ./db/ctc-catalogue.db /db/ctc-catalogue.db

# Add Datasette metadata file
COPY ./db/metadata.json /db/metadata.json

# Capture build argument that we need when launching Datasette
ENV DATASETTE_FORCE_HTTPS_URLS=${DATASETTE_FORCE_HTTPS_URLS}

# Default command to run Datasette
CMD datasette -p 8080 -h 0.0.0.0 -i /db/ctc-catalogue.db \
    --metadata /db/metadata.json \
    --plugins-dir /plugins \
    --setting facet_time_limit_ms 200 \
    --setting default_facet_size 25 \
    --setting suggest_facets off \
    --setting force_https_urls $DATASETTE_FORCE_HTTPS_URLS