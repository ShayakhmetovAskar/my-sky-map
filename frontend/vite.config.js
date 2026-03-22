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
                '/api/v1': {
                    target: 'http://localhost:8001',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api\/v1/, ''),
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
