(function () {
  function render() {
    var ids=['auth-button','auth-button-m'];
    var els=ids.map(function(id){return document.getElementById(id);}).filter(Boolean);
    if (!els.length) return;
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
    els.forEach(function(el){
      if (valid) {
        el.innerHTML = '<a href="#" class="nav-logout">登出</a>';
        el.querySelector('.nav-logout').addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          try { localStorage.removeItem('winds_google_token'); } catch (er) {}
          location.href = '/';
        });
      } else {
        el.innerHTML = '<a href="/">登入</a>';
      }
    });
  }
  window.__refreshNavAuth = render;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
