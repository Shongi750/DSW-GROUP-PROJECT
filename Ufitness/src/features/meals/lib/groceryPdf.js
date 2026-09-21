function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pdfSafe(value) {
  return String(value || '')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[×]/g, 'x')
    .replace(/[·]/g, '-')
    .replace(/[^\x20-\x7E]/g, '?');
}

function encodePdf(value) {
  return pdfSafe(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrap(value, maxChars) {
  const words = pdfSafe(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars) {
      if (current) lines.push(current);
      current = word.length > maxChars ? word.slice(0, maxChars) : word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

export function groceryListHtml({ title, subtitle, rows, total, footer }) {
  const body = rows
    .map(
      (row) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${escapeHtml(row.name)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${escapeHtml(row.store)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${escapeHtml(row.price)}</td>
      </tr>`
    )
    .join('');

  return `<html>
    <head>
      <meta charset="utf-8" />
      <style>
        @page { margin: 24px; }
        body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #171717; }
        h1 { margin: 0 0 4px; font-size: 22px; }
        p { margin: 0 0 18px; color: #8A8A8E; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th { text-align: left; color: #8A8A8E; font-size: 11px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
        th:last-child, td:last-child { text-align: right; }
        .total { margin-top: 16px; font-size: 16px; font-weight: 700; color: #C45A16; }
        .foot { margin-top: 16px; color: #8A8A8E; font-size: 11px; line-height: 16px; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(subtitle)}</p>
      <table>
        <thead><tr><th>Item</th><th>Where</th><th>Price</th></tr></thead>
        <tbody>${body}</tbody>
      </table>
      <p class="total">Total ${escapeHtml(total)}</p>
      <p class="foot">${escapeHtml(footer)}</p>
    </body>
  </html>`;
}

export function buildGroceryPdf({ title, subtitle, rows, total, footer }) {
  const pageW = 595;
  const pageH = 842;
  const margin = 48;
  const lineH = 15;
  const pages = [];
  let commands = [];
  let y = pageH - margin;

  const flush = () => {
    pages.push(commands.join('\n'));
    commands = [];
    y = pageH - margin;
  };

  const text = (value, x, yPos, size, color = '0 0 0') => {
    commands.push('BT');
    commands.push(`${color} rg`);
    commands.push(`/F1 ${size} Tf`);
    commands.push(`1 0 0 1 ${x.toFixed(2)} ${yPos.toFixed(2)} Tm`);
    commands.push(`(${encodePdf(value)}) Tj`);
    commands.push('ET');
  };

  const rule = (yPos) => {
    commands.push('0.9 0.9 0.9 RG');
    commands.push('0.6 w');
    commands.push(`${margin} ${yPos.toFixed(2)} m ${pageW - margin} ${yPos.toFixed(2)} l S`);
  };

  const header = () => {
    text(title, margin, y, 18);
    y -= 20;
    wrap(subtitle, 86).forEach((line) => {
      text(line, margin, y, 10, '0.54 0.54 0.56');
      y -= 13;
    });
    y -= 10;
    text('Item', margin, y, 9, '0.54 0.54 0.56');
    text('Where', 330, y, 9, '0.54 0.54 0.56');
    text('Price', 500, y, 9, '0.54 0.54 0.56');
    y -= 8;
    rule(y);
    y -= 16;
  };

  header();

  rows.forEach((row) => {
    const nameLines = wrap(row.name, 40);
    const storeLines = wrap(row.store, 22);
    const height = Math.max(nameLines.length, storeLines.length) * lineH + 4;
    if (y - height < margin + 70) {
      flush();
      header();
    }
    const top = y;
    nameLines.forEach((line, index) => text(line, margin, top - index * lineH, 11));
    storeLines.forEach((line, index) => text(line, 330, top - index * lineH, 10, '0.54 0.54 0.56'));
    text(row.price, 490, top, 11);
    y = top - height;
  });

  if (y < margin + 70) {
    flush();
    header();
  }
  y -= 4;
  rule(y);
  y -= 22;
  text('Total', margin, y, 13);
  text(total, 480, y, 13);
  y -= 26;
  wrap(footer, 86).forEach((line) => {
    if (y < margin) {
      flush();
      y = pageH - margin;
    }
    text(line, margin, y, 9, '0.54 0.54 0.56');
    y -= 12;
  });
  flush();

  const objects = [];
  const catalogId = 1;
  const pagesId = 2;
  const fontId = 3;
  const pageIds = [];

  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[fontId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  pages.forEach((content) => {
    const pageId = objects.length;
    const contentId = pageId + 1;
    while (objects.length < pageId) objects.push('');
    pageIds.push(pageId);
    objects[pageId] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`;
    objects[contentId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  });

  objects[pagesId] = `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`;

  let out = '%PDF-1.4\n';
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = out.length;
    out += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefAt = out.length;
  out += `xref\n0 ${objects.length}\n`;
  out += '0000000000 65535 f \n';
  for (let id = 1; id < objects.length; id += 1) {
    out += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

export function downloadPdfBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
