// Aviso de cookies: Google Analytics arranca con consentimiento denegado (Consent Mode v2)
// y solo se activa si el visitante acepta. La elección se guarda en este navegador.
(function(){
  var KEY = 'mpm-consent';
  function read(){ try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(value){ try { localStorage.setItem(KEY, value); } catch (e) {} }
  function apply(value){
    if (typeof gtag === 'function') {
      gtag('consent', 'update', { analytics_storage: value === 'granted' ? 'granted' : 'denied' });
    }
  }
  function show(){
    if (document.getElementById('cookie-banner')) return;
    var style = document.createElement('style');
    style.textContent = '#cookie-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:50;max-width:620px;margin:0 auto;padding:22px 24px;background:#242522;color:#f4f1ea;font:13px/1.6 Arial,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.25)}#cookie-banner p{margin:0 0 16px;color:#c8c3ba}#cookie-banner a{color:#fff;text-underline-offset:4px}#cookie-banner .cookie-actions{display:flex;flex-wrap:wrap;gap:10px}#cookie-banner button{appearance:none;border:1px solid rgba(255,255,255,.7);background:transparent;color:#fff;padding:12px 18px;cursor:pointer;font:10px Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase}#cookie-banner button[data-consent="granted"]{background:#f4f1ea;color:#242522;border-color:#f4f1ea}';
    document.head.appendChild(style);
    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Aviso de cookies');
    banner.innerHTML = '<p>Usamos cookies de analítica (Google Analytics) para saber cómo se usa esta web. Solo se activan si las aceptas. <a href="/cookies.html">Más información</a>.</p><div class="cookie-actions"><button type="button" data-consent="granted">Aceptar</button><button type="button" data-consent="denied">Rechazar</button></div>';
    banner.addEventListener('click', function(event){
      var value = event.target.getAttribute && event.target.getAttribute('data-consent');
      if (!value) return;
      save(value);
      apply(value);
      banner.remove();
    });
    document.body.appendChild(banner);
  }
  if (!read()) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show); else show();
  }
  // Enlace "Configurar cookies" del pie o de la página de cookies
  document.addEventListener('click', function(event){
    var link = event.target.closest && event.target.closest('[data-cookie-settings]');
    if (!link) return;
    event.preventDefault();
    show();
  });
})();
