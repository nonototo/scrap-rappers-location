# scrap-rappers-location

Scrap all rappers location (lat-lng) from wikipedia

Fetched wikipedia html pages will be stored in "cache" for later reprocess

If you want to "refetch" new data form wikipedia just delete the "cache" dir

Rappers info will be exported to "./html/json/rappers.json"

You can check results with a sample page

## initial setup

    $ yarn install

## delete cache

    $ rm -rf cache/*

## Generate json data

    $ node fetch_and_generate_json.js

## check results

    $ yarn start

## Online check

[Rappers](https://xa-bi.github.io/scrap-rappers-location/docs/)
