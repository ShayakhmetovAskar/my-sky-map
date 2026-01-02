import {fileURLToPath, URL} from 'node:url';
import {defineConfig, loadEnv} from 'vite';
import stringPlugin from 'vite-plugin-string';
import vue from '@vitejs/plugin-vue';
// import vueDevTools from 'vite-plugin-vue-devtools'; // временно отключен из-за проблем с localStorage

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            vue(),
            // vueDevTools() временно отключен из-за проблем с localStorage
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
                },
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
        },
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        }
    };
});
