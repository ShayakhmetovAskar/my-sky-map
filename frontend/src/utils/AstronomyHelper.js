import * as Astronomy from 'astronomy-engine'
import { equatorial_to_cartesian } from './algos';


export const CelestialRadii = {
  Sun: 696340,
  Mercury: 2439.7,
  Venus: 6051.8,
  Earth: 6371.0,
  Moon: 1737.4,
  Mars: 3389.5,
  Jupiter: 69911,
  Saturn: 58232,
  Uranus: 25362,
  Neptune: 24622,
  Pluto: 1188.3
};

export default {
  calculateCelestialBodyInfo(date, observer, target) {
    const observerInstance = new Astronomy.Observer(
      observer.latitude,
      observer.longitude,
      observer.height || 0
    );


    const equatorial = Astronomy.Equator(
      target,
      date,
      observerInstance,
      false, // Перенос координат с учетом прецессии и нутации
      false  // Учет аберации Земли
    );

    const lightTravelTimeSec = equatorial.dist * Astronomy.KM_PER_AU / 299792.0;
    const correctedDate = new Date(date.getTime() - lightTravelTimeSec * 1000);


    const axis = Astronomy.RotationAxis(target, correctedDate);


    const illumination = Astronomy.Illumination(target, correctedDate);

    return {
      coordinatesCartesian: equatorial_to_cartesian(
        equatorial.ra / 24 * 2 * Math.PI,
        equatorial.dec / 180 * Math.PI,
        10
      ),
      raRad: equatorial.ra / 24 * 2 * Math.PI,
      decRad: equatorial.dec / 180 * Math.PI,
      distanceKm: equatorial.dist * Astronomy.KM_PER_AU,
      northVector: equatorial_to_cartesian(
        axis.ra / 24 * 2 * Math.PI,
        axis.dec / 180 * Math.PI,
        1
      ),
      spinRad: (axis.spin % 360) / 180 * Math.PI,
      magnitude: illumination.mag,
    }
  },



  /**
   * Вычисляет время восхода и заката Солнца
   * @param {Date} date - Дата и время для расчета
   * @param {Object} observer - Объект с информацией об наблюдателе (latitude, longitude, height)
   * @returns {Object} - { sunrise, sunset }
   */
  calculateSunTimes(date, observer) {
    const observerData = {
      latitude: observer.latitude,
      longitude: observer.longitude,
      height: observer.height || 0,
    };

    const sunrise = Astronomy.SearchRiseSet('Sun', observerData, +1, date, 300);
    const sunset = Astronomy.SearchRiseSet('Sun', observerData, -1, date, 300);

    return {
      sunrise: sunrise.date,
      sunset: sunset.date,
    };
  },
};
