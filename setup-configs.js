const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Ensure directories
['src/app', 'src/components', 'src/lib', 'public/uploads', 'scripts'].forEach(ensureDir);

// 1. tsconfig.json
fs.writeFileSync('tsconfig.json', JSON.stringify({
  compilerOptions: {
    lib: ["dom", "dom.iterable", "esnext"],
    allowJs: true,
    skipLibCheck: true,
    strict: false,
    noEmit: true,
    esModuleInterop: true,
    module: "esnext",
    moduleResolution: "bundler",
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: "preserve",
    incremental: true,
    plugins: [{ name: "next" }],
    paths: { "@/*": ["./src/*"] }
  },
  include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  exclude: ["node_modules"]
}, null, 2));

// 2. postcss.config.js
fs.writeFileSync('postcss.config.js', 'module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };\n');

// 3. tailwind.config.js
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        cream: {
          50: '#fdfcfb',
          100: '#fbfbf8',
          200: '#f7f6f0',
          300: '#efece1',
          400: '#dfd9c5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};`;
fs.writeFileSync('tailwind.config.js', tailwindConfig);

// 4. next.config.js
const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  }
};
module.exports = nextConfig;`;
fs.writeFileSync('next.config.js', nextConfig);

// 5. .env.local
fs.writeFileSync('.env.local', `JWT_SECRET=mifthahul_uloom_secure_jwt_secret_key_2026_madrassa
MADRASSA_NAME="Mifthahul Uloom Higher Secondary Madrassa"
DATABASE_URL="file:./madrassa.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
`);

console.log('Setup basic configs generated successfully!');
