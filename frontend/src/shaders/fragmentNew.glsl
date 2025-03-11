#ifdef GL_ES
precision highp float;
#endif

// Униформы (названия и типы такие же, как в старом)
uniform sampler2D uTexture; // Текстура планеты (equirectangular)
uniform vec2 uCenterPx; // Сейчас не используется, оставляем для совместимости
uniform float uSizePx; // Тоже не используется в круге, оставляем
uniform vec3 uNorth; // Нормированный вектор северного полюса
uniform float uSpin; // Угол поворота планеты вокруг оси
uniform vec3 uDirection; // Направление камеры->планета (или наоборот)
uniform float uVisible; // Отображать/не отображать
uniform vec3 uSunDirection; // Направление на источник света
uniform float uSunDistance; // Расстояние до источника (в старом масштабе 10^8 км)
uniform float uDistance; // Расстояние до планеты (тоже в 10^8 км)
uniform vec3 uTest; // Доп. uniform

// Константы
const vec3 UP = vec3(0.0, 1.0, 0.0);

// Входящие данные из вершинного шейдера
// Ожидается, что vLocalXY ∈ [-1..+1]
varying vec2 vLocalXY;

// -----------------------------
// Функция для вычисления угла между наблюдателем и главным меридианом
// -----------------------------
float computeMeridianAngle(vec3 v, vec3 n, float spin) {
  v = normalize(v);
  n = normalize(n);

  // Проекция направления наблюдателя на экваториальную плоскость
  vec3 e_eq = normalize(v - dot(v, n) * n);

  // Базовый главный меридиан (m_0)
  vec3 u = vec3(1.0, 0.0, 0.0);
  if (abs(dot(u, n)) > 0.99) {
    u = vec3(0.0, 1.0, 0.0);
  }
  vec3 m_0 = normalize(u - dot(u, n) * n);

  // Вращение главного меридиана на угол spin
  vec3 m = m_0 * cos(spin) + cross(n, m_0) * sin(spin) +
           n * dot(n, m_0) * (1.0 - cos(spin));

  float cosM = dot(m, e_eq);
  float angle = acos(clamp(cosM, -1.0, 1.0));

  // Определяем знак угла через правило правой руки
  float sign = dot(cross(n, e_eq), m);
  if (sign < 0.0) {
    angle = -angle;
  }
  return angle;
}

// -----------------------------
// Матрица вращения (Rodrigues)
// -----------------------------
mat3 rotationMatrix(vec3 axis, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  float ic = 1.0 - c;
  axis = normalize(axis);

  return mat3(c + axis.x * axis.x * ic, axis.x * axis.y * ic - axis.z * s,
              axis.x * axis.z * ic + axis.y * s,
              axis.y * axis.x * ic + axis.z * s, c + axis.y * axis.y * ic,
              axis.y * axis.z * ic - axis.x * s,
              axis.z * axis.x * ic - axis.y * s,
              axis.z * axis.y * ic + axis.x * s, c + axis.z * axis.z * ic);
}

void main(void) {



  // 1) Вырезаем круг: если длина (vLocalXY) > 1, то мы за пределами круга
  if (length(vLocalXY) > 1.0) {
    discard;
  }



  // 2) «Подъём» на полусферу:
  // x^2 + y^2 + z^2 = 1 => z = sqrt(1 - x^2 - y^2)
  float x = vLocalXY.x;
  float y = vLocalXY.y;
  float z = sqrt(max(0.0, 1.0 - x * x - y * y));
  vec3 dirLocal = vec3(x, y, z);

//   float r = (x + 1.0) * 0.5; // x = -1 => r=0, x = +1 => r=1
//   float g = (y + 1.0) * 0.5; // y = -1 => g=0, y = +1 => g=1
//   float b = z;               // z = sqrt(1 - x^2 - y^2) ∈ [0..1]

//   // Формируем итоговый цвет
//   gl_FragColor = vec4(r, g, b, 1.0);
//   return;

  // 3) Базовые векторы
  vec3 F = -normalize(uDirection); // "Взгляд" (напр. камера->планета)
  vec3 R = normalize(-cross(F, UP)); // вправо
  vec3 U_ = normalize(-cross(R, F)); // вверх

  // localNorth: север планеты в системе (R, U_, F)
  vec3 localNorth = vec3(dot(uNorth, R), dot(uNorth, U_), dot(uNorth, F));

  // 4) Вращение вокруг оси (uSpin)
  float angle = computeMeridianAngle(uDirection, uNorth, uSpin);
  mat3 rotSpinLocal = rotationMatrix(localNorth, angle);
  vec3 dirSpun = rotSpinLocal * dirLocal;

  // 5) Вращаем (0,1,0) -> localNorth
  vec3 defaultNorth = vec3(0.0, 1.0, 0.0);
  vec3 axis1 = cross(defaultNorth, localNorth);
  float angle1 = acos(clamp(dot(defaultNorth, localNorth), -1.0, 1.0));
  mat3 rotToRealNorth = rotationMatrix(axis1, angle1);
  vec3 finalDir = rotToRealNorth * dirSpun;

  // 6) (phi, lambda) -> UV для equirectangular
  float phi = asin(clamp(finalDir.y, -1.0, 1.0));
  float lambda = atan(finalDir.x, finalDir.z);

  // Широта и долгота в [0..1]
  float TWO_PI = 6.28318530718;
  float u = lambda / TWO_PI + 0.5;
  float v = phi / 3.14159265359 + 0.5;

//   vec3 debugColor =
//       vec3(clamp(u + 0.3, 0.0, 1.0), clamp(v + 0.3, 0.0, 1.0), 0.5);
//   gl_FragColor = vec4(debugColor, 1.0);
//   return;

  vec4 color = texture2D(uTexture, vec2(u, v));

  // Если у вас логика про "если совпадает направление солнца",
  // можно оставить как в старом коде:
  if (uSunDirection == uDirection) {
    gl_FragColor = color;
    return;
  }

  // (Опциональный тест)
  vec3 testSpun = rotSpinLocal * uTest;
  testSpun = rotToRealNorth * testSpun;

  // 7) Диффузная освещённость
  vec3 planetToSun = normalize(normalize(uSunDirection) * uSunDistance -
                               normalize(uDirection) * uDistance);
  // Переводим planetToSun в систему (R,U_,F)
  planetToSun =
      vec3(dot(planetToSun, R), dot(planetToSun, U_), dot(planetToSun, F));
  planetToSun = normalize(planetToSun);
  planetToSun = rotSpinLocal * planetToSun;
  planetToSun = rotToRealNorth * planetToSun;
  planetToSun = normalize(planetToSun);

  float ndotl = max(dot(finalDir, planetToSun), 0.0);
  float diff = min(2.0, max(1.1 * ndotl, 0.0));

  vec4 litColor = vec4(color.rgb * diff, color.a);
  gl_FragColor = litColor;
}
