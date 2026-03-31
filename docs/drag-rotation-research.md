# Research: Drag Rotation for Sky Map Camera

## Проблема

При drag камеры внутри небесной сферы, у полюсов (zenith/nadir или celestial poles) возникает:
1. **Gimbal lock** — сферические координаты (theta/phi) теряют степень свободы у полюса
2. **lookAt degeneracy** — `camera.lookAt(origin)` с `up=(0,1,0)` не определена когда view direction параллелен up
3. **Oscillation** — iterative corrections overshoot, controls.update() перезатирает позицию

## Как решает Stellarium

Source: [StelMovementMgr.cpp](https://github.com/Stellarium/stellarium/blob/master/src/core/StelMovementMgr.cpp)

### Подход: spherical coordinates + pole recovery

**dragView():**
1. Unproject оба screen point (старый и новый) в J2000 frame
2. Конвертировать в текущий mount frame (altaz/equatorial)
3. Извлечь сферические координаты (az, alt) для обеих точек
4. Вычислить delta: `deltaAz = az2 - az1`, `deltaAlt = alt1 - alt2`
5. Вызвать `panView(deltaAz, deltaAlt)`

**panView():**
1. Извлечь текущий azVision, altVision из view direction
2. **Pole recovery:** если `|altVision| > 0.95 * PI/2` И `upVector.z < 0.9`:
   - Восстановить azimuth из upVector: `azVision = atan2(-up.y, -up.x)`
   - Это ключевой трюк! У полюса atan2 от view direction даёт мусор, но upVector хранит "память" о последнем азимуте
3. Применить: `azVision -= deltaAz`, `altVision += deltaAlt`
4. **Clamp altitude:** `altVision = clamp(altVision, -PI/2+ε, PI/2-ε)` — камера никогда не переворачивается
5. **Update upVector у полюса:** `setViewUpVector((-cos(az), -sin(az), 0) * sign(alt))` — "запоминает" азимут в upVector для следующего кадра

### Почему это работает
- **Нет quaternion rotation** — чистая сферическая арифметика (az ± delta, alt ± delta)
- **Нет gimbal lock** — azimuth восстанавливается из upVector, не из atan2(view)
- **Altitude clamped** — камера никогда не проходит через полюс, alt ∈ (-90°, +90°)
- **upVector как "память"** — хранит последний известный азимут когда altitude приближается к полюсу

## Как применить к нашему проекту

### Наша ситуация
- Camera внутри сферы (R=10), distance от origin = 0.01 (маленький FOV) до 7 (широкий FOV)
- OrbitControls управляет theta/phi
- skyGroup вращает небо через quaternion
- Нужно: drag привязывает точку к курсору

### Предлагаемый подход (Stellarium-style)

**Шаг 1: dragView — конвертировать screen delta в az/alt delta**

На mousedown и mousemove: unproject screen point → world direction → convert to spherical (az, alt) relative to camera-up plane.

Проще: использовать `_screenToEquatorial()` (уже есть!) для обеих точек, вычислить deltaRA / deltaDec.

**Шаг 2: panView — применить delta с pole recovery**

Вместо quaternion rotation:
```
currentRA -= deltaRA
currentDec += deltaDec
currentDec = clamp(currentDec, -89.99, +89.99)
```

Применить через `_pointCameraAt(currentRA, currentDec)` или через OrbitControls constraints.

**Шаг 3: Pole recovery**

Вблизи полюсов (|Dec| > 85°), deltaRA из `_screenToEquatorial` становится нестабильным (RA прыгает). Stellarium решает это через upVector. Мы можем:
- Отслеживать "последний стабильный RA" при |Dec| < 85°
- У полюса: использовать screen-space delta вместо RA delta

### Альтернативный подход: работать с OrbitControls напрямую

Вместо обхода OrbitControls, работать С ним:
1. mousedown: save current theta, phi (через `controls.getAzimuthalAngle()`, `controls.getPolarAngle()`)
2. mousemove: compute angular delta from mouse movement
3. Apply: `controls._sphericalDelta.theta = deltaTheta`, `controls._sphericalDelta.phi = deltaPhi`
4. Let controls.update() handle the rest (including clamping)

Это использует OrbitControls' встроенный clamp phi ∈ [0, PI] — камера не переворачивается. Нет gimbal lock потому что мы задаём DELTA, не абсолютное значение.

**Проблема:** angular delta из mouse movement не учитывает perspective projection. У краёв экрана тот же pixel delta = больший angular delta. Stellarium решает это через unproject.

### Рекомендация

**Гибрид:** unproject screen points для точного delta + OrbitControls._sphericalDelta для применения.

1. mousedown: save screen pos
2. mousemove: unproject обе точки → сферические координаты → delta
3. Apply: `controls._sphericalDelta.theta += deltaAz`, `controls._sphericalDelta.phi += deltaAlt`
4. `controls.update()` — применяет delta, clamps, updates position

## Sources

- [Stellarium StelMovementMgr.cpp](https://github.com/Stellarium/stellarium/blob/master/src/core/StelMovementMgr.cpp) — dragView, panView
- [Stellarium StelMovementMgr docs](https://stellarium.org/doc/0.21/classStelMovementMgr.html)
- [PaulHax/spin-controls](https://github.com/PaulHax/spin-controls) — arcball for three.js
- [ArcballControls](https://threejs.org/docs/pages/ArcballControls.html) — three.js built-in
- [Trackball Rotation using Quaternions](https://raw.org/code/trackball-rotation-using-quaternions/)
- [three.js sphere panning discussion](https://discourse.threejs.org/t/how-to-rotate-camera-around-sphere-in-sync-with-mouse-movement-for-proper-panning/5223)
