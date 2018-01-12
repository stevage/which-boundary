## Which-boundary

Look up which Australian Local Government Area (LGA) a given coordinate (as long/lat pair) is inside.

```
var which=require('which-boundary');
console.log(which.lgaByLonLat(145, -37.8));

{ name: 'Yarra (C)', abscode: '27350', state: 'Victoria' }
```

## Maintaining the data

Pre-requisites:
* gdal-bin (contains ogr2ogr)
* topojson (contains geo2topo)

```
wget -O 1270055003_lga_2016_aust_shape.zip 'http://www.abs.gov.au/ausstats/subscriber.nsf/log?openagent&1270055003_lga_2016_aust_shape.zip&1270.0.55.003&Data%20Cubes&6A6A6E8944937276CA25802C00142DD2&0&July%202016&13.09.2016&Latest'
unzip 1270055003_lga_2016_aust_shape.zip
ogr2ogr -f GeoJSON lgas.geojson LGA_2016_AUST.shp
geo2topo -q 1e4 lgas.geojson > lgas.topojson
```