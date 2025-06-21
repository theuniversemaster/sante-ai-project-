// script.js — version complète refondue
document.addEventListener("DOMContentLoaded", () => {
/* ------------------ État ------------------ */
let data = {};
let currentUser = "";

const createUser = (name) => ({
profile: {
name,
initials: name.charAt(0).toUpperCase(),
age: "Non défini",
memberSince: new Date().getFullYear(),
},
dashboard: { nextAppointment: "Aucun", medsTaken: 0, medsTotal: 0 },
medicalHistory: {
allergies: "Aucune",
conditions: "Aucune",
medications: "Aucun",
vaccinations: "Aucune",
},
symptomLogs: [],
chatHistory: [],
});

function save() {
if (currentUser) localStorage.setItem(`santeAI_${currentUser}`, JSON.stringify(data));
}
function load(username) {
currentUser = username;
data = JSON.parse(localStorage.getItem(`santeAI_${username}`)) || createUser(username);
save();
}

/* ------------------ Navigation ------------------ */
const screens = [...document.querySelectorAll(".screen")];
const navBtns = [...document.querySelectorAll("[data-target]")];

function show(id) {
screens.forEach((s) => s.classList.toggle("active", s.id === id));
navBtns.forEach((b) => b.classList.toggle("active", b.dataset.target === id));
document.querySelector("#bottom-nav").style.display =
id === "welcome-screen" || id === "login-screen" ? "none" : "flex";
}

document.body.addEventListener("click", (e) => {
const btn = e.target.closest("[data-target]");
if (btn && btn.id !== "login-btn") show(btn.dataset.target);
});

/* ------------------ Login ------------------ */
document.querySelector("#login-btn").addEventListener("click", () => {
const name = document.querySelector("#username").value.trim();
if (!name) return alert("Veuillez indiquer un nom d’utilisateur.");
load(name);
renderUI();
show("dashboard-screen");
});

/* ------------------ Dashboard ------------------ */
function renderUI() {
const { profile, dashboard, medicalHistory } = data;
// Header
document.querySelector(".avatar-placeholder").textContent = profile.initials;
document.querySelector(".profile-name").textContent = profile.name;
document.querySelector(".profile-meta").textContent = `${profile.age} ans • Membre depuis ${profile.memberSince}`;
// Cards
document.querySelector("#dashboard-appointment").textContent = dashboard.nextAppointment;
document.querySelector(
"#dashboard-meds"
).innerHTML = `${dashboard.medsTaken} / ${dashboard.medsTotal} <small>pris</small>`;
}

/* ------------------ Chat ------------------ */
const chatInput = document.querySelector(".chat-input-area input");
const chatLog = document.querySelector(".chat-content");

function addMsg(role, txt) {
const div = document.createElement("div");
div.className = `chat-message ${role}-message`;
div.innerHTML = txt.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
chatLog.appendChild(div);
chatLog.scrollTop = chatLog.scrollHeight;
}

async function send() {
const text = chatInput.value.trim();
if (!text) return;
addMsg("user", text);
data.chatHistory.push({ role: "user", content: text });
chatInput.value = "";

// Typing …
const loader = document.createElement("div");
loader.className = "chat-message assistant-message";
loader.textContent = "…";
chatLog.appendChild(loader);
chatLog.scrollTop = chatLog.scrollHeight;

try {
const assistant = await askMistral([...data.chatHistory]);
loader.remove();
addMsg("assistant", assistant);
data.chatHistory.push({ role: "assistant", content: assistant });
save();
} catch {
loader.remove();
addMsg(
"assistant",
"Désolé, une erreur est survenue. Merci de réessayer plus tard."
);
}
}
document.querySelector(".send-btn").addEventListener("click", send);
chatInput.addEventListener("keypress", (e) => e.key === "Enter" && send());

async function askMistral(history) {
const system = {
role: "system",
content:
"Tu es SanteAI, assistant santé empathique. Jamais de diagnostic ni de prescription; conseille toujours de consulter un pro. Réponds en français en mettant les points essentiels en **gras**.",
};
const resp = await fetch("/.netlify/functions/ask-mistral", {
method: "POST",
body: JSON.stringify({ messages: [system, ...history] }),
});
const data = await resp.json();
if (!resp.ok) throw new Error();
return data.choices[0].message.content;
}

/* ------------------ Symptômes ------------------ */
const rangeInput = document.querySelector("#symptom-intensity");
const rangeVal = document.querySelector("#intensity-value");
rangeInput.addEventListener("input", () => (rangeVal.textContent = rangeInput.value));

document.querySelector("#symptom-submit-btn").addEventListener("click", () => {
const desc = document.querySelector("#symptom-description").value.trim();
if (!desc) return alert("Veuillez décrire le symptôme.");
const log = {
description: desc,
location: document.querySelector("#symptom-location").value,
intensity: rangeInput.value,
aggravating: document.querySelector("#symptom-aggravating").value.trim(),
appeasing: document.querySelector("#symptom-appeasing").value.trim(),
time: new Date().toISOString(),
};
data.symptomLogs.push(log);
save();
alert("Symptôme enregistré !");
document.querySelector("#symptom-form").reset();
rangeVal.textContent = 5;
show("dashboard-screen");
});

/* ------------------ Mode sombre ------------------ */
const darkToggle = document.querySelector("#dark-toggle");
function applyTheme() {
document.documentElement.dataset.theme = darkToggle.checked ? "dark" : "light";
localStorage.setItem("santeAI_theme", darkToggle.checked ? "dark" : "light");
}
darkToggle.addEventListener("change", applyTheme);
if (localStorage.getItem("santeAI_theme") === "dark") {
darkToggle.checked = true;
applyTheme();
}

/* ------------------ Init ------------------ */
show("welcome-screen");
});