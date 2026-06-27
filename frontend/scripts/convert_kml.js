const fs = require('fs');
const path = require('path');
const DOMParser = require('xmldom').DOMParser;
const toGeoJSON = require('@mapbox/togeojson');

const kmlDir = "C:\\Users\\kaust\\Desktop\\ai_workplace\\Claude Impact Lab\\Datasets";
const outDir = path.join(__dirname, '..', 'public', 'data');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const files = [
  'CCTV Dataset.kml',
  'Police Stations.kml',
  'nashik_kumbh_chokepoints_parking_map.kml'
];

files.forEach(file => {
  const kmlPath = path.join(kmlDir, file);
  if (fs.existsSync(kmlPath)) {
    const kmlStr = fs.readFileSync(kmlPath, 'utf8');
    const kmlDom = new DOMParser().parseFromString(kmlStr, 'text/xml');
    const geojson = toGeoJSON.kml(kmlDom);
    
    const outName = file.replace('.kml', '.json').replace(/ /g, '_').toLowerCase();
    fs.writeFileSync(path.join(outDir, outName), JSON.stringify(geojson, null, 2));
    console.log(`Converted ${file} to ${outName}`);
  } else {
    console.warn(`File not found: ${kmlPath}`);
  }
});
