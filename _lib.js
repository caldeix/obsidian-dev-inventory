// DEV_INVENTORY — _lib.js
// Devuelve un objeto con las utilidades. Uso:
//   const { safeDate, daysAgo, ageBadge, showBanner, buildLanguageBar }
//     = eval(await app.vault.adapter.read('_lib.js'));
({
  safeDate: function(v) {
    if (!v) return null;
    if (typeof v === 'object' && v !== null) {
      if (typeof v.toISODate === 'function') return v.toISODate();
      if (typeof v.toFormat  === 'function') return v.toFormat('yyyy-MM-dd');
      if (v.ts) return new Date(v.ts).toISOString().slice(0, 10);
    }
    var str = String(v).trim();
    var m = str.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
  },

  daysAgo: function(dateStr) {
    if (!dateStr) return Infinity;
    var d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return Infinity;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  },

  ageBadge: function(dateStr) {
    var days = this.daysAgo(dateStr);
    if (!dateStr || days === Infinity) {
      return '<span class="di-age-badge di-age-unknown">Sin fecha</span>';
    }
    var cls;
    if      (days <=  30) cls = 'di-age-fresh';
    else if (days <=  90) cls = 'di-age-ok';
    else if (days <= 180) cls = 'di-age-warn';
    else if (days <= 365) cls = 'di-age-old';
    else                  cls = 'di-age-ancient';
    return '<span class="di-age-badge ' + cls + '">' + dateStr + '</span>';
  },

  showBanner: function(msg, type) {
    type = type || 'info';
    var colors = { info: '#4a9eff', success: '#4caf50', error: '#f44336', warn: '#ff9800' };
    var el = document.createElement('div');
    el.textContent = msg;
    Object.assign(el.style, {
      position: 'fixed', top: '20px', right: '20px', zIndex: '9999',
      background: colors[type] || colors.info, color: 'white',
      padding: '12px 20px', borderRadius: '8px', fontSize: '14px',
      boxShadow: '0 4px 12px rgba(0,0,0,.35)',
      animation: 'di-slide-in .3s ease', maxWidth: '320px',
      fontFamily: 'var(--font-interface, inherit)'
    });
    document.body.appendChild(el);
    setTimeout(function() {
      el.style.animation = 'di-fade-out .3s ease forwards';
      setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    }, 3000);
  },

  buildLanguageBar: function(lang, count, max) {
    var pct = max > 0 ? Math.round((count / max) * 100) : 0;
    var w   = Math.max(2, pct);
    return '<div class="di-bar-row">'
      + '<span class="di-bar-label">' + lang + '</span>'
      + '<div class="di-bar-track"><div class="di-bar-fill" style="width:' + w + '%"></div></div>'
      + '<span class="di-bar-count">' + count + '</span>'
      + '</div>';
  }
})
