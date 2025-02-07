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
  key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAstDgQFGfJrfxo3id/1KTHVZpKbsCRMKZJXDUsDT8JRfasB/CeDGmuVs1hFYBJcGgn9PbK/mnE9hzWERVFpa4sfGZ3o0lvyfPLUfJd7PmfZ/4PQvE4+GfVQPAz/p4OVtP1WtbN4DED3jmrXiSrZ72paioz/ydVOSRDfo8m3+s9K92LcraYXHItvs+rSKXgfKxflfGzByme/fVO2V4yvE6T0YOqdLDc2USF4KGx0llHvqnmtB2K+rLr3V1/UcM1b4fP6kCiZAo7K2Tngpqa8DxgLVp8GYZ7NPPFJqu4tG1G1iRjtwk8Qblqmw+jmH+qZ2WguGtFpxU7P2JD8znPu//OwIDAQAB',
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
  permissions: ['identity', 'storage'],
};

writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));
console.log(`Manifest generated with host_permission: ${hostPermission}`);
