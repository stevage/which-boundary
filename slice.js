const turf = require('@turf/turf');
const fs = require('fs-extra');

const geobuf = require('geobuf');
function writeGeoBuf(json, filename) {
    const pbf = geobuf.encode(json, new (require('pbf'))());
    const out = fs.createWriteStream(filename);
    out.write(Buffer.from(pbf));
    out.end();
}

function writeJson(json, filename) {
    fs.writeFileSync(filename, JSON.stringify(json));
}


function slice({source, name, minLon, maxLon, lat, baseDir}, done) {
    for (let lon = minLon; lon <= maxLon; lon ++) {
        const clipped = turf.featureCollection([]);
        source.features.forEach(f => {
            let cut;
            cut = turf.bboxClip(f, [lon, lat, lon+1, lat+1])
            if (cut.geometry.coordinates.length) {
                console.log(lon, lat);
                clipped.features.push(cut);
            }
        });
                
        const dir = `${baseDir}/clipped/${lon}/${lat}`;
        fs.ensureDirSync(dir);
        writeGeoBuf(clipped, `${dir}/${name}.geobuf`);
        writeJson(clipped, `${dir}/${name}.json`);
    }
    done({ lon, lat });
}
module.exports = slice;