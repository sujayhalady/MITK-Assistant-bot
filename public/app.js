// MITK Knowledge Base 
const mitkData = {
    institutional: {
        name: "Moodlakatte Institute of Technology, Kundapura (MITK)",
        established: "2004",
        affiliation: "Visvesvaraya Technological University (VTU), Belagavi",
        contact: {
            phone: "+91-8254-237630",
            email: "info@mitkundapura.com",
            website: "https://www.mitkundapura.com"
        }
    }
};

// Backend Configuration - This connects to your server
const BACKEND_CONFIG = {
    BASE_URL: 'http://localhost:3000',
    ENDPOINTS: {
        CHAT: '/api/chat',
        HEALTH: '/api/health'
    },
    TIMEOUT: 15000,
    ENABLED: true
};

// Translations
const translations = {
    en: {
        welcome: "Hello! 👋 I'm your MITK AI Assistant, powered by Google Gemini AI. I can answer detailed questions about Moodlakatte Institute of Technology, Kundapura.",
        askAnything: "What would you like to know about MITK?",
        language: "English",
        error: "I apologize, but I'm experiencing technical difficulties. Let me try to help with my knowledge base.",
        thinking: "Let me get that information for you...",
        backendOffline: "AI service is offline. Using local knowledge base."
    },
    kn: {
        welcome: "ನಮಸ್ಕಾರ! 👋 ನಾನು ನಿಮ್ಮ MITK AI ಸಹಾಯಕ. Google Gemini AI ಶಕ್ತಿಯಿಂದ ಚಾಲಿತ.",
        askAnything: "MITK ಬಗ್ಗೆ ನೀವು ಏನು ತಿಳಿದುಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಿ?",
        language: "ಕನ್ನಡ",
        error: "ಕ್ಷಮಿಸಿ, ತಾಂತ್ರಿಕ ತೊಂದರೆ. ನನ್ನ ಜ್ಞಾನದಿಂದ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.",
        thinking: "ಮಾಹಿತಿ ಹುಡುಕುತ್ತಿದ್ದೇನೆ...",
        backendOffline: "AI ಸೇವೆ ಆಫ್ಲೈನ್. ಸ್ಥಳೀಯ ಜ್ಞಾನ ಬಳಸುತ್ತಿದ್ದೇನೆ."
    }
};

// State management
let currentLanguage = 'en';
let conversationHistory = [];
let isProcessing = false;
let backendAvailable = false;

// DOM elements
let chatMessages, messageInput, sendBtn, languageToggle, typingIndicator, charCount, confidenceModal, newChatFab, statusText;

// Initialize application
document.addEventListener('DOMContentLoaded', init);

function init() {
    console.log('🚀 Initializing MITK AI Assistant...');
    
    // Get DOM elements
    chatMessages = document.getElementById('chatMessages');
    messageInput = document.getElementById('messageInput');
    sendBtn = document.getElementById('sendBtn');
    languageToggle = document.getElementById('languageToggle');
    typingIndicator = document.getElementById('typingIndicator');
    charCount = document.getElementById('charCount');
    confidenceModal = document.getElementById('confidenceModal');
    newChatFab = document.getElementById('newChatFab');
    statusText = document.getElementById('statusText');

    if (!chatMessages || !messageInput || !sendBtn) {
        console.error('❌ Required DOM elements not found');
        return;
    }

    setupEventListeners();
    checkBackendHealth();
    displayWelcomeMessage();
    autoResizeTextarea();
    updateLanguageUI();
    
    console.log('✅ MITK AI Assistant initialized successfully');
}

// Check if backend is available
async function checkBackendHealth() {
    console.log('🔍 Checking backend connection...');
    updateStatusText('Connecting...');

    if (!BACKEND_CONFIG.ENABLED) {
        console.log('⚠️ Backend disabled in config');
        backendAvailable = false;
        updateStatusText('🟡 Local Mode');
        return;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.HEALTH}`, {
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            backendAvailable = true;
            console.log('✅ Backend connected:', data.message);
            updateStatusText('🟢 AI Ready');
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.log('❌ Backend connection failed:', error.message);
        backendAvailable = false;
        updateStatusText('🔴 AI Offline');
    }
}

// Event listeners setup
function setupEventListeners() {
    if (sendBtn) sendBtn.addEventListener('click', handleSendMessage);
    
    if (messageInput) {
        messageInput.addEventListener('keydown', handleKeyDown);
        messageInput.addEventListener('input', handleInputChange);
    }
    
    if (languageToggle) languageToggle.addEventListener('click', toggleLanguage);
    if (newChatFab) newChatFab.addEventListener('click', () => resetConversation(false));

    // Global click delegation
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('confidence-badge')) {
            const confidence = e.target.dataset.confidence;
            const sources = e.target.dataset.sources;
            showConfidenceModal(confidence, sources);
        }
    });

    // Modal close handlers
    const modalClose = document.querySelector('.modal-close');
    const modalBackdrop = document.querySelector('.modal-backdrop');
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

// Enhanced welcome message
function displayWelcomeMessage() {
    const lang = translations[currentLanguage];
    const statusIndicator = backendAvailable ? '🤖 AI Powered (Gemini)' : '📚 Knowledge Base Mode';
    
    const welcomeHTML = `
        <div class="welcome-message">
            <h3>Welcome to MITK AI Assistant</h3>
            <p>${lang.welcome}</p>
            <p><strong>Status:</strong> ${statusIndicator}</p>
            
            <div class="welcome-categories">
                <div class="category-item">
                    <strong>Admissions</strong><br>
                    Eligibility, application process, entrance exams
                </div>
                <div class="category-item">
                    <strong>Courses</strong><br>
                    BE programs (CSE, AI/ML, ECE, ME, CE), MBA
                </div>
                <div class="category-item">
                    <strong>Campus Life</strong><br>
                    Facilities, hostels, events, activities
                </div>
                <div class="category-item">
                    <strong>Placements</strong><br>
                    Career services, companies, packages
                </div>
            </div>
            
            <p>${lang.askAnything}</p>
        </div>
    `;
    
    addBotMessage(welcomeHTML, 'welcome', 98, ['MITK AI Assistant']);
}

// Send message handling
function handleSendMessage() {
    const message = messageInput.value.trim();
    if (!message || isProcessing) return;

    console.log('📨 User message:', message);
    handleUserMessage(message);
}

async function handleUserMessage(message) {
    if (isProcessing) return;

    isProcessing = true;
    updateSendButtonState(true);
    addUserMessage(message);

    if (messageInput) {
        messageInput.value = '';
        updateCharCount();
        autoResizeTextarea();
    }

    // Add to conversation history
    conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
    });

    showTypingIndicator();
    updateStatusText('AI is thinking...');

    try {
        console.log('🔄 Getting response...');
        let response;

        // Try backend first if available
        if (backendAvailable && BACKEND_CONFIG.ENABLED) {
            console.log('🤖 Using AI backend...');
            try {
                response = await getBackendResponse(message);
                console.log('✅ AI response received');
            } catch (error) {
                console.log('❌ AI backend failed:', error.message);
                backendAvailable = false;
                updateStatusText('🔴 AI Failed - Using Local');
                response = getFallbackResponse(message);
            }
        } else {
            console.log('📚 Using fallback knowledge base...');
            response = getFallbackResponse(message);
        }

        hideTypingIndicator();

        // Add AI response to history
        conversationHistory.push({
            role: 'assistant',
            content: response.text,
            timestamp: new Date().toISOString()
        });

        console.log('✅ Displaying response');
        addBotMessage(response.text, 'ai_response', response.confidence, response.sources);

    } catch (error) {
        hideTypingIndicator();
        console.error('💥 Response Error:', error);
        const fallbackResponse = getFallbackResponse(message);
        addBotMessage(fallbackResponse.text, 'error', fallbackResponse.confidence, fallbackResponse.sources);
    } finally {
        isProcessing = false;
        updateSendButtonState(false);
        updateStatusText(backendAvailable ? '🟢 AI Ready' : '📚 Local Mode');
    }
}

// Backend API integration
async function getBackendResponse(userMessage) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BACKEND_CONFIG.TIMEOUT);

    try {
        console.log('📡 Calling backend API...');
        const response = await fetch(`${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.CHAT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: userMessage,
                history: conversationHistory.slice(-6),
                language: currentLanguage
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Backend error ${response.status}: ${errorData.details || errorData.error || response.statusText}`);
        }

        const data = await response.json();
        console.log('📨 Backend response:', data);

        return {
            text: formatAIResponse(data.response),
            confidence: data.confidence || 90,
            sources: ['MITK AI Assistant', `${data.model || 'Gemini AI'}`],
            model: data.model
        };

    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - AI service is slow');
        }
        throw error;
    }
}

// CLEANED UP Fallback responses
function getFallbackResponse(message) {
    const lower = message.toLowerCase();
    console.log('📚 Generating fallback response for:', lower.substring(0, 50));

    // Admission queries - CLEANED UP VERSION
    if (lower.includes('admission') || lower.includes('eligibility') || lower.includes('apply')) {
        return {
            text: `<h3>🎓 MITK Admission Process</h3>

<p><strong>Eligibility:</strong> 10+2 with Physics, Chemistry, Mathematics (minimum 45% for general category)</p>

<p><strong>Entrance Exams:</strong> Karnataka CET, COMEDK UGET, JEE Main</p>

<p><strong>Application Process:</strong></p>
<ul>
<li>Check eligibility criteria for your chosen course (BE or MBA)</li>
<li>Gather required documents (10th & 12th mark sheets, certificates, ID proof)</li>
<li>Fill application form online on MITK website</li>
<li>Submit application with supporting documents</li>
<li>Pay application fee as required</li>
</ul>

<p><strong>Contact Information:</strong></p>
<ul>
<li>Phone: +91-8254-237630</li>
<li>Email: info@mitkundapura.com</li>
<li>Website: <a href="https://www.mitkundapura.com" target="_blank">www.mitkundapura.com</a></li>
</ul>

<p>For the most accurate and up-to-date information, please visit the MITK website directly or contact the admissions office.</p>`,
            confidence: 92,
            sources: ['MITK Official Information', 'Local Knowledge Base']
        };
    }

    // Courses/Programs - CLEANED UP VERSION
    if (lower.includes('course') || lower.includes('program') || lower.includes('degree') || lower.includes('be') || lower.includes('mba')) {
        return {
            text: `<h3>📚 MITK Academic Programs</h3>

<p><strong>Undergraduate Programs (BE) - 4 Years:</strong></p>
<ul>
<li>Computer Science Engineering (CSE) - Intake: 120</li>
<li>Artificial Intelligence & Machine Learning (AI/ML) - Intake: 60</li>
<li>Electronics & Communication Engineering (ECE)</li>
<li>Mechanical Engineering (ME)</li>
<li>Civil Engineering (CE)</li>
</ul>

<p><strong>Postgraduate Programs:</strong></p>
<ul>
<li>MBA - 2 Years</li>
<li>Specializations: Finance, Marketing, Human Resources</li>
<li>Dual specialization options available</li>
</ul>

<p><strong>Affiliation:</strong> All programs are affiliated with Visvesvaraya Technological University (VTU), Belagavi and approved by AICTE.</p>

<p>Each program focuses on both theoretical knowledge and practical application with modern laboratory facilities.</p>`,
            confidence: 94,
            sources: ['MITK Academic Department', 'Local Knowledge Base']
        };
    }

    // Campus/Facilities - CLEANED UP VERSION
    if (lower.includes('campus') || lower.includes('hostel') || lower.includes('facilities') || lower.includes('infrastructure')) {
        return {
            text: `<h3>🏫 MITK Campus Facilities</h3>

<p><strong>Academic Facilities:</strong></p>
<ul>
<li>Modern computer labs with latest software</li>
<li>Electronics and communication labs</li>
<li>Mechanical workshops and labs</li>
<li>Civil engineering labs</li>
<li>Digital library with e-journals and books</li>
</ul>

<p><strong>Student Amenities:</strong></p>
<ul>
<li>Separate hostels for boys and girls with Wi-Fi</li>
<li>Hygienic cafeteria with vegetarian and non-vegetarian options</li>
<li>Indoor and outdoor sports facilities</li>
<li>On-campus medical assistance</li>
<li>College bus transportation from various routes</li>
</ul>

<p><strong>Innovation Hub:</strong></p>
<ul>
<li>Technology Business Incubator (TBI) for startups</li>
<li>Research and development facilities</li>
</ul>

<p>The campus is located at Moodlakatte, near Kundapura Railway Station, providing easy accessibility.</p>`,
            confidence: 91,
            sources: ['MITK Campus Administration', 'Local Knowledge Base']
        };
    }

    // Placement/Career - CLEANED UP VERSION
    if (lower.includes('placement') || lower.includes('job') || lower.includes('career') || lower.includes('company') || lower.includes('package')) {
        return {
            text: `<h3>💼 MITK Placement Services</h3>

<p><strong>Placement Statistics:</strong></p>
<ul>
<li>Average Package: 3.5 LPA</li>
<li>Highest Package: 8 LPA</li>
<li>Multiple placement opportunities annually</li>
</ul>

<p><strong>Top Recruiting Companies:</strong></p>
<ul>
<li>Infosys</li>
<li>Wipro</li>
<li>TCS (Tata Consultancy Services)</li>
<li>Tech Mahindra</li>
<li>Capgemini</li>
</ul>

<p><strong>Placement Support Services:</strong></p>
<ul>
<li>Pre-placement training and preparation</li>
<li>Soft skills development workshops</li>
<li>Aptitude test preparation</li>
<li>Mock interviews and group discussions</li>
<li>Campus recruitment drives</li>
</ul>

<p><strong>Recruitment Process:</strong></p>
<p>Companies typically conduct pre-placement talks, aptitude tests, technical interviews, and HR interviews on campus.</p>`,
            confidence: 89,
            sources: ['MITK Placement Cell', 'Local Knowledge Base']
        };
    }

    // Events/Activities - CLEANED UP VERSION
    if (lower.includes('event') || lower.includes('fest') || lower.includes('activity') || lower.includes('club') || lower.includes('cultural')) {
        return {
            text: `<h3>🎉 MITK Events & Activities</h3>

<p><strong>Technical Events:</strong></p>
<ul>
<li><strong>Cerebrox:</strong> AI & ML technical forum with seminars, workshops, and project presentations</li>
<li><strong>Saavishkaar:</strong> Annual technical fest featuring project exhibitions and competitions</li>
</ul>

<p><strong>Cultural Events:</strong></p>
<ul>
<li><strong>Mridula:</strong> Annual cultural fest with music, dance, and drama competitions</li>
<li>Inter-college cultural competitions</li>
<li>Student talent shows and performances</li>
</ul>

<p><strong>Student Development Programs:</strong></p>
<ul>
<li>Skill development workshops on coding and robotics</li>
<li>IoT and AI training sessions</li>
<li>Industry expert guest lectures</li>
</ul>

<p><strong>Student Clubs:</strong></p>
<ul>
<li>Photography Club for event coverage and creative projects</li>
<li>Robotics Club for building and testing robots</li>
<li>Various department-specific technical clubs</li>
</ul>`,
            confidence: 88,
            sources: ['MITK Student Affairs', 'Local Knowledge Base']
        };
    }

    // Location/Contact - CLEANED UP VERSION
    if (lower.includes('location') || lower.includes('address') || lower.includes('contact') || lower.includes('phone') || lower.includes('email')) {
        return {
            text: `<h3>📍 MITK Contact Information</h3>

<p><strong>Address:</strong></p>
<p>Moodlakatte Institute of Technology, Kundapura (MITK)<br>
Moodlakatte, Near Kundapura Railway Station<br>
Udupi District, Karnataka - 576217</p>

<p><strong>Contact Details:</strong></p>
<ul>
<li>Phone: +91-8254-237630</li>
<li>Email: info@mitkundapura.com</li>
<li>Website: <a href="https://www.mitkundapura.com" target="_blank">www.mitkundapura.com</a></li>
</ul>

<p><strong>Transportation:</strong></p>
<ul>
<li>Nearest Railway Station: Kundapura Railway Station</li>
<li>Nearest Bus Stop: Kundapura Bus Stand</li>
<li>College bus services available from various routes in Udupi and Kundapura</li>
</ul>

<p><strong>Established:</strong> 2004<br>
<strong>Affiliation:</strong> Visvesvaraya Technological University (VTU), Belagavi<br>
<strong>Approvals:</strong> AICTE, Government of Karnataka</p>`,
            confidence: 96,
            sources: ['MITK Official Directory', 'Local Knowledge Base']
        };
    }

    // Default response - CLEANED UP VERSION
    return {
        text: `<h3>🤖 MITK AI Assistant</h3>

<p>I'm here to help you with information about Moodlakatte Institute of Technology, Kundapura (MITK).</p>

<p><strong>I can provide information about:</strong></p>
<ul>
<li>Admission process and eligibility criteria</li>
<li>Academic programs (BE and MBA courses)</li>
<li>Campus facilities and infrastructure</li>
<li>Placement services and career opportunities</li>
<li>Events, activities, and student clubs</li>
<li>Contact information and location details</li>
</ul>

<p><strong>Quick Contact:</strong></p>
<ul>
<li>Phone: +91-8254-237630</li>
<li>Email: info@mitkundapura.com</li>
<li>Website: <a href="https://www.mitkundapura.com" target="_blank">www.mitkundapura.com</a></li>
</ul>

<p>Please feel free to ask me anything about MITK!</p>`,
        confidence: 85,
        sources: ['MITK AI Assistant', 'Local Knowledge Base']
    };
}

// Helper function to format AI responses
function formatAIResponse(response) {
    if (!response) return 'Sorry, I could not generate a response.';
    
    // Convert markdown-style formatting to HTML
    let formatted = response
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/### (.*)/g, '<h3>$1</h3>')
        .replace(/## (.*)/g, '<h2>$1</h2>')
        .replace(/# (.*)/g, '<h1>$1</h1>');
    
    // Convert bullet points to proper lists
    formatted = formatted.replace(/^\* (.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Add paragraph tags for better spacing
    formatted = formatted.replace(/\n\n/g, '</p><p>');
    if (!formatted.startsWith('<h') && !formatted.startsWith('<p>')) {
        formatted = '<p>' + formatted;
    }
    if (!formatted.endsWith('</p>') && !formatted.endsWith('>')) {
        formatted = formatted + '</p>';
    }
    
    return formatted;
}

// UI Helper Functions
function addUserMessage(message) {
    const messageElement = createMessageElement(message, 'user');
    chatMessages.appendChild(messageElement);
    scrollToBottom();
}

function addBotMessage(message, type = 'bot', confidence = 85, sources = ['MITK AI']) {
    const messageElement = createMessageElement(message, 'bot', confidence, sources);
    chatMessages.appendChild(messageElement);
    scrollToBottom();
}

function createMessageElement(content, sender, confidence, sources) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = `avatar ${sender}-avatar`;
    avatar.textContent = sender === 'user' ? '👤' : '🤖';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = content;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(bubble);
    
    if (sender === 'bot' && confidence && sources) {
        const meta = document.createElement('div');
        meta.className = 'message-meta';
        
        const confidenceBadge = document.createElement('span');
        confidenceBadge.className = 'confidence-badge';
        confidenceBadge.textContent = `${confidence}% confident`;
        confidenceBadge.dataset.confidence = confidence;
        confidenceBadge.dataset.sources = JSON.stringify(sources);
        
        const sourceText = document.createElement('span');
        sourceText.className = 'source-link';
        sourceText.textContent = sources[0] || 'MITK AI';
        
        meta.appendChild(confidenceBadge);
        meta.appendChild(sourceText);
        bubble.appendChild(meta);
    }
    
    return messageDiv;
}

function showTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.classList.remove('hidden');
    }
}

function hideTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.classList.add('hidden');
    }
}

function updateSendButtonState(isLoading) {
    if (!sendBtn) return;
    
    if (isLoading) {
        sendBtn.innerHTML = '<div class="loading-spinner">⏳</div>';
        sendBtn.disabled = true;
    } else {
        sendBtn.innerHTML = '📤';
        sendBtn.disabled = false;
    }
}

function updateStatusText(text) {
    if (statusText) {
        statusText.textContent = text;
    }
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
}

function handleInputChange() {
    updateCharCount();
    autoResizeTextarea();
}

function updateCharCount() {
    if (charCount && messageInput) {
        const count = messageInput.value.length;
        charCount.textContent = `${count}/500`;
        charCount.style.color = count > 450 ? '#dc2626' : '#64748b';
    }
}

function autoResizeTextarea() {
    if (!messageInput) return;
    
    messageInput.style.height = 'auto';
    const newHeight = Math.min(messageInput.scrollHeight, 120);
    messageInput.style.height = newHeight + 'px';
}

function scrollToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'kn' : 'en';
    updateLanguageUI();
    
    // Show language change message
    const lang = translations[currentLanguage];
    addBotMessage(`<p>Language changed to ${lang.language}. ${lang.askAnything}</p>`, 'system', 100, ['System']);
}

function updateLanguageUI() {
    const lang = translations[currentLanguage];
    
    if (languageToggle) {
        languageToggle.textContent = lang.language;
    }
    
    if (messageInput) {
        messageInput.placeholder = lang.askAnything;
    }
}

function resetConversation(showMessage = true) {
    conversationHistory = [];
    
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    if (showMessage) {
        displayWelcomeMessage();
    }
    
    console.log('🔄 Conversation reset');
}

function showConfidenceModal(confidence, sources) {
    if (!confidenceModal) return;
    
    const sourcesArray = typeof sources === 'string' ? JSON.parse(sources) : sources;
    
    const modalBody = confidenceModal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="confidence-meter">
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${confidence}%"></div>
                </div>
                <span class="confidence-text">${confidence}%</span>
            </div>
            
            <div class="sources">
                <h4>Information Sources:</h4>
                <ul>
                    ${sourcesArray.map(source => `<li>${source}</li>`).join('')}
                </ul>
            </div>
            
            <div class="api-info">
                <h4>About Confidence Score:</h4>
                <p>This score indicates how confident the AI is in the accuracy of the response based on available information and context.</p>
            </div>
        `;
    }
    
    confidenceModal.classList.remove('hidden');
}

function closeModal() {
    if (confidenceModal) {
        confidenceModal.classList.add('hidden');
    }
}