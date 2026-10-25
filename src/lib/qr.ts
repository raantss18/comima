/**
 * QR code en SVG (généré au build, rien à charger côté navigateur). Vert très foncé sur blanc :
 * contraste maximal, lisible même sur un écran ancien ou une affiche imprimée.
 */
import QRCode from 'qrcode';

export async function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#0f3d1b', light: '#ffffff' },
  });
}
