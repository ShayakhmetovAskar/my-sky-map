/**
 * DSS tile shader — desaturates dark areas to hide color calibration artifacts.
 *
 * DSS tiles have brown/blue artifacts in dark sky regions due to photometric
 * plate mismatches. This shader keeps bright objects (nebulae, stars) colorful
 * while reducing saturation in dark areas where artifacts live.
 */

export const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const fragmentShader = `
    uniform sampler2D map;
    uniform vec2 mapOffset;
    uniform vec2 mapRepeat;
    // SPIKE APO-80: user HiPS layer drawn on the same tile mesh
    uniform sampler2D userMap;
    uniform vec2 userOffset;
    uniform vec2 userRepeat;
    uniform float userOpacity;
    uniform float hasUser;
    varying vec2 vUv;

    void main() {
        // Apply texture offset/repeat (for parent tile sub-regions)
        vec2 transformedUv = vUv * mapRepeat + mapOffset;
        vec4 tex = texture2D(map, transformedUv);

        float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));

        // Saturation curve:
        // dark (lum < 0.15): low saturation to hide DSS color artifacts
        // mid/bright (lum > 0.15): capped saturation to avoid oversaturation
        float threshold = 0.15;
        float t = smoothstep(0.0, threshold, lum);
        float saturation = mix(0.25, 0.5, t);

        vec3 gray = vec3(lum);
        vec3 color = mix(gray, tex.rgb, saturation);

        // SPIKE APO-80: user photo over the (desaturated) DSS, straight alpha
        if (hasUser > 0.5) {
            vec4 usr = texture2D(userMap, vUv * userRepeat + userOffset);
            color = mix(color, usr.rgb, usr.a * userOpacity);
        }

        gl_FragColor = vec4(color, tex.a);
    }
`;
