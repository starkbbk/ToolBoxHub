/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Handle standard Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
      };

      // Handle 'node:' prefixed modules specifically
      config.resolve.alias = {
        ...config.resolve.alias,
        "node:fs": false,
        "node:path": false,
        "node:os": false,
        "node:crypto": false,
        "node:stream": false,
        "node:http": false,
        "node:https": false,
        "node:zlib": false,
      };

      // Strip 'node:' prefix from imports to prevent UnhandledSchemeError
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );
    }
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
