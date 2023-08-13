#!/bin/bash

docker build --build-arg="DATASETTE_FORCE_HTTPS_URLS=0" -t ctc-catalogue ./build-ctc-db/
docker run -t -i -p 8080:8080 ctc-catalogue