/** @type {import('tailwindcss').Config} */
export default {
    content: ['./entrypoints/**/*.{js,ts,jsx,tsx,html}', './assets/**/*.{js,ts,jsx,tsx,html}'],
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
