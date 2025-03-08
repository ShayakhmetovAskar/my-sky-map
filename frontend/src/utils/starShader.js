import * as THREE from "three";
import { ShaderMaterial } from "three";

export const createStarMaterial = () => {
  return new ShaderMaterial({
    uniforms: {
      fov: { value: 120.0 },
      planetVmag: { value: -1000 },
    },
    vertexShader: `
      attribute float vmag;
      attribute vec3 color;

      uniform float planetVmag; //hack for planet glow effect  

      uniform float fov; 
      varying float vAlpha;
      varying float size;
      varying vec3 vColor; 
      
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
        return min(22.0, a * exp(-b * (vmag - d)) + c);
      }
          
      void main() {
        vColor = color;
        vAlpha = 1.0;
        float scale = 1.0;

        if (planetVmag > -999.0) {
          size = vmag2size(planetVmag);
        } else {
          size = vmag2size(vmag);
        }
        
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
varying vec3 vColor;
varying float vAlpha;
varying float size;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);

  // Вместо discard – плавно уменьшаем альфу до 0
  float alpha = 1.0 - smoothstep(0.45, 0.55, dist);

  // Можно добавить экспоненциальный градиент для еще более плавного затухания:
  float radialGradient = 1.0;
  alpha *= radialGradient;

  gl_FragColor = vec4(vColor, alpha * vAlpha);
}

    `,
    transparent: true,
    blending: THREE.AdditiveBlending,

  });
};
