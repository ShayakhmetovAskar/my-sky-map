import {fileURLToPath, URL} from 'node:url';
import {defineConfig, loadEnv} from 'vite';
import stringPlugin from 'vite-plugin-string';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            vue(),
            vueDevTools(),
            stringPlugin({
                include: [
                    '**/*.glsl',
                ],
            }),
        ],
        server: {
            port: 4000,
            proxy: {
                '/dss': {
                    target: 'https://storage.yandexcloud.net/skymap-static-data',
                    changeOrigin: true,
                },
                '/stars': {
                    target: 'https://storage.yandexcloud.net/skymap-static-data',
                    changeOrigin: true,
                }
            }
        },
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        server: {
            proxy: {
                '/api': {
                    target: 'https://skymapdev.afsh.space',
                    changeOrigin: true,
                    configure: (proxy, options) => {
                        proxy.on('proxyReq', (proxyReq, req) => {
                            console.log(
                                '[proxyReq]',
                                req.method,
                                req.url,
                                '→',
                                options.target
                            )
                        })
                        proxy.on('proxyRes', (proxyRes, req, res) => {
                            console.log(
                                '[proxyRes]',
                                req.url,
                                'status:',
                                proxyRes.statusCode
                            )
                        })
                    }
                }
            }
        }
    };
});
