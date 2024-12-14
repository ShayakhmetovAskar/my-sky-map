import Papa from "papaparse";
import * as THREE from "three";

export async function loadCSV(filePath) {
    return new Promise((resolve, reject) => {
        Papa.parse(filePath, {
            download: true,
            header: true,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error),
        });
    });
}

export async function addStarsToScene(data, scene) {

    const csvData = await this.loadCSV('./data/test.csv');

    const radius = 10;
    const starCount = data.length;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    data.forEach((row, i) => {

        const ra = parseFloat(row.ra) * (Math.PI / 180);
        const de = parseFloat(row.de) * (Math.PI / 180);
        const vmag = parseFloat(row.vmag);


        const [x, y, z] = equatorial_to_cartesian(ra, de);

        positions[i * 3] = radius * x;
        positions[i * 3 + 1] = radius * y;
        positions[i * 3 + 2] = radius * z;

        sizes[i] = vmag;
    });

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starGeometry.setAttribute('vmag', new THREE.Float32BufferAttribute(sizes, 1));

    const stars = new THREE.Points(starGeometry, this.starMaterial);
    scene.add(stars);
}