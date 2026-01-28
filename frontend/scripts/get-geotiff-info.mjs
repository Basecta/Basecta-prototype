import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import parseGeoraster from 'georaster';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getInfo() {
  const inputPath = join(__dirname, '../public/Mapping-One-Field-orthophoto.tif');

  console.log('Reading GeoTIFF...');
  const buffer = readFileSync(inputPath);

  console.log('Parsing georaster...');
  const georaster = await parseGeoraster(buffer);

  console.log('\nGeoRaster Info:');
  console.log('- Projection:', georaster.projection);
  console.log('- xmin:', georaster.xmin);
  console.log('- xmax:', georaster.xmax);
  console.log('- ymin:', georaster.ymin);
  console.log('- ymax:', georaster.ymax);
  console.log('- width:', georaster.width);
  console.log('- height:', georaster.height);
  console.log('- pixelWidth:', georaster.pixelWidth);
  console.log('- pixelHeight:', georaster.pixelHeight);
  console.log('- numberOfRasters:', georaster.numberOfRasters);
}

getInfo().catch(console.error);
