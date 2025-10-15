const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const QRS_DIR = path.join(__dirname, '..', 'qrcodes');

function ensureDir() {
    if (!fs.existsSync(QRS_DIR)) fs.mkdirSync(QRS_DIR, { recursive: true });

}

async function generateQrPng({ filename, url }) {
    ensureDir();
    const filePath = path.join(QRS_DIR, filename);
    await QRCode.toFile(filePath, url, {
         type: 'png',
         width: 512, 
         errorCorrectionLevel: 'H',
         margin: 1,
         color: { dark: '#000000', light: '#FFFFFF' }
     });
    return filePath;
}

module.exports = { generateQrPng, QRS_DIR };