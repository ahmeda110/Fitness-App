const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App{
    #my_map;
    #e;
    #workouts = [];

    constructor(){
        this._loadMap();
        this._getLocalStorgae();
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleForm.bind(this));
        containerWorkouts.addEventListener('click', this._moveToMarker.bind(this));
    }

    _getPosition(){
        return new Promise((resolve, reject) => {
            if(navigator.geolocation){
                navigator.geolocation.getCurrentPosition(resolve, reject);
            }
        });
    }

    async _loadMap(){
        try{
            const position = await this._getPosition();
            const {latitude, longitude} = position.coords;

            this.#my_map = L.map('map').setView([latitude, longitude], 15);
        
                L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{
                    maxZoom: 20,
                    subdomains:['mt0','mt1','mt2','mt3']
                }).addTo(this.#my_map);
        
                this.#my_map.on('click', this._showForm.bind(this));

                this.#workouts.forEach(curr => this._renderWorkoutMarker(curr))
    
        }catch(err) { console.error(alert('Could not collect your location'))}
    }

    _showForm(ev) {
        this.#e = ev;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm(){
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
            const {lat, lng} = this.#e.latlng;
            let workout;

            const validInputs = (...inputs) => inputs.every(curr => typeof curr === 'number');
            const isPositive = (...inputs) => inputs.every(curr => curr > 0);
            
            if(type === 'running') {
                const cadence = +inputCadence.value;
                if(!validInputs(distance, duration, cadence) || !isPositive(distance, duration, cadence)){
                    return alert('Input has to be a positive number');}
                workout = new Running([lat, lng], distance,  duration, cadence);
            }else{ 
                const elevation = +inputElevation.value; 
                if(!validInputs(distance, duration, elevation) || !isPositive(distance, duration)){
                    return alert('Input has to be a positive number');}
                    workout = new Cycling([lat, lng], distance,  duration, elevation);  
            }

            this.#workouts.push(workout);
            this._renderWorkout(workout);
            this._renderWorkoutMarker(workout);
            this._setLocalStorage();      
            this._hideForm();
    }

    _renderWorkoutMarker(workout) {  
        
        L.marker(workout.coords)
                    .addTo(this.#my_map)
                    .bindPopup(L.popup({
                        maxWidth: 250,
                        minWidth: 100,
                        autoClose: false,
                        closeOnClick: false,
                        className: `${workout.type}-popup`,
                        })
                    )
                    .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
                    .openPopup();
    }

    _renderWorkout(workout) {
 
        let html = `
                    <li class="workout workout--${workout.type}" data-id="${workout.id}">
                        <h2 class="workout__title">${workout.description}</h2>
                        <div class="workout__details">
                        <span class="workout__icon"></span>
                        <span class="workout__value">${workout.distance}</span>
                        <span class="workout__unit">km</span>
                        </div>
                        <div class="workout__details">
                        <span class="workout__icon"></span>
                        <span class="workout__value">${workout.duration}</span>
                        <span class="workout__unit">min</span>
                        </div>
    `;

    if (workout.type === 'running')
      html += `
                <div class="workout__details">
                <span class="workout__icon"></span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">KPH</span>
                </div>
                <div class="workout__details">
                <span class="workout__icon"></span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
                </div>
            </li>
      `;

    if (workout.type === 'cycling')
      html += `
                <div class="workout__details">
                <span class="workout__icon"></span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">        
                <span class="workout__icon"></span>
                <span class="workout__value">${workout.elevation}</span>
                <span class="workout__unit">m</span>
                </div>
            </li>
      `;

    form.insertAdjacentHTML('afterend', html);
    }

    _moveToMarker(e){
        const workoutEl = e.target.closest('.workout');

        if(!workoutEl) return;
        const workout = this.#workouts.find(curr => curr.id === workoutEl.dataset.id);

        this.#my_map.setView(workout.coords, 15, {animate: true, pan: {
            duration: 1
        }})
    }

    _setLocalStorage(){
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorgae(){
        const data = JSON.parse(localStorage.getItem('workouts'));
        if(!data) return;
        this.#workouts = data;
        
        this.#workouts.forEach(curr => this._renderWorkout(curr));
    }
}

class Workout extends App{
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coords, distance, duration){
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }



    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)}  on
          ${months[this.date.getMonth()]} ${this.date.getDate()} in ${this._getCityAndCountry()}`;
    }
}

class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
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
        this._setDescription();
    }

    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
    }
}

const app = new App();



