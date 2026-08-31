export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["\"Poppins\"", "sans-serif"],
        body: ["\"Inter\"", "sans-serif"]
      },
      colors: {
        navy: "#071A33",
        navySoft: "#0B2447",
        navyLight: "#0E2E5C",
        primary: "#1155CC",
        primaryLight: "#3B82F6",
        danger: "#E71D2B",
        gold: "#F2B84B",
        muted: "#8494AD"
      },
      boxShadow: {
        card: "0 20px 50px rgba(0,0,0,0.35)",
        glow: "0 0 0 4px rgba(17,85,204,0.18)",
        glowRed: "0 0 0 4px rgba(231,29,43,0.15)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};
