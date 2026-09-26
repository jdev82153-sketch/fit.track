const STORAGE_KEY = "fittrack_mvp_v4";


const defaultState = {

    date:
        new Date()
            .toISOString()
            .slice(0, 10),

    water: 0,

    activity: 0,

    sleep: 0,

    habits: [

        {
            id: 1,
            name: "Beber água",
            frequency: "Diário",
            done: false
        },

        {
            id: 2,
            name: "Caminhar",
            frequency: "Diário",
            done: false
        },

        {
            id: 3,
            name: "Dormir no horário",
            frequency: "Diário",
            done: false
        }

    ],

    goals: {

        water: 2,

        activity: 30,

        sleep: 8,

        habits: 3

    },

    profile: {

        name: "Você",

        goal:
            "Criar uma rotina mais consistente",

        age: "",

        height: "",

        weight: ""

    },

    history: [

        60,
        75,
        80,
        65,
        90,
        85,
        95

    ]

};


let state = loadState();


/* =========================================
   STORAGE
========================================= */

function loadState() {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            );


        if (saved) {

            const today =
                new Date()
                    .toISOString()
                    .slice(0, 10);


            if (saved.date !== today) {

                saved.date = today;

                saved.water = 0;

                saved.activity = 0;

                saved.sleep = 0;

                saved.habits =
                    (saved.habits || [])
                        .map(h => ({
                            ...h,
                            done: false
                        }));

            }


            return {

                ...structuredClone(defaultState),

                ...saved

            };

        }

    } catch (error) {

        console.log(
            "Não foi possível carregar os dados."
        );

    }


    return structuredClone(defaultState);
}


function save() {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(state)

    );

    renderAll();
}


/* =========================================
   HELPERS
========================================= */

const $ =
    selector =>
        document.querySelector(selector);


const $$ =
    selector =>
        [...document.querySelectorAll(selector)];


function percentage(value, goal) {

    return Math.min(

        100,

        Math.round(

            ((Number(value) || 0) /
            (Number(goal) || 1)) *
            100

        )

    );

}


function escapeHTML(value) {

    return String(value)
        .replace(
            /[&<>"']/g,
            character => ({

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            })[character]
        );

}


/* =========================================
   DAILY SCORE
========================================= */

function getDailyPercentage() {

    const water =
        percentage(
            state.water,
            state.goals.water
        );


    const activity =
        percentage(
            state.activity,
            state.goals.activity
        );


    const sleep =
        percentage(
            state.sleep,
            state.goals.sleep
        );


    const habits =
        state.habits.length

            ? Math.round(
                (
                    state.habits
                        .filter(h => h.done)
                        .length /
                    state.habits.length
                ) * 100
            )

            : 0;


    return Math.round(

        (
            water +
            activity +
            sleep +
            habits
        ) / 4

    );

}


/* =========================================
   RENDER PRINCIPAL
========================================= */

function renderAll() {

    renderDate();

    renderOverview();

    renderHabits();

    renderGoals();

    renderCharts();

    renderProfile();

}


/* =========================================
   DATE
========================================= */

function renderDate() {

    const dateElement =
        $("#todayLabel");


    if (!dateElement) return;


    dateElement.textContent =
        new Date().toLocaleDateString(
            "pt-BR",
            {
                weekday: "long",
                day: "2-digit",
                month: "long"
            }
        );

}


/* =========================================
   OVERVIEW
========================================= */

function renderOverview() {

    const userName =
        $("#userName");


    if (userName) {

        userName.textContent =
            state.profile.name || "Você";

    }


    $("#dailyPercent").textContent =
        getDailyPercentage() + "%";


    $("#waterValue").textContent =
        Number(state.water)
            .toFixed(2)
            .replace(".", ",");


    $("#activityValue").textContent =
        state.activity;


    $("#sleepValue").textContent =
        Number(state.sleep)
            .toFixed(1)
            .replace(".", ",");


    $("#habitDone").textContent =
        state.habits
            .filter(h => h.done)
            .length;


    $("#habitTotal").textContent =
        state.habits.length;


    $("#waterBar").style.width =
        percentage(
            state.water,
            state.goals.water
        ) + "%";


    $("#activityBar").style.width =
        percentage(
            state.activity,
            state.goals.activity
        ) + "%";


    $("#sleepBar").style.width =
        percentage(
            state.sleep,
            state.goals.sleep
        ) + "%";


    const habitPercentage =
        state.habits.length

            ? (
                state.habits
                    .filter(h => h.done)
                    .length /
                state.habits.length
            ) * 100

            : 0;


    $("#habitBar").style.width =
        habitPercentage + "%";

}


/* =========================================
   GRÁFICOS
========================================= */

function renderCharts() {

    renderChart(
        "#miniChart",
        state.history
    );


    renderChart(
        "#bigChart",
        state.history
    );

}


function renderChart(
    selector,
    data
) {

    const element =
        $(selector);


    if (!element) return;


    const labels = [

        "Seg",
        "Ter",
        "Qua",
        "Qui",
        "Sex",
        "Sáb",
        "Dom"

    ];


    element.innerHTML =

        data.map(

            (value, index) => `

                <span
                    style="height:${Math.max(
                        8,
                        value
                    )}%"
                >

                    <small>
                        ${labels[index]}
                    </small>

                </span>

            `

        ).join("");

}


/* =========================================
   GOALS
========================================= */

function renderGoals() {

    const doneHabits =
        state.habits
            .filter(h => h.done)
            .length;


    const goals = [

        {
            icon: "💧",
            name: "Água",
            value:
                `${Number(state.water)
                    .toFixed(2)
                    .replace(".", ",")} / ${state.goals.water} L`,
            percentage:
                percentage(
                    state.water,
                    state.goals.water
                )
        },

        {
            icon: "🏃",
            name: "Atividade",
            value:
                `${state.activity} / ${state.goals.activity} min`,
            percentage:
                percentage(
                    state.activity,
                    state.goals.activity
                )
        },

        {
            icon: "◷",
            name: "Sono",
            value:
                `${Number(state.sleep)
                    .toFixed(1)
                    .replace(".", ",")} / ${state.goals.sleep} h`,
            percentage:
                percentage(
                    state.sleep,
                    state.goals.sleep
                )
        },

        {
            icon: "✓",
            name: "Hábitos",
            value:
                `${doneHabits} / ${state.goals.habits}`,
            percentage:
                Math.min(
                    100,
                    Math.round(
                        doneHabits /
                        state.goals.habits *
                        100
                    )
                )
        }

    ];


    const summary =
        $("#goalSummary");


    if (summary) {

        summary.innerHTML =
            goals.map(goal => `

                <div class="goal-row">

                    <span>
                        ${goal.icon}
                    </span>

                    <div>

                        <b>
                            ${goal.name}
                        </b>

                        <small>
                            ${goal.value}
                        </small>

                    </div>

                    <strong>
                        ${goal.percentage}%
                    </strong>

                </div>

            `).join("");

    }


    const list =
        $("#goalList");


    if (list) {

        const keys = [

            "water",
            "activity",
            "sleep",
            "habits"

        ];


        list.innerHTML =
            goals.map(
                (goal, index) => `

                    <div class="goal-item">

                        <span>
                            ${goal.icon}
                        </span>

                        <div>

                            <b>
                                ${goal.name}
                            </b>

                            <small>
                                Meta atual:
                                ${goal.value.split(" / ")[1]}
                            </small>

                        </div>

                        <strong class="goal-value">
                            ${goal.percentage}%
                        </strong>

                        <button
                            class="mini-btn edit-goal"
                            data-goal="${keys[index]}"
                        >
                            Editar
                        </button>

                    </div>

                `
            ).join("");

    }

}


/* =========================================
   HABITS
========================================= */

function renderHabits() {

    const list =
        $("#habitList");


    if (!list) return;


    if (!state.habits.length) {

        list.innerHTML = `

            <div class="panel">

                <p>
                    Nenhum hábito criado ainda.
                </p>

            </div>

        `;

        return;

    }


    list.innerHTML =

        state.habits.map(
            habit => `

                <div class="habit-item">

                    <button
                        class="check ${
                            habit.done
                                ? "done"
                                : ""
                        }"
                        data-toggle="${habit.id}"
                    >
                        ${
                            habit.done
                                ? "✓"
                                : ""
                        }
                    </button>


                    <div class="habit-main">

                        <b>
                            ${escapeHTML(
                                habit.name
                            )}
                        </b>

                        <small>
                            ${escapeHTML(
                                habit.frequency
                            )}
                        </small>

                    </div>


                    <div class="habit-actions">

                        <button
                            class="mini-btn danger"
                            data-delete="${habit.id}"
                        >
                            Excluir
                        </button>

                    </div>

                </div>

            `
        ).join("");

}


/* =========================================
   PROFILE
========================================= */

function renderProfile() {

    $("#profileName").value =
        state.profile.name || "";


    $("#profileGoal").value =
        state.profile.goal || "";


    $("#profileAge").value =
        state.profile.age || "";


    $("#profileHeight").value =
        state.profile.height || "";


    $("#profileWeight").value =
        state.profile.weight || "";

}


/* =========================================
   NAVEGAÇÃO
========================================= */

function openScreen(screen) {

    $$(".side-link")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.screen === screen
            );

        });


    $$(".screen")
        .forEach(section => {

            section.classList.toggle(

                "active",

                section.id ===
                `screen-${screen}`

            );

        });


    const titles = {

        overview: "Visão geral",

        habits: "Hábitos",

        goals: "Metas",

        progress: "Progresso",

        help: "Ajuda",

        profile: "Perfil"

    };


    $("#screenTitle").textContent =
        titles[screen] || "FITTRACK";


    document
        .querySelector(".app-shell")
        ?.scrollIntoView({

            behavior: "smooth",

            block: "start"

        });

}


/* =========================================
   MODAIS
========================================= */

function openModal(id) {

    const modal = $(id);


    if (!modal) return;


    modal.classList.add("open");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeModals() {

    $$(".modal")
        .forEach(modal => {

            modal.classList.remove("open");

            modal.setAttribute(
                "aria-hidden",
                "true"
            );

        });

}


/* =========================================
   CLIQUES
========================================= */

document.addEventListener(
    "click",
    event => {

        const screenButton =
            event.target.closest(
                "[data-screen]"
            );


        if (screenButton) {

            openScreen(
                screenButton.dataset.screen
            );

        }


        const targetButton =
            event.target.closest(
                "[data-screen-target]"
            );


        if (targetButton) {

            openScreen(
                targetButton.dataset.screenTarget
            );

        }


        const openApp =
            event.target.closest(
                "[data-open-app]"
            );


        if (openApp) {

            openScreen("overview");

        }


        const action =
            event.target.closest(
                "[data-action]"
            )?.dataset.action;


        /* Água */

        if (action === "water") {

            state.water =
                Math.min(
                    10,
                    state.water + 0.25
                );

            save();

        }


        /* Atividade */

        if (action === "activity") {

            state.activity =
                Math.min(
                    300,
                    state.activity + 10
                );

            save();

        }


        /* Sono */

        if (action === "sleep") {

            openModal(
                "#sleepModal"
            );

        }


        /* Novo hábito */

        if (
            event.target.closest(
                "#newHabit"
            )
        ) {

            openModal(
                "#habitModal"
            );

        }


        /* Fechar */

        if (
            event.target.closest(
                "[data-close-modal]"
            )
        ) {

            closeModals();

        }


        /* Toggle hábito */

        const toggle =
            event.target.closest(
                "[data-toggle]"
            );


        if (toggle) {

            const habit =
                state.habits.find(
                    item =>
                        item.id ==
                        toggle.dataset.toggle
                );


            if (habit) {

                habit.done =
                    !habit.done;

                save();

            }

        }


        /* Excluir hábito */

        const deleteButton =
            event.target.closest(
                "[data-delete]"
            );


        if (deleteButton) {

            state.habits =
                state.habits.filter(
                    item =>
                        item.id !=
                        deleteButton.dataset.delete
                );

            save();

        }


        /* Editar meta */

        const editGoal =
            event.target.closest(
                ".edit-goal"
            );


        if (editGoal) {

            const key =
                editGoal.dataset.goal;


            const labels = {

                water:
                    "Litros de água",

                activity:
                    "Minutos de atividade",

                sleep:
                    "Horas de sono",

                habits:
                    "Hábitos por dia"

            };


            const value =
                prompt(

                    `Nova meta — ${labels[key]}`,

                    state.goals[key]

                );


            if (
                value !== null &&
                !isNaN(value) &&
                Number(value) > 0
            ) {

                state.goals[key] =
                    Number(value);

                save();

            }

        }


        /* Reset */

        if (
            event.target.closest(
                "#resetData"
            )
        ) {

            const confirmed =
                confirm(
                    "Resetar todos os dados locais do FITTRACK?"
                );


            if (confirmed) {

                state =
                    structuredClone(
                        defaultState
                    );

                save();

            }

        }

    }
);


/* =========================================
   FECHAR MODAL CLICANDO FORA
========================================= */

document.addEventListener(
    "click",
    event => {

        if (
            event.target.classList.contains(
                "modal"
            )
        ) {

            closeModals();

        }

    }
);


/* =========================================
   NOVO HÁBITO
========================================= */

$("#habitForm")
    .addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const name =
                $("#habitName")
                    .value
                    .trim();


            if (!name) return;


            state.habits.push({

                id: Date.now(),

                name: name,

                frequency:
                    $("#habitFrequency").value,

                done: false

            });


            event.target.reset();

            closeModals();

            save();

            openScreen("habits");

        }
    );


/* =========================================
   SONO
========================================= */

$("#sleepForm")
    .addEventListene
