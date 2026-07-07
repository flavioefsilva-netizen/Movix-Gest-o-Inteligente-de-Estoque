import type {NextConfig} from 'next';

const nextConfig: any = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  transpilePackages: ['motion'],
  webpack: (config: any, {dev, isServer, webpack}: any) => {
    // Prevent webpack from resolving server-side node modules in the browser bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        https: false,
        http: false,
        path: false,
        stream: false,
        zlib: false,
        crypto: false,
      };

      // Rewrite 'node:*' imports to remove the 'node:' prefix so fallback targets can pick them up
      if (webpack) {
        config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: any) => {
            resource.request = resource.request.replace(/^node:/, '');
          })
        );
      }
    }
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
