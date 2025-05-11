/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/entrypoints/**/*.{js,ts,jsx,tsx,html}',
        './src/assets/**/*.{js,ts,jsx,tsx,html}',
        './src/components/**/*.{js,ts,jsx,tsx,html}',
    ],
    theme: {
        extend: {
            animation: {
                'spin-slow': 'spin 20s linear infinite',
            },
        },
    },
    darkMode: 'media',
    plugins: [],
};
