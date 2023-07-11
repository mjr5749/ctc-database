#!/bin/bash
docker run -p 8001:8001 -v `pwd`:/mnt \
    datasetteproject/datasette \
    datasette -p 8001 -h 0.0.0.0 /mnt/youtube-api/db/ctc-catalogue.db