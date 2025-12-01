/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mazda: ['MazdaType', 'sans-serif'],
        gizmo: ['SS Gizmo', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
