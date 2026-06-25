import { defineConfig } from '@pandacss/dev';
import { createPreset } from '@park-ui/panda-preset';
import teal from '@park-ui/panda-preset/colors/teal';
import neutral from '@park-ui/panda-preset/colors/neutral';

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  presets: [
    '@pandacss/preset-base',
    createPreset({
      accentColor: teal,
      grayColor: neutral,
      radius: 'md',
    }),
  ],

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  // The output directory for your css system
  outdir: 'styled-system',

  jsxFramework: 'react',
});
