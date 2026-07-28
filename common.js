// Season 1 Discord server invite — set this once the new server invite is ready.
// Empty string = Discord links are hidden everywhere (topbar / sidebar).
const DISCORD_INVITE = "";

// Sidebar definition - shared across all pages
const NAV = [
  {title:"概要", links:[
    {slug:"news", label:"お知らせ", icon:"📢"},
    {slug:"updates", label:"機能変更", icon:"🔄"},
    {slug:"index", label:"街の概要", icon:"🏙️"},
    {slug:"guide", label:"初心者ガイド", icon:"📖"},
    {slug:"commands", label:"コマンド一覧", icon:"⌨️"},
    {slug:"terms", label:"配信用語集", icon:"💬"},
  ]},
  {title:"ルール", links:[
    {slug:"rules-general", label:"一般ルール", icon:"📜"},
    {slug:"rules-rp", label:"RPルール", icon:"🎭"},
    {slug:"rules-combat", label:"戦闘ルール", icon:"⚔️"},
    {slug:"rules-vehicle", label:"車両ルール", icon:"🚗"},
    {slug:"rules-relationship", label:"恋愛RP", icon:"💕"},
    {slug:"rules-pd", label:"警察ルール", icon:"🚓"},
    {slug:"rules-ems", label:"救急隊ルール", icon:"🚑"},
    {slug:"rules-doctor", label:"個人医・闇医者ルール", icon:"⚕️"},
    {slug:"rules-mechanic", label:"メカニックルール", icon:"🔧"},
    {slug:"rules-food", label:"飲食店ルール", icon:"🍔"},
    {slug:"rules-crime", label:"犯罪ルール", icon:"💀"},
  ]},
  {title:"職業", links:[
    {slug:"job-pd", label:"警察 (PD)", icon:"🚓"},
    {slug:"job-ems", label:"EMS（救急）", icon:"🚑"},
    {slug:"job-doctor", label:"個人医・闇医者", icon:"⚕️"},
    {slug:"job-mechanic", label:"メカニック", icon:"🔧"},
    {slug:"job-food", label:"飲食店", icon:"🍔"},
    {slug:"job-crime", label:"犯罪", icon:"💀"},
  ]},
  {title:"カタログ", links:[
    {slug:"dealer", label:"ディーラー", icon:"🚗"},
    {slug:"nekocafenau", label:"猫カフェNAU", icon:"🐱"},
    {slug:"burgershot", label:"BurgerShot", icon:"🍔"},
  ]},
  {title:"最新情報", links:[
    {slug:"streams", label:"配信中", icon:"📺"},
    {slug:"socials", label:"住民SNS", icon:"𝕏"},
    {slug:"clips", label:"クリップ", icon:"🎬"},
  ]},
  {title:"外部リンク", links:[
    {url:"https://x.com/yuzu_server", label:"公式 Twitter", icon:"𝕏"},
    ...(DISCORD_INVITE ? [{url:DISCORD_INVITE, label:"Discord", icon:"💬"}] : []),
  ]},
];

// Build flat list for prev/next navigation
const FLAT_NAV = NAV.flatMap(s => s.links.filter(l => l.slug));

// Render sidebar
function renderSidebar(currentSlug){
  const html = NAV.map(section => `
    <div class="nav-section">
      <div class="nav-section-title">${section.title}</div>
      ${section.links.map(link => {
        if(link.url) return `<a href="${link.url}" class="nav-link" target="_blank" rel="noopener"><span class="nav-link-icon">${link.icon}</span>${link.label}</a>`;
        const active = link.slug === currentSlug ? ' active' : '';
        const href = link.slug === 'index' ? 'index.html' : `${link.slug}.html`;
        return `<a href="${href}" class="nav-link${active}"><span class="nav-link-icon">${link.icon}</span>${link.label}</a>`;
      }).join('')}
    </div>
  `).join('');
  return html;
}

// Render top bar — editorial masthead
function renderTopbar(){
  return `
    <a href="index.html" class="topbar-brand">Yuzu City Wiki</a>
    <form class="topbar-search-form" id="topSearchForm" autocomplete="off" action="search.html" method="get">
      <input type="text" name="q" class="topbar-search" id="topSearch" placeholder="Wiki全体を検索 ／ Enterで全体検索">
    </form>
    <div class="topbar-actions">
      <a href="https://x.com/yuzu_server" target="_blank" aria-label="X">𝕏</a>
      ${DISCORD_INVITE ? `<a href="${DISCORD_INVITE}" target="_blank">DISCORD</a>` : ''}
      <button class="menu-toggle" onclick="document.getElementById('sidebar').classList.toggle('open')" aria-label="menu">☰</button>
    </div>
  `;
}

// Render prev/next nav
function renderPageNav(currentSlug){
  const idx = FLAT_NAV.findIndex(l => l.slug === currentSlug);
  if(idx === -1) return '';
  const prev = idx > 0 ? FLAT_NAV[idx-1] : null;
  const next = idx < FLAT_NAV.length - 1 ? FLAT_NAV[idx+1] : null;
  const prevHref = prev ? (prev.slug === 'index' ? 'index.html' : prev.slug + '.html') : '#';
  const nextHref = next ? (next.slug === 'index' ? 'index.html' : next.slug + '.html') : '#';
  return `
    <div class="page-nav">
      ${prev ? `<a href="${prevHref}" class="page-nav-link"><div class="page-nav-link-arrow">←</div><div><div class="page-nav-link-label">前のページ</div><div class="page-nav-link-title">${prev.icon} ${prev.label}</div></div></a>` : '<div class="page-nav-spacer"></div>'}
      ${next ? `<a href="${nextHref}" class="page-nav-link next"><div class="page-nav-link-arrow">→</div><div><div class="page-nav-link-label">次のページ</div><div class="page-nav-link-title">${next.icon} ${next.label}</div></div></a>` : '<div class="page-nav-spacer"></div>'}
    </div>
  `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const slug = document.body.dataset.page || 'index';

  // Inject topbar
  const topbar = document.getElementById('topbar');
  if(topbar) topbar.innerHTML = renderTopbar();

  // Inject sidebar
  const sidebar = document.getElementById('sidebar');
  if(sidebar){
    sidebar.innerHTML = renderSidebar(slug);

    // Preserve sidebar scroll position across page navigations.
    // Saved on every scroll; restored right after injection so the list
    // doesn't jump back to the top when you click into another page.
    const SCROLL_KEY = 'yc-sidebar-scroll';
    try{
      const saved = sessionStorage.getItem(SCROLL_KEY);
      if(saved !== null){
        sidebar.scrollTop = parseInt(saved, 10) || 0;
      }else{
        // First visit this session: make sure the active page is visible.
        const active = sidebar.querySelector('.nav-link.active');
        if(active && active.offsetTop > sidebar.clientHeight - 60){
          sidebar.scrollTop = active.offsetTop - sidebar.clientHeight / 2;
        }
      }
      sidebar.addEventListener('scroll', () => {
        sessionStorage.setItem(SCROLL_KEY, String(sidebar.scrollTop));
      }, {passive:true});
    }catch(e){ /* sessionStorage unavailable (e.g. blocked) — ignore */ }
  }

  // Inject page nav
  const pageNav = document.getElementById('pageNav');
  if(pageNav) pageNav.innerHTML = renderPageNav(slug);

  // Setup search:
  //   - While typing: live-filter elements on the current page (instant feedback)
  //   - On submit (Enter): navigate to search.html?q=... for Wiki-wide search
  const search = document.getElementById('topSearch');
  const searchForm = document.getElementById('topSearchForm');
  if(search){
    search.addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      const items = document.querySelectorAll('.rule-item, .card, .cmd-item, .term-item, .timeline-item, tbody tr');
      if(!q){
        items.forEach(i => i.classList.remove('hidden-by-search'));
        return;
      }
      items.forEach(i => {
        const text = i.textContent.toLowerCase();
        i.classList.toggle('hidden-by-search', !text.includes(q));
      });
    });
  }
  if(searchForm){
    searchForm.addEventListener('submit', e => {
      const q = (search && search.value || '').trim();
      if(!q){
        e.preventDefault();
        return;
      }
      // Let the native form submission to search.html?q=... happen.
      // (Clear DOM-filter state so it doesn't persist visually on this page.)
      document.querySelectorAll('.hidden-by-search').forEach(el => el.classList.remove('hidden-by-search'));
    });
  }

  // Close sidebar on link click (mobile)
  document.querySelectorAll('.sidebar .nav-link').forEach(l => {
    l.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
    });
  });

  // Cursor-following spotlight on cards
  function bindSpotlight(el){
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
    });
  }
  document.querySelectorAll('.card, .vehicle-card, .menu-card, .clip-card, .streamer-card, .social-card').forEach(bindSpotlight);

  // Scroll-triggered reveal — for elements outside the initial viewport
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting){
          e.target.style.animation = 'reveal .7s cubic-bezier(.22,.61,.36,1) both';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    // Only observe cards/sections that are below the fold on initial paint
    setTimeout(() => {
      document.querySelectorAll('section, .card, .stat, .menu-card, .vehicle-card, .clip-card, .streamer-card, .social-card, .rule-item, .cmd-item, .term-item, .timeline-item').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top > window.innerHeight){
          el.style.animation = 'none';
          el.style.opacity = '0';
          io.observe(el);
        }
      });
    }, 50);
  }
});

// Tab switching (used on some pages)
function showTab(group, btn, idx){
  const tabs = btn.parentElement.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content[data-group="'+group+'"]');
  tabs.forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  contents.forEach((c,i) => c.classList.toggle('active', i===idx));
}
