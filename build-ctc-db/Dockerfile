# syntax=docker/dockerfile:1

ARG DATASETTE_VERSION=0.64.3

FROM datasetteproject/datasette:${DATASETTE_VERSION}

ARG DATASETTE_FORCE_HTTPS_URLS=1

# Install Datasette plugins
RUN ["datasette", "install", "datasette-json-html"]
RUN ["datasette", "install", "datasette-hashed-urls"]
RUN ["datasette", "install", "datasette-template-sql"]

# Copy custom Datasette plugins
COPY ./plugins /plugins

# Copy custom Datasette templates
COPY ./templates /templates

# Add database of CTC Catalogue
COPY ./db/ctc-catalogue.db /db/ctc-catalogue.db

# Add Datasette metadata file
COPY ./db/metadata.json /db/metadata.json

# Pre-calculate row counts
RUN  ["datasette", "inspect", "/db/ctc-catalogue.db", \
      "--inspect-file=/db/inspect.json"]

# Capture build argument that we need when launching Datasette
ENV DATASETTE_FORCE_HTTPS_URLS=${DATASETTE_FORCE_HTTPS_URLS}

# Default command to run Datasette
CMD datasette -p 8080 -h 0.0.0.0 -i /db/ctc-catalogue.db \
    --inspect-file=/db/inspect.json \
    --metadata /db/metadata.json \
    --plugins-dir /plugins \
    --template-dir /templates \
    --setting facet_time_limit_ms 200 \
    --setting default_facet_size 25 \
    --setting suggest_facets off \
    --setting force_https_urls $DATASETTE_FORCE_HTTPS_URLS