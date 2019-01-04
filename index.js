const booleanPointInPolygon = require('@turf/boolean-point-in-polygon');
const geobuf = require('geobuf');
const Pbf = require('pbf');
const fs = require('fs');

const boundarySets = {};
const boundaryTypes = ['elb', 'lga'];
const clipCache = {};

function loadBoundaries(type) {
    boundarySets[type] = readGeoBuf(`${__dirname}/data/${type}.geobuf`);
}

function readGeoBuf(filename) {
    const file = fs.readFileSync(filename);
    return geobuf.decode(new Pbf(file));
}

function findBoundary(features, lon, lat) {
    return features.find(f => f.geometry && booleanPointInPolygon([lon, lat], f.geometry));
}

function cleanProps(props, boundaryType) {
    if (boundaryType === 'lga') {
        return {
            // TODO only store the properties we want to serve
            name: props.LGA_NAME16,
            abscode: props.LGA_CODE16,
            state: props.STE_NAME16
        };
    } else if (boundaryType === 'elb') {
        // console.log(props);
        return {
            name: props.NAME,
            id: props.CE_PID,
            state: props.STATE_PID
        }
    }
}


function lookup(boundaryType, lon, lat) {
    if (!boundaryTypes[boundaryType]) {
        loadBoundaries(boundaryType);
    }
    const boundary = findBoundary(boundarySets[boundaryType].features, lon, lat);
    return boundary ? cleanProps(boundary.properties, boundaryType) : false;
}

function cacheClip(features, lonF, latF) {
    clipCache[lonF] = clipCache[lonF] || {};
    clipCache[lonF][latF] = features;
}


// "light" means don't cache anything, to minimise memory overhead.
function lookupIndexed(boundaryType, lon, lat, light) {
    function loadBoundaries() {
        return readGeoBuf(`${__dirname}/clipped/${lonF}/${latF}/${boundaryType}.geobuf`).features;
    }
    function getCachedClip() {
        if (!clipCache[lonF] || !clipCache[lonF][latF]) {
            cacheClip(loadBoundaries(), lonF, latF);
        }
        return clipCache[lonF][latF];
    }
    const lonF = Math.floor(lon), 
        latF = Math.floor(lat);
    const features = light ? loadBoundaries() : getCachedClip();
    const boundary = findBoundary(features, lon, lat);
    return boundary ? cleanProps(boundary.properties, boundaryType) : false;
}

function lgaByLonLat(lon, lat) {
    return lookup('lga', lon, lat);
};

function elbByLonLat(lon, lat, light = false) {
    return lookupIndexed('elb', lon, lat, light);
};

module.exports = {
    lookup,
    lgaByLonLat,
    elbByLonLat
};
