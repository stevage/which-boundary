const booleanPointInPolygon = require('@turf/boolean-point-in-polygon');
const geobuf = require('geobuf');
const Pbf = require('pbf');
const fs = require('fs');

const boundarySets = {};
const boundaryTypes = ['elb', 'lga'];
boundaryTypes.forEach(type => {
    const file = fs.readFileSync('data/' + type + '.geobuf');
    boundarySets[type] = geobuf.decode(new Pbf(file));
});

module.exports.lookup = function lookup(boundaryType, lon, lat) {
    let boundary = boundarySets[boundaryType].features
        .find(f => f.geometry && booleanPointInPolygon([lon, lat], f.geometry));
    if (boundary) {
        const p = boundary.properties;
        if (boundaryType === 'lga') {
            return {
                // TODO only store the properties we want to serve
                name: p.LGA_NAME16,
                abscode: p.LGA_CODE16,
                state: p.STE_NAME16
            };
        } else if (boundaryType === 'elb') {
            return {
                name: p.NAME,
                id: p.CE_PID,
                state: p.STATE_PID
            }
        }
    } else {
        return false;
    }
}

module.exports.lgaByLonLat = function(lon, lat) {
    return module.exports.lookup('lga', lon, lat);
};

module.exports.elbByLonLat = function(lon, lat) {
    return module.exports.lookup('elb', lon, lat);
};