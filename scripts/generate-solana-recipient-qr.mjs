import { writeFileSync } from "node:fs";

const recipient = "HMmUVQx6ToGQa8Fnd6aicHhpF1ti9QrzqNNC8187Y4s1";
const outputPath = new URL("../public/assets/solana-usdc-recipient-qr.svg", import.meta.url);

const version = 3;
const size = 21 + (version - 1) * 4;
const dataCodewords = 55;
const errorCodewords = 15;
const mask = 2;
const matrix = Array.from({ length: size }, () => Array(size).fill(false));
const reserved = Array.from({ length: size }, () => Array(size).fill(false));

function setModule(row, col, dark, isReserved = true) {
  if (row < 0 || col < 0 || row >= size || col >= size) return;
  matrix[row][col] = Boolean(dark);
  reserved[row][col] = isReserved;
}

function appendBits(buffer, value, length) {
  for (let bit = length - 1; bit >= 0; bit -= 1) {
    buffer.push((value >>> bit) & 1);
  }
}

function bytesFromString(text) {
  return Array.from(new TextEncoder().encode(text));
}

function buildDataCodewords(text) {
  const bits = [];
  const bytes = bytesFromString(text);

  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  for (const byte of bytes) appendBits(bits, byte, 8);

  appendBits(bits, 0, Math.min(4, dataCodewords * 8 - bits.length));
  while (bits.length % 8) bits.push(0);

  const codewords = [];
  for (let index = 0; index < bits.length; index += 8) {
    codewords.push(bits.slice(index, index + 8).reduce((value, bit) => (value << 1) | bit, 0));
  }

  for (let pad = 0; codewords.length < dataCodewords; pad += 1) {
    codewords.push(pad % 2 === 0 ? 0xec : 0x11);
  }

  return codewords;
}

function buildGaloisTables() {
  const exp = Array(512).fill(0);
  const log = Array(256).fill(0);
  let value = 1;

  for (let index = 0; index < 255; index += 1) {
    exp[index] = value;
    log[value] = index;
    value <<= 1;
    if (value & 0x100) value ^= 0x11d;
  }

  for (let index = 255; index < 512; index += 1) exp[index] = exp[index - 255];
  return { exp, log };
}

const gf = buildGaloisTables();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return gf.exp[gf.log[a] + gf.log[b]];
}

function polyMultiply(left, right) {
  const result = Array(left.length + right.length - 1).fill(0);
  for (let i = 0; i < left.length; i += 1) {
    for (let j = 0; j < right.length; j += 1) {
      result[i + j] ^= gfMul(left[i], right[j]);
    }
  }
  return result;
}

function reedSolomonGenerator(degree) {
  let poly = [1];
  for (let index = 0; index < degree; index += 1) {
    poly = polyMultiply(poly, [1, gf.exp[index]]);
  }
  return poly;
}

function reedSolomonRemainder(data, degree) {
  const generator = reedSolomonGenerator(degree);
  const remainder = Array(degree).fill(0);

  for (const byte of data) {
    const factor = byte ^ remainder.shift();
    remainder.push(0);

    for (let index = 0; index < degree; index += 1) {
      remainder[index] ^= gfMul(generator[index + 1], factor);
    }
  }

  return remainder;
}

function drawFinder(row, col) {
  for (let y = -1; y <= 7; y += 1) {
    for (let x = -1; x <= 7; x += 1) {
      const moduleRow = row + y;
      const moduleCol = col + x;
      const inFinder = x >= 0 && x <= 6 && y >= 0 && y <= 6;
      const dark = inFinder && (
        x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)
      );
      setModule(moduleRow, moduleCol, dark);
    }
  }
}

function drawAlignment(centerRow, centerCol) {
  for (let y = -2; y <= 2; y += 1) {
    for (let x = -2; x <= 2; x += 1) {
      const dark = Math.max(Math.abs(x), Math.abs(y)) === 2 || (x === 0 && y === 0);
      setModule(centerRow + y, centerCol + x, dark);
    }
  }
}

function drawFunctionPatterns() {
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);
  drawAlignment(22, 22);

  for (let index = 8; index < size - 8; index += 1) {
    const dark = index % 2 === 0;
    if (!reserved[6][index]) setModule(6, index, dark);
    if (!reserved[index][6]) setModule(index, 6, dark);
  }

  setModule(4 * version + 9, 8, true);

  for (let index = 0; index < 9; index += 1) {
    if (!reserved[8][index]) reserved[8][index] = true;
    if (!reserved[index][8]) reserved[index][8] = true;
  }

  for (let index = size - 8; index < size; index += 1) reserved[8][index] = true;
  for (let index = size - 7; index < size; index += 1) reserved[index][8] = true;
}

function maskBit(row, col) {
  return col % 3 === 0;
}

function drawData(codewords) {
  const bits = [];
  for (const codeword of codewords) appendBits(bits, codeword, 8);

  let bitIndex = 0;
  let upward = true;

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;

    for (let offset = 0; offset < size; offset += 1) {
      const row = upward ? size - 1 - offset : offset;

      for (let delta = 0; delta < 2; delta += 1) {
        const x = col - delta;
        if (reserved[row][x]) continue;

        const bit = bitIndex < bits.length ? bits[bitIndex] : 0;
        matrix[row][x] = Boolean(bit) !== maskBit(row, x);
        bitIndex += 1;
      }
    }

    upward = !upward;
  }
}

function bitLength(value) {
  let length = 0;
  while (value) {
    length += 1;
    value >>>= 1;
  }
  return length;
}

function formatBits() {
  const ecLevelL = 0b01;
  const value = (ecLevelL << 3) | mask;
  let data = value << 10;
  const generator = 0x537;

  while (bitLength(data) >= 11) {
    data ^= generator << (bitLength(data) - 11);
  }

  return ((value << 10) | data) ^ 0x5412;
}

function drawFormatBits() {
  const bits = formatBits();
  const get = (index) => ((bits >>> index) & 1) === 1;

  for (let index = 0; index <= 5; index += 1) setModule(8, index, get(index));
  setModule(8, 7, get(6));
  setModule(8, 8, get(7));
  setModule(7, 8, get(8));
  for (let index = 9; index < 15; index += 1) setModule(14 - index, 8, get(index));

  for (let index = 0; index < 8; index += 1) setModule(size - 1 - index, 8, get(index));
  for (let index = 8; index < 15; index += 1) setModule(8, size - 15 + index, get(index));
}

function renderSvg() {
  const quietZone = 4;
  const moduleSize = 8;
  const imageSize = (size + quietZone * 2) * moduleSize;
  const rects = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!matrix[row][col]) continue;
      rects.push(`<rect x="${(col + quietZone) * moduleSize}" y="${(row + quietZone) * moduleSize}" width="${moduleSize}" height="${moduleSize}" />`);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${imageSize} ${imageSize}" role="img" aria-label="Solana USDC recipient QR code">
  <rect width="${imageSize}" height="${imageSize}" rx="18" fill="#efe3c8"/>
  <g fill="#17120c">
    ${rects.join("\n    ")}
  </g>
</svg>
`;
}

const data = buildDataCodewords(recipient);
const codewords = [...data, ...reedSolomonRemainder(data, errorCodewords)];

drawFunctionPatterns();
drawData(codewords);
drawFormatBits();

writeFileSync(outputPath, renderSvg());
console.log(`Wrote ${outputPath.pathname}`);
