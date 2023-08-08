#!/bin/bash

docker build --build-arg="DATASETTE_FORCE_HTTPS_URLS=0" -t ctc-catalogue ./build-ctc-db/
docker run -t -i -p 8080:8080 ctc-catalogue

#docker run -p 8001:8001 -v `pwd`:/mnt \
#    datasetteproject/datasette \
#    datasette -p 8001 -h 0.0.0.0 /mnt/build-ctc-dbDock/db/ctc-catalogue.db \
#    --setting facet_time_limit_ms 200

#datasette -p 8001 -h 0.0.0.0 ./build-ctc-db/db/ctc-catalogue.db \
#    --setting facet_time_limit_ms 200 \
#    --setting default_facet_size 100