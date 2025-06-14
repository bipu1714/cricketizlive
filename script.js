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

    const liveScorecardPath = 'live-scorecard/index.html'; 

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