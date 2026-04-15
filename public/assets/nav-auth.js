(function () {
  function render() {
    var el = document.getElementById('auth-button');
    if (!el) return;
    var token = '';
    try { token = localStorage.getItem('winds_google_token') || ''; } catch (e) {}
    var valid = false;
    var name = '';
    if (token) {
      try {
        var p = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (p.exp && p.exp * 1000 > Date.now()) {
          valid = true;
          name = (p.family_name || '') + (p.given_name || '') || p.name || '';
        }
      } catch (e) {}
    }
    if (valid) {
      el.innerHTML =
        '<span style="color:var(--winds-text-muted);margin-right:8px;">' + name + '</span>' +
        '<a href="#" id="nav-logout">登出</a>';
      var btn = document.getElementById('nav-logout');
      if (btn) btn.addEventListener('click', function (e) {
        e.preventDefault();
        try { localStorage.removeItem('winds_google_token'); } catch (er) {}
        location.href = '/';
      });
    } else {
      el.innerHTML = '<a href="/">登入</a>';
    }
  }
  window.__refreshNavAuth = render;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
