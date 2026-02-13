/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./client/**/*.{html,js}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
