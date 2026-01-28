import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import parseGeoraster from 'georaster';
import sharp from 'sharp';
import proj4 from 'proj4';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define EPSG:32629 (UTM zone 29N)
proj4.defs('EPSG:32629', '+proj=utm +zone=29 +datum=WGS84 +units=m +no_defs');

async function convertGeoTiff() {
  const inputPath = join(__dirname, '../public/Mapping-One-Field-orthophoto.tif');
  const outputImagePath = join(__dirname, '../public/farm-orthophoto.png');
  const outputBoundsPath = join(__dirname, '../public/farm-orthophoto-bounds.json');

  console.log('Reading GeoTIFF...');
  const buffer = readFileSync(inputPath);

  console.log('Parsing georaster for bounds...');
  const georaster = await parseGeoraster(buffer);

  // Convert UTM bounds to WGS84 (lat/lng)
  const southWest = proj4('EPSG:32629', 'WGS84', [georaster.xmin, georaster.ymin]);
  const northEast = proj4('EPSG:32629', 'WGS84', [georaster.xmax, georaster.ymax]);

  const bounds = {
    south: southWest[1],
    west: southWest[0],
    north: northEast[1],
    east: northEast[0],
    // Keep original UTM for reference
    utm: {
      xmin: georaster.xmin,
      xmax: georaster.xmax,
      ymin: georaster.ymin,
      ymax: georaster.ymax,
      projection: georaster.projection,
    },
  };

  console.log('WGS84 Bounds:');
  console.log(`  South: ${bounds.south}`);
  console.log(`  West: ${bounds.west}`);
  console.log(`  North: ${bounds.north}`);
  console.log(`  East: ${bounds.east}`);

  writeFileSync(outputBoundsPath, JSON.stringify(bounds, null, 2));
  console.log(`Bounds saved to ${outputBoundsPath}`);

  // Convert to PNG with transparency (black pixels become transparent)
  console.log('Converting to PNG with transparency...');

  // First resize
  const resized = await sharp(inputPath)
    .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized;
  const pixels = new Uint8Array(data);

  // Make black/near-black pixels transparent
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // If pixel is very dark (near black), make it transparent
    if (r < 15 && g < 15 && b < 15) {
      pixels[i + 3] = 0; // Set alpha to 0
    }
  }

  await sharp(Buffer.from(pixels), {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(outputImagePath);

  const stats = await sharp(outputImagePath).metadata();
  console.log(`Image saved to ${outputImagePath}`);
  console.log(`  Dimensions: ${stats.width}x${stats.height}`);
  console.log('Done!');
}

convertGeoTiff().catch(console.error);
