#!/usr/bin/env node --max_old_space_size=12000
/*
Makes a Geobuf of the electoral divisions. Basically solves three issues:
1) The input files are split up by state
2) The input files have geometry separated from attributes
3) The input files are individual polygons, and we probably want multipolygons.
*/
const shapefile = require('shapefile');
const fs = require('fs-extra');
const states = ['ACT','NSW','NT','QLD','SA','TAS','VIC','WA'];
// const states = ['NSW'];
const turf = require('@turf/turf');

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

function processState(state, out, outFile) {
    // Makes a multipolygon from any polygons that match this row's identifier, plus the row's attributes
    function makeMulti(row, polygons) {
        return turf.multiPolygon(
            polygons.features
                .filter(b => b.properties.CE_PID === row.CE_PID)
                .map(b => b.geometry.coordinates),
            row
        )
    }

    function addAttributes(polygons) {
        polygons.features.forEach(poly => poly.properties = rowIndex[poly.properties.CE_PID]);
        return polygons;
    }

    let polygons, rowIndex = {};
    return shapefile
        .read(`srcdata/${state}_COMM_ELECTORAL_POLYGON_shp`)
        .then(features => {
            // Wow. One multipolygon in NSW caused so much pain.
            polygons = turf.flatten(features);
            return readDbf(`srcdata/${state}_COMM_ELECTORAL_shp.dbf`)
        })        
        .then(rows => {
            rows.forEach(row => rowIndex[row.CE_PID] = row);
            metadata = rows;
            console.log(state,': ',rows.length);
            // const multifiedRows = rows.map(row => makeMulti(row, polygons));
            // const flattenedRows = turf.flatten(multifiedRows); // I know, right...
            const outRows = addAttributes(polygons).features;
            if (outFile) {
                outRows.forEach(row => outFile.write(JSON.stringify(row) + '\n'));
            } else {                
                out.features = out.features.concat(outRows)
            }
        });
}
/*
function slice(source, name) {
    // try { fs.mkdirSync('clipped'); } catch (e) { }
    fs.removeSync('clipped');
    // console.log(source);
    // 110..155, -44..-8
    for (let lon = 110; lon < 155; lon ++) {
        console.log(lon);
        for (let lat = -44; lat < -8; lat ++) {
            // console.log(lon,lat);
            const clipped = turf.featureCollection([]);
            const bbox = turf.polygon([[[lon, lat], [lon + 1, lat], [lon + 1, lat + 1], [lon, lat + 1], [lon, lat]]]);
            source.features.forEach(f => {
                let cut;
                cut = turf.bboxClip(f, [lon, lat, lon+1, lat+1])
                if (cut.geometry.coordinates.length) {
                    console.log(lon, lat);
                    clipped.features.push(cut);
                }
            });
                    
            const dir = `clipped/${lon}/${lat}`;
            fs.ensureDirSync(dir);
            writeGeoBuf(clipped, `${dir}/${name}.geobuf`);
            writeJson(clipped, `${dir}/${name}.json`);
        }
    }
}
*/
function slice(source, name) {
    // try { fs.mkdirSync('clipped'); } catch (e) { }
    fs.removeSync('clipped');
    // console.log(source);
    // 110..155, -44..-8

    const Pool = require('threads').Pool;
    const slicePool = new Pool().run('./slice');


    // for (let lon = 110; lon < 155; lon ++) {
        // console.log(lon);
        // for (let lat = -44; lat < -8; lat ++) {
        //     slicePool.send({ source, name, lon, lat, baseDir: __dirname});
        // }
    for (let lat = -44; lat < -8; lat ++) {
        const minLon = 110, maxLon = 155;
        slicePool.send({ source, name, minLon, maxLon, lat, baseDir: __dirname});
        // }
    }
    slicePool.on('done', function(job, { lon, lat }) {
        console.log('Job done:', lon, lat);
    });
}


const out = { type: 'FeatureCollection', features: []};
Promise.all(states.map(s => processState(s, out))).then(() => {
    slice(out, 'elb');
});
