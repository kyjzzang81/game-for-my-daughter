/* 생성한 이미지 다듬기
   - 투명한 픽셀의 색이 검정이면, 게임에서 줄여 그릴 때 가장자리에 검은 테두리가 비쳐요.
     그래서 가장자리 색을 투명 영역까지 번지게(color bleed) 해 둬요.
   - 거의 투명한 먼지 같은 픽셀은 지우고, 빈 여백은 잘라서 크기를 맞추기 쉽게 해요.
   - 게임에서 쓰는 크기의 약 2배로 미리 줄여서, 화면에서 많이 줄일 때 생기는 거친 가장자리를 막아요. */
import sharp from 'sharp';

export async function cleanSprite(input, maxSide) {
  let { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;

  // 1) 알파 정리: 거의 투명 → 투명, 거의 불투명 → 불투명.
  //    생성 이미지 맨 바깥 1~2줄에 반투명 선이 끼어 있을 때가 있어서 가장자리 4px은 비워요
  const edge = 4;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const a = x < edge || y < edge || x >= w - edge || y >= h - edge ? 0 : data[i + 3];
    data[i + 3] = a < 12 ? 0 : a > 245 ? 255 : a;
    if (data[i + 3]) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  }
  if (maxX < 0) throw new Error('이미지가 모두 투명해요');

  // 2) 빈 여백 자르기 (가장자리 번짐용으로 조금 남겨요)
  const pad = 8;
  const left = Math.max(0, minX - pad), top = Math.max(0, minY - pad);
  const cw = Math.min(w, maxX + pad + 1) - left, ch = Math.min(h, maxY + pad + 1) - top;
  let img = sharp(data, { raw: info }).extract({ left, top, width: cw, height: ch });

  // 3) 줄이기 (sharp는 알파를 고려해서 줄여요)
  if (Math.max(cw, ch) > maxSide) img = img.resize({ width: cw >= ch ? maxSide : undefined, height: ch > cw ? maxSide : undefined, kernel: 'lanczos3' });
  ({ data, info } = await img.raw().toBuffer({ resolveWithObject: true }));

  // 4) 가장자리 색 번지기: 투명 픽셀에 옆 픽셀 색을 몇 겹 채워요 (알파는 그대로 0)
  const W2 = info.width, H2 = info.height;
  let filled = new Uint8Array(W2 * H2);
  for (let p = 0; p < W2 * H2; p++) filled[p] = data[p * 4 + 3] > 0 ? 1 : 0;
  for (let pass = 0; pass < 6; pass++) {
    const next = filled.slice();
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
      const p = y * W2 + x;
      if (filled[p]) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W2 || ny >= H2) continue;
        const q = ny * W2 + nx;
        if (!filled[q]) continue;
        r += data[q * 4]; g += data[q * 4 + 1]; b += data[q * 4 + 2]; n++;
      }
      if (n) { data[p * 4] = r / n; data[p * 4 + 1] = g / n; data[p * 4 + 2] = b / n; next[p] = 1; }
    }
    filled = next;
  }
  return sharp(data, { raw: info }).png({ compressionLevel: 9 }).toBuffer();
}

/* 배경: 게임 화면(1280×720)에 꽉 차게 잘라서 jpg로 */
export async function cleanBackground(input) {
  return sharp(input).resize(1280, 720, { fit: 'cover', position: 'centre', kernel: 'lanczos3' }).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
}
