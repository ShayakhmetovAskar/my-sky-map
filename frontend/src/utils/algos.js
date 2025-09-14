import * as healpix from "@hscmap/healpix";
import { temperatureColorTable } from "@/utils/temperatureColorTable.js";
import * as THREE from 'three';
import Papa from 'papaparse';

export function equatorial_to_cartesian(ra, dec, radius = 1) {
    const x = radius * -Math.cos(dec) * Math.sin(ra);
    const y = radius * Math.sin(dec);
    const z = radius * -Math.cos(dec) * Math.cos(ra);

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




export function isPixelVisible(norder, pix, camera, group, nest = true) {
    const nside = 1 << norder;

    let { theta, phi } = healpix.pix2ang_nest(nside, pix);
    let ra = phi;
    let dec = -(theta - Math.PI / 2);
    const v = equatorial_to_cartesian(ra, dec);

    const v3 = new THREE.Vector3();
    camera.getWorldDirection(v3);

    const tileCenterV = new THREE.Vector3(v[0], v[1], v[2]);
    tileCenterV.applyMatrix4(group.matrixWorld);

    const angleBetweenVectors = (v1, v2, inDegrees = false) => inDegrees ? THREE.MathUtils.radToDeg(Math.acos(v1.dot(v2) / (v1.length() * v2.length()))) : Math.acos(v1.dot(v2) / (v1.length() * v2.length()));

    const angleDeg = angleBetweenVectors(v3, tileCenterV, true);

    if (angleDeg < camera.fov + Math.PI / 4 / nside * 90) {
        return true;
    } else {
        return false;
    }
}




export function getWorldUp(lon, lat) {
    // lat in north 90, equator 0, south -90
    return equatorial_to_cartesian(0, lat);
}

export function getZenithRaDecFast(dateUtc, latDeg, lonDeg) {
    // 1) d = число суток, прошедших с 2000-01-01 12:00:00 UTC
    const msSinceJ2000 = dateUtc.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0);
    const d = msSinceJ2000 / 86400000; // миллисекунды -> дни

    // 2) Вычисляем гринвичское звёздное время (GMST) в градусах (приближённая формула)
    //    GMST_deg = 280.4606 + 360.9856473 * d
    let gmstDeg = 280.4606 + 360.9856473 * d;
    // Приводим к диапазону [0..360)
    gmstDeg = ((gmstDeg % 360) + 360) % 360;

    // 3) Переводим GMST из градусов в часы
    let gmstHours = gmstDeg / 15;

    // 4) Переходим к местному звёздному времени (LST), добавляя долготу в часах
    //    (lonDeg>0 для востока)
    let lstHours = gmstHours + lonDeg / 15;
    // Приводим в диапазон [0..24)
    lstHours = ((lstHours % 24) + 24) % 24;

    // 5) Зенит: RA = LST (часы), Dec = latDeg (градусы)
    //    (упрощённо без геоцентрических поправок)
    const ra = lstHours;
    const dec = latDeg;

    return { ra, dec };
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
    //                     0-6  7   8   9   10  11 12 13 14 15 16  17
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


export function prepareStarsGeometryNew(csvText) {
    const results = Papa.parse(csvText, {
        header: true,
        delimiter: ","
    });

    // Фильтруем строки, где отсутствует значение для ra, dec или phot_g_mean_mag
    const data = results.data.filter(row => row.ra && row.dec && row.phot_g_mean_mag);

    const starCount = data.length;

    const positions = new Float32Array(starCount * 3);
    const vmags = new Float32Array(starCount);
    const colors = new Float32Array(starCount * 3);

    const brightestStars = [];
    const findInsertIndex = (array, value, key) => {
        let low = 0;
        let high = array.length;
        while (low < high) {
            const mid = (low + high) >>> 1;
            if (array[mid][key] < value) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        return low;
    };

    for (let i = 0; i < starCount; i++) {
        const row = data[i];
        // Преобразуем ra и dec в числа и переводим в радианы
        const ra_deg = parseFloat(row.ra);
        const dec_deg = parseFloat(row.dec);
        const ra_rad = ra_deg * Math.PI / 180;
        const dec_rad = dec_deg * Math.PI / 180;

        // Получаем декартовы координаты звезды (с радиусом r = 10)
        const pos = equatorial_to_cartesian(ra_rad, dec_rad, 10);
        positions[i * 3] = pos[0];
        positions[i * 3 + 1] = pos[1];
        positions[i * 3 + 2] = pos[2];

        // phot_g_mean_mag как vmag
        const currentMag = parseFloat(row.phot_g_mean_mag);
        vmags[i] = currentMag;

        // Цвет звезды — белый (1, 1, 1)
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;

        // Обновление списка самых ярких звезд
        const starInfo = {
            source_id: row.source_id,
            ra: ra_deg,
            dec: dec_deg,
            phot_g_mean_mag: currentMag,
            position: new THREE.Vector3(...pos)
        };

        if (brightestStars.length < 10000) {
            const index = findInsertIndex(brightestStars, currentMag, 'phot_g_mean_mag');
            brightestStars.splice(index, 0, starInfo);
        } else {
            if (currentMag < brightestStars[brightestStars.length - 1].phot_g_mean_mag) {
                const index = findInsertIndex(brightestStars, currentMag, 'phot_g_mean_mag');
                brightestStars.splice(index, 0, starInfo);
                brightestStars.pop();
            }
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('vmag', new THREE.Float32BufferAttribute(vmags, 1));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Если вдруг набралось меньше 10.
    brightestStars.length = Math.min(brightestStars.length, 10000);

    return {geometry, brightestStars};
}



export function prepareStarsGeometry(stars_data) {
    const starCount = stars_data.length;
    const positions = new Float32Array(starCount * 3);
    const vmags = new Float32Array(starCount);
    const colors = new Float32Array(starCount * 3);
    const radius = 10;

    stars_data.forEach((row, i) => {
        const ra = parseFloat(row.ra) * (Math.PI / 180);
        const de = parseFloat(row.de) * (Math.PI / 180);
        const vmag = parseFloat(row.vmag);
        const source_id = parseInt(row.source_id);
        let b_v = parseFloat(row.b_v);


        const [x, y, z] = equatorial_to_cartesian(ra, de, radius);
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;


        if (source_id > 1000000) {
            b_v = 1.3 * b_v + 0.0;
        }
        const [r, g, b] = bvToColor(b_v);
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;


        vmags[i] = vmag;
    });

    return { 'positions': positions, 'vmags': vmags, 'colors': colors };
}


function bvToTemperature(bv) {
    const points = [
        { bv: -0.5, T: 30000 }, // Голубой
        { bv: 0.1, T: 7000 },  // Белый
        { bv: 0.6, T: 5000 },   // Желтоватый
        { bv: 0.8, T: 4000 },   // Жёлтый
        { bv: 1.22, T: 3800 },   // Красный
        { bv: 2.6, T: 3500 }    // Красный
    ];


    if (bv <= points[0].bv) {
        return points[0].T;
    }


    if (bv >= points[points.length - 1].bv) {
        return points[points.length - 1].T;
    }

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        if (bv >= p1.bv && bv <= p2.bv) {
            // Выполняем линейную интерполяцию
            const slope = (p2.T - p1.T) / (p2.bv - p1.bv);
            const T = p1.T + slope * (bv - p1.bv);
            return Math.round(T);
        }
    }
    return (bv < points[0].bv) ? points[0].T : points[points.length - 1].T;
}

export function bvToColor(bv) {
    // Преобразование HEX в RGB
    function hexToRgb(hex, temp) {
        if (hex === undefined) {
            console.log(temp);
        }
        const bigint = parseInt(hex.slice(1), 16);
        return [
            ((bigint >> 16) & 255) / 255, // Красный
            ((bigint >> 8) & 255) / 255,  // Зелёный
            (bigint & 255) / 255          // Синий
        ];
    }

    const temperature = bvToTemperature(bv);
    const roundedTemp = Math.floor(temperature / 200) * 200;
    const hexColor = temperatureColorTable.get(roundedTemp);
    return hexToRgb(hexColor, temperature);
}




export function calculateSizePx(fov, windowHeight, radius, distance) {
    return 2 * Math.atan(radius / distance) / (fov / 180 * Math.PI) * windowHeight;
}