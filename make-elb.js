#!/usr/bin/env node --max_old_space_size=12000
/*
Makes a Geobuf of the electoral divisions. Basically solves three issues:
1) The input files are split up by state
2) The input files have geometry separated from attributes
3) The input files are individual polygons, and we probably want multipolygons.
*/
const shapefile = require('shapefile');
const fs = require('fs');
const states = ['ACT','NSW','NT','QLD','SA','TAS','VIC','WA'];
// const states = ['NSW'];
const turf = require('@turf/turf');
const out = { type: 'FeatureCollection', features: []};
const geobuf = require('geobuf');
function writeGeoBuf(json, filename) {
    const pbf = geobuf.encode(json, new (require('pbf'))());
    const out = fs.createWriteStream(filename);
    out.write(Buffer.from(pbf));
}

function readDbf(dbfName) {
    function readMore(source, result) {
        if (result) {
            if (result.done) {
                return;
            }
            features.push(result.value);
        }
        return source.read().then(result => readMore(source, result));
    };
    const features = [];

    return shapefile.openDbf(dbfName)
        // .then(source => source.read().then(result => readMore(source, result)))
        .then(readMore)
        .then(() => features);
}

function processState(state, outFile) {
    // Makes a multipolygon from any polygons that match this row's identifier, plus the row's attributes
    function makeMulti(row, polygons) {
        return turf.multiPolygon(
            polygons.features
                .filter(b => b.properties.CE_PID === row.CE_PID)
                .map(b => b.geometry.coordinates),
            row
        )
    }

    let polygons;
    return shapefile
        .read(`srcdata/${state}_COMM_ELECTORAL_POLYGON_shp`)
        .then(features => {
            // Wow. One multipolygon in NSW caused so much pain.
            polygons = turf.flatten(features);
            return readDbf(`srcdata/${state}_COMM_ELECTORAL_shp.dbf`)
        })        
        .then(rows => {
            metadata = rows;
            console.log(state,': ',rows.length);
            const multifiedRows = rows.map(row => makeMulti(row, polygons));
            if (outFile) {
                multifiedRows.forEach(row => outFile.write(JSON.stringify(row) + '\n'));
            } else {                
                out.features = out.features.concat(multifiedRows)
            }
        });
}

Promise.all(states.map(s => processState(s))).then(() => {
fs.writeFileSync('data/elb.json', JSON.stringify(out, null, 2));
    writeGeoBuf(out, 'data/elb.geobuf');
});
