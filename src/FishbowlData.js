export function saveState(state) {
    localStorage.setItem('fishbowl', JSON.stringify(state));
}

export function loadState() {
    const state = localStorage.getItem('fishbowl');
    return state ? JSON.parse(state) : null;
}