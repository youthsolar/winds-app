(function () {
  function render() {
    var el = document.getElementById('auth-button');
    if (!el) return;
    var token = '';
    try { token = localStorage.getItem('winds_google_token') || ''; } catch (e) {}
    var valid = false;
    if (token) {
      try {
        var p = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (p.exp && p.exp * 1000 > Date.now()) {
          valid = true;
        }
      } catch (e) {}
    }
    if (valid) {
      el.innerHTML = '<a href="#" id="nav-logout">登出</a>';
      var btn = document.getElementById('nav-logout');
      if (btn) btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
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
