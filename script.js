'use strict';
// ! 03/10/2022
let map, mapEvent;

// ! Workout Parent Class
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  constructor(coords, duration, distance) {
    this.coords = coords;
    this.duration = duration;
    this.distance = distance;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    // Running on April 14
    this.description = `${this.type[0].toUpperCase()}${this.type
      .slice(1)
      .toLowerCase()} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}
// ! Running Child Class
class running extends Workout {
  type = 'running';
  constructor(coords, duration, distance, cadence) {
    super(coords, duration, distance);
    this.cadence = cadence;
    this.calcpace();
    this._setDescription();
  }

  calcpace() {
    // * min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// ! Cycling Child Class
class cycling extends Workout {
  type = 'cycling';
  constructor(coords, duration, distance, elevation) {
    super(coords, duration, distance);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // * km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// :::::::::::::::::::::::::::::::::::::::::::
// ! APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #zoomMapLevel = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    // ! Get User's Postilion
    this._getPosition();
    // ! Get Data From Local Storage
    this._getLocalStorage();
    // ! Attach Event Handler
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToMap.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Please Set Your Current Location');
        }
      );
    }
  }

  _loadMap(position) {
    //   const latitude = position.coords.latitude;
    //  ! ===
    const { latitude } = position.coords;

    //   const longitude = position.coords.longitude;
    // ! ===
    const { longitude } = position.coords;
    //   console.log(
    //     `https://www.google.com/maps/@${latitude},${longitude},16z?hl=fr-FR`
    //   );

    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#zoomMapLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.fr/hot/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(work => {
      this._renderWorkoutMArker(work);
    });
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 500);
  }
  _newWorkout(e) {
    const validation = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const positiveNumber = (...inputs) => inputs.every(inp => inp >= 0);
    e.preventDefault();

    // * Get Data From Form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // * Check if data is valid

    // * If Workout running , Create Running Object

    if (type === 'running') {
      const cadence = +inputCadence.value;
      // * Check if data is valid
      if (
        !validation(distance, duration, cadence) ||
        !positiveNumber(distance, duration, cadence)
      )
        return alert('Please Enter Positive Numbers !!!');
      workout = new running([lat, lng], distance, duration, cadence);
    }

    // * If Workout Cycling , Create Cycling Object

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // * Check if data is valid
      if (
        !validation(distance, duration, elevation) ||
        !positiveNumber(distance, duration)
      )
        return alert('Please Enter Positive Numbers !!!');
      workout = new cycling([lat, lng], distance, duration, elevation);
    }

    // * Add New Object To Workout Array
    this.#workouts.push(workout);
    console.log(workout);
    // * Render Workout On Map As Marker
    this._renderWorkoutMArker(workout);

    // * Render Workout In list
    this._renderWorkoutInList(workout);

    // * Hide Form + Clear Input Fields
    this._hideForm();

    // * Set Local Storage
    this._setLocalStorage();
  }

  _renderWorkoutMArker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '🚲'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkoutInList(workout) {
    // let icon = workout.type
    let tests = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃' : '🚲'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;
    if (workout.type === 'running')
      tests += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;

    if (workout.type === 'cycling')
      tests += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;

    form.insertAdjacentHTML('afterend', tests);
  }

  _moveToMap(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#zoomMapLevel, {
      Animation: true,
      nap: {
        duration: 1,
      },
    });

    // workout.click();
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkoutInList(work);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
// ! 10/10/2022