## Which-boundary

Look up which Australian Local Government Area (LGA) a given coordinate (as long/lat pair) is inside based on Australian Bureau of Statistics data

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
wget -O 1270055003_lga_2017_aust_shp.zip 'http://www.ausstats.abs.gov.au/ausstats/subscriber.nsf/0/F11A76BAD13A9F8FCA25816B00135BCA/$File/1270055003_lga_2017_aust_shp.zip'
unzip 1270055003_lga_2017_aust_shp.zip
ogr2ogr -f GeoJSON lgas.geojson LGA_2017_AUST.shp
geo2topo -q 1e4 lgas.geojson > lgas.topo.json
```