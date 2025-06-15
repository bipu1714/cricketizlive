// admin-script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Constants ---
    const ADMIN_USERNAME_VALID = 'admin'; 
    const ADMIN_PASSWORD_VALID = 'password123'; 
    const ADMIN_LOGGED_IN_KEY = 'cricketizlive_adminLoggedIn_v1';
    const ADMIN_CONFIG_KEY = 'cricketizlive_admin_draft_config_v3'; 
    const PUBLIC_CONFIG_KEY = 'cricketizlive_public_config_v2';  

    // --- DOM Elements ---
    const loginScreen = document.getElementById('admin-login-screen');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const loginErrorEl = document.getElementById('login-error');

    const mainAdminContent = document.getElementById('admin-main-content');
    const logoutButton = document.getElementById('logout-button');
    const adminSeriesNameDisplay = document.getElementById('admin-series-name-display');

    const apiKeyInput = document.getElementById('api-key');
    const fetchApiDataButton = document.getElementById('fetch-api-data-button');
    const adminSeriesNameInput = document.getElementById('admin-series-name');
    const adminMatchTitleInput = document.getElementById('admin-match-title');

    const team1NameInput = document.getElementById('team1-name-override');
    const team1LogoUrlInput = document.getElementById('team1-logo-url-manual');
    const team1LogoUploadInput = document.getElementById('team1-logo-upload');
    const team1LogoPreviewImg = document.getElementById('team1-logo-preview-img');

    const team2NameInput = document.getElementById('team2-name-override');
    const team2LogoUrlInput = document.getElementById('team2-logo-url-manual');
    const team2LogoUploadInput = document.getElementById('team2-logo-upload');
    const team2LogoPreviewImg = document.getElementById('team2-logo-preview-img');
    
    const adminMatchStatusPreviewInput = document.getElementById('admin-match-status-preview');
    const adminWinningTeamPreviewInput = document.getElementById('admin-winning-team-preview');
    const team1ScorePreviewInput = document.getElementById('team1-score-preview');
    const team1OversPreviewInput = document.getElementById('team1-overs-preview');
    const team2ScorePreviewInput = document.getElementById('team2-score-preview');
    const team2OversPreviewInput = document.getElementById('team2-overs-preview');
    const currentOversPreviewInput = document.getElementById('current-overs-preview');

    const saveUpdatePreviewButton = document.getElementById('save-update-preview-button');
    const goLiveButton = document.getElementById('go-live-button');
    const openObsViewButton = document.getElementById('open-obs-view-button');
    const adminStatusMessageEl = document.getElementById('admin-status-message');

    const adminPublicApiKeyDisplay = document.getElementById('admin-public-api-key-display');
    const currentYearSpan = document.getElementById('current-year');
    const scorecardPreviewIframe = document.getElementById('scorecard-preview-iframe');

    if(currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

    let currentAdminConfig = {
        apiKey: '',
        seriesName: '',
        matchTitle: '',
        team1: { name: '', logoUrl: '', manualLogoDataUrl: null },
        team2: { name: '', logoUrl: '', manualLogoDataUrl: null },
        matchStatusForPreview: '', winningTeamForPreview: '',
        team1ScoreForPreview: '', team1OversForPreview: '',
        team2ScoreForPreview: '', team2OversForPreview: '',
        currentOversForPreview: '', currentOverBallsForPreview: ["","","","","",""], 
        crrForPreview: '', rrrForPreview: '', targetForPreview: '', commentaryForPreview: ["Preview mode active."], currentEventForPreview: ""
    };

    // --- Login Logic ---
    function attemptLogin() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        if (username === ADMIN_USERNAME_VALID && password === ADMIN_PASSWORD_VALID) {
            localStorage.setItem(ADMIN_LOGGED_IN_KEY, 'true');
            showMainAdminContent();
            loginErrorEl.textContent = ''; loginErrorEl.className = 'status-message';
        } else {
            loginErrorEl.textContent = 'Invalid username or password.'; loginErrorEl.className = 'status-message error';
        }
    }
    function showMainAdminContent() {
        if (loginScreen) loginScreen.style.display = 'none';
        if (mainAdminContent) mainAdminContent.style.display = 'flex';
        loadAdminConfigFromLocalStorage();
        loadPublicConfigDisplay();
    }
    function showLoginScreen() {
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainAdminContent) mainAdminContent.style.display = 'none';
        localStorage.removeItem(ADMIN_LOGGED_IN_KEY);
    }
    function checkLoginStatus() {
        if (localStorage.getItem(ADMIN_LOGGED_IN_KEY) === 'true') {
            showMainAdminContent();
        } else {
            showLoginScreen();
        }
    }

    // --- Configuration Management ---
    function populateFormFromAdminConfig() {
        apiKeyInput.value = currentAdminConfig.apiKey || '';
        adminSeriesNameInput.value = currentAdminConfig.seriesName || '';
        adminMatchTitleInput.value = currentAdminConfig.matchTitle || '';
        team1NameInput.value = currentAdminConfig.team1?.name || '';
        team1LogoUrlInput.value = currentAdminConfig.team1?.logoUrl || '';
        if (currentAdminConfig.team1?.manualLogoDataUrl) {
            team1LogoPreviewImg.src = currentAdminConfig.team1.manualLogoDataUrl;
            team1LogoPreviewImg.style.display = 'block';
        } else { team1LogoPreviewImg.style.display = 'none'; team1LogoPreviewImg.src="#"; }
        team2NameInput.value = currentAdminConfig.team2?.name || '';
        team2LogoUrlInput.value = currentAdminConfig.team2?.logoUrl || '';
        if (currentAdminConfig.team2?.manualLogoDataUrl) {
            team2LogoPreviewImg.src = currentAdminConfig.team2.manualLogoDataUrl;
            team2LogoPreviewImg.style.display = 'block';
        } else { team2LogoPreviewImg.style.display = 'none'; team2LogoPreviewImg.src="#"; }
        adminMatchStatusPreviewInput.value = currentAdminConfig.matchStatusForPreview || '';
        adminWinningTeamPreviewInput.value = currentAdminConfig.winningTeamForPreview || '';
        team1ScorePreviewInput.value = currentAdminConfig.team1ScoreForPreview || '';
        team1OversPreviewInput.value = currentAdminConfig.team1OversForPreview || '';
        team2ScorePreviewInput.value = currentAdminConfig.team2ScoreForPreview || '';
        team2OversPreviewInput.value = currentAdminConfig.team2OversForPreview || '';
        currentOversPreviewInput.value = currentAdminConfig.currentOversForPreview || '';
        updateAdminDisplays();
    }

    function loadAdminConfigFromLocalStorage() {
        const savedConfigStr = localStorage.getItem(ADMIN_CONFIG_KEY);
        if (savedConfigStr) {
            try {
                const loadedConfig = JSON.parse(savedConfigStr);
                currentAdminConfig = {...currentAdminConfig, ...loadedConfig};
                if(loadedConfig.team1) currentAdminConfig.team1 = {...currentAdminConfig.team1, ...loadedConfig.team1};
                if(loadedConfig.team2) currentAdminConfig.team2 = {...currentAdminConfig.team2, ...loadedConfig.team2};
                populateFormFromAdminConfig();
                console.log('Admin draft config loaded.');
            } catch (e) {
                console.error("Error loading admin draft config:", e);
                showAdminStatus('Error loading saved configuration. Using defaults.', 'error');
                populateFormFromAdminConfig();
            }
        } else { 
            console.log("No admin draft config found. Using defaults.");
            populateFormFromAdminConfig();
        }
    }

    function readFormIntoAdminConfig() {
        currentAdminConfig.apiKey = apiKeyInput.value.trim();
        currentAdminConfig.seriesName = adminSeriesNameInput.value.trim();
        currentAdminConfig.matchTitle = adminMatchTitleInput.value.trim();
        currentAdminConfig.team1 = currentAdminConfig.team1 || {}; 
        currentAdminConfig.team1.name = team1NameInput.value.trim(); 
        currentAdminConfig.team1.logoUrl = team1LogoUrlInput.value.trim();
        currentAdminConfig.team2 = currentAdminConfig.team2 || {}; 
        currentAdminConfig.team2.name = team2NameInput.value.trim(); 
        currentAdminConfig.team2.logoUrl = team2LogoUrlInput.value.trim();
        currentAdminConfig.matchStatusForPreview = adminMatchStatusPreviewInput.value.trim();
        currentAdminConfig.winningTeamForPreview = adminWinningTeamPreviewInput.value.trim();
        currentAdminConfig.team1ScoreForPreview = team1ScorePreviewInput.value.trim(); 
        currentAdminConfig.team1OversForPreview = team1OversPreviewInput.value.trim();
        currentAdminConfig.team2ScoreForPreview = team2ScorePreviewInput.value.trim(); 
        currentAdminConfig.team2OversForPreview = team2OversPreviewInput.value.trim();
        currentAdminConfig.currentOversForPreview = currentOversPreviewInput.value.trim();
    }

    function saveAndPreview() {
        readFormIntoAdminConfig();
        localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(currentAdminConfig));
        updateAdminDisplays();
        sendConfigToIframePreview();
        showAdminStatus('Draft saved & preview updated!', 'success');
        console.log('Admin config saved to draft and sent to preview.');
    }

    function handleLogoUpload(event, teamConfigObjectInAdminConfig, previewImgEl) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => { 
                teamConfigObjectInAdminConfig.manualLogoDataUrl = e.target.result; 
                previewImgEl.src = e.target.result; 
                previewImgEl.style.display = 'block'; 
            };
            reader.readAsDataURL(file);
        } else { 
            teamConfigObjectInAdminConfig.manualLogoDataUrl = null; 
            previewImgEl.src = '#'; 
            previewImgEl.style.display = 'none'; 
        }
    }
    
    function updateAdminDisplays() { 
        adminSeriesNameDisplay.textContent = currentAdminConfig.seriesName || 'Not Set'; 
    }

    function loadPublicConfigDisplay() {
        const publicConfigStr = localStorage.getItem(PUBLIC_CONFIG_KEY);
        if (publicConfigStr) { 
            try { 
                const publicConfig = JSON.parse(publicConfigStr); 
                adminPublicApiKeyDisplay.textContent = publicConfig.apiKey || 'None Set'; 
            } catch (e) { adminPublicApiKeyDisplay.textContent = 'Error reading'; }
        } else { adminPublicApiKeyDisplay.textContent = 'None Set'; }
    }

    async function fetchAndPopulateFromAPI() {
        const apiKeyOrUrl = apiKeyInput.value.trim();
        if (!apiKeyOrUrl) {
            showAdminStatus('Please enter an API Key or Endpoint URL first.', 'error');
            return;
        }
        showAdminStatus('Fetching data from API...', 'info');
        try {
            const response = await fetch(apiKeyOrUrl);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }
            const apiData = await response.json();
            console.log("API Data Received:", apiData);

            adminSeriesNameInput.value = apiData.seriesName || apiData.series?.name || '';
            adminMatchTitleInput.value = apiData.matchTitle || apiData.match?.title || '';
            
            if (apiData.team1 || (apiData.teams && apiData.teams[0])) {
                const t1Data = apiData.team1 || apiData.teams[0];
                team1NameInput.value = t1Data.name || '';
                team1LogoUrlInput.value = t1Data.logoUrl || t1Data.logo || '';
            }
            if (apiData.team2 || (apiData.teams && apiData.teams[1])) {
                const t2Data = apiData.team2 || apiData.teams[1];
                team2NameInput.value = t2Data.name || '';
                team2LogoUrlInput.value = t2Data.logoUrl || t2Data.logo || '';
            }
            
            adminMatchStatusPreviewInput.value = apiData.matchStatus || apiData.status || '';
            adminWinningTeamPreviewInput.value = apiData.winningTeam || apiData.winner || '';
            team1ScorePreviewInput.value = apiData.team1Score || apiData.team1?.score || '';
            team1OversPreviewInput.value = apiData.team1Overs || apiData.team1?.overs || '';
            team2ScorePreviewInput.value = apiData.team2Score || apiData.team2?.score || '';
            team2OversPreviewInput.value = apiData.team2Overs || apiData.team2?.overs || '';
            currentOversPreviewInput.value = apiData.currentOvers || apiData.overs || '';

            showAdminStatus('Fields populated from API! Review and override if needed.', 'success');
            saveAndPreview(); 
        } catch (error) {
            console.error("Error fetching or processing API data:", error);
            showAdminStatus(`API Error: ${error.message}`, 'error');
        }
    }

    function sendConfigToIframePreview() {
        if (!scorecardPreviewIframe || !scorecardPreviewIframe.contentWindow) { console.warn("Preview iframe not ready yet."); return; }
        readFormIntoAdminConfig(); 
        const previewConfigForIframe = {
            apiKey: currentAdminConfig.apiKey, 
            seriesName: currentAdminConfig.seriesName, 
            matchTitle: currentAdminConfig.matchTitle,
            team1Name: currentAdminConfig.team1.name, 
            team1Logo: currentAdminConfig.team1.manualLogoDataUrl || currentAdminConfig.team1.logoUrl || null,
            team2Name: currentAdminConfig.team2.name, 
            team2Logo: currentAdminConfig.team2.manualLogoDataUrl || currentAdminConfig.team2.logoUrl || null,
            status: currentAdminConfig.matchStatusForPreview, 
            matchTypeStatus: currentAdminConfig.matchStatusForPreview, 
            winningTeam: currentAdminConfig.winningTeamForPreview,
            team1Score: currentAdminConfig.team1ScoreForPreview, 
            team1Overs: currentAdminConfig.team1OversForPreview, 
            team2Score: currentAdminConfig.team2ScoreForPreview, 
            team2Overs: currentAdminConfig.team2OversForPreview, 
            currentOvers: currentAdminConfig.currentOversForPreview, 
            currentOverBallsForPreview: currentAdminConfig.currentOverBallsForPreview, 
            crrForPreview: currentAdminConfig.crrForPreview, 
            rrrForPreview: currentAdminConfig.rrrForPreview, 
            targetForPreview: currentAdminConfig.targetForPreview,
            commentaryForPreview: currentAdminConfig.commentaryForPreview,
            currentEventForPreview: currentAdminConfig.currentEventForPreview
        };
        scorecardPreviewIframe.contentWindow.postMessage({ type: 'UPDATE_PREVIEW_CONFIG', config: previewConfigForIframe }, '*');
        console.log("Config sent to iframe preview:", previewConfigForIframe);
    }

    function goLive() {
        readFormIntoAdminConfig(); 
        localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(currentAdminConfig)); 
        if (!currentAdminConfig.apiKey && !currentAdminConfig.seriesName) { 
            showAdminStatus('Cannot Go Live. API Key or Series Name is required.', 'error'); return; 
        }
        const publicConfig = {
            apiKey: currentAdminConfig.apiKey, 
            seriesName: currentAdminConfig.seriesName, 
            matchTitle: currentAdminConfig.matchTitle,
            team1: { name: currentAdminConfig.team1.name, logo: currentAdminConfig.team1.manualLogoDataUrl || currentAdminConfig.team1.logoUrl || null },
            team2: { name: currentAdminConfig.team2.name, logo: currentAdminConfig.team2.manualLogoDataUrl || currentAdminConfig.team2.logoUrl || null },
        };
        localStorage.setItem(PUBLIC_CONFIG_KEY, JSON.stringify(publicConfig));
        showAdminStatus('Configuration is NOW LIVE!', 'success');
        loadPublicConfigDisplay(); 
        console.log('Configuration pushed to live (PUBLIC_CONFIG_KEY).');
    }

    function showAdminStatus(message, type = 'info') {
        adminStatusMessageEl.textContent = message; 
        adminStatusMessageEl.className = `status-message ${type}`;
        setTimeout(() => { adminStatusMessageEl.textContent = ''; adminStatusMessageEl.className = 'status-message'; }, 4000);
    }
    
    function openObsViewTab() {
        const obsUrl = '../live/index.html?viewMode=obs_ad_free';
        window.open(obsUrl, '_blank');
        showAdminStatus('OBS Ad-Free view opened in new tab. Uses "Live" config.', 'info');
        console.log('OBS Ad-Free view tab opened:', obsUrl);
    }

    // --- Event Listeners ---
    if (loginButton) {
        loginButton.addEventListener('click', attemptLogin);
        // Also allow login on Enter press in password or username field
        passwordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') attemptLogin(); });
        usernameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') attemptLogin(); });
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', showLoginScreen);
    }
    if (fetchApiDataButton) {
        fetchApiDataButton.addEventListener('click', fetchAndPopulateFromAPI);
    }
    if (saveUpdatePreviewButton) {
        saveUpdatePreviewButton.addEventListener('click', saveAndPreview);
    }
    if (goLiveButton) {
        goLiveButton.addEventListener('click', goLive);
    }
    if (openObsViewButton) { // Added listener for OBS button
        openObsViewButton.addEventListener('click', openObsViewTab);
    }
    if (team1LogoUploadInput) {
        team1LogoUploadInput.addEventListener('change', (e) => handleLogoUpload(e, currentAdminConfig.team1, team1LogoPreviewImg));
    }
    if (team2LogoUploadInput) {
        team2LogoUploadInput.addEventListener('change', (e) => handleLogoUpload(e, currentAdminConfig.team2, team2LogoPreviewImg));
    }

    if (scorecardPreviewIframe) {
        scorecardPreviewIframe.addEventListener('load', () => {
            console.log("Admin Panel: Iframe has loaded its content. Attempting to send initial config.");
            // loadAdminConfigFromLocalStorage() is called by showMainAdminContent -> checkLoginStatus.
            // By the time the iframe 'load' event fires, currentAdminConfig should be populated if there was saved data.
            // So, we can directly try to send the (possibly loaded) config.
            sendConfigToIframePreview(); 
        });
    }
    
    checkLoginStatus();
});