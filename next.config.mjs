// next.config.mjs
export default {
  reactStrictMode: true,
  webpack: (config) => {
    config.externals = [...(config.externals || []), { 'utf-8-validate': 'utf-8-validate' }];
    return config;
  },
  images: {
    domains: ['localhost'],
  },
};
