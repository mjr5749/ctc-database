# syntax=docker/dockerfile:1
   
FROM datasetteproject/datasette

# Install Datasette plugins
RUN ["datasette", "install", "datasette-json-html"]

# Add database of CTC Catalogue
COPY ./db/ctc-catalogue.db /db/ctc-catalogue.db

# Default command to run Datasette
CMD ["datasette", "-p", "8080", "-h", "0.0.0.0", "/db/ctc-catalogue.db", \
     "--setting", "facet_time_limit_ms", "200", \
     "--setting", "default_facet_size", "100"]