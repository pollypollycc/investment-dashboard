// Shared logic for the investment watchlist site.
// Data is read from data.json (a static snapshot). To update prices/news,
// edit data.json and re-deploy -- no build step required.

function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  const sw = document.getElementById('theme-switch');
  if (sw) sw.classList.toggle('on', next === 'dark');
}

function initNav(activePage) {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });
  document.addEventListener('click', () => menu.classList.remove('open'));
  menu.querySelectorAll('a').forEach(a => {
    if (a.dataset.page === activePage) a.classList.add('active');
  });
}

async function loadData() {
  const res = await fetch('data.json');
  return res.json();
}

function fmtPrice(item) {
  if (item.price === null || item.price === undefined) return '—';
  if (item.ticker === 'US10Y') return item.price.toFixed(2) + '%';
  if (item.ticker === 'DXY') return item.price.toFixed(2);
  if (item.ticker === 'WTI') return '$' + item.price.toFixed(2) + '/bbl';
  const prefix = item.ticker.endsWith('.HK') ? '' : '$';
  const suffix = item.ticker.endsWith('.HK') ? ' HKD' : '';
  return prefix + item.price.toLocaleString(undefined, { minimumFractionDigits: item.price < 10 ? 4 : 2, maximumFractionDigits: 2 }) + suffix;
}

function fmtChange(item) {
  if (item.change === null || item.change === undefined) {
    return item.note ? `<span class="change flat">${item.note}</span>` : '<span class="change flat">n/a</span>';
  }
  const cls = item.change > 0 ? 'up' : item.change < 0 ? 'down' : 'flat';
  const sign = item.change > 0 ? '+' : '';
  return `<span class="change ${cls}">${sign}${item.change.toFixed(2)}%</span>`;
}

function tileHTML(tier) {
  const rows = tier.items.map(item => `
    <div class="tile-row">
      <div><span class="ticker">${item.ticker}</span><span class="name">${item.name}</span></div>
      <div style="text-align:right;">
        <div>${fmtPrice(item)}</div>
        <div>${fmtChange(item)}</div>
      </div>
    </div>
  `).join('');
  return `
    <div class="tile">
      <div class="tile-head">
        <span>${tier.label}</span>
        <span class="tag">${tier.note ? tier.note : tier.items.length + ' names'}</span>
      </div>
      ${rows}
    </div>
  `;
}

function signalHTML(sig) {
  const icon = sig.severity === 'danger' ? 'ti-alert-triangle' :
               sig.severity === 'warning' ? 'ti-alert-circle' : 'ti-info-circle';
  const focus = sig.focus ? `<p class="signal-watch" style="margin-top:4px;"><b>Focus read:</b> ${sig.focus}</p>` : '';
  return `
    <div class="signal-card">
      <i class="ti ${icon} signal-icon ${sig.severity}"></i>
      <div>
        <span class="pill">${sig.tier.replace('_',' ')}</span>
        <p class="signal-title">${sig.title}</p>
        <p class="signal-body">${sig.body}</p>
        <p class="signal-watch"><b>Watch for:</b> ${sig.watch}</p>
        ${focus}
      </div>
    </div>
  `;
}

function outlookHTML(outlook) {
  const strong = outlook.strongest.map(o => `
    <div class="tile-row" style="align-items:flex-start;">
      <div style="max-width:100%;"><span class="ticker">${o.area}</span><span class="name" style="display:block;margin-top:2px;">${o.reason}</span></div>
    </div>`).join('');
  const weak = outlook.weakest.map(o => `
    <div class="tile-row" style="align-items:flex-start;">
      <div style="max-width:100%;"><span class="ticker">${o.area}</span><span class="name" style="display:block;margin-top:2px;">${o.reason}</span></div>
    </div>`).join('');
  return `
    <div class="tile-grid" style="margin-bottom:14px;">
      <div class="tile">
        <div class="tile-head"><span>Strongest setup</span><span class="tag">this week</span></div>
        ${strong}
      </div>
      <div class="tile">
        <div class="tile-head"><span>Weakest setup</span><span class="tag">this week</span></div>
        ${weak}
      </div>
    </div>
    <div class="signal-card" style="background:var(--accent-bg);border-color:var(--accent);">
      <i class="ti ti-compass signal-icon info"></i>
      <div>
        <p class="signal-title">Next step</p>
        <p class="signal-body">${outlook.nextStep}</p>
      </div>
    </div>
    <p class="footer-note">${outlook.summary}</p>
  `;
}
