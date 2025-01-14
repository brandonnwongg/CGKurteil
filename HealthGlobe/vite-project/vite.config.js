import vitePluginString from 'vite-plugin-string'
import glsl from 'vite-plugin-glsl';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        vitePluginString(),
        glsl()
    ]
});