import { defineConfig } from '@pandacss/dev';
import { createPreset } from '@park-ui/panda-preset';
import teal from '@park-ui/panda-preset/colors/teal';
import neutral from '@park-ui/panda-preset/colors/neutral';
import amber from '@park-ui/panda-preset/colors/amber';
import blue from '@park-ui/panda-preset/colors/blue';

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

  theme: {
    extend: {
      tokens: {
        colors: {
          amber: amber.tokens,
          blue: blue.tokens,
        },
      },
      semanticTokens: {
        colors: {
          amber: amber.semanticTokens,
          blue: blue.semanticTokens,
        },
      },
    },
  },

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  // The output directory for your css system
  outdir: 'styled-system',

  jsxFramework: 'react',
});
