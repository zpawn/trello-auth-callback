(function () {
    const params = new URLSearchParams(window.location.search);
    const state = params.get('state') || "";
    const error = params.get('error') || "";
    const token = (window.location.hash || "").substring('#token='.length);
    
    fetch('/auth/save-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, token, error })
    })
    .then(() => {})
    .catch(() => {});
})()