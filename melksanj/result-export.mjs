const encoder = new TextEncoder();
const namespaces = {
  svg: 'http://www.w3.org/2000/svg',
  html: 'http://www.w3.org/1999/xhtml'
};

function asDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function rasterize(card, width) {
  const font = await fetch(new URL('./vazirmatn.woff2', import.meta.url));
  if (!font.ok) throw new Error('Result font unavailable');
  const fontData = await asDataUrl(await font.blob());
  await document.fonts.ready;

  const mount = document.createElement('div');
  mount.className = 'exportMount';
  mount.inert = true;
  mount.setAttribute('aria-hidden', 'true');
  mount.style.width = Math.ceil(width) + 'px';
  card.style.cssText = 'position:static;width:100%;margin:0;box-shadow:none;backdrop-filter:none';
  mount.append(card);
  document.body.append(mount);

  let svg;
  let height;
  try {
    width = Math.ceil(card.getBoundingClientRect().width);
    height = Math.ceil(card.getBoundingClientRect().height);
    const snapshot = card.cloneNode(true);
    const sources = [card, ...card.querySelectorAll('*')];
    const copies = [snapshot, ...snapshot.querySelectorAll('*')];
    sources.forEach((node, index) => {
      const style = getComputedStyle(node);
      for (const property of style) {
        if (!property.startsWith('--')) copies[index].style.setProperty(property, style.getPropertyValue(property));
      }
    });
    const container = document.createElementNS(namespaces.html, 'div');
    container.setAttribute('dir', document.documentElement.dir);
    const style = document.createElementNS(namespaces.html, 'style');
    style.textContent = '@font-face{font-family:Vazirmatn;src:url("' + fontData + '") format("woff2");font-weight:100 900}';
    container.append(style, snapshot);
    const root = document.createElementNS(namespaces.svg, 'svg');
    root.setAttribute('width', width);
    root.setAttribute('height', height);
    const foreign = document.createElementNS(namespaces.svg, 'foreignObject');
    foreign.setAttribute('width', '100%');
    foreign.setAttribute('height', '100%');
    foreign.append(container);
    root.append(foreign);
    svg = new XMLSerializer().serializeToString(root);
  } finally {
    mount.remove();
  }

  const image = new Image();
  const loaded = new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error('Could not render result card'));
  });
  image.src = await asDataUrl(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  await loaded;
  const scale = Math.min(2.5, 4096 / Math.max(width, height), Math.sqrt(12000000 / (width * height)));
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  if (!ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data[3]) {
    throw new Error('The browser rendered an empty result card');
  }
  return canvas;
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not encode result image')), type, quality);
  });
}

// Embed the same rasterized card in a PDF sized to keep it on one page.
async function resultPdf(canvas) {
  const image = new Uint8Array(await (await canvasBlob(canvas, 'image/jpeg', 0.96)).arrayBuffer());
  const scale = Math.min(1, 560 / canvas.width, 14000 / canvas.height);
  const width = (canvas.width * scale).toFixed(2);
  const height = (canvas.height * scale).toFixed(2);
  const commands = `q ${width} 0 0 ${height} 18 18 cm /Card Do Q\n`;
  const chunks = [];
  const offsets = [0];
  let length = 0;
  const append = data => {
    const bytes = typeof data === 'string' ? encoder.encode(data) : data;
    chunks.push(bytes);
    length += bytes.length;
  };
  const object = (...parts) => {
    offsets.push(length);
    append(`${offsets.length - 1} 0 obj\n`);
    parts.forEach(append);
    append('\nendobj\n');
  };
  append('%PDF-1.4\n');
  object('<< /Type /Catalog /Pages 2 0 R >>');
  object('<< /Type /Pages /Count 1 /Kids [3 0 R] >>');
  object(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${Number(width) + 36} ${Number(height) + 36}] /Resources << /XObject << /Card 4 0 R >> >> /Contents 5 0 R >>`);
  object(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`, image, '\nendstream');
  object(`<< /Length ${commands.length} >>\nstream\n`, commands, 'endstream');
  const xref = length;
  append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  offsets.slice(1).forEach(offset => append(`${String(offset).padStart(10, '0')} 00000 n \n`));
  append(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks, { type: 'application/pdf' });
}

export async function downloadResult(card, { width, format }) {
  const canvas = await rasterize(card, width);
  if (format === 'pdf') {
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const blob = format === 'pdf' ? await resultPdf(canvas) : await canvasBlob(canvas, 'image/png');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `melksanj-result.${format}`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 60000);
}
