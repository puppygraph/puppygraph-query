/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        "puppy-purple": "#5e2f76",
        "puppy-dark": "#3f3261",
        "puppy-yellow": "#f1c159",
        "puppy-jade": "#63b7b2",
        "puppy-gray": "#dedede"
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
