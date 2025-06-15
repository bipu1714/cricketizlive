// Welcome Page/live/script.js

// --- Global Scope: Parameter Detection & Key Constants ---
const liveUrlParams = new URLSearchParams(window.location.search);
const currentViewMode = liveUrlParams.get('viewMode');

// Constants needed by this script (ensure these match your actual keys)
const PUBLIC_CONFIG_KEY = 'cricketizlive_public_config_v2';
const MATCH_END_TIME_KEY_LS = 'cricketizlive_matchEndTime';
const LAST_MATCH_OVERLAY_DATA_KEY = 'cricketizlive_lastMatchOverlayData';
const RESULT_DISPLAY_DURATION_LS = 3 * 60 * 60 * 1000; // 3 hours
const welcomePagePath = 'https://cricketizlive.com/'; // Your welcome page URL

// Global variables that might be controlled by different modes
let apiInterval = null;
let redirectTimerId = null;
let mockMatchData = { /* Initialize with your default mockMatchData structure */
    seriesDisplayString: "Loading Series...",
    matchTitle: "Loading Match...",
    status: "Loading...",
    matchTypeStatus: "LOADING",
    team1: { name: "Team A", logo: "", score: "0-0", wickets: 0, totalScore: 0, battedOvers: 0.0 },
    team2: { name: "Team B", logo: "", score: "0-0", wickets: 0, totalScore: 0, battedOvers: 0.0 },
    currentInnings: 1,
    overs: 0.0,
    currentOverBalls: ["", "", "", "", "", ""],
    batters: [],
    bowler: {},
    commentary: ["Loading commentary..."],
    crr: 0.0,
    rrr: 0.0,
    target: 0,
    winningTeam: null,
    current_event: ""
};

// --- DOM Element Selectors (ensure all your selectors are here) ---
let seriesNameTextEl, bannerMatchStatusTagEl, bannerTeam1NameEl, bannerTeam1FlagEl, 
    bannerTeam1ScoreEl, bannerTeam1OversEl, bannerTeam2NameEl, bannerTeam2FlagEl, 
    bannerTeam2ScoreEl, bannerTeam2OversEl, dynamicEventTextEl, bannerMatchTitleEl, 
    bannerCrrEl, bannerRrEl, rrSeparatorEl, overProgressBallsEl, batterTbodyEl, 
    bowlerTbodyEl, commentaryBoxEl, matchResultOverlayEl, winnerLogoEl, matchWinnerTextEl;

function assignDOMSelectors() {
    seriesNameTextEl = document.getElementById('series-name-text');
    bannerMatchStatusTagEl = document.getElementById('banner-match-status-tag');
    bannerTeam1NameEl = document.getElementById('banner-team1-name');
    bannerTeam1FlagEl = document.getElementById('banner-team1-flag');
    bannerTeam1ScoreEl = document.getElementById('banner-team1-score');
    bannerTeam1OversEl = document.getElementById('banner-team1-overs');
    bannerTeam2NameEl = document.getElementById('banner-team2-name');
    bannerTeam2FlagEl = document.getElementById('banner-team2-flag');
    bannerTeam2ScoreEl = document.getElementById('banner-team2-score');
    bannerTeam2OversEl = document.getElementById('banner-team2-overs');
    dynamicEventTextEl = document.getElementById('dynamic-event-text');
    bannerMatchTitleEl = document.getElementById('banner-match-title');
    bannerCrrEl = document.getElementById('banner-crr');
    bannerRrEl = document.getElementById('banner-rr');
    rrSeparatorEl = document.querySelector('.run-rates-container .run-rate-separator');
    overProgressBallsEl = document.querySelectorAll('.over-progress .ball-in-over');
    batterTbodyEl = document.getElementById('batter-tbody');
    bowlerTbodyEl = document.getElementById('bowler-tbody');
    commentaryBoxEl = document.getElementById('commentary-box');
    matchResultOverlayEl = document.getElementById('match-result-overlay');
    winnerLogoEl = document.getElementById('winner-logo');
    matchWinnerTextEl = document.getElementById('match-winner-text');
}


// --- Main Execution Logic (after DOM is loaded) ---
document.addEventListener('DOMContentLoaded', () => {
    assignDOMSelectors(); // Assign all DOM elements once DOM is ready

    console.log("Live Scorecard DOM Loaded. Current viewMode:", currentViewMode);

    // --- Ad Hiding Logic ---
    if (currentViewMode === 'admin_iframe_preview' || currentViewMode === 'obs_ad_free') {
        console.log("Live Scorecard: Ad-free mode detected. Hiding ads (implement ad hiding).");
        // !!! IMPORTANT: Implement your ad hiding logic here !!!
        // e.g., const adElements = document.querySelectorAll('.ad-placeholder-class, #google-ad-id');
        // adElements.forEach(ad => { if(ad) ad.style.display = 'none'; });
    }

    // --- Behavior based on viewMode ---
    if (currentViewMode === 'admin_iframe_preview') {
        console.log("Live Scorecard: Running in ADMIN IFRAME PREVIEW mode.");
        if (apiInterval) clearInterval(apiInterval);
        if (redirectTimerId) clearTimeout(redirectTimerId);

        // Display an initial "waiting" state in the iframe
        if (seriesNameTextEl) seriesNameTextEl.textContent = "Admin Preview";
        if (bannerMatchTitleEl) bannerMatchTitleEl.textContent = "Waiting for Admin Config...";
        // Clear out other dynamic data or show placeholders
        updateAllUIData({ // Pass a minimal default state for preview
            seriesDisplayString: "Admin Preview Mode",
            matchTitle: "Waiting for Configuration...",
            team1: { name: "Team 1", logo: "", score: "-", wickets:0, totalScore:0, battedOvers:0 },
            team2: { name: "Team 2", logo: "", score: "-", wickets:0, totalScore:0, battedOvers:0 },
            status: "Preview", matchTypeStatus: "PREVIEW",
            currentOverBalls: [], batters: [], bowler: {}, commentary: ["Preview will update based on admin panel actions."],
            crr: 0, rrr: 0, target: 0, current_event: "", winningTeam: null
        });


        window.addEventListener("message", function(event) {
            // IMPORTANT: Add origin check for security in production if admin panel domain differs
            // if (event.origin !== "http://127.0.0.1:5500" && event.origin !== "https://youradmin.com") {
            //     console.warn("Message from untrusted origin blocked:", event.origin);
            //     return;
            // }
            if (event.data && event.data.type === "UPDATE_PREVIEW_CONFIG") {
                console.log("Admin Iframe Preview: Config received from admin panel", event.data.config);
                applyAdminConfigToPreview(event.data.config);
            }
        });

    } else if (currentViewMode === 'obs_ad_free') {
        console.log("Live Scorecard: Running in OBS AD-FREE mode.");
        initializeScorecardForOBS();

    } else {
        console.log("Live Scorecard: Running in PUBLIC mode.");
        initializeScorecard(); // Your existing full initialization for public view
    }
});


// --- Function Definitions (Paste your existing functions here, then we'll modify/add) ---

function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 1002 });
    }
}

// --- UI UPDATE FUNCTIONS (These should be your existing functions) ---
function updateSeriesBannerUI(seriesText) { if(seriesNameTextEl) seriesNameTextEl.textContent = seriesText || "Ongoing Series"; }
function updateScoreBannerUI(data) {
    if (!bannerMatchStatusTagEl) return; // Guard against elements not found
    bannerMatchStatusTagEl.textContent = data.matchTypeStatus || "LIVE | ODI";
    if (bannerTeam1NameEl) bannerTeam1NameEl.textContent = data.team1.name;
    if (bannerTeam1FlagEl) bannerTeam1FlagEl.src = data.team1.logo;
    if (bannerTeam1ScoreEl) bannerTeam1ScoreEl.textContent = data.team1.score;
    if (bannerTeam1OversEl) {
        if (data.currentInnings === 1 && data.status !== "Match Finished" && data.status !== "Innings Break") {
            bannerTeam1OversEl.textContent = (typeof data.overs === 'number' ? data.overs.toFixed(1) : "0.0");
        } else {
            bannerTeam1OversEl.textContent = data.team1.battedOvers ? data.team1.battedOvers.toFixed(1) : "0.0";
        }
    }
    if (bannerTeam2NameEl) bannerTeam2NameEl.textContent = data.team2.name;
    if (bannerTeam2FlagEl) bannerTeam2FlagEl.src = data.team2.logo;
    if (bannerTeam2ScoreEl) bannerTeam2ScoreEl.textContent = data.team2.score;
    if (bannerTeam2OversEl) {
        if (data.currentInnings === 2 && data.status !== "Match Finished" && data.status !== "Innings Break") {
            bannerTeam2OversEl.textContent = (typeof data.overs === 'number' ? data.overs.toFixed(1) : "0.0");
        } else {
            bannerTeam2OversEl.textContent = data.team2.battedOvers ? data.team2.battedOvers.toFixed(1) : "0.0";
        }
    }
    if (bannerMatchTitleEl) bannerMatchTitleEl.textContent = data.matchTitle || "Match Details";
    if (bannerCrrEl) bannerCrrEl.textContent = `CRR: ${(typeof data.crr === 'number' ? data.crr.toFixed(2) : "0.00")}`;
    if (bannerRrEl && rrSeparatorEl) {
        if (data.currentInnings === 2 && data.target > 0 && data.status !== "Match Finished" && !data.winningTeam) {
            bannerRrEl.textContent = `RR: ${(typeof data.rrr === 'number' ? data.rrr.toFixed(1) : "0.0")}`;
            bannerRrEl.style.display = 'inline';
            rrSeparatorEl.style.display = 'inline';
        } else {
            bannerRrEl.textContent = ''; bannerRrEl.style.display = 'none'; rrSeparatorEl.style.display = 'none';
        }
    }
    if(dynamicEventTextEl) {
        dynamicEventTextEl.textContent = ''; dynamicEventTextEl.classList.remove('wicket-text-style');
        if (data.current_event === "4" || data.current_event === "6") {
            dynamicEventTextEl.textContent = data.current_event; triggerConfetti();
        } else if (data.current_event === "W") {
            dynamicEventTextEl.textContent = "WICKET"; dynamicEventTextEl.classList.add('wicket-text-style');
        }
    }
}
function updateOverProgressUI(balls) { /* Paste your existing updateOverProgressUI here */
    if(!overProgressBallsEl) return;
    overProgressBallsEl.forEach((ballEl, index) => {
        ballEl.textContent = ''; ballEl.className = 'ball-in-over';
        const ballOutcome = balls && balls[index] ? balls[index] : "";
        if (ballOutcome) {
            ballEl.textContent = ballOutcome;
            if (ballOutcome === "W") ballEl.classList.add('wicket');
            else if (ballOutcome === "4") ballEl.classList.add('four');
            else if (ballOutcome === "6") ballEl.classList.add('six');
            else if (ballOutcome === "0" || ballOutcome.toLowerCase() === "dot") ballEl.classList.add('dot');
            else if (!isNaN(parseInt(ballOutcome))) ballEl.classList.add('run');
        }
    });
}
function updateBatterStatsUI(batters) { /* Paste your existing updateBatterStatsUI here */
    if(!batterTbodyEl) return; batterTbodyEl.innerHTML = '';
    if (batters && batters.length) {
        batters.forEach(batter => {
            const row = batterTbodyEl.insertRow();
            row.innerHTML = `<td>${batter.onStrike ? '<strong>' + batter.name + '*</strong>' : batter.name}</td><td>${batter.runs}</td><td>${batter.balls}</td><td>${batter.fours}</td><td>${batter.sixes}</td><td>${(typeof batter.sr === 'number' ? batter.sr.toFixed(2) : "0.00")}</td>`;
        });
    }
}
function updateBowlerStatsUI(bowler) { /* Paste your existing updateBowlerStatsUI here */
    if(!bowlerTbodyEl) return; bowlerTbodyEl.innerHTML = '';
    if (bowler && bowler.name) { // Check if bowler object has data
        const row = bowlerTbodyEl.insertRow();
        row.innerHTML = `<td>${bowler.name}</td><td>${(typeof bowler.overs === 'number' ? bowler.overs.toFixed(1) : "0.0")}</td><td>${bowler.maidens}</td><td>${bowler.runsGiven}</td><td>${bowler.wickets}</td><td>${(typeof bowler.economy === 'number' ? bowler.economy.toFixed(2) : "0.00")}</td>`;
    }
}
function updateCommentaryUI(commentaryList) { /* Paste your existing updateCommentaryUI here */
    if(!commentaryBoxEl) return; commentaryBoxEl.innerHTML = '';
    if (commentaryList && commentaryList.length) {
        commentaryList.slice().reverse().forEach(comment => {
            const p = document.createElement('p'); p.textContent = comment; commentaryBoxEl.appendChild(p);
        });
        commentaryBoxEl.scrollTop = 0;
    }
}
function updateAllUIData(data) {
    if (!data) { console.error("updateAllUIData called with null data"); return; }
    updateSeriesBannerUI(data.seriesDisplayString);
    if (data.team1 && data.team2) { // Ensure team data exists
       updateScoreBannerUI(data);
    }
    updateOverProgressUI(data.currentOverBalls);
    updateBatterStatsUI(data.batters);
    updateBowlerStatsUI(data.bowler);
    updateCommentaryUI(data.commentary);
}


// --- Admin Preview Specific Function ---
function applyAdminConfigToPreview(adminConfig) {
    console.log("Applying admin config to preview iframe:", adminConfig);
    if (apiInterval) { clearInterval(apiInterval); apiInterval = null; }
    if (redirectTimerId) { clearTimeout(redirectTimerId); redirectTimerId = null; }

    // Update mockMatchData with adminConfig
    mockMatchData.apiKey = adminConfig.apiKey || '';
    mockMatchData.seriesDisplayString = adminConfig.seriesName || 'Preview Series';
    mockMatchData.matchTitle = adminConfig.matchTitle || 'Preview Match';
    mockMatchData.team1.name = adminConfig.team1Name || 'Team 1 (Preview)';
    mockMatchData.team1.logo = adminConfig.team1Logo || '';
    mockMatchData.team2.name = adminConfig.team2Name || 'Team 2 (Preview)';
    mockMatchData.team2.logo = adminConfig.team2Logo || '';
    mockMatchData.status = adminConfig.status || "Preview Mode";
    mockMatchData.matchTypeStatus = adminConfig.matchTypeStatus || "PREVIEW";
    mockMatchData.winningTeam = adminConfig.winningTeam || null;
    mockMatchData.team1.score = adminConfig.team1Score || "0-0";
    mockMatchData.team1.battedOvers = parseFloat(adminConfig.team1Overs) || 0.0;
    let t1Parts = mockMatchData.team1.score.split('-'); mockMatchData.team1.totalScore = parseInt(t1Parts[0]) || 0; mockMatchData.team1.wickets = parseInt(t1Parts[1]) || 0;
    mockMatchData.team2.score = adminConfig.team2Score || "0-0";
    mockMatchData.team2.battedOvers = parseFloat(adminConfig.team2Overs) || 0.0;
    let t2Parts = mockMatchData.team2.score.split('-'); mockMatchData.team2.totalScore = parseInt(t2Parts[0]) || 0; mockMatchData.team2.wickets = parseInt(t2Parts[1]) || 0;
    mockMatchData.overs = parseFloat(adminConfig.currentOvers) || 0.0;
    // Defaults for other fields if not provided by admin for preview
    mockMatchData.currentOverBalls = adminConfig.currentOverBallsForPreview || ["","","","","",""];
    mockMatchData.crr = adminConfig.crrForPreview || 0.0;
    mockMatchData.rrr = adminConfig.rrrForPreview || 0.0;
    mockMatchData.target = adminConfig.targetForPreview || 0;
    mockMatchData.commentary = adminConfig.commentaryForPreview || ["Admin preview. Live data might differ."];
    mockMatchData.current_event = adminConfig.currentEventForPreview || "";

    updateAllUIData(mockMatchData);

    if (mockMatchData.status === "Match Finished" && mockMatchData.winningTeam) {
        showMatchEndOverlay(mockMatchData.winningTeam,
                            mockMatchData.team1.name === mockMatchData.winningTeam ? mockMatchData.team1.logo : mockMatchData.team2.logo,
                            mockMatchData.matchTypeStatus);
    } else {
        if (matchResultOverlayEl) matchResultOverlayEl.classList.remove('show');
    }
    console.log("Admin Iframe Preview: UI updated.");
}

// --- OBS Specific Initialization ---
function initializeScorecardForOBS() {
    // ... (Paste your initializeScorecardForOBS function from my previous long response here) ...
    // Ensure it reads PUBLIC_CONFIG_KEY and updates mockMatchData, then calls updateAllUIData()
    // and starts apiInterval if a live config is found. Does NOT do 3-hr overlay or page redirect.
    console.log("Live Scorecard: Initializing for OBS (Ad-Free, uses PUBLIC_CONFIG_KEY, no auto-page-redirect).");
    if (apiInterval) clearInterval(apiInterval); 
    if (redirectTimerId) clearTimeout(redirectTimerId);

    const liveConfigStr = localStorage.getItem(PUBLIC_CONFIG_KEY);
    let isLiveMatchConfigured = false;
    if (liveConfigStr) {
        try {
            const liveConfig = JSON.parse(liveConfigStr);
            if (liveConfig && (liveConfig.apiKey || Object.keys(liveConfig).length > 0 )) {
                mockMatchData.apiKey = liveConfig.apiKey;
                mockMatchData.seriesDisplayString = liveConfig.seriesName || mockMatchData.seriesDisplayString;
                mockMatchData.matchTitle = liveConfig.matchTitle || mockMatchData.matchTitle;
                if(liveConfig.team1) { mockMatchData.team1.name = liveConfig.team1.name || mockMatchData.team1.name; mockMatchData.team1.logo = liveConfig.team1.logo || mockMatchData.team1.logo; }
                if(liveConfig.team2) { mockMatchData.team2.name = liveConfig.team2.name || mockMatchData.team2.name; mockMatchData.team2.logo = liveConfig.team2.logo || mockMatchData.team2.logo; }
                isLiveMatchConfigured = true; 
            }
        } catch (e) { console.error("OBS Mode: Error parsing live config:", e); }
    }

    if (!isLiveMatchConfigured) {
        mockMatchData.seriesDisplayString = "No Live Match Programmed (OBS)";
        mockMatchData.matchTitle = "Check Admin Panel";
        updateAllUIData(mockMatchData); 
        return; 
    }
    mockMatchData.status = "Live via Public Config"; mockMatchData.matchTypeStatus = "LIVE (OBS)"; // Indicate source
    updateAllUIData(mockMatchData); 
    apiInterval = setInterval(simulateApiUpdate, 4000); // Your existing simulation
}


// --- PUBLIC Initialization & Logic (Your existing functions for public view) ---
function showMatchEndOverlay(winningTeamName, logoUrl, matchStatusText = "Match Finished") {
    // ... (Your existing showMatchEndOverlay logic for the public page) ...
    // This is the one that shows the overlay.
    if(winnerLogoEl) winnerLogoEl.src = logoUrl;
    if(matchWinnerTextEl) matchWinnerTextEl.textContent = `${winningTeamName} Wins!`;
    if(matchWinnerTextEl && winningTeamName === "Match Tied") matchWinnerTextEl.textContent = "Match Tied!";
    if(matchResultOverlayEl) matchResultOverlayEl.classList.add('show');
    if(dynamicEventTextEl) { dynamicEventTextEl.textContent = (winningTeamName === "Match Tied") ? "TIED" : "WIN"; dynamicEventTextEl.style.color = "gold"; }
    if (bannerMatchStatusTagEl) bannerMatchStatusTagEl.textContent = matchStatusText.toUpperCase();
    if (bannerRrEl && rrSeparatorEl) { bannerRrEl.style.display = 'none'; rrSeparatorEl.style.display = 'none';}
}

function showMatchEndOverlayAndPersist(data) { // For PUBLIC view when match ends
    // ... (Your existing showMatchEndOverlayAndPersist logic: show overlay, save to LS, set 3hr timer) ...
    const winningTeamName = data.winningTeam;
    let logoForWinner = data.team1.name === winningTeamName ? data.team1.logo : data.team2.logo;
    if (winningTeamName === "Match Tied") logoForWinner = "https://via.placeholder.com/80x80/cccccc/000000?Text=TIE";
    showMatchEndOverlay(winningTeamName, logoForWinner, data.matchTypeStatus);
    const matchEndTime = Date.now();
    localStorage.setItem(MATCH_END_TIME_KEY_LS, matchEndTime.toString());
    localStorage.setItem(LAST_MATCH_OVERLAY_DATA_KEY, JSON.stringify({ /* ... relevant data ... */
        winningTeam: winningTeamName, winnerLogo: logoForWinner, matchTitle: data.matchTitle,
        team1: data.team1, team2: data.team2, matchTypeStatus: data.matchTypeStatus
    }));
    clearAndSetRedirectTimer(RESULT_DISPLAY_DURATION_LS);
}

function redirectToWelcomePage() { /* ... Your existing redirectToWelcomePage ... */
    if (redirectTimerId) { clearTimeout(redirectTimerId); redirectTimerId = null; }
    localStorage.removeItem(MATCH_END_TIME_KEY_LS);
    localStorage.removeItem(LAST_MATCH_OVERLAY_DATA_KEY);
    window.location.href = welcomePagePath;
}

function clearAndSetRedirectTimer(duration) { /* ... Your existing clearAndSetRedirectTimer ... */
    if (redirectTimerId) clearTimeout(redirectTimerId);
    redirectTimerId = setTimeout(redirectToWelcomePage, duration);
}

function initializeScorecard() { // PUBLIC MODE INITIALIZATION
    // ... (Your existing initializeScorecard logic for public view that checks MATCH_END_TIME_KEY_LS,
    //      PUBLIC_CONFIG_KEY, shows overlay or live data, and handles redirection) ...
    console.log("Initializing Scorecard Page (Public Mode)...");
    const storedMatchEndTimeStr = localStorage.getItem(MATCH_END_TIME_KEY_LS);
    const storedOverlayDataStr = localStorage.getItem(LAST_MATCH_OVERLAY_DATA_KEY);

    if (storedMatchEndTimeStr && storedOverlayDataStr) {
        const matchEndTime = parseInt(storedMatchEndTimeStr, 10);
        const currentTime = Date.now();
        const timeSinceEnd = currentTime - matchEndTime;
        if (timeSinceEnd < RESULT_DISPLAY_DURATION_LS) {
            try {
                const overlayData = JSON.parse(storedOverlayDataStr);
                mockMatchData.team1 = overlayData.team1; mockMatchData.team2 = overlayData.team2;
                mockMatchData.matchTitle = overlayData.matchTitle; mockMatchData.status = "Match Finished";
                mockMatchData.matchTypeStatus = overlayData.matchTypeStatus || "MATCH FINISHED";
                mockMatchData.winningTeam = overlayData.winningTeam;
                mockMatchData.crr = mockMatchData.team1.battedOvers > 0 ? (mockMatchData.team1.totalScore / mockMatchData.team1.battedOvers) : 0;
                updateAllUIData(mockMatchData);
                showMatchEndOverlay(overlayData.winningTeam, overlayData.winnerLogo, overlayData.matchTypeStatus);
                const remainingDuration = RESULT_DISPLAY_DURATION_LS - timeSinceEnd;
                clearAndSetRedirectTimer(remainingDuration);
                if (apiInterval) clearInterval(apiInterval); return;
            } catch (e) { /* ... error handling, clear LS ... */ }
        } else { redirectToWelcomePage(); return; }
    }

    const liveConfigStr = localStorage.getItem(PUBLIC_CONFIG_KEY);
    let isLiveMatchConfigured = false;
    if (liveConfigStr) { /* ... parse liveConfig ... */
        try {
            const liveConfig = JSON.parse(liveConfigStr);
            if (liveConfig && (liveConfig.apiKey || Object.keys(liveConfig).length > 0 )) {
                 mockMatchData.apiKey = liveConfig.apiKey;
                 mockMatchData.seriesDisplayString = liveConfig.seriesName || mockMatchData.seriesDisplayString;
                 /* ... apply other liveConfig to mockMatchData ... */
                 if(liveConfig.team1) { mockMatchData.team1.name = liveConfig.team1.name || mockMatchData.team1.name; mockMatchData.team1.logo = liveConfig.team1.logo || mockMatchData.team1.logo; }
                 if(liveConfig.team2) { mockMatchData.team2.name = liveConfig.team2.name || mockMatchData.team2.name; mockMatchData.team2.logo = liveConfig.team2.logo || mockMatchData.team2.logo; }

                isLiveMatchConfigured = true;
            }
        } catch(e) { console.error("Error parsing public config", e); }
    }

    if (!isLiveMatchConfigured) { redirectToWelcomePage(); return; }

    // Reset for new live match if applicable
    if (mockMatchData.currentInnings === 1 && mockMatchData.overs === 0.0 && (!mockMatchData.winningTeam) ) {
        // Basic reset for a new match, API will provide actual initial data
        mockMatchData.team1.score = "0-0"; mockMatchData.team1.wickets = 0; mockMatchData.team1.totalScore = 0; mockMatchData.team1.battedOvers = 0.0;
        mockMatchData.team2.score = "0-0"; mockMatchData.team2.wickets = 0; mockMatchData.team2.totalScore = 0; mockMatchData.team2.battedOvers = 0.0;
        mockMatchData.overs = 0.0; mockMatchData.currentOverBalls = ["", "", "", "", "", ""];
        mockMatchData.batters = [ { name: `${mockMatchData.team1.name.substring(0,3).toUpperCase()} BatterA`, runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0, onStrike: true }, { name: `${mockMatchData.team1.name.substring(0,3).toUpperCase()} BatterB`, runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0 }];
        mockMatchData.bowler = { name: `${mockMatchData.team2.name.substring(0,3).toUpperCase()} BowlerX`, overs: 0.0, maidens: 0, runsGiven: 0, wickets: 0, economy: 0.00 };
        mockMatchData.crr = 0.0; mockMatchData.rrr = 0.0; mockMatchData.target = 0;
        mockMatchData.commentary = ["Match is about to begin!"];
        mockMatchData.status = "Live | ODI"; mockMatchData.matchTypeStatus = "LIVE | ODI"; mockMatchData.winningTeam = null;
    }
    updateAllUIData(mockMatchData);
    if (apiInterval) clearInterval(apiInterval);
    apiInterval = setInterval(simulateApiUpdate, 4000); // Your existing simulation
}

function simulateApiUpdate() { // PUBLIC MODE SIMULATION
    // ... (Your existing simulateApiUpdate logic) ...
    // IMPORTANT: At the end, when matchHasJustEnded is true:
    // if (matchHasJustEnded) {
    //     ... determine winner ...
    //     updateAllUIData(mockMatchData);
    //     if (!currentViewMode) { // ONLY for public mode
    //         showMatchEndOverlayAndPersist(mockMatchData);
    //     } else if (currentViewMode === 'obs_ad_free' && mockMatchData.winningTeam) {
    //         showMatchEndOverlay(mockMatchData.winningTeam, ...); // Show simple overlay for OBS, no persist/redirect
    //     }
    //     if (apiInterval) clearInterval(apiInterval);
    //     return;
    // }
    // updateAllUIData(mockMatchData);
    if (mockMatchData.status === "Match Finished" && mockMatchData.winningTeam && !currentViewMode) { // Ensure public mode check
        if (apiInterval) clearInterval(apiInterval); return;
    }
     if (currentViewMode === 'admin_iframe_preview') { // Admin preview is driven by postMessage, not simulation
        if (apiInterval) clearInterval(apiInterval); return;
    }


    const outcomes = ["0", "1", "2", "3", "4", "6", "W"];
    const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    mockMatchData.current_event = randomOutcome;

    let currentOverStr = mockMatchData.overs.toFixed(1);
    let ballsInOverInt = parseInt(currentOverStr.split('.')[1] || '0');
    ballsInOverInt++;
    if (ballsInOverInt <= 6) {
        mockMatchData.overs = parseFloat(Math.floor(mockMatchData.overs) + "." + ballsInOverInt);
        mockMatchData.currentOverBalls[ballsInOverInt - 1] = randomOutcome;
    } else { 
        mockMatchData.overs = Math.floor(mockMatchData.overs) + 1.1;
        mockMatchData.currentOverBalls = [randomOutcome, "", "", "", "", ""]; 
    }

    const battingTeamData = mockMatchData.currentInnings === 1 ? mockMatchData.team1 : mockMatchData.team2;
    const onStrikeBatter = mockMatchData.batters.find(b => b.onStrike);

    if (randomOutcome === "W") { /* ... update wickets, commentary ... */ }
    else if (!isNaN(parseInt(randomOutcome))) { /* ... update score, runs, fours, sixes, commentary ... */ }
    else { /* ... dot ball commentary ... */ }
    if (onStrikeBatter && randomOutcome !== "W") { /* ... update batter balls, SR ... */ }
    battingTeamData.score = `${battingTeamData.totalScore}-${battingTeamData.wickets}`;
    battingTeamData.battedOvers = mockMatchData.overs;
    mockMatchData.crr = /* ... calculate CRR ... */ (battingTeamData.battedOvers > 0 ? (battingTeamData.totalScore / battingTeamData.battedOvers) : 0);


    let matchHasJustEnded = false;
    const maxMatchOvers = 50.0; 
    if (battingTeamData.wickets >= 10 || mockMatchData.overs >= maxMatchOvers) {
        if (mockMatchData.currentInnings === 1) { /* ... innings break logic ... */ }
        else { matchHasJustEnded = true; mockMatchData.status = "Match Finished"; mockMatchData.matchTypeStatus = "MATCH FINISHED"; }
    }
    if (mockMatchData.currentInnings === 2 && mockMatchData.target > 0) {
        if (mockMatchData.team2.totalScore >= mockMatchData.target) {
            matchHasJustEnded = true; mockMatchData.winningTeam = mockMatchData.team2.name;
            mockMatchData.status = "Match Finished"; mockMatchData.matchTypeStatus = "MATCH FINISHED";
        } else { /* ... calculate RRR ... */ }
    }

    if (matchHasJustEnded) {
        if (!mockMatchData.winningTeam) { /* ... determine winner if not set ... */ }
        updateAllUIData(mockMatchData); 
        
        if (!currentViewMode) { // Public mode
            showMatchEndOverlayAndPersist(mockMatchData);
        } else if (currentViewMode === 'obs_ad_free' && mockMatchData.winningTeam) {
            // OBS mode just shows the final overlay state, no persistence from here
            showMatchEndOverlay(mockMatchData.winningTeam, 
                mockMatchData.team1.name === mockMatchData.winningTeam ? mockMatchData.team1.logo : mockMatchData.team2.logo,
                mockMatchData.matchTypeStatus);
        }
        // For admin_iframe_preview, the state is controlled by postMessage, so this simulation
        // shouldn't be determining its final state unless admin explicitly sends "finished" config.
        // If this simulation runs for OBS and finishes, it should stop.
        if (apiInterval) clearInterval(apiInterval);
        console.log("Match ended in simulation (mode:", currentViewMode || "public","). API interval cleared.");
        return; 
    }
    updateAllUIData(mockMatchData);
}