/**
 * generateQRCode(container, text, options)
 * Uses QRCode.js (global QRCode) to render to a DOM element.
 */
export function generateQRCode(container, text = '', options = {}){
  container.innerHTML = '';
  const size = options.size || 200;
  const color = options.color || '#000000';
  // QRCode.js writes an img or table; prefer canvas by using default.
  const q = new QRCode(container, {
    text: text,
    width: size,
    height: size,
    colorDark: color,
    colorLight: options.background || '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
  return q;
}
