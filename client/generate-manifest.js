import { writeFileSync } from 'fs';
import { config } from 'dotenv';

config();

const hostPermission = `${process.env.VITE_BACKEND_ENDPOINT}/*`;
const appDescription = process.env.VITE_APP_SLOGAN;
const appTitle = process.env.VITE_APP_TITLE;
const buildNumber = process.env.VITE_BUILD_NUMBER || 0;

const manifest = {
  name: appTitle,
  version: `1.1.${buildNumber}`,
  description: appDescription,
  manifest_version: 3,
  author: 'Cefalo https://github.com/Cefalo',
  action: {
    default_popup: 'index.html',
    default_icon: 'favicon-32x32.png',
    default_title: appTitle,
  },
  host_permissions: [hostPermission],
  icons: {
    16: 'favicon-16x16.png',
    32: 'favicon-32x32.png',
    128: 'logo_128.png',
  },
  permissions: ['storage'],
};

writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));
console.log(`Manifest generated with host_permission: ${hostPermission}`);
