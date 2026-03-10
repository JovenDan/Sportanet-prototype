function toggleTheme() {
    // flip the class on <body>
    document.body.classList.toggle("light");

    if (document.body.classList.contains("light")) {
        localStorage.setItem("theme", "light");
    } else {
        localStorage.setItem("theme", "dark");
    }

    updateSwitch();
}

function updateSwitch() {
    const btn = document.getElementById('switch');
    if (!btn) return;

    if (document.body.classList.contains('light')) {
        // show moon: switch to dark
        btn.value = '🌙';
        btn.classList.remove('s-button-light');
        btn.classList.add('s-button-dark');
    } else {
        // show sun: switch to light
        btn.value = '☀️';
        btn.classList.remove('s-button-dark');
        btn.classList.add('s-button-light');
    }
}

function applyStoredTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
        document.body.classList.add('light');
    } else {
        document.body.classList.remove('light');
    }
    updateSwitch();
}

// attach handler on page load and apply any saved preference
window.addEventListener('DOMContentLoaded', () => {
    applyStoredTheme();
    const btn = document.getElementById('switch');
    if (btn) {
        btn.addEventListener('click', toggleTheme);
    }
});