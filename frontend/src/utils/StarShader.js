import * as THREE from "three";
import {ShaderMaterial} from "three";

export const createStarMaterial = () => {
    return new ShaderMaterial({
        uniforms: {
            color: {value: new THREE.Color(0xffffff)},
            fov: {value: 120.0},
        },
        vertexShader: `
      attribute float vmag;
      uniform float fov; 
      varying float vAlpha;
      
      float vmag2size(float vmag) {
        float a = 7.76;
        float b = 0.3;
        float c = 0.0;
        float d;
        if (fov < 17.0) {
            d = 0.2 * exp(-(0.2 * fov -4.0)) + 2.9;
            //d = -0.7 * fov + 9.33;
        } else {
            d = 4.0 * (1.0 - fov/120.0);
        }
        return min(25.0, a * exp(-b * (vmag - d)) + c);
      }
          
      void main() {
        vAlpha = 1.0;
        float scale = 1.0;
        float size = vmag2size(vmag);
        if (size < 1.5) { //TODO make fov dependence
            gl_PointSize = 0.0;
            return;
        }
        if (size < 4.0) {
            vAlpha = 0.4 * size - 0.6;
        }
        gl_PointSize = size / scale;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: `
      uniform vec3 color;
      varying float vAlpha;
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5); // Центрирование координат в [0, 0]
        float dist = length(coord); // Расстояние от центра
        if (dist > 0.5) {
          discard; // Удаляем пиксели за пределами диска
        }
        float alpha = 1.0 - smoothstep(0.4, 0.5, dist); // Плавный переход к краям диска
        gl_FragColor = vec4(color, alpha * vAlpha);
      }
    `,
        transparent: true,
    });
};
