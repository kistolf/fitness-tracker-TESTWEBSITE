// DOM Elements
const currentDateEl = document.getElementById('current-date');
const totalWorkoutsEl = document.getElementById('total-workouts');
const totalCaloriesEl = document.getElementById('total-calories');
const totalMinutesEl = document.getElementById('total-minutes');
const workoutNameInput = document.getElementById('workout-name');
const workoutCaloriesInput = document.getElementById('workout-calories');
const workoutDurationInput = document.getElementById('workout-duration');
const addWorkoutBtn = document.getElementById('add-workout');
const listContainer = document.getElementById('list-container');
const caloriesChartEl = document.getElementById('calories-chart');
const minutesChartEl = document.getElementById('minutes-chart');
const tabButtons = document.querySelectorAll('.tab-btn');
const notificationEl = document.getElementById('notification');

// Data
let workouts = JSON.parse(localStorage.getItem('workouts')) || [];
let weeklyStats = JSON.parse(localStorage.getItem('weeklyStats')) || {
    calories: [0, 0, 0, 0, 0, 0, 0],
    minutes: [0, 0, 0, 0, 0, 0, 0]
};

// Initialize
updateDate();
renderWorkouts();
updateStats();
renderCharts();

// Event Listeners
addWorkoutBtn.addEventListener('click', addWorkout);

workoutNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addWorkout();
});

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCharts();
    });
});

// Functions
function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = new Date().toLocaleDateString('en-US', options);
}

function addWorkout() {
    const name = workoutNameInput.value.trim();
    const calories = parseInt(workoutCaloriesInput.value);
    const minutes = parseInt(workoutDurationInput.value);

    if (!name || isNaN(calories)) {
        showNotification('Please enter workout name and calories!', 'error');
        return;
    }

    const today = new Date().getDay();
    const finalMinutes = isNaN(minutes) ? 0 : minutes;

    weeklyStats.calories[today] += calories;
    weeklyStats.minutes[today] += finalMinutes;

    const newWorkout = {
        id: Date.now(),
        name,
        calories,
        minutes: finalMinutes,
        date: new Date().toISOString()
    };

    workouts.push(newWorkout);
    saveData();
    renderWorkouts();
    updateStats();
    renderCharts();
    showNotification('Workout added successfully!');

    // Clear inputs
    workoutNameInput.value = '';
    workoutCaloriesInput.value = '';
    workoutDurationInput.value = '';
    workoutNameInput.focus();
}

function renderWorkouts() {
    listContainer.innerHTML = '';

    if (workouts.length === 0) {
        listContainer.innerHTML = '<p class="empty-message">No workouts yet. Add your first workout!</p>';
        return;
    }

    // Sort by newest first
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedWorkouts.forEach(workout => {
        const workoutEl = document.createElement('div');
        workoutEl.className = 'workout-item';
        workoutEl.innerHTML = `
      <div class="workout-info">
        <div class="workout-name">${workout.name}</div>
        <div class="workout-details">
          <span class="workout-calories">${workout.calories} kcal</span>
          <span class="workout-duration">${workout.minutes} min</span>
        </div>
      </div>
      <button class="delete-btn" data-id="${workout.id}">
        <i class="fas fa-trash-alt"></i>
      </button>
    `;
        listContainer.appendChild(workoutEl);
    });

    // Add delete event listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            deleteWorkout(id);
        });
    });
}

function deleteWorkout(id) {
    const workoutIndex = workouts.findIndex(w => w.id === id);
    if (workoutIndex === -1) return;

    const workout = workouts[workoutIndex];
    const workoutDate = new Date(workout.date);
    const dayOfWeek = workoutDate.getDay();

    weeklyStats.calories[dayOfWeek] -= workout.calories;
    weeklyStats.minutes[dayOfWeek] -= workout.minutes;

    workouts.splice(workoutIndex, 1);
    saveData();
    renderWorkouts();
    updateStats();
    renderCharts();
    showNotification('Workout deleted!');
}

function updateStats() {
    const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);
    const totalMinutes = workouts.reduce((sum, w) => sum + w.minutes, 0);

    totalWorkoutsEl.textContent = workouts.length;
    totalCaloriesEl.textContent = totalCalories;
    totalMinutesEl.textContent = totalMinutes;
}

function renderCharts() {
    const activeTab = document.querySelector('.tab-btn.active').dataset.chart;
    const data = activeTab === 'calories' ? weeklyStats.calories : weeklyStats.minutes;
    const maxValue = Math.max(...data, 1);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    caloriesChartEl.innerHTML = '';
    minutesChartEl.innerHTML = '';

    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * 100;
        const barEl = document.createElement('div');
        barEl.className = 'bar';
        barEl.style.height = `${barHeight}%`;
        barEl.innerHTML = `
      <div class="bar-value">${value}</div>
      <div class="bar-label">${days[index]}</div>
    `;

        if (activeTab === 'calories') {
            caloriesChartEl.appendChild(barEl);
        } else {
            minutesChartEl.appendChild(barEl);
        }
    });
}

function saveData() {
    localStorage.setItem('workouts', JSON.stringify(workouts));
    localStorage.setItem('weeklyStats', JSON.stringify(weeklyStats));
}

function showNotification(message, type = 'success') {
    notificationEl.textContent = message;
    notificationEl.className = 'notification show';
    notificationEl.classList.toggle('error', type === 'error');

    setTimeout(() => {
        notificationEl.classList.remove('show');
    }, 3000);
}