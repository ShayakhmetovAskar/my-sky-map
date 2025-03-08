precision mediump float;

uniform sampler2D uTextures[10];

uniform float uOpacities[10];

uniform int uTextureCount;


varying vec2 vUv;

void main() {
    vec4 finalColor = vec4(0.0);

    
    for (int i = 0; i < 10; i++) {
        if (i >= uTextureCount) break;

        vec4 texColor = texture2D(uTextures[i], vUv);
        finalColor += texColor * uOpacities[i];
    }

    finalColor.a = clamp(finalColor.a, 0.0, 1.0);
    gl_FragColor = finalColor;
}
