"use strict";

/* =====================================================
   FITTRACK
   MVP — Frontend + LocalStorage
===================================================== */

const STORAGE_KEY = "fittrack_mvp_v1";


/* =====================================================
   ESTADO INICIAL
===================================================== */

const defaultState = {
  profile: {
    name: "João",
    goal: "Manter uma rotina mais ativa",
    age: "",
    height: "",
    weight: ""
  },

  metrics: {
    water: 1.5,
    activity: 35,
    sleep: 7.33
  },

  goals: {
    water: 2,
    activity: 50,
    sleep: 8,
    habits: 5
  },

  habits: [
    {
      id: 1,
      name: "Beber água ao longo do dia",
      frequency: "Todos os dias",
      completed: false,
      streak: 12
    },

    {
      id: 2,
      name: "Caminhar",
      frequency: "Todos os dias",
      completed: false,
      streak: 7
    },

    {
      id: 3,
      name: "Ler por 20 minutos",
      frequency: "Todos os dias",
      completed: false,
      streak: 4
    },

    {
      id: 4,
      name: "Organizar a rotina",
      frequency: "Segunda a sexta",
      completed: false,
      streak: 3
    },

    {
      id: 5,
      name: "Desconectar antes de dormir",
      frequency: "Todos os dias",
      completed: false,
      streak: 2
    }
  ],

  week: [60, 75, 80, 65, 90, 85, 95],

  lastDate: getTodayKey()
};


/* =====================================================
   ESTADO
===================================================== */

let state = loadState();


/* =====================================================
   ELEMENTOS
===================================================== */

const landing = document.getElementById("landing");
const app = document.getElementById("app");

const toast = document.getElementById("toast");

const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.getElementById("main-nav");

const siteHeader = document.getElementById("site-header");


/* =====================================================
   UTILIDADES
===================================================== */

function getTodayKey() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}


function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return structuredClone(defaultState);
    }

    const parsed = JSON.parse(saved);

    return {
      ...structuredClone(defaultState),
      ...parsed,
      profile: {
        ...defaultState.profile,
        ...(parsed.profile || {})
      },
      metrics: {
        ...defaultState.metrics,
        ...(parsed.metrics || {})
      },
      goals: {
        ...defaultState.goals,
        ...(parsed.goals || {})
      },
      habits: Array.isArray(parsed.habits)
        ? parsed.habits
        : structuredClone(defaultState.habits),

      week: Array.isArray(parsed.week)
        ? parsed.week
        : [...defaultState.week]
    };

  } catch (error) {
    console.error("Erro ao carregar dados:", error);

    return structuredClone(defaultState);
  }
}


function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}


function showToast(message) {
  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}


function getInitial(name) {
  if (!name) return "J";

  return name
    .trim()
    .charAt(0)
    .toUpperCase();
}


function clamp(value, min, max) {
  return Math.min(
    Math.max(value, min),
    max
  );
}


function percentage(value, goal) {
  if (!goal || goal <= 0) return 0;

  return clamp(
    Math.round((value / goal) * 100),
    0,
    100
  );
}


/* =====================================================
   DATA
===================================================== */

function formatDate() {
  const date = new Date();

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long"
    }
  ).format(date);
}


function formatSleep(decimalHours) {
  const hours = Math.floor(decimalHours);

  const minutes = Math.round(
    (decimalHours - hours) * 60
  );

  return `${hours}h ${String(minutes).padStart(2, "0")}`;
}


/* =====================================================
   RESET DIÁRIO
===================================================== */

function resetDailyIfNeeded() {

  const today = getTodayKey();

  if (state.lastDate === today) {
    return;
  }

  state.lastDate = today;

  state.metrics = {
    water: 0,
    activity: 0,
    sleep: 0
  };

  state.habits = state.habits.map(habit => ({
    ...habit,
    completed: false
  }));

  saveState();
}


/* =====================================================
   NAVEGAÇÃO LANDING
===================================================== */

function openDashboard() {

  landing.classList.add("hidden");
  app.classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });

  renderAll();

  showView("overview");
}


function backToSite() {

  app.classList.add("hidden");
  landing.classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}


document.querySelectorAll(".js-start").forEach(button => {

  button.addEventListener("click", openDashboard);

});


document.getElementById("back-site")?.addEventListener(
  "click",
  backToSite
);


/* =====================================================
   MENU PRINCIPAL
===================================================== */

menuToggle?.addEventListener(
  "click",
  () => {

    const opened =
      mainNav.classList.toggle("open");

    menuToggle.setAttribute(
      "aria-expanded",
      opened
    );

  }
);


mainNav?.querySelectorAll("a").forEach(link => {

  link.addEventListener("click", () => {

    mainNav.classList.remove("open");

    menuToggle?.setAttribute(
      "aria-expanded",
      "false"
    );

  });

});


/* =====================================================
   HEADER SCROLL
===================================================== */

window.addEventListener(
  "scroll",
  () => {

    if (!siteHeader) return;

    siteHeader.classList.toggle(
      "scrolled",
      window.scrollY > 30
    );

  },
  { passive: true }
);


/* =====================================================
   NAVEGAÇÃO DO APP
===================================================== */

document.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest("[data-view]");

    if (!button) return;

    event.preventDefault();

    const view =
      button.dataset.view;

    if (!view) return;

    showView(view);

  }
);


function showView(viewName) {

  if (!app || app.classList.contains("hidden")) {
    return;
  }

  document
    .querySelectorAll(".app-view")
    .forEach(view => {

      view.classList.toggle(
        "active",
        view.id === `view-${viewName}`
      );

    });


  document
    .querySelectorAll(".side-link[data-view]")
    .forEach(link => {

      link.classList.toggle(
        "active",
        link.dataset.view === viewName
      );

    });


  if (window.innerWidth <= 760) {

    closeMobileMenu();

  }

  renderAll();
}


function closeMobileMenu() {

  const sidebar =
    document.querySelector(".sidebar");

  if (sidebar) {
    sidebar.classList.remove("mobile-open");
  }

}


/* =====================================================
   MOBILE APP MENU
===================================================== */

document.getElementById("app-menu")?.addEventListener(
  "click",
  () => {

    const views = [
      ["overview", "Visão geral"],
      ["habits", "Hábitos"],
      ["goals", "Metas"],
      ["progress", "Progresso"],
      ["profile", "Perfil"]
    ];

    const menu =
      views
        .map(
          (item, index) =>
            `${index + 1}. ${item[1]}`
        )
        .join("\n");

    const answer = prompt(
      `FITTRACK\n\n${menu}\n\nDigite o número:`
    );

    if (!answer) return;

    const index =
      Number(answer) - 1;

    if (
      index >= 0 &&
      index < views.length
    ) {
      showView(views[index][0]);
    }

  }
);


/* =====================================================
   RENDER GERAL
===================================================== */

function renderAll() {

  renderProfile();

  renderMetrics();

  renderHabits();

  renderGoals();

  renderCharts();

  renderDate();

}


/* =====================================================
   PERFIL
===================================================== */

function renderProfile() {

  const name =
    state.profile.name || "João";

  const initial =
    getInitial(name);


  const greeting =
    document.getElementById("user-greeting");

  const chipName =
    document.getElementById("profile-chip-name");

  const profileInitial =
    document.getElementById("profile-initial");

  const largeAvatar =
    document.getElementById("large-avatar");


  if (greeting) {
    greeting.textContent = name;
  }

  if (chipName) {
    chipName.textContent = name;
  }

  if (profileInitial) {
    profileInitial.textContent = initial;
  }

  if (largeAvatar) {
    largeAvatar.textContent = initial;
  }


  const mobileAvatar =
    document.querySelector(".mobile-avatar");

  if (mobileAvatar) {
    mobileAvatar.textContent = initial;
  }


  const nameInput =
    document.getElementById("profile-name");

  const goalInput =
    document.getElementById("profile-goal");

  const ageInput =
    document.getElementById("profile-age");

  const heightInput =
    document.getElementById("profile-height");

  const weightInput =
    document.getElementById("profile-weight");


  if (nameInput) {
    nameInput.value =
      state.profile.name || "";
  }

  if (goalInput) {
    goalInput.value =
      state.profile.goal || "";
  }

  if (ageInput) {
    ageInput.value =
      state.profile.age || "";
  }

  if (heightInput) {
    heightInput.value =
      state.profile.height || "";
  }

  if (weightInput) {
    weightInput.value =
      state.profile.weight || "";
  }

}


/* =====================================================
   DATA / DATA ATUAL
===================================================== */

function renderDate() {

  const element =
    document.getElementById("current-date");

  if (!element) return;

  element.textContent =
    formatDate();
}


/* =====================================================
   MÉTRICAS
===================================================== */

function renderMetrics() {

  const waterPercent =
    percentage(
      state.metrics.water,
      state.goals.water
    );

  const activityPercent =
    percentage(
      state.metrics.activity,
      state.goals.activity
    );

  const sleepPercent =
    percentage(
      state.metrics.sleep,
      state.goals.sleep
    );


  const completed =
    state.habits.filter(
      habit => habit.completed
    ).length;

  const total =
    state.habits.length;


  const habitPercent =
    total
      ? percentage(completed, total)
      : 0;


  setText(
    "water-value",
    state.metrics.water.toFixed(2)
  );

  setText(
    "water-percent",
    `${waterPercent}% da meta`
  );

  setWidth(
    "water-bar",
    waterPercent
  );


  setText(
    "activity-value",
    Math.round(state.metrics.activity)
  );

  setText(
    "activity-percent",
    `${activityPercent}% da meta`
  );

  setWidth(
    "activity-bar",
    activityPercent
  );


  setText(
    "sleep-value",
    formatSleep(state.metrics.sleep)
  );

  setText(
    "sleep-percent",
    `${sleepPercent}% da meta`
  );

  setWidth(
    "sleep-bar",
    sleepPercent
  );


  setText(
    "habits-complete",
    completed
  );

  setText(
    "habits-total",
    total
  );

  setText(
    "habits-percent",
    `${habitPercent}% concluído`
  );

  setWidth(
    "habits-bar",
    habitPercent
  );


  const streak =
    calculateCurrentStreak();

  setText(
    "streak-value",
    streak
  );

}


function setText(id, value) {

  const element =
    document.getElementById(id);

  if (element) {
    element.textContent = value;
  }

}


function setWidth(id, percentageValue) {

  const element =
    document.getElementById(id);

  if (!element) return;

  element.style.width =
    `${clamp(percentageValue, 0, 100)}%`;

}


/* =====================================================
   ÁGUA
===================================================== */

document.getElementById("add-water")?.addEventListener(
  "click",
  () => {

    state.metrics.water =
      Math.round(
        (state.metrics.water + 0.25) * 100
      ) / 100;

    saveState();

    renderAll();

    showToast(
      "💧 +250ml adicionados!"
    );

  }
);


/* =====================================================
   ATIVIDADE
===================================================== */

document.getElementById("add-activity")?.addEventListener(
  "click",
  () => {

    state.metrics.activity += 5;

    saveState();

    renderAll();

    showToast(
      "🚶 +5 minutos registrados!"
    );

  }
);


/* =====================================================
   SONO
===================================================== */

document.getElementById("edit-sleep")?.addEventListener(
  "click",
  () => {

    const modal =
      document.getElementById("sleep-modal");

    if (!modal) return;

    const hours =
      Math.floor(state.metrics.sleep);

    const minutes =
      Math.round(
        (state.metrics.sleep - hours) * 60
      );

    const hoursInput =
      document.getElementById("sleep-hours");

    const minutesInput =
      document.getElementById("sleep-minutes");


    if (hoursInput) {
      hoursInput.value = hours;
    }

    if (minutesInput) {
      minutesInput.value = minutes;
    }

    openModal(modal);

  }
);


document.getElementById("sleep-form")?.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    const hours =
      Number(
        document.getElementById(
          "sleep-hours"
        ).value
      );

    const minutes =
      Number(
        document.getElementById(
          "sleep-minutes"
        ).value
      );


    if (
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes)
    ) {
      return;
    }


    state.metrics.sleep =
      hours + minutes / 60;


    saveState();

    closeAllModals();

    renderAll();

    showToast(
      "🌙 Sono atualizado!"
    );

  }
);


/* =====================================================
   HÁBITOS
===================================================== */

function renderHabits() {

  const overview =
    document.getElementById(
      "overview-habits"
    );

  const all =
    document.getElementById(
      "all-habits"
    );


  const html =
    state.habits
      .map(habit => habitHTML(habit))
      .join("");


  if (overview) {
    overview.innerHTML =
      state.habits.length
        ? html
        : emptyHabitsHTML();
  }


  if (all) {
    all.innerHTML =
      state.habits.length
        ? html
        : emptyHabitsHTML();
  }


  setText(
    "habit-summary",
    `${state.habits.length} ${
      state.habits.length === 1
        ? "hábito"
        : "hábitos"
    }`
  );

}


function habitHTML(habit) {

  return `
    <div
      class="habit-item ${
        habit.completed ? "completed" : ""
      }"
      data-habit-id="${habit.id}"
    >

      <button
        class="habit-check"
        data-habit-toggle="${habit.id}"
        aria-label="Marcar hábito"
      >
        ✓
      </button>

      <div class="habit-info">

        <strong>
          ${escapeHTML(habit.name)}
        </strong>

        <small>
          ${escapeHTML(habit.frequency)}
        </small>

      </div>

      <span class="habit-streak">
        🔥 ${habit.streak}d
      </span>

      <button
        class="habit-delete"
        data-habit-delete="${habit.id}"
        aria-label="Excluir hábito"
      >
        ×
      </button>

    </div>
  `;
}


function emptyHabitsHTML() {

  return `
    <div class="habit-item">

      <div class="habit-info">

        <strong>
          Nenhum hábito criado
        </strong>

        <small>
          Clique em “Novo hábito” para começar.
        </small>

      </div>

    </div>
  `;

}


/* =====================================================
   EVENTOS DE HÁBITOS
===================================================== */

document.addEventListener(
  "click",
  event => {

    const toggle =
      event.target.closest(
        "[data-habit-toggle]"
      );

    const deleteButton =
      event.target.closest(
        "[data-habit-delete]"
      );


    if (toggle) {

      const id =
        Number(toggle.dataset.habitToggle);

      toggleHabit(id);

      return;
    }


    if (deleteButton) {

      const id =
        Number(deleteButton.dataset.habitDelete);

      deleteHabit(id);

    }

  }
);


function toggleHabit(id) {

  const habit =
    state.habits.find(
      item => item.id === id
    );

  if (!habit) return;

  habit.completed =
    !habit.completed;


  if (habit.completed) {

    habit.streak += 1;

    showToast(
      "🔥 Hábito concluído!"
    );

  } else {

    habit.streak =
      Math.max(
        0,
        habit.streak - 1
      );

    showToast(
      "Hábito desmarcado."
    );

  }


  updateWeek();

  saveState();

  renderAll();

}


function deleteHabit(id) {

  const habit =
    state.habits.find(
      item => item.id === id
    );

  if (!habit) return;


  const confirmed =
    confirm(
      `Excluir o hábito "${habit.name}"?`
    );

  if (!confirmed) return;


  state.habits =
    state.habits.filter(
      item => item.id !== id
    );


  updateWeek();

  saveState();

  renderAll();

  showToast(
    "Hábito excluído."
  );

}


/* =====================================================
   NOVO HÁBITO
===================================================== */

document.getElementById("new-habit")?.addEventListener(
  "click",
  () => {

    const modal =
      document.getElementById(
        "habit-modal"
      );

    if (!modal) return;

    const input =
      document.getElementById(
        "habit-name"
      );

    if (input) {
      input.value = "";
    }

    openModal(modal);

  }
);


document.getElementById("habit-form")?.addEventListener(
  "submit",
  event => {

    event.preventDefault();


    const nameInput =
      document.getElementById(
        "habit-name"
      );

    const frequencyInput =
      document.getElementById(
        "habit-frequency"
      );


    const name =
      nameInput.value.trim();

    const frequency =
      frequencyInput.value;


    if (!name) {
      showToast(
        "Digite o nome do hábito."
      );

      return;
    }


    const id =
      Date.now();


    state.habits.push({

      id,

      name,

      frequency,

      completed: false,

      streak: 0

    });


    saveState();

    closeAllModals();

    renderAll();

    showToast(
      "✓ Novo hábito criado!"
    );

  }
);


/* =====================================================
   METAS
===================================================== */

function renderGoals() {

  const container =
    document.getElementById(
      "goals-grid"
    );

  if (!container) return;


  const habitsCompleted =
    state.habits.filter(
      habit => habit.completed
    ).length;


  const goals = [

    {
      key: "water",
      icon: "💧",
      title: "Água",
      current: state.metrics.water,
      target: state.goals.water,
      unit: "L"
    },

    {
      key: "activity",
      icon: "🚶",
      title: "Atividade",
      current: state.metrics.activity,
      target: state.goals.activity,
      unit: "min"
    },

    {
      key: "sleep",
      icon: "☾",
  
