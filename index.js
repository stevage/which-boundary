const booleanPointInPolygon = require('@turf/boolean-point-in-polygon');
const topojson = require('topojson-client');

const lgasFile = require('./lgas.topo.json');
const lgas = topojson.feature(lgasFile, lgasFile.objects.lgas);


module.exports.lgaByLonLat = function(lon, lat) {
    let lga = lgas.features.find(f => f.geometry && booleanPointInPolygon([lon, lat], f.geometry));
    if (lga) {
        return {
            name: lga.properties.LGA_NAME17,
            abscode: lga.properties.LGA_CODE17,
            state: lga.properties.STE_NAME17
        };
    }
};