import { readFileSync, writeFileSync } from 'node:fs';
const data = JSON.parse(readFileSync(new URL('../public/assets/bar/world-land.geojson',import.meta.url),'utf8'));
const project = ([lng,lat]) => [(lng + 180) * 2,(85 - lat) * 2];
const rings = data.features.flatMap(feature => feature.geometry.type === 'Polygon' ? feature.geometry.coordinates : feature.geometry.coordinates.flat());
const paths = rings.map(ring => ring.map((point,index) => `${index ? 'L' : 'M'}${project(point).map(value => value.toFixed(1)).join(' ')}`).join('') + 'Z').join('');
writeFileSync(new URL('../public/assets/bar/world-land.svg',import.meta.url),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 290"><path fill="#315f63" stroke="#6b9794" stroke-width=".5" d="${paths}"/></svg>\n`);
