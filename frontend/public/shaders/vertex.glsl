varying vec2 vUv;

void main() {
    vUv = vec2((position.xy + 1.0) / 2.0); // UV-координаты для текстуры
    gl_Position = vec4(position.xy, 0.0, 1.0); // Прямоугольник на экране
}   