#ifdef GL_ES
precision highp float;
#endif

// Z на нас Y вверх X вправо

// Униформы
uniform sampler2D uTexture;    // Текстура планеты в equirectangular
uniform vec2      uCenterPx;     // Центр диска (в пикселях)
uniform float     uSizePx;     // Диаметр диска (в пикселях)
uniform vec3      uNorth;      // Нормированный вектор северного полюса планеты (в мировой системе)
uniform float     uSpin;       // Угол поворота плануты вокруг её северного полюса (в радианах)
uniform vec3      uDirection; 
uniform float     uVisible;
uniform vec3      uSunDirection; // Направление на источник света
uniform float     uSunDistance; // Расстояние до источника света в 10^8 км
uniform float     uDistance; // Расстояние до планеты в 10^8 км
uniform vec3      uTest; 


const vec3 UP = vec3(0.0, 1.0, 0.0);


// Функция для вычисления угла между наблюдателем и главным меридианом
float computeMeridianAngle(vec3 v, vec3 n, float spin) {
    // Нормализуем входные векторы
    v = normalize(v);
    n = normalize(n);

    // Проекция направления наблюдателя на экваториальную плоскость
    vec3 e_eq = normalize(v - dot(v, n) * n);

    // Находим базовый главный меридиан (m_0)
    vec3 u = vec3(1.0, 0.0, 0.0); // Вспомогательный вектор
    if (abs(dot(u, n)) > 0.99) { // Если u почти коллинеарен n
        u = vec3(0.0, 1.0, 0.0);
    }
    vec3 m_0 = normalize(u - dot(u, n) * n);

    // Вращение главного меридиана на угол spin
    vec3 m = m_0 * cos(spin) +
             cross(n, m_0) * sin(spin) +
             n * dot(n, m_0) * (1.0 - cos(spin));

    // Вычисляем угол между проекцией направления наблюдателя и главным меридианом
    float cosM = dot(m, e_eq);
    float angle = acos(cosM);

    // Определяем знак угла через правило правой руки
    float sign = dot(cross(n, e_eq), m);
    if (sign < 0.0) {
        angle = -angle;
    }

    return angle;
}



// -----------------------------------------------------------------
// Вспомогательная функция: матрица вращения вокруг оси (Rodrigues)
// ------------------------------------------------------------------
mat3 rotationMatrix(vec3 axis, float angle)
{
    float c  = cos(angle);
    float s  = sin(angle);
    float ic = 1.0 - c;
    axis = normalize(axis);

    return mat3(
        c + axis.x*axis.x*ic,         axis.x*axis.y*ic - axis.z*s, axis.x*axis.z*ic + axis.y*s,
        axis.y*axis.x*ic + axis.z*s,  c + axis.y*axis.y*ic,        axis.y*axis.z*ic - axis.x*s,
        axis.z*axis.x*ic - axis.y*s,  axis.z*axis.y*ic + axis.x*s, c + axis.z*axis.z*ic
    );
}

void main(void)
{
    if (uVisible < 0.5) {
        discard;
    }


    vec3 F = -normalize(uDirection);
    vec3 R = -cross(F, UP);
    R = normalize(R);
    vec3 U_ = -cross(R, F);
    U_ = normalize(U_);

    vec3 localNorth = vec3(
        dot(uNorth, R),
        dot(uNorth, U_),
        dot(uNorth, F)
    );  


    // --------------------------------------------------
    // 1) Определяем, попадаем ли мы внутрь диска
    // --------------------------------------------------
    vec2 fragPos = gl_FragCoord.xy;   // Положение фрагмента в экранных координатах (px)
    vec2 d = fragPos - uCenterPx;       // Вектор от центра диска
    float radius = 0.5 * uSizePx;     // Радиус диска

    // Если за пределами круга, либо отбрасываем, либо делаем прозрачным
    if (length(d) > radius) {
        discard;
    }

    // --------------------------------------------------
    // 2) Преобразуем (x, y) -> "локальная сфера"
    //    (где ось Y локально считается «севером»)
    // --------------------------------------------------
    // Нормированные координаты диска: [-1..1] по x и y
    vec2 ndc = d / radius;

    // Восстанавливаем "полушаровой" вектор в локальной системе
    // Пусть локальный (0,1,0) — север, (0,-1,0) — юг,
    // (1,0,0) — восток, (-1,0,0) — запад, а z смотрит "из экрана" к нам (или от нас).
    // Выберем соглашение:
    //   dir = (x, y, z), где z = sqrt(1 - x^2 - y^2), смотрит "в камеру"
    //   x = ndc.x, y = ndc.y
    float x = ndc.x;
    float y = ndc.y;
    float z = sqrt(max(0.0, 1.0 - x*x - y*y));

    vec3 dirLocal = vec3(x, y, z);

    // --------------------------------------------------
    // 3) Сначала крутим вокруг локального (0,1,0) на uSpin
    // --------------------------------------------------
    //  - Это значит, что если uSpin != 0, мы поворачиваем «текстуру»
    //    вокруг локальной оси north (0,1,0).

    float angle = computeMeridianAngle(uDirection, uNorth, uSpin);

    mat3 rotSpinLocal = rotationMatrix(localNorth, angle);
    vec3 dirSpun = rotSpinLocal * dirLocal;

    // --------------------------------------------------
    // 4) Потом совмещаем (0,1,0) с реальным localNorth,
    //    чтобы локальная ось y стала localNorth в мировой системе.
    // --------------------------------------------------
    vec3 defaultNorth = vec3(0.0, 1.0, 0.0);
    // Ось вращения: перпендикуляр между defaultNorth и localNorth
    vec3 axis1  = cross(defaultNorth, localNorth);
    float angle1 = acos(clamp(dot(defaultNorth, localNorth), -1.0, 1.0));
    mat3 rotToRealNorth = rotationMatrix(axis1, angle1);

    vec3 finalDir = rotToRealNorth * dirSpun;

    // --------------------------------------------------
    // 5) Теперь находим широту и долготу по finalDir
    // --------------------------------------------------
    // Соглашение: 
    //   широта phi = asin(y)  ∈ [-π/2..+π/2]
    //   долгота λ   = atan2(x, z) ∈ [-π..+π]
    float phi    = asin(clamp(finalDir.y, -1.0, 1.0)); 
    float lambda = atan(finalDir.x, finalDir.z);      

    // --------------------------------------------------
    // 6) Переводим (phi, lambda) -> UV для equirectangular
    // --------------------------------------------------
    //   u = (lambda / 2π) + 0.5
    //   v = (phi    / π ) + 0.5
    float TWO_PI = 6.28318530718;
    float u = lambda / TWO_PI + 0.5;
    float v = phi    / 3.14159265359 + 0.5;


    vec4 color = texture(uTexture, vec2(u, v));

    if (uSunDirection == uDirection) {
        gl_FragColor = color;
        return;
    }

    vec3 testSpun = rotSpinLocal * uTest;
    testSpun = rotToRealNorth * testSpun;


    // Диффузная освещённость
    vec3 planetToSun = normalize(normalize(uSunDirection) * uSunDistance - normalize(uDirection) * uDistance);
    planetToSun = vec3(
        dot(planetToSun, R),
        dot(planetToSun, U_),
        dot(planetToSun, F)
    );
    planetToSun = normalize(planetToSun);
    planetToSun = rotSpinLocal * planetToSun;
    planetToSun = rotToRealNorth * planetToSun;
    planetToSun = normalize(planetToSun);

    float ndotl = max(dot(finalDir, planetToSun) + 0.00, 0.0);
    float diff = min(2.0, max(1.1 * ndotl + 0.0, 0.0));

    // Итоговый цвет — умножим текстурный цвет на освещённость
    vec4 litColor = vec4(color.rgb * diff, color.a);

    gl_FragColor = litColor;
}
