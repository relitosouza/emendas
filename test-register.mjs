import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

try {
  console.log('Registering loader...');
  // Simulating the path with spaces if needed, but here we just use the current one
  const loaderUrl = pathToFileURL('C:/projects/PortalEmendas UAT/portal-de-emendas/node_modules/@tailwindcss/node/esm-cache-loader');
  console.log('URL:', loaderUrl.href);
  register(loaderUrl);
  console.log('Success!');
} catch (e) {
  console.error('Failed:', e);
}
