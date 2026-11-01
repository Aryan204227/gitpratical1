import fs from 'fs';
import path from 'path';

const outDir = path.resolve('stitch_screens');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const baseDir = 'C:\\Users\\ayush\\.gemini\\antigravity-ide\\brain\\3d80a4af-1bd8-4bcf-a7e2-f8909e8c7652\\.system_generated\\steps';

const screens = [
  {
    prefix: '1_clubpulse_home',
    title: 'ClubPulse — Home',
    id: '8e9659080a8f46269f9390908ae5205f',
    htmlStep: 205,
    imgStep: 213,
  },
  {
    prefix: '2_student_dashboard',
    title: 'Student Dashboard — Alex Rivera',
    id: 'd42dcfe0251146a88d7c9280fd587502',
    htmlStep: 217,
    imgStep: 219,
  },
  {
    prefix: '3_leader_dashboard',
    title: 'Leader Dashboard — ACM President',
    id: 'cdb2199626d647b7bb3c4fc893bb3906',
    htmlStep: 221,
    imgStep: 223,
  },
  {
    prefix: '4_dean_audit_console',
    title: 'Dean Audit Console — Prof. Marcus Vance',
    id: 'dcbc8e7745ea4885b972270652d2b779',
    htmlStep: 225,
    imgStep: 227,
  },
];

for (const screen of screens) {
  // Read HTML
  const htmlFilePath = path.join(baseDir, String(screen.htmlStep), 'output.txt');
  const htmlRaw = fs.readFileSync(htmlFilePath, 'utf8');
  const htmlJson = JSON.parse(htmlRaw);
  const outHtmlPath = path.join(outDir, `${screen.prefix}.html`);
  fs.writeFileSync(outHtmlPath, htmlJson.html, 'utf8');
  console.log(`Saved HTML: ${outHtmlPath} (${(htmlJson.html.length / 1024).toFixed(1)} KB)`);

  // Read Screenshot
  const imgFilePath = path.join(baseDir, String(screen.imgStep), 'output.txt');
  const imgRaw = fs.readFileSync(imgFilePath, 'utf8');
  const imgJson = JSON.parse(imgRaw);
  const imgBuffer = Buffer.from(imgJson.image, 'base64');
  const outImgPath = path.join(outDir, `${screen.prefix}.png`);
  fs.writeFileSync(outImgPath, imgBuffer);
  console.log(`Saved Image: ${outImgPath} (${(imgBuffer.length / 1024).toFixed(1)} KB)`);
}

console.log('All screens and images extracted successfully!');
