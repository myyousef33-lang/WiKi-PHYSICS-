import sharp from 'sharp';
import path from 'path';

const dir = './public/images/accessories';

async function processAll() {
  // 1. Graduation Cap
  {
    const img = sharp(path.join(dir, 'real_grad_cap.jpg'));
    const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const buf = Buffer.from(data);
    for (let i = 0; i < buf.length; i += info.channels) {
      const r = buf[i], g = buf[i+1], b = buf[i+2];
      if (r > 235 && g > 235 && b > 235) {
        buf[i+3] = 0;
      } else if (r > 215 && g > 215 && b > 215 && Math.abs(r-g) < 10 && Math.abs(g-b) < 10) {
        buf[i+3] = Math.max(0, Math.floor((235 - Math.max(r,g,b)) / 20 * 255));
      }
    }
    await sharp(buf, { raw: info }).trim().png().toFile(path.join(dir, 'real_grad_cap.png'));
    console.log('Processed real_grad_cap.png');
  }

  // 2. Gold Crown
  {
    const img = sharp(path.join(dir, 'real_gold_crown.jpg'));
    const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const buf = Buffer.from(data);
    for (let i = 0; i < buf.length; i += info.channels) {
      const r = buf[i], g = buf[i+1], b = buf[i+2];
      if (r > 230 && g > 230 && b > 230) {
        buf[i+3] = 0;
      } else if (r > 210 && g > 210 && b > 210 && Math.abs(r-g) < 15 && Math.abs(g-b) < 15) {
        buf[i+3] = Math.max(0, Math.floor((230 - Math.max(r,g,b)) / 20 * 255));
      }
    }
    await sharp(buf, { raw: info }).trim().png().toFile(path.join(dir, 'real_gold_crown.png'));
    console.log('Processed real_gold_crown.png');
  }

  // 3. Smart Glasses (Make inside lenses semi-transparent with slight cyan tint, and outside background 100% transparent)
  {
    const img = sharp(path.join(dir, 'real_smart_glasses.jpg'));
    const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const buf = Buffer.from(data);
    for (let i = 0; i < buf.length; i += info.channels) {
      const r = buf[i], g = buf[i+1], b = buf[i+2];
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const diff = maxC - minC;

      // Outer pure white background or inner white glass
      if (r > 230 && g > 230 && b > 230 && diff < 15) {
        buf[i+3] = 0; // completely clear glass / background
      } else if (r > 200 && g > 200 && b > 200 && diff < 15) {
        buf[i+3] = Math.floor((230 - maxC) / 30 * 180);
      }
    }
    await sharp(buf, { raw: info }).trim().png().toFile(path.join(dir, 'real_smart_glasses.png'));
    console.log('Processed real_smart_glasses.png');
  }

  // 4. Physics Medal
  {
    const img = sharp(path.join(dir, 'real_physics_medal.jpg'));
    const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const buf = Buffer.from(data);
    for (let i = 0; i < buf.length; i += info.channels) {
      const r = buf[i], g = buf[i+1], b = buf[i+2];
      if (r > 235 && g > 235 && b > 235) {
        buf[i+3] = 0;
      } else if (r > 215 && g > 215 && b > 215 && Math.abs(r-g) < 10 && Math.abs(g-b) < 10) {
        buf[i+3] = Math.max(0, Math.floor((235 - Math.max(r,g,b)) / 20 * 255));
      }
    }
    await sharp(buf, { raw: info }).trim().png().toFile(path.join(dir, 'real_physics_medal.png'));
    console.log('Processed real_physics_medal.png');
  }

  // 5. Physics Hoodie
  {
    const img = sharp(path.join(dir, 'real_physics_hoodie.jpg'));
    const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const buf = Buffer.from(data);
    for (let i = 0; i < buf.length; i += info.channels) {
      const r = buf[i], g = buf[i+1], b = buf[i+2];
      if (r > 235 && g > 235 && b > 235) {
        buf[i+3] = 0;
      } else if (r > 215 && g > 215 && b > 215 && Math.abs(r-g) < 10 && Math.abs(g-b) < 10) {
        buf[i+3] = Math.max(0, Math.floor((235 - Math.max(r,g,b)) / 20 * 255));
      }
    }
    await sharp(buf, { raw: info }).trim().png().toFile(path.join(dir, 'real_physics_hoodie.png'));
    console.log('Processed real_physics_hoodie.png');
  }
}

processAll().catch(console.error);
