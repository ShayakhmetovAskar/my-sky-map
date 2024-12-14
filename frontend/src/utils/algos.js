import * as healpix from "@hscmap/healpix";

export function equatorial_to_cartesian(ra, dec) {
    const x = -Math.cos(dec) * Math.sin(ra);
    const y = Math.sin(dec);
    const z = -Math.cos(dec) * Math.cos(ra);

    return [x, y, z];
}


export function cartesian_to_equatorial(x, y, z) {
    const length = Math.sqrt(x * x + y * y + z * z);
    x /= length;
    y /= length;
    z /= length;

    const dec = Math.asin(y);
    const ra = Math.atan2(x, z) + Math.PI;


    return [ra, dec];
}


export function equatorial_to_heal_ang(ra, dec) {
    const theta = dec + Math.PI / 2;
    const phi = ra;

    return [theta, phi];
}


export function getVisiblePixels(cameraDirection, cameraFov) {
    const fov = cameraFov
    let fov_rad = fov / 180 * Math.PI / 4;
    if (fov_rad > Math.PI / 2) {
        fov_rad = Math.PI / 2;
    }

    const [ra, dec] = cartesian_to_equatorial(...cameraDirection);
    const [theta, phi] = equatorial_to_heal_ang(ra, dec);

    const fovThresholds = [120, 70, 60, 30, 15, 10, 7, 6, 4, 3, 0, 0];
    //                               0-6  7   8   9   10  11 12 13 14 15 16  17
    const visiblePixels = new Set();

    for (let ipix = 0; ipix < 12; ipix++) {
        visiblePixels.add([1, ipix]);
    }

    for (let nside = 2; Math.log2(nside) <= 10; nside *= 2) {
        if (fov > fovThresholds[Math.log2(nside)]) {
            break;
        }
        const pixels = new Set();
        healpix.query_disc_inclusive_nest(nside, healpix.ang2vec(theta, phi), fov_rad, (ipix) => {
            pixels.add(ipix);
        });
        for (let ipix of pixels) {
            visiblePixels.add([nside, ipix]);
        }
    }
    return visiblePixels;
}

export function prepareStarsGeometry(stars_data) {
    const starCount = stars_data.length;
    const positions = new Float32Array(starCount * 3);
    const vmags = new Float32Array(starCount);
    const radius = 10;

    stars_data.forEach((row, i) => {
        const ra = parseFloat(row.ra) * (Math.PI / 180);
        const de = parseFloat(row.de) * (Math.PI / 180);
        const vmag = parseFloat(row.vmag);

        const [x, y, z] = equatorial_to_cartesian(ra, de);

        positions[i * 3] = radius * x;
        positions[i * 3 + 1] = radius * y;
        positions[i * 3 + 2] = radius * z;

        vmags[i] = vmag;
    });

    return {'positions': positions, 'vmags': vmags};
}

