
function generateCtab() {
    const ctab = new Array(256);

    function Z(a) {
        return [a, a + 1, a + 256, a + 257];
    }

    function Y(a) {
        return [...Z(a), ...Z(a + 2), ...Z(a + 512), ...Z(a + 514)];
    }

    function X(a) {
        return [...Y(a), ...Y(a + 4), ...Y(a + 1024), ...Y(a + 1028)];
    }

    return [...X(0), ...X(8), ...X(2048), ...X(2056)];
}

const ctab = generateCtab();




/**
 * https://iopscience.iop.org/article/10.1086/427976/pdf
 */

export function heal2equatorial(xs, ys) {
    const PI = Math.PI;

    // Переведем сначала в сферические
    let phi, theta;

    // 1) Экваториальная зона: |y_s| < pi/4
    if (Math.abs(ys) < PI / 4) {
        // phi = x_s
        phi = xs;

        // cos(theta) = (8 / (3 * pi)) * y_s
        const cosTheta = (8 / (3 * PI)) * ys;

        // На всякий случай подрежем cosTheta, чтобы не вылезал за [-1,1] из-за возможных погрешностей.
        const c = Math.max(-1, Math.min(1, cosTheta));
        theta = Math.acos(c);

    } else {
        // 2) Полярная зона: |y_s| > pi/4

        // В формулах используется x_t = x_s mod (pi/2).
        // В JS оператор % может давать отрицательное значение, поэтому нормализуем:
        let x_t = xs % (PI / 2);
        if (x_t < 0) {
            x_t += PI / 2;
        }

        // phi = x_s - (|y_s| - pi/4)/(|y_s| - pi/2) * ( x_t - pi/4 )
        const absYs = Math.abs(ys);
        const numerator = absYs - PI / 4;
        const denominator = absYs - PI / 2;

        phi = xs - (numerator / denominator) * (x_t - PI / 4);

        // cos(theta) = [ 1 - (1/3)*(2 - 4|y_s|/pi)^2 ] * sign(y_s)
        const bracket = 1 - (1 / 3) * Math.pow((2 - (4 * absYs) / PI), 2);
        const signYs = ys >= 0 ? 1 : -1;
        let cosTheta = bracket * signYs;

        // также аккуратно ограничиваем от -1 до 1
        cosTheta = Math.max(-1, Math.min(1, cosTheta));
        theta = Math.acos(cosTheta);
    }


    // Теперь перевод в экваториальные координаты: RA, Dec
    // Dec = pi/2 - theta,  RA = phi (приведённый к [0, 2pi))
    let ra = phi % (2 * PI);
    if (!ra) { ra = 0; } // ra may be undefined if phi is NaN
    if (ra < 0) {
        ra += 2 * PI;
    }
    let dec = PI / 2 - theta;

    // Возвращаем объект { ra, dec } в радианах
    return { ra, dec };
}





export function nest2xyf(nside, pix) {
    const npface = nside * nside;
    let face = Math.floor(pix / npface);
    pix &= (npface - 1);

    let raw = (pix & 0x5555) | ((pix & 0x55550000) >> 15);
    let ix = ctab[raw & 0xff] | (ctab[raw >> 8] << 4);

    pix >>= 1;
    raw = (pix & 0x5555) | ((pix & 0x55550000) >> 15);
    let iy = ctab[raw & 0xff] | (ctab[raw >> 8] << 4);

    return { face, ix, iy };
}


const FACES = [
    [-3, 0],
    [-1, 0],
    [1, 0],
    [3, 0],
    [-4, -1],
    [-2, -1],
    [0, -1],
    [2, -1],
    [-3, -2],
    [-1, -2],
    [1, -2],
    [3, -2],
]


export function hipspix2healpix(nside, pix, x, y) {
    const RES = 1;

    let { face, ix, iy } = nest2xyf(nside, pix);

    let [hx, hy] = FACES[face];
    hx *= Math.PI / 4;
    hy *= Math.PI / 4;

    hx += (ix - iy) * Math.PI / 4 / nside;
    hy += (ix + iy) * Math.PI / 4 / nside;

    hx += Math.PI / 4 / nside;
    hy += Math.PI / 4 / nside;

    hx -= (Math.PI / 4 / nside * (x + y) / RES);
    hy += (Math.PI / 4 / nside * (x - y) / RES);

    return [hx, hy];
}


export function isNorthAdjacent(norder, ipix) {
    // Количество тайлов в каждом базовом пикселе: D = 4^norder
    const D = Math.pow(4, norder);
    // Общее число тайлов на сфере: 12 базовых пикселей * D
    const totalPix = 12 * D;
    if (ipix < 0 || ipix >= totalPix) {
        return false; // Некорректный индекс
    }
    // Определяем базовый пиксель (face) и локальный индекс внутри него
    const face = Math.floor(ipix / D);
    const localIndex = ipix % D;

    // Для северного полюса: базовые пиксели с номерами 0,1,2,3,
    // где тайл, смежный с полюсом, имеет локальный номер D - 1
    if (face >= 0 && face <= 3 && localIndex === D - 1) {
        return true;
    }

    return false;
}

export function isSouthAdjacent(norder, ipix) {
    // Количество тайлов в каждом базовом пикселе: D = 4^norder
    const D = Math.pow(4, norder);
    // Общее число тайлов на сфере: 12 базовых пикселей * D
    const totalPix = 12 * D;
    if (ipix < 0 || ipix >= totalPix) {
        return false; // Некорректный индекс
    }
    // Определяем базовый пиксель (face) и локальный индекс внутри него
    const face = Math.floor(ipix / D);
    const localIndex = ipix % D;



    // Для южного полюса: базовые пиксели с номерами 8,9,10,11,l
    // где смежный тайл имеет локальный номер 0
    if (face >= 8 && face <= 11 && localIndex === 0) {
        return true;
    }

    return false;
}
