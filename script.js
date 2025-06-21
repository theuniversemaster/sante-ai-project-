document.addEventListener("DOMContentLoaded", () => {
    /* ------------------ State Management ------------------ */
    let data = {};
    let currentUser = "";

    const createUser = (name) => ({
        profile: {
            name,
            initials: name.charAt(0).toUpperCase(),
            memberSince: new Date().getFullYear(),
        },
        medicalHistory: {
            dob: "Non défini", sex: "Non défini", bloodType: "Non défini",
            allergies: "Aucune", conditions: "Aucune", medications: "Aucun", vaccinations: "Aucune",
        },
        dashboard: { medsTaken: 0, medsTotal: 0 },
        appointments: [],
        symptomLogs: [],
        chatHistory: [],
    });

    function save() {
        if (currentUser) {
            localStorage.setItem(`santeAI_v2_${currentUser}`, JSON.stringify(data));
        }
    }

    function load(username) {
        currentUser = username;
        const saved = localStorage.getItem(`santeAI_v2_${currentUser}`);
        data = saved ? JSON.parse(saved) : createUser(username);
        save();
    }

    /* ------------------ Navigation ------------------ */
    const screens = [...document.querySelectorAll(".screen")];
    const navBtns = [...document.querySelectorAll("[data-target]")];
    const modals = [...document.querySelectorAll(".modal-overlay")];

    function showScreen(id) {
        screens.forEach((s) => s.classList.toggle("active", s.id === id));
        navBtns.forEach((b) => {
            const navBtn = b.closest('.nav-btn');
            if(navBtn) navBtn.classList.toggle("active", navBtn.dataset.target === id)
        });
        document.querySelector("#bottom-nav").style.display =
            id === "welcome-screen" || id === "login-screen" ? "none" : "flex";
    }
    
    function showModal(id, active) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.toggle('active', active);
    }

    document.body.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-target]");
        if (btn && btn.id !== "login-btn") showScreen(btn.dataset.target);
        
        if (e.target.closest('.close-modal-btn')) {
            modals.forEach(m => m.classList.remove('active'));
        }
    });

    /* ------------------ UI Rendering ------------------ */
    function renderUI() {
        if (!data.profile) return;
        renderDashboard();
        renderHealthRecord();
        renderAppointments();
    }
    
    function calculateAge(dob) {
        if (!dob || dob === "Non défini") return "Non défini";
        return Math.floor((new Date() - new Date(dob)) / 31557600000);
    }

    function renderDashboard() {
        const { profile, dashboard, appointments } = data;
        const age = calculateAge(data.medicalHistory.dob);
        document.querySelector(".avatar-placeholder").textContent = profile.initials;
        document.querySelector(".profile-name").textContent = profile.name;
        document.querySelector(".profile-meta").textContent = `${age} ans • Membre depuis ${profile.memberSince}`;

        const nextAppointment = appointments.filter(a => new Date(a.date) >= new Date()).sort((a,b) => new Date(a.date) - new Date(b.date))[0];
        document.querySelector("#dashboard-appointment").textContent = nextAppointment ? new Date(nextAppointment.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short'}) : "Aucun";
        document.querySelector("#dashboard-meds").innerHTML = `${dashboard.medsTaken} / ${dashboard.medsTotal} <small>pris</small>`;
    }

    function renderHealthRecord() {
        const { name } = data.profile;
        const { dob, sex, bloodType, allergies, conditions, medications, vaccinations } = data.medicalHistory;
        document.getElementById("record-name").textContent = name;
        document.getElementById("record-dob").textContent = dob;
        document.getElementById("record-sex").textContent = sex;
        document.getElementById("record-blood-type").textContent = bloodType;
        document.getElementById("record-allergies").textContent = allergies;
        document.getElementById("record-conditions").textContent = conditions;
        document.getElementById("record-medications").textContent = medications;
        document.getElementById("record-vaccinations").textContent = vaccinations;
    }

    function renderAppointments() {
        const list = document.getElementById("appointments-list");
        const empty = document.getElementById("appointments-empty");
        list.innerHTML = "";
        
        if (data.appointments.length === 0) {
            empty.style.display = 'block';
            return;
        }
        empty.style.display = 'none';

        const sortedAppointments = data.appointments.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        sortedAppointments.forEach(appt => {
            const date = new Date(appt.date);
            const card = document.createElement('div');
            card.className = 'appointment-card';
            card.dataset.id = appt.id;
            card.innerHTML = `
                <div class="appointment-date">
                    <span class="appointment-day">${date.getDate()}</span>
                    <span class="appointment-month">${date.toLocaleString('fr-FR', { month: 'short' })}</span>
                </div>
                <div class="appointment-details">
                    <p class="appointment-title">${appt.title}</p>
                    <p class="appointment-time">${appt.time}</p>
                </div>
            `;
            list.appendChild(card);
        });
    }

    /* ------------------ User Flow & Forms ------------------ */
    document.querySelector("#login-btn").addEventListener("click", () => {
        const name = document.querySelector("#username").value.trim();
        if (!name) return alert("Veuillez indiquer un nom de profil.");
        load(name);
        renderUI();
        showScreen("dashboard-screen");
    });
    
    document.querySelector("#logout-btn").addEventListener("click", () => {
        currentUser = "";
        data = {};
        showScreen('welcome-screen');
    });

    // Profile Edit
    document.getElementById('edit-profile-btn').addEventListener('click', () => {
        const { dob, sex, bloodType, allergies, conditions, medications, vaccinations } = data.medicalHistory;
        document.getElementById('edit-dob').value = dob !== "Non défini" ? dob : "";
        document.getElementById('edit-sex').value = sex;
        document.getElementById('edit-blood-type').value = bloodType;
        document.getElementById('edit-allergies').value = allergies !== "Aucune" ? allergies : "";
        document.getElementById('edit-conditions').value = conditions !== "Aucune" ? conditions : "";
        document.getElementById('edit-medications').value = medications !== "Aucun" ? medications : "";
        document.getElementById('edit-vaccinations').value = vaccinations !== "Aucune" ? vaccinations : "";
        showModal('profile-edit-modal', true);
    });

    document.getElementById('profile-edit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        data.medicalHistory = {
            dob: document.getElementById('edit-dob').value || "Non défini",
            sex: document.getElementById('edit-sex').value,
            bloodType: document.getElementById('edit-blood-type').value,
            allergies: document.getElementById('edit-allergies').value.trim() || "Aucune",
            conditions: document.getElementById('edit-conditions').value.trim() || "Aucune",
            medications: document.getElementById('edit-medications').value.trim() || "Aucun",
            vaccinations: document.getElementById('edit-vaccinations').value.trim() || "Aucune",
        };
        save();
        renderUI();
        showModal('profile-edit-modal', false);
    });
    
    // Appointments
    const appointmentForm = document.getElementById('appointment-form');
    document.getElementById('add-appointment-btn').addEventListener('click', () => {
        appointmentForm.reset();
        document.getElementById('appointment-id').value = '';
        document.getElementById('appointment-modal-title').textContent = 'Nouveau rendez-vous';
        document.getElementById('delete-appointment-btn').style.display = 'none';
        showModal('appointment-modal', true);
    });

    document.getElementById('appointments-list').addEventListener('click', (e) => {
        const card = e.target.closest('.appointment-card');
        if (!card) return;
        const appt = data.appointments.find(a => a.id == card.dataset.id);
        if (!appt) return;

        document.getElementById('appointment-id').value = appt.id;
        document.getElementById('appointment-title').value = appt.title;
        document.getElementById('appointment-date').value = appt.date;
        document.getElementById('appointment-time').value = appt.time;
        document.getElementById('appointment-notes').value = appt.notes;
        document.getElementById('appointment-modal-title').textContent = 'Modifier le rendez-vous';
        document.getElementById('delete-appointment-btn').style.display = 'block';
        showModal('appointment-modal', true);
    });
    
    appointmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('appointment-id').value;
        const newAppt = {
            id: id || Date.now(),
            title: document.getElementById('appointment-title').value.trim(),
            date: document.getElementById('appointment-date').value,
            time: document.getElementById('appointment-time').value,
            notes: document.getElementById('appointment-notes').value.trim(),
        };

        if (id) { // Edit
            data.appointments = data.appointments.map(a => a.id == id ? newAppt : a);
        } else { // Add
            data.appointments.push(newAppt);
        }
        save();
        renderUI();
        showModal('appointment-modal', false);
    });

    document.getElementById('delete-appointment-btn').addEventListener('click', () => {
        const id = document.getElementById('appointment-id').value;
        if (confirm("Voulez-vous vraiment supprimer ce rendez-vous ?")) {
            data.appointments = data.appointments.filter(a => a.id != id);
            save();
            renderUI();
            showModal('appointment-modal', false);
        }
    });

    /* ------------------ Chat & AI ------------------ */
    const chatInput = document.querySelector(".chat-input-area input");
    const chatLog = document.querySelector(".chat-content");

    function addMsg(role, txt) {
        const div = document.createElement("div");
        div.className = `chat-message ${role}-message`;
        div.innerHTML = txt.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
        chatLog.appendChild(div);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    async function send() {
        const text = chatInput.value.trim();
        if (!text) return;
        addMsg("user", text);
        data.chatHistory.push({ role: "user", content: text });
        chatInput.value = "";

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
            addMsg("assistant", "Désolé, une erreur est survenue.");
        }
    }
    document.querySelector(".send-btn").addEventListener("click", send);
    chatInput.addEventListener("keypress", (e) => e.key === "Enter" && send());

    async function askMistral(history) {
        let context = `[CONTEXTE UTILISATEUR]\n- Nom: ${data.profile.name}\n- Âge: ${calculateAge(data.medicalHistory.dob)} ans\n- Sexe: ${data.medicalHistory.sex}\n- Allergies: ${data.medicalHistory.allergies}\n- Conditions: ${data.medicalHistory.conditions}\n- Médicaments: ${data.medicalHistory.medications}`;
        const lastSymptom = data.symptomLogs.slice(-1)[0];
        if(lastSymptom) context += `\n- Dernier symptôme: ${lastSymptom.description} (Intensité: ${lastSymptom.intensity}/10)`;
        const nextAppt = data.appointments.filter(a => new Date(a.date) >= new Date()).sort((a,b) => new Date(a.date) - new Date(b.date))[0];
        if(nextAppt) context += `\n- Prochain RDV: ${nextAppt.title} le ${new Date(nextAppt.date).toLocaleDateString('fr-FR')}`;
        context += `\n[FIN DU CONTEXTE]`;
        
        const system = { role: "system", content: "Tu es SanteAI, assistant empathique. Jamais de diagnostic ni de prescription; conseille toujours de consulter un pro. Réponds en français en mettant les points essentiels en **gras**. Utilise le contexte fourni pour personnaliser tes réponses." };
        const resp = await fetch("/.netlify/functions/ask-mistral", { method: "POST", body: JSON.stringify({ messages: [system, {role: "user", content: context}, ...history.slice(-6)] }) });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error);
        return json.choices[0].message.content;
    }

    /* ------------------ Symptom Logger ------------------ */
    const rangeInput = document.querySelector("#symptom-intensity");
    rangeInput.addEventListener("input", () => (document.querySelector("#intensity-value").textContent = rangeInput.value));
    document.querySelector("#symptom-submit-btn").addEventListener("click", () => {
        const desc = document.querySelector("#symptom-description").value.trim();
        if (!desc) return alert("Veuillez décrire le symptôme.");
        data.symptomLogs.push({
            description: desc,
            location: document.querySelector("#symptom-location").value.trim(),
            intensity: rangeInput.value,
            aggravating: document.querySelector("#symptom-aggravating").value.trim(),
            appeasing: document.querySelector("#symptom-appeasing").value.trim(),
            time: new Date().toISOString(),
        });
        save();
        alert("Symptôme enregistré !");
        document.querySelector("#symptom-form").reset();
        document.querySelector("#intensity-value").textContent = 5;
        showScreen("dashboard-screen");
    });

    /* ------------------ Dark Mode ------------------ */
    const darkToggle = document.querySelector("#dark-toggle");
    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem("santeAI_theme", theme);
        darkToggle.checked = theme === 'dark';
    }
    darkToggle.addEventListener("change", () => applyTheme(darkToggle.checked ? "dark" : "light"));
    
    /* ------------------ Init ------------------ */
    const preferredTheme = localStorage.getItem("santeAI_theme") || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(preferredTheme);
    showScreen("welcome-screen");
});