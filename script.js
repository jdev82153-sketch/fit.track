/* =========================================================
   FITTRACK
   SCRIPT.JS
========================================================= */

/*
    URL DO BACKEND

    Durante desenvolvimento:
    http://localhost:3000/api

    Quando colocar seu backend online, troque para:
    https://SEU-BACKEND.com/api
*/

const API = window.FITTRACK_API || "http://localhost:3000/api";


/* =========================================================
   ESTADO
========================================================= */

let authMode = "register";

let currentUser = null;

let habits = [];

let goals = [];

let localMetrics = {
    water: 0,
    activity: 0,
    sleep: 0
};


/* =========================================================
   ELEMENTOS
========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    loadLocalData();

    setupAuthMode();

    await restoreSession();

    renderHabits();

    renderGoals();

    updateMetricsUI();

});


/* =========================================================
   LOCAL DATA
========================================================= */

function loadLocalData() {

    try {

        const savedMetrics = localStorage.getItem(
            "fittrack_local_metrics"
        );

        if (savedMetrics) {
            localMetrics = {
                ...localMetrics,
                ...JSON.parse(savedMetrics)
            };
        }

        const savedHabits = localStorage.getItem(
            "fittrack_local_habits"
        );

        if (savedHabits) {
            habits = JSON.parse(savedHabits);
        }

        const savedGoals = localStorage.getItem(
            "fittrack_local_goals"
        );

        if (savedGoals) {
            goals = JSON.parse(savedGoals);
        }

    } catch (error) {

        console.error(
            "Erro ao carregar dados locais:",
            error
        );

    }

}


function saveLocalData() {

    localStorage.setItem(
        "fittrack_local_metrics",
        JSON.stringify(localMetrics)
    );

    localStorage.setItem(
        "fittrack_local_habits",
        JSON.stringify(habits)
    );

    localStorage.setItem(
        "fittrack_local_goals",
        JSON.stringify(goals)
    );

}


/* =========================================================
   API
========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const token = localStorage.getItem(
        "fittrack_token"
    );

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {

        const response = await fetch(
            `${API}${endpoint}`,
            {
                ...options,
                headers
            }
        );

        const contentType =
            response.headers.get("content-type") || "";

        const data = contentType.includes("application/json")
            ? await response.json()
            : await response.text();

        if (!response.ok) {

            const message =
                data?.message ||
                data?.error ||
                "Não foi possível completar a solicitação.";

            throw new Error(message);
        }

        return data;

    } catch (error) {

        console.error(
            `API ${endpoint}:`,
            error
        );

        throw error;
    }
}


/* =========================================================
   SESSION
========================================================= */

async function restoreSession() {

    const token = localStorage.getItem(
        "fittrack_token"
    );

    if (!token) {
        return;
    }

    try {

        const data = await apiRequest(
            "/auth/me"
        );

        currentUser =
            data.user ||
            data;

        if (
            currentUser.role === "owner" ||
            currentUser.role === "admin"
        ) {

            showPage("admin");

            await loadAdminUsers();

        } else {

            showPage("dashboard");

            await loadUserData();

        }

        updateLoggedHeader();

    } catch (error) {

        localStorage.removeItem(
            "fittrack_token"
        );

        currentUser = null;

    }

}


/* =========================================================
   PAGES
========================================================= */

function showPage(page) {

    const pages = [
        "home",
        "auth",
        "dashboard",
        "checkout",
        "admin"
    ];

    pages.forEach((name) => {

        const element = $(`#${name}Page`);

        if (element) {
            element.classList.remove("active");
        }

    });


    const target =
        $(`#${page}Page`);

    if (target) {
        target.classList.add("active");
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (page === "dashboard") {
        updateDashboard();
    }

    if (page === "admin") {
        loadAdminUsers();
    }

}


/* =========================================================
   MOBILE MENU
========================================================= */

function toggleMobileMenu() {

    $("#mobileMenu")?.classList.toggle(
        "open"
    );

}


function closeMobileMenu() {

    $("#mobileMenu")?.classList.remove(
        "open"
    );

}


/* =========================================================
   AUTH
========================================================= */

function openAuth(mode = "register") {

    authMode = mode;

    setupAuthMode();

    showPage("auth");

}


function setupAuthMode() {

    const nameField =
        $("#nameField");

    const title =
        $("#authTitle");

    const subtitle =
        $("#authSubtitle");

    const submit =
        $("#authSubmit");

    const switchText =
        $("#authSwitchText");

    const switchButton =
        $("#authSwitchButton");

    const nameInput =
        $("#authName");


    if (authMode === "login") {

        if (nameField) {
            nameField.style.display = "none";
        }

        if (nameInput) {
            nameInput.required = false;
        }

        if (title) {
            title.textContent =
                "Bem-vindo de volta";
        }

        if (subtitle) {
            subtitle.textContent =
                "Entre na sua conta FITTRACK.";
        }

        if (submit) {
            submit.textContent =
                "Entrar";
        }

        if (switchText) {
            switchText.textContent =
                "Ainda não possui uma conta?";
        }

        if (switchButton) {
            switchButton.textContent =
                "Criar conta";
        }

    } else {

        if (nameField) {
            nameField.style.display = "grid";
        }

        if (nameInput) {
            nameInput.required = true;
        }

        if (title) {
            title.textContent =
                "Criar sua conta";
        }

        if (subtitle) {
            subtitle.textContent =
                "Comece sua jornada gratuitamente.";
        }

        if (submit) {
            submit.textContent =
                "Criar conta";
        }

        if (switchText) {
            switchText.textContent =
                "Já possui uma conta?";
        }

        if (switchButton) {
            switchButton.textContent =
                "Entrar";
        }

    }

}


function toggleAuthMode() {

    authMode =
        authMode === "login"
            ? "register"
            : "login";

    setupAuthMode();

}


async function handleAuth(event) {

    event.preventDefault();

    const errorElement =
        $("#authError");

    errorElement.textContent = "";


    const name =
        $("#authName")?.value.trim();

    const email =
        $("#authEmail")?.value.trim();

    const password =
        $("#authPassword")?.value;


    if (!email || !password) {

        errorElement.textContent =
            "Preencha e-mail e senha.";

        return;
    }


    if (
        authMode === "register" &&
        !name
    ) {

        errorElement.textContent =
            "Informe seu nome.";

        return;
    }


    const submit =
        $("#authSubmit");

    const originalText =
        submit.textContent;

    submit.disabled = true;
    submit.textContent =
        "Aguarde...";


    try {

        let data;


        if (authMode === "register") {

            data = await apiRequest(
                "/auth/register",
                {
                    method: "POST",
                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );

        } else {

            data = await apiRequest(
                "/auth/login",
                {
                    method: "POST",
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

        }


        const token =
            data.token ||
            data.accessToken;

        if (!token) {
            throw new Error(
                "O servidor não retornou o token de acesso."
            );
        }


        localStorage.setItem(
            "fittrack_token",
            token
        );


        currentUser =
            data.user ||
            data;


        $("#authForm").reset();

        showToast(
            authMode === "register"
                ? "Conta criada com sucesso!"
                : "Login realizado!"
        );


        if (
            currentUser.role === "owner" ||
            currentUser.role === "admin"
        ) {

            showPage("admin");

            await loadAdminUsers();

        } else {

            showPage("dashboard");

            await loadUserData();

        }


        updateLoggedHeader();


    } catch (error) {

        errorElement.textContent =
            error.message ||
            "Não foi possível entrar.";

    } finally {

        submit.disabled = false;

        submit.textContent =
            originalText;

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    localStorage.removeItem(
        "fittrack_token"
    );

    currentUser = null;

    habits = [];

    showPage("home");

    updateLoggedHeader();

    showToast(
        "Você saiu da sua conta."
    );

}


/* =========================================================
   HEADER
========================================================= */

function updateLoggedHeader() {

    const loginButton =
        $("#loginHeaderButton");

    if (!loginButton) {
        return;
    }

    if (currentUser) {

        loginButton.textContent =
            "Dashboard";

        loginButton.onclick = () => {

            if (
                currentUser.role === "owner" ||
                currentUser.role === "admin"
            ) {
                showPage("admin");
            } else {
                showPage("dashboard");
            }

        };

    } else {

        loginButton.textContent =
            "Entrar";

        loginButton.onclick =
            () => openAuth("login");

    }

}


/* =========================================================
   USER DATA
========================================================= */

async function loadUserData() {

    try {

        const me =
            await apiRequest(
                "/auth/me"
            );

        currentUser =
            me.user ||
            me;


        try {

            const habitsData =
                await apiRequest(
                    "/me/habits"
                );

            if (Array.isArray(habitsData)) {
                habits = habitsData;
            } else if (
                Array.isArray(habitsData.habits)
            ) {
                habits = habitsData.habits;
            }

        } catch (error) {

            console.warn(
                "Não foi possível carregar hábitos da API."
            );

        }


        try {

            const metricsData =
                await apiRequest(
                    "/me/metrics"
                );

            const metrics =
                metricsData.metrics ||
                metricsData;

            if (metrics) {

                localMetrics = {
                    ...localMetrics,
                    ...metrics
                };

            }

        } catch (error) {

            console.warn(
                "Não foi possível carregar métricas da API."
            );

        }


        renderHabits();

        updateMetricsUI();

        updateDashboard();

        saveLocalData();

    } catch (error) {

        console.warn(
            "Modo local:",
            error.message
        );

        updateDashboard();

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    if (!currentUser) {
        return;
    }


    const name =
        currentUser.name ||
        currentUser.username ||
        "você";


    const dashboardName =
        $("#dashboardUserName");

    if (dashboardName) {
        dashboardName.textContent =
            name.split(" ")[0];
    }


    const premium =
        isPremium();


    const planBadge =
        $("#dashboardPlanBadge");

    if (planBadge) {

        planBadge.textContent =
            premium
                ? "PREMIUM"
                : "FREE";

        planBadge.classList.toggle(
            "premium",
            premium
        );

    }


    const sidebarPlan =
        $("#sidebarPlan");

    if (sidebarPlan) {

        sidebarPlan.querySelector(
            "strong"
        ).textContent =
            premium
                ? "PREMIUM"
                : "FREE";

    }


    const profilePlan =
        $("#profilePlan");

    if (profilePlan) {

        profilePlan.textContent =
            premium
                ? "PREMIUM"
                : "FREE";

    }


    const description =
        $("#profilePlanDescription");

    if (description) {

        description.textContent =
            premium
                ? "Seu acesso Premium está ativo."
                : "Você está utilizando o plano gratuito.";

    }


    const premiumButton =
        $("#profilePremiumButton");

    if (premiumButton) {

        premiumButton.style.display =
            premium
                ? "none"
                : "flex";

    }


    const premiumCard =
        $("#premiumDashboardCard");

    if (premiumCard) {

        premiumCard.style.display =
            premium
                ? "none"
                : "flex";

    }


    fillProfile();

    renderGoals();

}


/* =========================================================
   PLAN
========================================================= */

function isPremium() {

    if (!currentUser) {
        return false;
    }


    if (
        currentUser.plan === "premium" ||
        currentUser.plan === "PREMIUM"
    ) {
        return true;
    }


    if (
        currentUser.premiumUntil ||
        currentUser.premium_until
    ) {

        const date =
            new Date(
                currentUser.premiumUntil ||
                currentUser.premium_until
            );

        return date > new Date();

    }


    return false;

}


/* =========================================================
   DASHBOARD SECTIONS
========================================================= */

function switchDashboardSection(section) {

    $$(".dashboard-section")
        .forEach((element) => {

            element.classList.remove(
                "active"
            );

        });


    const target =
        $(`#section-${section}`);

    if (target) {
        target.classList.add(
            "active"
        );
    }


    $$(".dashboard-nav-item")
        .forEach((button) => {

            button.classList.toggle(
                "active",
                button.dataset.section === section
            );

        });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (section === "habits") {
        renderHabits();
    }

    if (section === "progress") {
        updateMetricsUI();
    }

    if (section === "profile") {
        fillProfile();
    }

}


function toggleSidebar() {

    $(".sidebar")?.classList.toggle(
        "open"
    );

}


/* =========================================================
   METRICS
========================================================= */

function updateMetricsUI() {

    const water =
        Number(localMetrics.water || 0);

    const activity =
        Number(localMetrics.activity || 0);

    const sleep =
        Number(localMetrics.sleep || 0);


    const waterElement =
        $("#waterValue");

    if (waterElement) {

        waterElement.textContent =
            `${water.toLocaleString("pt-BR")} ml`;

    }


    const waterProgress =
        $("#waterProgress");

    if (waterProgress) {

        waterProgress.style.width =
            `${Math.min((water / 2000) * 100, 100)}%`;

    }


    const activityElement =
        $("#activityValue");

    if (activityElement) {

        activityElement.textContent =
            activity.toLocaleString("pt-BR");

    }


    const activityProgress =
        $("#activityProgress");

    if (activityProgress) {

        activityProgress.style.width =
            `${Math.min((activity / 10000) * 100, 100)}%`;

    }


    const sleepElement =
        $("#sleepValue");

    if (sleepElement) {

        sleepElement.textContent =
            `${sleep}h`;

    }


    const sleepProgress =
        $("#sleepProgress");

    if (sleepProgress) {

        sleepProgress.style.width =
            `${Math.min((sleep / 8) * 100, 100)}%`;

    }


    const historyWater =
        $("#historyWater");

    if (historyWater) {
        historyWater.textContent =
            `${water.toLocaleString("pt-BR")} ml`;
    }


    const historyActivity =
        $("#historyActivity");

    if (historyActivity) {
        historyActivity.textContent =
            activity.toLocaleString("pt-BR");
    }


    const historySleep =
        $("#historySleep");

    if (historySleep) {
        historySleep.textContent =
            `${sleep}h`;
    }


    const completed =
        habits.filter(
            habit => habit.completed
        ).length;


    const historyHabits =
        $("#historyHabits");

    if (historyHabits) {
        historyHabits.textContent =
            completed;
    }


    const total =
        habits.length;

    const percentage =
        total
            ? Math.round(
                (completed / total) * 100
            )
            : 0;


    const progressPercentage =
        $("#progressPercentage");

    if (progressPercentage) {

        progressPercentage.textContent =
            `${percentage}%`;

    }


    const streak =
        $("#streakValue");

    if (streak) {

        streak.textContent =
            `${calculateStreak()} dias`;

    }

}


/* =========================================================
   WATER
========================================================= */

async function addWater(amount) {

    localMetrics.water =
        Number(localMetrics.water || 0) +
        amount;


    saveLocalData();

    updateMetricsUI();


    try {

        aw
