export default class ShaderLoader {
    static async loadShader(path) {
        const response = await fetch(path);
        return response.text();
    }
}

