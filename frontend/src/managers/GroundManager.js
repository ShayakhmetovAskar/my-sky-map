import * as THREE from 'three';

class GroundManager {
    constructor(scene, radius = 10, color = 0x003300, opacity = 1) {
        this.scene = scene;
        this.radius = radius;
        this.color = color;
        this.opacity = opacity;
        this.groundMesh = null;

        // Создаём полусферу
        this.createGroundHemisphere();
    }

    createGroundHemisphere() {
        // phiStart = 0, phiLength = 2π (полный оборот вокруг оси Y)
        // thetaStart = π/2, thetaLength = π/2 (нижняя полусфера)
        const geometry = new THREE.SphereGeometry(
            this.radius,
            64,
            64,
            0,                // phiStart
            Math.PI * 2,      // phiLength
            Math.PI / 2,      // thetaStart
            Math.PI / 2       // thetaLength
        );

        const material = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: this.opacity,
            side: THREE.DoubleSide,
            depthTest: false,
        });

        this.groundMesh = new THREE.Mesh(geometry, material);
        this.groundMesh.renderOrder = 10000000;
        this.scene.add(this.groundMesh);
    }


    setOpacity(newOpacity) {
        if (this.groundMesh) {
            this.groundMesh.material.opacity = newOpacity;
        }
    }


    setVisible(isVisible) {
        if (this.groundMesh) {
            this.groundMesh.visible = isVisible;
        }
    }


    dispose() {
        if (this.groundMesh) {
            this.scene.remove(this.groundMesh);
            this.groundMesh.geometry.dispose();
            this.groundMesh.material.dispose();
            this.groundMesh = null;
        }
    }
}

export default GroundManager;
