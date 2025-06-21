// SanteAI Script - V3.5

document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================================
    // 1. STATE MANAGEMENT & DATA
    // ===================================================================================
    let santeAIData = {};
    let currentUser = localStorage.getItem('santeAI_currentUser') || '';

    const createNewUserData = (username) => ({
        profile: { 
            name: username, 
            initials: username.charAt(0).toUpperCase(), 
            dob: "Non défini", 
            sex: "Non défini", 
            bloodType: "Non défini", 
            memberSince: new Date().getFullYear(), 
            age: "Non défini" 
        },
        medicalHistory: { allergies: "Aucune", conditions: "Aucune", medications: "Aucun", vaccinations: "Aucune" },
        dashboard: { nextAppointment: "Aucun", medsTaken: 0, medsTotal: 0 },
        symptomLogs: [], 
        chatHistory: []
    });

    function saveData() { 
        if (currentUser) {
            localStorage.setItem(`santeAIData_${currentUser}`, JSON.stringify(santeAIData)); 
            localStorage.setItem('santeAI_currentUser', currentUser);
        }
    }

    function loadOrCreateUser(username) {
        currentUser = username;
        const savedData = localStorage.getItem(`santeAIData_${currentUser}`);
        santeAIData = savedData ? JSON.parse(savedData) : createNewUserData(username);
        saveData();
    }

    function calculateAge(dobString) {
        if (!dobString || dobString === "Non défini") return "Non défini";
        const dob = new Date(dobString);
        const diff_ms = Date.now() - dob.getTime();
        const age_dt = new Date(diff_ms);
        return Math.abs(age_dt.getUTCFullYear() - 1970);
    }
    
    function logout() {
        currentUser = '';
        localStorage.removeItem('santeAI_currentUser');
        navigateTo('welcome-screen');
    }

    // ===================================================================================
    // 2. UI NAVIGATION & RENDERING
    // ===================================================================================
    const allScreens = document.querySelectorAll('.screen');
    const navButtons = document.querySelectorAll('.nav-btn');
    const bottomNav = document.getElementById('bottom-nav');

    // CORRECTED in V3.5
    function navigateTo(screenId) {
        allScreens.forEach(screen => screen.classList.remove('active'));
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) targetScreen.classList.add('active');

        // CORRECTED & SIMPLIFIED: Now, only the button corresponding to the screenId will be active.
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.target === screenId);
        });
        
        bottomNav.style.display = (screenId === 'welcome-screen' || screenId === 'login-screen') ? 'none' : 'flex';
    }

    function renderUI() {
        if (!santeAIData.profile) return;

        // Calculate age
        santeAIData.profile.age = calculateAge(santeAIData.profile.dob);

        // Dashboard
        document.querySelector('#dashboard-screen .profile-name').textContent = santeAIData.profile.name;
        document.querySelector('#dashboard-screen .avatar-placeholder').textContent = santeAIData.profile.initials;
        document.querySelector('#dashboard-screen .profile-meta').innerHTML = `${santeAIData.profile.age} ans &bull; Membre depuis ${santeAIData.profile.memberSince}`;
        document.getElementById('dashboard-appointment').textContent = santeAIData.dashboard.nextAppointment;
        document.getElementById('dashboard-meds').innerHTML = `${santeAIData.dashboard.medsTaken}/${santeAIData.dashboard.medsTotal}`;
        
        // Health Record
        document.getElementById('record-name').textContent = santeAIData.profile.name;
        document.getElementById('record-dob').textContent = santeAIData.profile.dob;
        document.getElementById('record-age').textContent = santeAIData.profile.age;
        document.getElementById('record-sex').textContent = santeAIData.profile.sex;
        document.getElementById('record-blood-type').textContent = santeAIData.profile.bloodType;
        document.getElementById('record-allergies').textContent = santeAIData.medicalHistory.allergies;
        document.getElementById('record-conditions').textContent = santeAIData.medicalHistory.conditions;
        document.getElementById('record-medications').textContent = santeAIData.medicalHistory.medications;
        document.getElementById('record-vaccinations').textContent = santeAIData.medicalHistory.vaccinations;

        // Settings Screen
        document.getElementById('settings-profile-name').textContent = santeAIData.profile.name;
        document.querySelector('#settings-screen .avatar-placeholder').textContent = santeAIData.profile.initials;
        document.getElementById('settings-profile-meta').textContent = `Membre depuis ${santeAIData.profile.memberSince}`;
        
        renderChatHistory();
    }
    
    function renderChatHistory() {
        const chatContent = document.querySelector('#chat-screen .chat-content');
        const suggestions = document.querySelector('.chat-suggestions');
        chatContent.querySelectorAll('.chat-message').forEach(el => el.remove());
        if (santeAIData.chatHistory.length > 0) {
            suggestions.style.display = 'none';
            santeAIData.chatHistory.forEach(msg => addMessageToChat(msg.role, msg.content, false, true));
        } else {
            suggestions.style.display = 'block';
        }
    }
    
    // ===================================================================================
    // 3. EVENT LISTENERS
    // ===================================================================================
    
    // NEW HELPER FUNCTION in V3.5
    function populateProfileModal() {
        // Populate with profile data
        const dob = santeAIData.profile.dob;
        // The date input requires YYYY-MM-DD format. Handle "Non défini".
        document.getElementById('edit-dob').value = (dob && dob !== "Non défini") ? dob : '';
        document.getElementById('edit-sex').value = santeAIData.profile.sex || "Non défini";
        document.getElementById('edit-blood-type').value = santeAIData.profile.bloodType || "Non défini";
        
        // Populate with medical history data
        document.getElementById('edit-allergies').value = (santeAIData.medicalHistory.allergies !== "Aucune") ? santeAIData.medicalHistory.allergies : '';
        document.getElementById('edit-conditions').value = (santeAIData.medicalHistory.conditions !== "Aucune") ? santeAIData.medicalHistory.conditions : '';
    }

    // UPDATED in V3.5
    function setupEventListeners() {
        // Main navigation click listener
        document.body.addEventListener('click', (e) => {
            const navTarget = e.target.closest('[data-target]');
            if (navTarget && !['login-btn', 'logout-btn'].includes(navTarget.id)) {
                navigateTo(navTarget.dataset.target);
            }
        });

        // Specific button listeners
        document.getElementById('login-btn').addEventListener('click', handleLogin);
        document.getElementById('logout-btn').addEventListener('click', logout);
        document.getElementById('symptom-submit-btn').addEventListener('click', handleSymptomSubmit);
        document.getElementById('symptom-intensity').addEventListener('input', (e) => {
            document.getElementById('intensity-value').textContent = e.target.value;
        });

        // Chat listeners
        const sendButton = document.querySelector('.chat-input-area .send-btn');
        const chatInput = document.querySelector('.chat-input-area input');
        sendButton.addEventListener('click', handleSendMessage);
        chatInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleSendMessage());
        document.querySelectorAll('.suggestion-item').forEach(button => {
            button.addEventListener('click', () => {
                chatInput.value = button.dataset.prompt;
                handleSendMessage();
            });
        });

        // Modal listeners (UPDATED)
        const modal = document.getElementById('edit-profile-modal');
        const openModal = () => {
            populateProfileModal(); // <-- FIX IS HERE: Populate form before showing
            modal.style.display = 'flex';
        };
        document.getElementById('edit-profile-btn').addEventListener('click', openModal);
        document.getElementById('edit-profile-btn-2').addEventListener('click', openModal);
        document.getElementById('close-modal-btn').addEventListener('click', () => modal.style.display = 'none');
        document.getElementById('profile-edit-form').addEventListener('submit', handleProfileUpdate);
    }

    // ===================================================================================
    // 4. FUNCTIONAL FEATURES LOGIC
    // ===================================================================================
    function handleLogin() {
        const usernameInput = document.getElementById('username');
        const username = usernameInput.value.trim();
        if (!username) { alert("Veuillez entrer un nom de profil."); return; }
        loadOrCreateUser(username);
        renderUI();
        navigateTo('dashboard-screen');
    }

    function handleSymptomSubmit() {
        const newSymptom = {
            description: document.getElementById('symptom-description').value.trim(),
            location: document.getElementById('symptom-location').value.trim(),
            intensity: document.getElementById('symptom-intensity').value,
            aggravating: document.getElementById('symptom-aggravating').value.trim(),
            appeasing: document.getElementById('symptom-appeasing').value.trim(),
            timestamp: new Date().toISOString()
        };
        if (!newSymptom.description) { alert("Veuillez décrire vos symptômes."); return; }
        santeAIData.symptomLogs.push(newSymptom);
        saveData();
        alert("Symptômes enregistrés !");
        document.getElementById('symptom-form').reset();
        document.getElementById('intensity-value').textContent = '5'; // Reset slider UI
        navigateTo('dashboard-screen');
    }

    function handleProfileUpdate(e) {
        e.preventDefault();
        santeAIData.profile.dob = document.getElementById('edit-dob').value || "Non défini";
        santeAIData.profile.sex = document.getElementById('edit-sex').value;
        santeAIData.profile.bloodType = document.getElementById('edit-blood-type').value;
        santeAIData.medicalHistory.allergies = document.getElementById('edit-allergies').value.trim() || "Aucune";
        santeAIData.medicalHistory.conditions = document.getElementById('edit-conditions').value.trim() || "Aucune";
        
        saveData();
        renderUI();
        document.getElementById('edit-profile-modal').style.display = 'none';
        alert("Profil mis à jour !");
    }

    // ===================================================================================
    // 5. CHAT LOGIC & AI INTEGRATION
    // ===================================================================================
    const chatContentEl = document.querySelector('#chat-screen .chat-content');

    function addMessageToChat(role, text, isTyping = false, fromHistory = false) {
        document.querySelector('.chat-suggestions').style.display = 'none';
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', `${role}-message`);

        if (isTyping) {
            messageDiv.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
            messageDiv.id = 'typing-indicator';
        } else {
            messageDiv.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        }
        chatContentEl.appendChild(messageDiv);
        chatContentEl.parentElement.scrollTop = chatContentEl.parentElement.scrollHeight;
        return messageDiv;
    }

    async function handleSendMessage() {
        const chatInput = document.querySelector('.chat-input-area input');
        const userText = chatInput.value.trim();
        if (userText === "") return;

        addMessageToChat('user', userText);
        santeAIData.chatHistory.push({ role: 'user', content: userText });
        chatInput.value = "";
        
        const typingIndicator = addMessageToChat('assistant', '', true);

        try {
            const aiResponse = await askMistral(santeAIData.chatHistory);
            typingIndicator.remove();
            addMessageToChat('assistant', aiResponse);
            santeAIData.chatHistory.push({ role: 'assistant', content: aiResponse });
            saveData();
        } catch (error) {
            typingIndicator.remove();
            addMessageToChat('assistant', "Désolé, une erreur s'est produite. Veuillez réessayer.");
            console.error("Error with AI service:", error);
        }
    }
    
    async function askMistral(currentChatHistory) {
        // This function remains largely the same, but is now more robust.
        const systemPrompt = {
            role: 'system',
            content: `Tu es SanteAI, un assistant de santé IA empathique. Ton but est d'aider l'utilisateur à suivre ses symptômes et à comprendre son bien-être, en te basant sur les infos fournies. **Règles critiques:** 1. **NE JAMAIS** poser de diagnostic. 2. **NE JAMAIS** prescrire de traitement. 3. **TOUJOURS** recommander de consulter un professionnel de santé (médecin, pharmacien) pour un avis médical. 4. Utilise un ton rassurant et clair. 5. Réponds en français et formate les points importants en gras (**texte en gras**).`
        };
        const lastSymptom = santeAIData.symptomLogs.length > 0 ? santeAIData.symptomLogs.slice(-1)[0] : null;
        let contextContent = `[CONTEXTE UTILISATEUR]\n- Nom: ${santeAIData.profile.name}\n- Âge: ${santeAIData.profile.age}\n- Sexe: ${santeAIData.profile.sex}\n- Allergies: ${santeAIData.medicalHistory.allergies}\n- Conditions préexistantes: ${santeAIData.medicalHistory.conditions}`;
        if (lastSymptom) { contextContent += `\n- Dernier symptôme enregistré: ${lastSymptom.description} (Intensité: ${lastSymptom.intensity}/10)`; }
        contextContent += `\n[FIN DU CONTEXTE]`;

        const userContextPrompt = { role: 'user', content: contextContent };
        const messagesForAPI = [ systemPrompt, userContextPrompt, ...currentChatHistory.slice(-10) ]; // Send last 10 messages for context

        const response = await fetch('/.netlify/functions/ask-mistral', {
            method: 'POST', body: JSON.stringify({ messages: messagesForAPI })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API call failed with status: ${response.status}`);
        }
        const data = await response.json();
        return data.choices[0].message.content;
    }

    // ===================================================================================
    // 6. APP INITIALIZATION
    // ===================================================================================
    function initialize() {
        setupEventListeners();
        if (currentUser && localStorage.getItem(`santeAIData_${currentUser}`)) {
            loadOrCreateUser(currentUser);
            renderUI();
            navigateTo('dashboard-screen');
        } else {
            navigateTo('welcome-screen');
        }
    }

    initialize();
});