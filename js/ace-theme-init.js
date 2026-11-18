/* Load synchronously in <head>, before CSS, to prevent a theme flash. */
(function(){try{const t=localStorage.getItem('ace-ui.theme');if(['dark','light','sage','eye'].includes(t))document.documentElement.dataset.aceTheme=t;}catch{}})();
