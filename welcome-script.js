// Temporary content for Welcome Page/live/script.js
console.log("--- LIVE SCRIPT.JS LOADED ---");
alert("IFRAME IS LOADING LIVE/SCRIPT.JS");

const liveUrlParams = new URLSearchParams(window.location.search);
const currentViewMode = liveUrlParams.get('viewMode');

console.log("Current viewMode parameter in iframe:", currentViewMode);
alert("Iframe viewMode is: " + currentViewMode);

if (currentViewMode === 'admin_iframe_preview') {
    document.body.innerHTML = '<h1>SUCCESS! Iframe is in ADMIN PREVIEW MODE.</h1> <p>Content from live/index.html</p>';
    console.log("Displaying admin preview mode content in iframe.");
} else if (currentViewMode === 'obs_ad_free') {
    document.body.innerHTML = '<h1>SUCCESS! Iframe is in OBS AD-FREE MODE.</h1> <p>Content from live/index.html</p>';
    console.log("Displaying OBS ad-free mode content in iframe.");
} else {
    document.body.innerHTML = '<h1>LIVE SCRIPT: NO RECOGNIZED VIEWMODE. This is public mode.</h1> <p>Content from live/index.html</p>';
    console.log("Displaying public mode content in iframe (or should be if not in iframe).");
    // Here, your original initializeScorecard() would run for the public page
}


document.addEventListener('DOMContentLoaded', () => {
    const currentYearEl = document.getElementById('current-year');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    const welcomePageStatusMessageEl = document.getElementById('welcome-page-status-message');
    const viewScoresLinkEl = document.getElementById('view-scores-link-welcome');

    const PUBLIC_CONFIG_KEY = 'cricketizlive_public_config_v2';
    const LAST_MATCH_RESULT_KEY = 'cricketizlive_lastFinalMatchData';
    const MATCH_END_TIME_KEY = 'cricketizlive_matchEndTime';
    const RESULT_DISPLAY_DURATION = 3 * 60 * 60 * 1000; // 3 hours

    const liveScorecardPath = 'live/index.html'; 

    function checkAndRedirect() {
        const publicConfigStr = localStorage.getItem(PUBLIC_CONFIG_KEY);
        const lastResultStr = localStorage.getItem(LAST_MATCH_RESULT_KEY);
        const matchEndTimeStr = localStorage.getItem(MATCH_END_TIME_KEY);

        let shouldRedirectImmediately = false;
        let showViewResultButton = false;
        let statusMessage = "No live matches are currently in progress."; 

        if (publicConfigStr) {
            try {
                const publicConfig = JSON.parse(publicConfigStr);
                if (publicConfig && publicConfig.apiKey) {
                    shouldRedirectImmediately = true;
                }
            } catch (e) { console.error("Welcome Page Script: Error parsing public config:", e); }
        }

        if (!shouldRedirectImmediately && lastResultStr && matchEndTimeStr) {
            try {
                const endTime = parseInt(matchEndTimeStr);
                const now = new Date().getTime();
                if ((now - endTime) < RESULT_DISPLAY_DURATION) {
                    showViewResultButton = true;
                    statusMessage = "A previous match recently concluded.";
                } else {
                    localStorage.removeItem(LAST_MATCH_RESULT_KEY);
                    localStorage.removeItem(MATCH_END_TIME_KEY);
                }
            } catch (e) { console.error("Welcome Page Script: Error processing stored match end time:", e); }
        }

        if (shouldRedirectImmediately) {
            window.location.href = liveScorecardPath;
        } else {
            if (welcomePageStatusMessageEl) {
                welcomePageStatusMessageEl.textContent = statusMessage;
            }
            if (viewScoresLinkEl) {
                viewScoresLinkEl.style.display = showViewResultButton ? 'inline-block' : 'none';
            }
        }
    }

    checkAndRedirect();
    setInterval(checkAndRedirect, 15000);
});