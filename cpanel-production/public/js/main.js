/* ALO English Test Platform — minimal frontend JS.
 * Mobile nav toggle + CSRF token auto-injection for forms.
 * No external dependencies; CSP-friendly (script-src 'self'). */
(function () {
    'use strict';
    function initNav() {
        var toggle = document.querySelector('.alo-nav-toggle'), nav = document.querySelector('#alo-nav');
        if (!toggle || !nav) return;
        toggle.addEventListener('click', function () {
            var open = nav.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    }
    // If a meta[name="csrf-token"] exists, ensure every POST form has a hidden _csrf field.
    function initCsrf() {
        var meta = document.querySelector('meta[name="csrf-token"]');
        if (!meta) return;
        var token = meta.getAttribute('content') || '';
        if (!token) return;
        Array.prototype.forEach.call(document.querySelectorAll('form'), function (form) {
            if (form.method.toLowerCase() !== 'post') return;
            if (form.querySelector('input[name="_csrf"]')) return;
            var input = document.createElement('input');
            input.type = 'hidden'; input.name = '_csrf'; input.value = token;
            form.appendChild(input);
        });
    }
    // Copy-to-clipboard helper (ambassador dashboard).
    function initCopy() {
        Array.prototype.forEach.call(document.querySelectorAll('[data-copy-target]'), function (btn) {
            btn.addEventListener('click', function () {
                var input = document.querySelector(btn.getAttribute('data-copy-target'));
                if (!input) return;
                try {
                    input.select(); input.setSelectionRange(0, 99999);
                    if (navigator.clipboard) navigator.clipboard.writeText(input.value);
                    else document.execCommand('copy');
                    var prev = btn.textContent; btn.textContent = 'Copied!';
                    setTimeout(function () { btn.textContent = prev; }, 1500);
                } catch (e) { /* no-op */ }
            });
        });
    }
    var boot = function () { initNav(); initCsrf(); initCopy(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
