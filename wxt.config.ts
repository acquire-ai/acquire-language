/**
 * Acquire Language WXT Configuration File
 */
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
    srcDir: 'src',
    // Use Chrome extension API
    extensionApi: 'chrome',

    // Use React module
    modules: ['@wxt-dev/module-react'],

    // Add static resource configuration to ensure files in public directory are copied to build output
    publicDir: 'public',

    // Extension manifest configuration
    manifest: {
        // Extension name
        name: 'Acquire Language',

        // Extension description
        description: 'Learn foreign languages while watching videos',

        // Version number
        version: '0.0.1',
        permissions: ['storage', 'webRequest', 'tabs'],
        host_permissions: ['*://*.youtube.com/*'],
        web_accessible_resources: [
            {
                resources: ['icon/*.png'],
                matches: ['<all_urls>'],
            },
            {
                resources: ['assets/*.css', 'content-scripts/*.css'],
                matches: ['<all_urls>'],
            },
        ],

        options_page: null,
        options_ui: null,
    },
});
