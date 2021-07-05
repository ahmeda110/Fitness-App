const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const sidebar = document.querySelector('.sidebar');


class App {
    #my_map;
    #e;
    #workouts = [];
    #markers = [];
    formNewWorkoutVisible = false;

    constructor() {
        this._loadMap();
        this._getLocalStorgae();
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleForm.bind(this));
        sidebar.addEventListener('click', this._clickHandler.bind(this));
    }

    _getPosition() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            }
        });
    }

    async _loadMap() {
        try {
            const position = await this._getPosition();
            const {
                latitude,
                longitude
            } = position.coords;
            getPositionFromCord(latitude, longitude)

            this.#my_map = L.map('map').setView([latitude, longitude], 15);

            L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
            }).addTo(this.#my_map);

            this.#my_map.on('click', this._showForm.bind(this));
            this.#workouts.forEach(curr => this._renderWorkoutMarker(curr))

        } catch (err) {
            console.error(alert('Could not collect your location'))
        }
    }

    _showForm(ev) {
        this.#e = ev;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm() {
        inputCadence.value = inputDistance.value = inputDuration.value =
            inputElevation.value = '';

        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid', 1000);
    }

    _toggleForm() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(ev) {
        ev.preventDefault();

        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const {
            lat,
            lng
        } = this.#e.latlng;
        let workout;

        const validInputs = (...inputs) => inputs.every(curr => typeof curr === 'number');
        const isPositive = (...inputs) => inputs.every(curr => curr > 0);

        if (type === 'running') {
            const cadence = +inputCadence.value;
            if (!validInputs(distance, duration, cadence) || !isPositive(distance, duration, cadence)) {
                return alert('Input has to be a positive number');
            }
            workout = new Running([lat, lng], distance, duration, cadence);
        } else {
            const elevation = +inputElevation.value;
            if (!validInputs(distance, duration, elevation) || !isPositive(distance, duration)) {
                return alert('Input has to be a positive number');
            }
            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        this.#workouts.push(workout);
        this._renderWorkout(workout);
        this._renderWorkoutMarker(workout);
        this._setLocalStorage();
        this._hideForm();
    }

    _renderWorkoutMarker(workout) {
        const marker = L.marker(workout.coords)
            .addTo(this.#my_map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            }))
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
            .openPopup();

            this.#markers.push(marker);
    }

    _renderWorkout(workout) {
            let html = `
                <li class="workout--container">
                  <form class="edit--workout form">
                    <div class="form__row">
                      <label class="form__label">Type</label>
                      <span>${
                        workout.type.slice(0, 1).toUpperCase() + workout.type.slice(1)
                      }</span>
                    </div>
                    <div class="form__row">
                      <label class="form__label">Distance</label>
                      <input class="form__input form__input--distance" placeholder="km" value="${
                        workout.distance
                      }" />
                    </div>
                    <div class="form__row">
                      <label class="form__label">Duration</label>
                      <input
                        class="form__input form__input--duration"
                        placeholder="min"
                        value="${workout.duration}"
                      />
                    </div>
                    <div class="form__row ${
                      workout.type === 'cycling' ? 'form__row--hidden' : ''
                    }">
                      <label class="form__label">Cadence</label>
                      <input
                        class="form__input form__input--cadence"
                        placeholder="step/min"
                        value="${workout.type === 'running' ? workout.cadence : ''}"
                      />
                    </div>
                    <div class="form__row ${
                      workout.type === 'running' ? 'form__row--hidden' : ''
                    }">
                      <label class="form__label">Elev Gain</label>
                      <input
                        class="form__input form__input--elevation"
                        placeholder="meters"
                        value="${
                          workout.type === 'cycling' ? workout.elevationGain : ''
                        }"
                      />
                    </div>
                    <button class="form__btn">OK</button>
                  </form>
        
                  <div class="workout workout--${workout.type}" data-id="${workout.id}">
                    <div class="workout__title--container">
                      <h2 class="workout__title">${workout.description}</h2>
                      <div class="workout__controls">
                        <button data-type="edit">
                          <i class="far fa-edit"></i>
                        </button>  
                        <button data-type="delete">
                          <i class="far fa-trash-alt"></i>
                        </button>  
                      </div>
                    </div>
                    <div class="workout__details">
                      <span class="workout__icon"></span>
                      <span class="workout__value ">${workout.distance}</span>
                      <span class="workout__unit">km</span>
                    </div>
                    <div class="workout__details">
                      <span class="workout__icon"></span>
                      <span class="workout__value ">${workout.duration}</span>
                      <span class="workout__unit">min</span>
                    </div>`;
        
            if (workout.type === 'running')
              html += `
                    <div class="workout__details">
                      <span class="workout__icon"></span>
                      <span class="workout__value ">${workout.pace.toFixed(1)}</span>
                      <span class="workout__unit">min/km</span>
                    </div>
                    <div class="workout__details">
                      <span class="workout__icon"></span>
                      <span class="workout__value ">${workout.cadence}</span>
                      <span class="workout__unit">spm</span>
                    </div>
                  </div>
                </li>`;
        
            if (workout.type === 'cycling')
              html += `
                    <div class="workout__details">
                      <span class="workout__icon"></span>
                      <span class="workout__value ">${workout.speed.toFixed(1)}</span>
                      <span class="workout__unit">km/h</span>
                    </div>
                    <div class="workout__details">
                      <span class="workout__icon"></span>
                      <span class="workout__value ">${workout.elevationGain}</span>
                      <span class="workout__unit">m</span>
                    </div>
                  </div>
                </li>`;
        
            form.insertAdjacentHTML('afterend', html);
    }



    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorgae() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        if (!data) return;
        this.#workouts = data;

        this.#workouts.forEach(curr => this._renderWorkout(curr));
    }



    _clickHandler(e) {
        const btnElement = e.target.closest('.workout__controls button');
        const workoutEl = e.target.closest('.workout');
        const editForm = e.target.closest('form.edit--workout');
        const formNewWorkout = e.target.closest('form.new--workout');
    
        if (this.formNewWorkoutVisible && !formNewWorkout) {
          this.formNewWorkoutVisible = false;
          this._hideForm(true);
        }
    
        if (!btnElement && !workoutEl) return;
        if (editForm) return;
    
        const workout = this.#workouts.find(
          work => work.id === workoutEl.dataset.id
        );
    
        if (btnElement) {
          if (btnElement.dataset.type === 'edit')
            this._showWorkoutEditor(workoutEl);
          else this._deleteWorkout(workout);
        } else {
          this.#my_map.setView(workout.coords, 15, {
            animate: true,
            pan: {
              duration: 1,
            },
          });
        }
      }

    reset() {
        window.localStorage.removeItem('workouts');
        window.location.reload();
      }

    _showWorkoutEditor(el) {
        
        const editor = el
          .closest('.workout--container')
          .querySelector('.edit--workout');
    
        editor.style.transform = 'translateX(0%)';
        el.classList.add('hidden');
      }

    _deleteWorkout(workout) {
        const check = confirm('Are you sure you want to delete this workout?');
    
        if (!check) return;
    
        const delEl = document.querySelector(`.workout[data-id='${workout.id}']`);
        const delObj = this.#workouts.find(obj => obj.id === delEl.dataset.id);
        const delobjIndex = this.#workouts.indexOf(delObj);
        const markerObj = this.#markers.find(
          obj => obj._leaflet_id === delObj.markerId
        );
        const ms =
          window.getComputedStyle(delEl).transitionDuration.slice(0, -1) * 1000;
    
        // Delete from Object and memory
        this.#workouts.splice(delobjIndex, 1);
        this._setLocalStorage();
    
        // Delete from Workout list
        delEl.style.opacity = 0;
        window.setTimeout(() => delEl.closest('.workout--container').remove(), ms);
    
        // Delete from Map
        markerObj.remove();
      }
      _deleteAllWorkouts() {
        document.querySelectorAll('.workout').forEach(function (work) {
          console.log(work);
        });
      }










}

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10); 
    c = [];

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    cityAndCountry(coords){
            const [latitude, longitude] = coords;
            let result;
    
            fetch(`https://geocode.xyz/${latitude},${longitude}?geoit=json`)
            .then(res => {
                if(!res.ok) throw new Error(`Location not found (${res.status}`);
                else return res.json();
            })
            .then(data => {
                this.c.push(data.city)
            })
            .catch(err =>
                console.error(err));
                
    }


    _setDescription(coords){
        this.cityAndCountry(coords);
        

        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)}  on
          ${months[this.date.getMonth()]} ${this.date.getDate()} in ${this.c}`;
    }
}

class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription(coords);
    }

    calcPace() {
        this.pace = this.duration / this.distance;
    }
}

class Cycling extends Workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevation = elevationGain;
        this.calcSpeed();
        this._setDescription(coords);
    }

    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
    }
}

const app = new App();

const api = {
    key: '62d3ce8da012c04f2a1652b8e53c5291',
    base: 'https://api.openweathermap.org/data/2.5/',
};


function getPositionFromCord(lat, lon) {
    fetch(`${api.base}weather?lat=${lat}&lon=${lon}&units=metric&APPID=${api.key}`).then(weather => {
        return weather.json();
    }).then(displayResults)

}


function displayResults(weather) {
    let city = document.querySelector('.location .city');
    city.innerText = `${weather.name}, ${weather.sys.country}`;

    let now = new Date();
    let date = document.querySelector('.location .date');
    date.innerText = dateBuilder(now);

    let temp = document.querySelector('.current');
    temp.innerHTML = `${Math.round(weather.main.temp)}<span>°c</span>`;

   
}

function dateBuilder(d) {

    let days = [
        'Sun',
        'Mon',
        'Tues',
        'Wed',
        'Thur',
        'Fri',
        'Sat',
    ];

    let day = days[d.getDay()];
    let date = d.getDate();
    let month = d.getMonth();
    let year = d.getFullYear();

    return `${day}, ${date}/${month + 1}/${year}`;
}

