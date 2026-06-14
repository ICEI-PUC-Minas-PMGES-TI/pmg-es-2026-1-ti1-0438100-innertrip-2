// ══════════════════════════════════════════════════════════════
//  PSYCHE – Home Page
//  Lógica: menu mobile, reveal on scroll, nav shadow, smooth scroll
// ══════════════════════════════════════════════════════════════

/* ─────────────────────────────────────────
   MENU MOBILE (hamburger)
───────────────────────────────────────── */
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  const ham  = document.getElementById('hamburger');
  menu.classList.toggle('open');
  ham.classList.toggle('open');
}

// Fecha o menu ao clicar fora dele
document.addEventListener('click', function (e) {
  const menu = document.getElementById('mobileMenu');
  const ham  = document.getElementById('hamburger');
  if (
    menu &&
    menu.classList.contains('open') &&
    !menu.contains(e.target) &&
    !ham.contains(e.target)
  ) {
    menu.classList.remove('open');
    ham.classList.remove('open');
  }
});

/* ─────────────────────────────────────────
   REVEAL ON SCROLL (IntersectionObserver)
───────────────────────────────────────── */
const reveals = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

reveals.forEach((el) => revealObserver.observe(el));

/* ─────────────────────────────────────────
   NAV – sombra ao rolar
───────────────────────────────────────── */
const nav = document.querySelector('.nav');

window.addEventListener('scroll', () => {
  if (!nav) return;
  nav.style.boxShadow = window.scrollY > 10
    ? '0 2px 20px rgba(0,0,0,.4)'
    : 'none';
});

/* ─────────────────────────────────────────
   SMOOTH SCROLL para âncoras internas
───────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const targetId = link.getAttribute('href');
    const target   = document.querySelector(targetId);

    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });

      // Fecha menu mobile se estiver aberto
      const menu = document.getElementById('mobileMenu');
      const ham  = document.getElementById('hamburger');
      if (menu) {
        menu.classList.remove('open');
        ham.classList.remove('open');
      }
    }
  });
});