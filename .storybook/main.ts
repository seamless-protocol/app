import type { StorybookConfig } from '@storybook/react-vite';
import path from 'node:path';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    // Add path aliases
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '../src'),
        '@components': path.resolve(__dirname, '../src/components'),
        '@hooks': path.resolve(__dirname, '../src/hooks'),
        '@lib': path.resolve(__dirname, '../src/lib'),
        '@utils': path.resolve(__dirname, '../src/lib/utils'),
        '@constants': path.resolve(__dirname, '../src/lib/constants'),
        '@types': path.resolve(__dirname, '../src/types'),
        '@routes': path.resolve(__dirname, '../src/routes'),
        '@features': path.resolve(__dirname, '../src/features'),
        '@assets': path.resolve(__dirname, '../src/assets'),
      };
    }

    return config;
  },
};
export default config;
