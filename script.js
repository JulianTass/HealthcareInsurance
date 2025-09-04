// HCF Mobile App - Updated Script with Real-time Code Detection
// Real-time code notifications using Server-Sent Events (SSE)

let countdownInterval;
let lastKnownSessionId = null;
let currentSessionId = null;
let currentGeneratedCode = null;
let eventSource = null; // SSE connection


// API Configuration
const API_BASE_URL = (() => {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://127.0.0.1:3000/api';
    }
    
    return `http://${hostname}:3000/api`;
})();

// ✅ REAL-TIME CODE DETECTION using Server-Sent Events
function startRealTimeCodeDetection() {
    console.log('🎧 Starting SSE connection...');
    
    if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
        console.log('🔄 SSE already connected, state:', eventSource.readyState);
        return;
    }

    const sseUrl = `${API_BASE_URL}/notifications/codes`;
    console.log('🌐 Connecting to:', sseUrl);
    
    try {
        if (eventSource) {
            eventSource.close();
        }
        
        eventSource = new EventSource(sseUrl);
        
        eventSource.onopen = function(event) {
            console.log('✅ SSE connection established!');
        };
        
        eventSource.onmessage = function(event) {
            console.log('📡 SSE message received:', event.data);
            try {
                const message = JSON.parse(event.data);
                
                if (message.type === 'NEW_CODE') {
                    console.log('🆕 New code from SSE:', message.data.code);
                    handleNewCodeFromSSE(message.data);
                } else if (message.type === 'CONNECTED') {
                    console.log('🔗 SSE connected:', message.message);
                }
            } catch (error) {
                console.error('❌ Error parsing SSE message:', error);
            }
        };
        
        eventSource.onerror = function(event) {
            console.error('❌ SSE error:', event);
        };
        
    } catch (error) {
        console.error('❌ Error starting SSE:', error);
    }
}

function stopRealTimeCodeDetection() {
    if (eventSource) {
        console.log('⏹️ Stopping real-time code detection');
        eventSource.close();
        eventSource = null;
    }
}

// Handle new code received via SSE
function handleNewCodeFromSSE(codeData) {
    console.log('🎯 Processing new code from SSE:', codeData);
    
    // Validate the code
    if (!codeData.code || !isValidFourDigitCode(codeData.code)) {
        console.warn('⚠️ Invalid code format from SSE:', codeData.code);
        return;
    }
    
    // Store the new session data
    currentSessionId = codeData.sessionId;
    currentGeneratedCode = codeData.code;
    lastKnownSessionId = codeData.sessionId;
    
    console.log('✅ Stored code from SSE:', currentGeneratedCode);
    
    // Update the button to show code was received
    const button = document.getElementById('generateCodeBtn');
    if (button) {
        button.disabled = true;
        button.textContent = 'New Code Received ✓';
        button.style.backgroundColor = '#4CAF50';
    }
    
    // Show the code screen automatically
    showCodeScreen(currentGeneratedCode);
    
    // Save session for persistence
    saveSessionToStorage({
        sessionId: codeData.sessionId,
        expiryTime: new Date(codeData.expires).getTime(),
        code: currentGeneratedCode
    });
    
    // Announce to screen reader
    announceToScreenReader(`New authentication code received: ${currentGeneratedCode}`);
}

// Generate 4-digit code via API with better response handling
async function generateCodeAPI() {
    const startTime = Date.now();
    
    try {
        console.log('📡 Making API request to generate 4-digit code...');
        
        const requestBody = {
            phoneNumber: '+61 400 123 456',
            deviceId: navigator.userAgent.substring(0, 50)
        };
        
        console.log('📤 Request body:', requestBody);
        
        const response = await fetch(`${API_BASE_URL}/auth/generate-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('📥 Response status:', response.status);
        console.log('📥 Response OK:', response.ok);
        
        if (!response.ok) {
            trackApiCall(startTime, false);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📥 Full API response:', data);
        
        if (data.success && data.code) {
            // ✅ CRITICAL: Validate the code is 4-digit
            const apiCode = String(data.code);
            
            if (!isValidFourDigitCode(apiCode)) {
                console.warn('⚠️ API returned non-4-digit code:', apiCode);
                // If API returns 6-digit, take first 4 digits
                const convertedCode = apiCode.substring(0, 4);
                console.log('🔄 Converting to 4-digit:', convertedCode);
                
                trackApiCall(startTime, true);
                return {
                    success: true,
                    code: convertedCode,
                    originalCode: apiCode, // Keep original for verification if needed
                    sessionId: data.sessionId,
                    message: data.message,
                    expiryTime: data.expiryTime
                };
            }
            
            console.log('✅ API Success - Valid 4-digit code:', apiCode);
            console.log('✅ Session ID:', data.sessionId);
            console.log('✅ Expiry time:', new Date(data.expiryTime).toISOString());
            
            trackApiCall(startTime, true);
            return {
                success: true,
                code: apiCode, // Use exact API code
                sessionId: data.sessionId,
                message: data.message,
                expiryTime: data.expiryTime
            };
        } else {
            trackApiCall(startTime, false);
            console.error('❌ API returned success: false or missing code', data);
            throw new Error(data.error || 'Failed to generate code or code missing');
        }
    } catch (error) {
        trackApiCall(startTime, false);
        console.error('❌ API Error:', error);
        throw error;
    }
}

// Generate Code button - now just triggers auto-detection check
async function generateCodeDirectly() {
    console.log('🔵 Generate Code button clicked - checking for new codes');
    const button = document.getElementById('generateCodeBtn');
    
    if (!button) {
        console.error('❌ Generate button not found');
        return;
    }
    
    // Prevent multiple clicks
    if (button.disabled) {
        console.log('⚠️ Button already disabled, preventing duplicate request');
        return;
    }
    
    // Show checking state
    button.disabled = true;
    button.textContent = 'Checking for codes...';
    button.style.backgroundColor = '#FF9800';
    updateStatus('loading', 'Checking for new codes...', 'Looking for codes generated via API calls');
    
    try {
        // Clear any existing session data first
        currentSessionId = null;
        currentGeneratedCode = null;
        clearInterval(countdownInterval);
        
        console.log('📡 Manually checking admin endpoint for new codes...');
        
        // Check the admin endpoint for any new codes
        const response = await fetch(`${API_BASE_URL}/admin/sessions`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📥 Admin endpoint response:', data);

        if (data.success && data.activeSessions && data.activeSessions.length > 0) {
            // Get the most recent unused session
            const latestSession = data.activeSessions
                .filter(session => !session.used)
                .sort((a, b) => new Date(b.generated) - new Date(a.generated))[0];

            if (latestSession && latestSession.code) {
                console.log('🆕 Found new code from API:', latestSession.code);
                
                // Store and display the code
                currentSessionId = latestSession.sessionId;
                currentGeneratedCode = String(latestSession.code);
                lastKnownSessionId = latestSession.sessionId;
                
                // Validate the code
                if (isValidFourDigitCode(currentGeneratedCode)) {
                    console.log('✅ Valid 4-digit code found:', currentGeneratedCode);
                    
                    // Show success and update button
                    button.textContent = 'Code Found ✓';
                    button.style.backgroundColor = '#4CAF50';
                    
                    // Display the code
                    showCodeScreen(currentGeneratedCode);
                    
                    console.log('✅ Code displayed from API:', currentGeneratedCode);
                } else {
                    throw new Error(`Invalid 4-digit code format: ${currentGeneratedCode}`);
                }
            } else {
                // No new codes found
                updateStatus('error', '📭 No New Codes Found', 'Use Postman or another tool to make a POST request to generate a code first');
                
                setTimeout(() => {
                    button.disabled = false;
                    button.textContent = 'Check Again';
                    button.style.backgroundColor = 'var(--hcf-pink)';
                    hideStatus();
                }, 3000);
            }
        } else {
            // No active sessions
            updateStatus('error', '📭 No Active Sessions', 'Make a POST request to /api/auth/generate-code first');
            
            setTimeout(() => {
                button.disabled = false;
                button.textContent = 'Check for Codes';
                button.style.backgroundColor = 'var(--hcf-pink)';
                hideStatus();
            }, 3000);
        }
        
    } catch (error) {
        console.error('❌ Error checking for codes:', error);
        
        const errorInfo = handleApiError(error, 'Checking for codes');
        updateStatus('error', `❌ ${errorInfo.userMessage}`, errorInfo.technicalDetails);
        
        // Reset button after delay
        setTimeout(() => {
            button.disabled = false;
            button.textContent = 'Try Again';
            button.style.backgroundColor = 'var(--hcf-pink)';
            
            setTimeout(() => {
                hideStatus();
            }, 4000);
        }, 2500);
    }
}

// Show code screen with generated 4-digit code
function showCodeScreen(code) {
    console.log('🎯 showCodeScreen called with code:', code);
    console.log('🎯 Code type:', typeof code);
    console.log('🎯 Code length:', code.length);
    
    // Validate input
    if (!code || !isValidFourDigitCode(code)) {
        console.error('❌ Invalid code passed to showCodeScreen:', code);
        updateStatus('error', '❌ Invalid Code Format', 'Code must be 4 digits');
        return;
    }
    
    // Hide login screen
    const loginScreen = document.getElementById('mobileLogin');
    if (loginScreen) {
        loginScreen.style.display = 'none';
        console.log('🔵 Hidden login screen');
    }
    
    // Show code screen
    const codeSection = document.getElementById('mobileCodeSection');
    if (codeSection) {
        codeSection.classList.add('show');
        console.log('🔵 Showed code section');
        
        // Display the EXACT 4-digit code from API
        const codeDisplay = document.getElementById('codeDisplay');
        if (codeDisplay) {
            codeDisplay.textContent = code; // Use exact code passed in
            console.log('✅ Code displayed in UI:', codeDisplay.textContent);
            
            // Announce to screen readers
            announceToScreenReader(`Authentication code generated: ${code}`);
        } else {
            console.error('❌ Code display element not found');
        }
        
        updateStatus('success', '✅ Code Generated Successfully!', 'Your 4-digit authentication code is ready to use');
        
        // Start countdown timer (5 minutes)
        const expiryTime = Date.now() + (5 * 60 * 1000);
        startCountdown(expiryTime);
        
        console.log('✅ Code screen setup completed');
    } else {
        console.error('❌ Code section element not found');
    }
}

// Show login screen
function showLoginScreen() {
    // Hide code screen
    const codeSection = document.getElementById('mobileCodeSection');
    if (codeSection) {
        codeSection.classList.remove('show');
    }
    
    // Show login screen
    document.getElementById('mobileLogin').style.display = 'block';
    
    // Reset generate button
    const button = document.getElementById('generateCodeBtn');
    if (button) {
        button.disabled = false;
        button.textContent = 'Check for New Codes';
        button.style.backgroundColor = 'var(--hcf-pink)';
    }
    
    // Clear code display
    const codeDisplay = document.getElementById('codeDisplay');
    if (codeDisplay) {
        codeDisplay.textContent = '----';
    }
    
    hideStatus();
    clearInterval(countdownInterval);
}

function makeCall() {
    // This will open the phone dialer on mobile devices
    window.location.href = 'tel:+61281884705,87651';
}

// Genesys Chat Integration
function openChat() {
    // Determine if mobile or desktop
    const isMobile = window.innerWidth <= 768;
    
    // Choose deployment ID based on device
    const deploymentId = isMobile ? 
        '50dcb71a-3f0b-4855-a4ed-f2ae701b8142' :  // Mobile deployment ID
        'd19620c2-515c-4897-afbc-b22360e6fc67';   // Desktop deployment ID
    
    // If Messenger is already loaded, just open it and set variables
    if (window.Genesys && window.Genesys.isBooted) {
        // Subscribe to database ready event first
        window.Genesys("subscribe", "Database.ready", function() {
            console.log("✅ Database ready - setting Authenticated variable");
            
            // Now set the Authenticated variable
            window.Genesys("command", "Database.set", {
                messaging: {
                    customAttributes: {
                        Authenticated: "true"
                    }
                }
            });
        });
        
        window.Genesys("command", "Messenger.open", {},
            function() {
                console.log("✅ Messenger opened");
            },
            function() {
                console.log("⚠️ Messenger already open, closing...");
                window.Genesys("command", "Messenger.close");
            }
        );
        return;
    }

    // Load Messenger bootstrap with appropriate deployment ID
    (function (g, e, n, es, ys) {
        g['_genesysJs'] = e;
        g[e] = g[e] || function () {
            (g[e].q = g[e].q || []).push(arguments)
        };
        g[e].t = Date.now();
        g[e].c = es;

        ys = document.createElement('script');
        ys.async = 1;
        ys.src = n;
        ys.charset = 'utf-8';
        ys.onload = function () {
            g[e]('boot');
            g[e]('subscribe', 'Messenger.ready', function () {
                console.log(`✅ Messenger ready (${isMobile ? 'Mobile' : 'Desktop'})`);
                
                // Subscribe to database ready event first
                g[e]("subscribe", "Database.ready", function() {
                    console.log("✅ Database ready - setting Authenticated variable");
                    
                    // Now set the Authenticated variable
                    g[e]("command", "Database.set", {
                        messaging: {
                            customAttributes: {
                                Authenticated: "true"
                            }
                        }
                    });
                });
                
                g[e]("command", "Messenger.open");
            });
        };

        document.head.appendChild(ys);
    })(window, 'Genesys',
        'https://apps.mypurecloud.com.au/genesys-bootstrap/genesys.min.js',
        {
            environment: 'prod-apse2',
            deploymentId: deploymentId
        }
    );

    window.Genesys.isBooted = true;
}

function handleDesktopLogin(e) {
    e.preventDefault();
    const desktopLoginPage = document.getElementById('desktopLoginPage');
    const desktopDashboardPage = document.getElementById('desktopDashboardPage');
    
    if (desktopLoginPage) desktopLoginPage.style.display = 'none';
    if (desktopDashboardPage) desktopDashboardPage.classList.add('active');
    
    // Trigger chat to open after successful desktop login
    setTimeout(() => {
        openChat();  // Same function, different deployment ID
    }, 1000);
}

function fallbackChatOption() {
    alert('Chat is temporarily unavailable. Please call us at 13 13 34 for assistance.');
}



// Status update functions
function updateStatus(type, message, details = '') {
    const statusDiv = document.getElementById('codeStatus');
    const messageDiv = document.getElementById('statusMessage');
    const detailsDiv = document.getElementById('statusDetails');
    
    if (!statusDiv || !messageDiv || !detailsDiv) return;
    
    // Remove existing classes
    statusDiv.classList.remove('loading', 'success', 'error');
    statusDiv.classList.add('show', type);
    
    messageDiv.innerHTML = message;
    detailsDiv.innerHTML = details;
}

function hideStatus() {
    const statusDiv = document.getElementById('codeStatus');
    if (statusDiv) {
        statusDiv.classList.remove('show');
    }
}

function showLoadingSpinner(text) {
    return `<span class="loading-spinner"></span>${text}`;
}

// Countdown timer
function startCountdown(expiryTime) {
    clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        const now = Date.now();
        const remaining = expiryTime - now;
        
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            updateStatus('error', '⏰ Code Expired', 'Please generate a new code');
            
            // Reset to login screen after expiry
            setTimeout(() => {
                showLoginScreen();
            }, 3000);
            return;
        }
        
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        const timeLeft = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const detailsDiv = document.getElementById('statusDetails');
        if (detailsDiv && detailsDiv.innerHTML.includes('ready to use')) {
            detailsDiv.innerHTML = `Code expires in ${timeLeft}`;
        }
    }, 1000);
}

// Form validation for mobile login
function validateMobileForm() {
    const membershipNumber = document.getElementById('membershipNumber');
    const password = document.getElementById('mobilePassword');
    const signInBtn = document.getElementById('mobileSignInBtn');
    
    if (!membershipNumber || !password || !signInBtn) return;
    
    if (membershipNumber.value.trim() && password.value.trim()) {
        signInBtn.classList.add('active');
    } else {
        signInBtn.classList.remove('active');
    }
}

// Navigation Functions
function showSection(section) {
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelectorAll('.dashboard-content').forEach(s => s.classList.remove('active'));
    
    if (section === 'dashboard') {
        const mainContent = document.getElementById('desktopMainContent');
        if (mainContent) {
            mainContent.classList.add('active');
        }
        if (event && event.target) {
            event.target.classList.add('active');
        }
    } else {
        const sectionElement = document.getElementById(section + 'Section');
        if (sectionElement) {
            sectionElement.classList.add('active');
        }
        if (event && event.target) {
            event.target.classList.add('active');
        }
    }
}

function showMobileSection(section) {
    const sectionNames = {
        'profile': 'My Profile',
        'policy': 'My Cover',
        'claims': 'Make a Claim',
        'payments': 'Manage Payments',
        'programs': 'Chat with us',
        'benefits': 'Calculate Benefits'
    };
    
    console.log('Mobile section clicked:', section, '-', sectionNames[section] || section);
    // In a real app, this would navigate to different mobile screens
    alert(`${sectionNames[section] || section} feature would open here`);
}

// ✅ ENHANCED LOGOUT with real-time detection cleanup
function logout() {
    // Stop real-time detection
    stopRealTimeCodeDetection();
    lastKnownSessionId = null;
    
    // Reset to login screens
    const desktopLoginPage = document.getElementById('desktopLoginPage');
    const desktopDashboardPage = document.getElementById('desktopDashboardPage');
    const desktopMainContent = document.getElementById('desktopMainContent');
    
    if (desktopLoginPage) desktopLoginPage.style.display = 'flex';
    if (desktopDashboardPage) desktopDashboardPage.classList.remove('active');
    if (desktopMainContent) desktopMainContent.classList.add('active');
    
    document.querySelectorAll('.dashboard-content').forEach(s => s.classList.remove('active'));
    
    // Reset sidebar nav
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const firstNavItem = document.querySelector('.sidebar-nav-item');
    if (firstNavItem) firstNavItem.classList.add('active');
    
    // Mobile logout
    showLoginScreen();
    const mobileDashboard = document.getElementById('mobileDashboard');
    if (mobileDashboard) mobileDashboard.classList.add('hidden');
    
    // Reset sessions and timers
    clearInterval(countdownInterval);
    hideStatus();
    currentSessionId = null;
    currentGeneratedCode = null;
    
    // Reset button state
    const btn = document.getElementById('generateCodeBtn');
    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Check for New Codes';
        btn.style.backgroundColor = 'var(--hcf-pink)';
    }
    
    // Clear auth token
    localStorage.removeItem('hcf_auth_token');
    
    // Reset forms
    const desktopForm = document.getElementById('desktopLoginForm');
    const mobileForm = document.getElementById('mobileLoginForm');
    if (desktopForm) desktopForm.reset();
    if (mobileForm) mobileForm.reset();
    
    console.log('🚪 Logout completed - real-time detection stopped');
}

// Claims Form Handler
function handleClaimFormSubmit(e) {
    e.preventDefault();
    alert('Claim submitted successfully! You will receive a confirmation email shortly.');
    e.target.reset();
}


// Mobile Login Handler
function handleMobileLogin(e) {
    e.preventDefault();
    const signInBtn = document.getElementById('mobileSignInBtn');
    if (signInBtn && signInBtn.classList.contains('active')) {
        // Simulate successful login
        document.getElementById('mobileLogin').style.display = 'none';
        const codeSection = document.getElementById('mobileCodeSection');
        if (codeSection) codeSection.classList.remove('show');
        
        const mobileDashboard = document.getElementById('mobileDashboard');
        if (mobileDashboard) mobileDashboard.classList.remove('hidden');
    }
}

// ✅ ENHANCED INITIALIZATION with real-time detection
document.addEventListener('DOMContentLoaded', function() {
    const isMobile = window.innerWidth <= 768;
    
    // Update URL based on device type
    const currentUrl = new URL(window.location);
    if (isMobile) {
        currentUrl.searchParams.set('view', 'mobile');
    } else {
        currentUrl.searchParams.set('view', 'web');
    }
    window.history.replaceState(null, '', currentUrl);
    
    // Close banner functionality
    const closeBanner = document.querySelector('.mobile-close-banner');
    if (closeBanner) {
        closeBanner.addEventListener('click', function() {
            const banner = document.querySelector('.mobile-top-banner');
            if (banner) banner.style.display = 'none';
        });
    }
    
    // Mobile form validation
    const membershipInput = document.getElementById('membershipNumber');
    const passwordInput = document.getElementById('mobilePassword');
    if (membershipInput) membershipInput.addEventListener('input', validateMobileForm);
    if (passwordInput) passwordInput.addEventListener('input', validateMobileForm);
    
    // Form event listeners
    const mobileLoginForm = document.getElementById('mobileLoginForm');
    if (mobileLoginForm) {
        mobileLoginForm.addEventListener('submit', handleMobileLogin);
    }
    
    const desktopLoginForm = document.getElementById('desktopLoginForm');
    if (desktopLoginForm) {
        desktopLoginForm.addEventListener('submit', handleDesktopLogin);
    }
    
    const claimForm = document.getElementById('claimForm');
    if (claimForm) {
        claimForm.addEventListener('submit', handleClaimFormSubmit);
    }
    
    // Device-specific initialization
    if (isMobile) {
        const mobileContainer = document.querySelector('.mobile-container');
        const desktopContainer = document.querySelector('.desktop-container');
        
        if (mobileContainer) mobileContainer.style.display = 'block';
        if (desktopContainer) desktopContainer.style.display = 'none';
        
        // ✅ START REAL-TIME DETECTION for mobile users
        setTimeout(() => {
            startRealTimeCodeDetection();
        }, 1000);
    } else {
        const desktopContainer = document.querySelector('.desktop-container');
        const mobileContainer = document.querySelector('.mobile-container');
        
        if (desktopContainer) desktopContainer.style.display = 'flex';
        if (mobileContainer) mobileContainer.style.display = 'none';
        
        const desktopLoginPage = document.getElementById('desktopLoginPage');
        const desktopDashboardPage = document.getElementById('desktopDashboardPage');
        
        if (desktopLoginPage) desktopLoginPage.style.display = 'flex';
        if (desktopDashboardPage) desktopDashboardPage.classList.remove('active');
        
        // Real-time detection works on desktop too
        setTimeout(() => {
            startRealTimeCodeDetection();
        }, 1000);
    }
});

// ✅ ENHANCED RESIZE HANDLER with real-time detection management
window.addEventListener('resize', function() {
    const isMobile = window.innerWidth <= 768;
    
    // Update URL based on device type
    const currentUrl = new URL(window.location);
    if (isMobile) {
        currentUrl.searchParams.set('view', 'mobile');
    } else {
        currentUrl.searchParams.set('view', 'web');
    }
    window.history.replaceState(null, '', currentUrl);
    
    if (isMobile) {
        const mobileContainer = document.querySelector('.mobile-container');
        const desktopContainer = document.querySelector('.desktop-container');
        
        if (mobileContainer) mobileContainer.style.display = 'block';
        if (desktopContainer) desktopContainer.style.display = 'none';
    } else {
        const desktopContainer = document.querySelector('.desktop-container');
        const mobileContainer = document.querySelector('.mobile-container');
        
        if (desktopContainer) desktopContainer.style.display = 'flex';
        if (mobileContainer) mobileContainer.style.display = 'none';
    }
    
    // Real-time detection continues regardless of screen size
});

// ✅ CLEANUP: Stop real-time detection when page is about to unload
window.addEventListener('beforeunload', function() {
    stopRealTimeCodeDetection();
    console.log('🧹 Page unloading - stopped real-time detection');
});

// ✅ VISIBILITY API: Pause real-time detection when tab is hidden
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('👁️ Tab hidden - pausing real-time detection');
        stopRealTimeCodeDetection();
    } else {
        console.log('👁️ Tab visible - resuming real-time detection');
        startRealTimeCodeDetection();
    }
});

// ✅ NETWORK STATUS: Handle online/offline states
window.addEventListener('online', function() {
    console.log('🌐 Back online - resuming real-time detection');
    if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
        startRealTimeCodeDetection();
    }
});

window.addEventListener('offline', function() {
    console.log('📡 Gone offline - stopping real-time detection');
    stopRealTimeCodeDetection();
});

// ✅ KEYBOARD SHORTCUTS: Add helpful keyboard shortcuts
document.addEventListener('keydown', function(e) {
    const isMobile = window.innerWidth <= 768;
    
    // Only in mobile view
    if (!isMobile) return;
    
    // ESC key - go back to login screen
    if (e.key === 'Escape') {
        e.preventDefault();
        const codeSection = document.getElementById('mobileCodeSection');
        if (codeSection && codeSection.classList.contains('show')) {
            showLoginScreen();
            console.log('⌨️ Returned to login via ESC key');
        }
    }
});

// ✅ UTILITY FUNCTIONS: Additional helper functions
function isValidFourDigitCode(code) {
    return /^\d{4}$/.test(code);
}

function formatPhoneNumber(phone) {
    // Simple phone number formatting for display
    if (phone && phone.startsWith('+61')) {
        return phone.replace('+61', '0').replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return phone;
}

// ✅ UTILITY FUNCTIONS: Fixed version
function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent.substring(0, 100),
        platform: navigator.platform,
        language: navigator.language,
        screen: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString()
    };
}

// ✅ ACCESSIBILITY IMPROVEMENTS
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// ✅ ENHANCED ERROR HANDLING
function handleApiError(error, context = 'API operation') {
    console.error(`❌ ${context} failed:`, error);
    
    let userMessage = 'Something went wrong. Please try again.';
    let technicalDetails = error.message;
    
    if (error.message.includes('fetch')) {
        userMessage = 'Unable to connect to HCF servers';
        technicalDetails = 'Network connection failed';
    } else if (error.message.includes('timeout')) {
        userMessage = 'Request timed out';
        technicalDetails = 'Server response took too long';
    } else if (error.message.includes('401')) {
        userMessage = 'Authentication failed';
        technicalDetails = 'Invalid credentials or session expired';
    } else if (error.message.includes('403')) {
        userMessage = 'Access denied';
        technicalDetails = 'Insufficient permissions';
    } else if (error.message.includes('404')) {
        userMessage = 'Service not found';
        technicalDetails = 'API endpoint not available';
    } else if (error.message.includes('500')) {
        userMessage = 'Server error occurred';
        technicalDetails = 'Internal server error';
    }
    
    return {
        userMessage,
        technicalDetails,
        timestamp: new Date().toISOString(),
        context
    };
}

// ✅ PERFORMANCE MONITORING
let performanceMetrics = {
    apiCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    averageResponseTime: 0,
    lastCallTime: null
};

function trackApiCall(startTime, success = true) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    performanceMetrics.apiCalls++;
    performanceMetrics.lastCallTime = endTime;
    
    if (success) {
        performanceMetrics.successfulCalls++;
    } else {
        performanceMetrics.failedCalls++;
    }
    
    // Calculate rolling average response time
    performanceMetrics.averageResponseTime = 
        (performanceMetrics.averageResponseTime * (performanceMetrics.apiCalls - 1) + responseTime) / 
        performanceMetrics.apiCalls;
    
    console.log(`📊 API Call completed in ${responseTime}ms (Success: ${success})`);
}

function getPerformanceReport() {
    const successRate = performanceMetrics.apiCalls > 0 ? 
        (performanceMetrics.successfulCalls / performanceMetrics.apiCalls * 100).toFixed(1) : 0;
    
    return {
        ...performanceMetrics,
        successRate: `${successRate}%`,
        uptime: Date.now() - (window.hcfAppStartTime || Date.now())
    };
}

// ✅ SESSION MANAGEMENT
function saveSessionToStorage(sessionData) {
    try {
        const sessionInfo = {
            sessionId: sessionData.sessionId,
            timestamp: Date.now(),
            expiryTime: sessionData.expiryTime,
            deviceId: getDeviceInfo().userAgent,
            code: sessionData.code
        };
        
        sessionStorage.setItem('hcf_current_session', JSON.stringify(sessionInfo));
        console.log('💾 Session saved to storage');
    } catch (error) {
        console.warn('⚠️ Could not save session to storage:', error);
    }
}

function loadSessionFromStorage() {
    try {
        const stored = sessionStorage.getItem('hcf_current_session');
        if (stored) {
            const sessionInfo = JSON.parse(stored);
            
            // Check if session is still valid
            if (sessionInfo.expiryTime && Date.now() < sessionInfo.expiryTime) {
                console.log('📂 Valid session loaded from storage');
                return sessionInfo;
            } else {
                console.log('⏰ Stored session expired, clearing');
                sessionStorage.removeItem('hcf_current_session');
            }
        }
    } catch (error) {
        console.warn('⚠️ Could not load session from storage:', error);
    }
    return null;
}

function clearSessionStorage() {
    try {
        sessionStorage.removeItem('hcf_current_session');
        console.log('🗑️ Session storage cleared');
    } catch (error) {
        console.warn('⚠️ Could not clear session storage:', error);
    }
}

// ✅ DEBUG HELPERS: Development and testing utilities
function getAutoDetectionStatus() {
    return {
        isRunning: !!eventSource && eventSource.readyState === EventSource.OPEN,
        connectionState: eventSource ? eventSource.readyState : 'Not connected',
        currentSessionId: currentSessionId,
        lastKnownSessionId: lastKnownSessionId,
        isMobile: window.innerWidth <= 768,
        isVisible: document.visibilityState === 'visible',
        isOnline: navigator.onLine,
        apiBaseUrl: API_BASE_URL
    };
}

async function debugAdminEndpoint() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/sessions`);
        const data = await response.json();
        console.log('🐛 Admin endpoint response:', data);
        return data;
    } catch (error) {
        console.error('🐛 Admin endpoint error:', error);
        return null;
    }
}

// Manual refresh option for immediate check
async function checkForNewCodeNow() {
    console.log('🔍 Manual check for new code triggered');
    try {
        await generateCodeDirectly();
    } catch (error) {
        console.error('🔍 Manual check failed:', error);
    }
}

// Add to window for debugging (only in development)
if (typeof window !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.debugHCF = {
        getStatus: getAutoDetectionStatus,
        startRealTime: startRealTimeCodeDetection,
        stopRealTime: stopRealTimeCodeDetection,
        checkNow: checkForNewCodeNow,
        generateCode: generateCodeDirectly,
        showLogin: showLoginScreen,
        showCode: showCodeScreen,
        currentCode: () => currentGeneratedCode,
        currentSession: () => currentSessionId,
        debugAdmin: debugAdminEndpoint,
        performanceReport: getPerformanceReport,
        clearSession: clearSessionStorage
    };
    console.log('🐛 Debug helpers available at window.debugHCF');
    console.log('🐛 Available methods:', Object.keys(window.debugHCF));
}

// ✅ FINAL INITIALIZATION
window.hcfAppStartTime = Date.now();

// Enhanced startup logging
console.log('🚀 HCF Mobile App Script Loaded Successfully');
console.log('📱 User Agent:', navigator.userAgent.substring(0, 80) + '...');
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('📊 Performance tracking enabled');
console.log('🛡️ Error handling enhanced');
console.log('♿ Accessibility features active');
console.log('📡 Real-time code detection via Server-Sent Events');

// Check for stored session on startup
const storedSession = loadSessionFromStorage();
if (storedSession) {
    currentSessionId = storedSession.sessionId;
    lastKnownSessionId = storedSession.sessionId;
    currentGeneratedCode = storedSession.code;
    console.log('🔄 Restored session from storage:', storedSession.sessionId);
    
    // If we have a valid stored session with a code, show it
    if (storedSession.code && isValidFourDigitCode(storedSession.code)) {
        console.log('🎯 Auto-displaying stored code:', storedSession.code);
        setTimeout(() => {
            showCodeScreen(storedSession.code);
        }, 1000);
    }
}

// Expose version info
window.HCF_APP_VERSION = '2.1.0';
window.HCF_FEATURES = {
    fourDigitCodes: true,
    realTimeDetection: true,
    serverSentEvents: true,
    mobileFirst: true,
    accessibilityEnabled: true,
    performanceTracking: true,
    sessionPersistence: true,
    genesysChat: true
};

console.log('✅ HCF Mobile App v2.1.0 Ready - Real-time code detection active!');