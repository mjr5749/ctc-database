# syntax=docker/dockerfile:1
   
FROM datasetteproject/datasette

# Install Datasette plugins
RUN ["datasette", "install", "datasette-json-html"]
RUN ["datasette", "install", "datasette-hashed-urls"]

# Add database of CTC Catalogue
COPY ./db/ctc-catalogue.db /db/ctc-catalogue.db

# Add Datasette metadata file
COPY ./db/metadata.json /db/metadata.json

# Default command to run Datasette
CMD ["datasette", "-p", "8080", "-h", "0.0.0.0", "-i", "/db/ctc-catalogue.db", \
    "--metadata", "/db/metadata.json", \
     "--setting", "facet_time_limit_ms", "200", \
     "--setting", "default_facet_size", "25", \
     "--setting", "suggest_facets", "off", \
     "--setting", "force_https_urls", "1"]