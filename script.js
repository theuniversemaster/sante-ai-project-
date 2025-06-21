document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================================
    // 1. STATE MANAGEMENT
    // ===================================================================================
    let santeAIData = {};
    let currentUser = '';

    const createNewUserData = (username) => ({
        profile: { name: username, initials: username.charAt(0).toUpperCase(), dob: "Non défini", sex: "Non défini", bloodType: "Non défini", memberSince: new Date().getFullYear(), age: "Non défini" },
        medicalHistory: { allergies: "Aucune", conditions: "Aucune", medications: "Aucun", vaccinations: "Aucune" },
        dashboard: { nextAppointment: "Aucun rendez-vous", medsTaken: 0, medsTotal: 0 },
        symptomLogs: [], chatHistory: []
    });

    function saveData() { if (currentUser) localStorage.setItem(`santeAIData_${currentUser}`, JSON.stringify(santeAIData)); }
    function loadOrCreateUser(username) {
        currentUser = username;
        const savedData = localStorage.getItem(`santeAIData_${currentUser}`);
        santeAIData = savedData ? JSON.parse(savedData) : createNewUserData(username);
        saveData();
    }
    function clearOldData() { localStorage.removeItem('santeAIData'); }

    // ===================================================================================
    // 2. UI NAVIGATION & RENDERING
    // ===================================================================================
    const allScreens = document.querySelectorAll('.screen');
    const navButtons = document.querySelectorAll('.nav-btn');
    const bottomNav = document.getElementById('bottom-nav');

    function navigateTo(screenId) {
        allScreens.forEach(screen => screen.classList.remove('active'));
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) targetScreen.classList.add('active');
        navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.target === screenId));
        bottomNav.style.display = (screenId === 'welcome-screen' || screenId === 'login-screen') ? 'none' : 'flex';
    }

    function renderUI() {
        if (!santeAIData.profile) return;
        // Dashboard Header
        document.querySelector('#dashboard-screen .profile-name').textContent = santeAIData.profile.name;
        document.querySelector('#dashboard-screen .avatar-placeholder').textContent = santeAIData.profile.initials;
        document.querySelector('#dashboard-screen .profile-meta').innerHTML = `${santeAIData.profile.age} ans &bull; Membre depuis ${santeAIData.profile.memberSince}`;
        
        // Dashboard Cards
        document.getElementById('dashboard-appointment').textContent = santeAIData.dashboard.nextAppointment;
        document.getElementById('dashboard-meds').innerHTML = `${santeAIData.dashboard.medsTaken} sur ${santeAIData.dashboard.medsTotal} <span class="card-subtitle">pris</span>`;
        
        // Health Record - Personal Info
        document.getElementById('record-name').textContent = santeAIData.profile.name;
        document.getElementById('record-dob').textContent = santeAIData.profile.dob;
        document.getElementById('record-sex').textContent = santeAIData.profile.sex;
        document.getElementById('record-blood-type').textContent = santeAIData.profile.bloodType;
        
        // Health Record - Medical History
        document.getElementById('record-allergies').textContent = santeAIData.medicalHistory.allergies;
        document.getElementById('record-conditions').textContent = santeAIData.medicalHistory.conditions;
        document.getElementById('record-medications').textContent = santeAIData.medicalHistory.medications;
        document.getElementById('record-vaccinations').textContent = santeAIData.medicalHistory.vaccinations;

        renderChatHistory();
    }
    
    function renderChatHistory() {
        const chatContent = document.querySelector('#chat-screen .chat-content');
        chatContent.querySelectorAll('.chat-message').forEach(el => el.remove());
        santeAIData.chatHistory.forEach(msg => addMessageToChat(msg.role, msg.content, false, true));
    }

    // ===================================================================================
    // 3. EVENT LISTENERS
    // ===================================================================================
    function setupEventListeners() {
        document.body.addEventListener('click', (e) => {
            const navTarget = e.target.closest('[data-target]');
            if (navTarget && navTarget.id !== 'login-btn') {
                navigateTo(navTarget.dataset.target);
            }
        });

        document.getElementById('login-btn').addEventListener('click', handleLogin);
        document.getElementById('symptom-submit-btn').addEventListener('click', handleSymptomSubmit);
        
        const sendButton = document.querySelector('.chat-input-area .send-btn');
        const chatInput = document.querySelector('.chat-input-area input');
        sendButton.addEventListener('click', handleSendMessage);
        chatInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleSendMessage());

        document.querySelectorAll('.suggestion-item').forEach(button => {
            button.addEventListener('click', () => {
                chatInput.value = button.dataset.prompt; // Use data-prompt
                handleSendMessage();
            });
        });
    }

    // ===================================================================================
    // 4. FUNCTIONAL FEATURES LOGIC
    // ===================================================================================
    function handleLogin() {
        const usernameInput = document.getElementById('username');
        const username = usernameInput.value.trim();
        if (!username) { alert("Veuillez entrer un nom d'utilisateur."); return; }
        loadOrCreateUser(username);
        renderUI();
        navigateTo('dashboard-screen');
    }

    function handleSymptomSubmit() {
        const newSymptom = {
            description: document.getElementById('symptom-description').value.trim(),
            location: document.getElementById('symptom-location').value,
            intensity: document.getElementById('symptom-intensity').value,
            aggravating: document.getElementById('symptom-aggravating').value.trim(),
            appeasing: document.getElementById('symptom-appeasing').value.trim(),
            timestamp: new Date().toISOString()
        };
        if (!newSymptom.description) { alert("Veuillez décrire vos symptômes."); return; }
        santeAIData.symptomLogs.push(newSymptom);
        saveData();
        alert("Symptômes enregistrés avec succès !");
        document.getElementById('symptom-form').reset(); // Reset the form by its ID
        navigateTo('dashboard-screen');
    }

    // ===================================================================================
    // 5. CHAT LOGIC & AI INTEGRATION
    // ===================================================================================
    const chatContentEl = document.querySelector('#chat-screen .chat-content');
    const chatSuggestionsEl = document.querySelector('.chat-suggestions');

    function addMessageToChat(role, text, isTyping = false, fromHistory = false) {
        if (santeAIData.chatHistory.length > 0) { chatSuggestionsEl.style.display = 'none'; }
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', `${role}-message`);
        if (!fromHistory) messageDiv.classList.add('new-message');

        if (isTyping) {
            messageDiv.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
            messageDiv.id = 'typing-indicator';
        } else {
            messageDiv.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }
        chatContentEl.appendChild(messageDiv);
        chatContentEl.scrollTop = chatContentEl.scrollHeight;
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
            addMessageToChat('assistant', "Désolé, une erreur de communication avec le service IA s'est produite. Veuillez réessayer.");
            console.error("Error communicating with AI service:", error);
        }
    }
    
    async function askMistral(currentChatHistory) {
        const systemPrompt = {
            role: 'system',
            content: `Tu es SanteAI, un assistant de santé IA empathique et serviable. Ton but est d'aider l'utilisateur à suivre ses symptômes et à mieux comprendre son bien-être général, en te basant sur les informations qu'il te fournit. **Règles critiques:** 1. **NE JAMAIS** poser de diagnostic. 2. **NE JAMAIS** prescrire de traitement ou de médicament. 3. **TOUJOURS** recommander de consulter un professionnel de santé (médecin, pharmacien) pour tout avis médical. 4. Utilise un ton rassurant et clair. 5. Réponds toujours en français et formate les points importants en gras en utilisant des astérisques (**texte en gras**).`
        };
        const lastSymptom = santeAIData.symptomLogs.length > 0 ? santeAIData.symptomLogs.slice(-1)[0] : null;
        let contextContent = `[CONTEXTE UTILISATEUR]\n- Nom: ${santeAIData.profile.name}\n- Âge: ${santeAIData.profile.age} ans\n- Allergies: ${santeAIData.medicalHistory.allergies}`;
        if (lastSymptom) { contextContent += `\n- Dernier symptôme enregistré: ${lastSymptom.description} (Intensité: ${lastSymptom.intensity}/10)`; }
        contextContent += `\n[FIN DU CONTEXTE]`;

        const userContextPrompt = { role: 'user', content: contextContent };
        const messagesForAPI = [ systemPrompt, userContextPrompt, ...currentChatHistory ];

        const response = await fetch('/.netlify/functions/ask-mistral', {
            method: 'POST', body: JSON.stringify({ messages: messagesForAPI })
        });
        if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data.choices[0].message.content;
    }

    // ===================================================================================
    // 6. APP INITIALIZATION
    // ===================================================================================
    function initialize() {
        clearOldData();
        setupEventListeners();
        navigateTo('welcome-screen'); // Start at the welcome screen every time
    }

    initialize();
});