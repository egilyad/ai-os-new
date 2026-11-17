import { build } from 'vite';

process.env.VITE_BUNDLE_ANALYZE = '1';

await build({ logLevel: 'info' });
