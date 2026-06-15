/* ============================================
   ASF İnşaat – Main JavaScript
   ============================================ */

'use strict';

// ===== UTILITY =====
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollReveal();
  initCounters();
  initFilter();
  initTestimonials();
  initLightbox();
  initScrollTop();
  setYear();
});

// ===== NAVIGATION =====
function initNav() {
  const header    = $('#site-header');
  const hamburger = $('#hamburger');
  const mobileMenu = $('#mobile-menu');
  const mobileLinks = $$('.mobile-link');

  // Sticky header
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close mobile menu on link click
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!header.contains(e.target) && mobileMenu.classList.contains('open')) {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  // Active nav link on scroll
  const sections = $$('section[id]');
  const navLinks  = $$('.nav-link');

  const highlightNav = () => {
    const scrollY = window.scrollY + 120;
    sections.forEach(section => {
      const top    = section.offsetTop;
      const height = section.offsetHeight;
      const id     = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.toggle(
            'active',
            link.getAttribute('href') === `#${id}`
          );
        });
      }
    });
  };
  window.addEventListener('scroll', highlightNav, { passive: true });
}

// ===== SCROLL REVEAL =====
function initScrollReveal() {
  if (!window.IntersectionObserver) {
    $$('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
      el.classList.add('visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  $$('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
    observer.observe(el);
  });
}

// ===== COUNTERS =====
let countersStarted = false;

function initCounters() {
  const statEls = $$('.stat-num[data-count]');
  if (!statEls.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !countersStarted) {
          countersStarted = true;
          statEls.forEach(el => animateCounter(el));
          observer.disconnect();
        }
      });
    },
    { threshold: 0.5 }
  );

  // Observe the first stat element
  if (statEls[0]) observer.observe(statEls[0]);
}

function animateCounter(el) {
  const target   = parseInt(el.dataset.count, 10);
  const duration = 2000;
  const step     = target / (duration / 16);
  let   current  = 0;

  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current);
    if (current >= target) {
      el.textContent = target;
      clearInterval(timer);
    }
  }, 16);
}

// ===== PROJECT FILTER =====
function initFilter() {
  const filterBtns = $$('.filter-btn');
  const cards      = $$('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter cards with animation
      cards.forEach(card => {
        const cat = card.dataset.category;
        const show = filter === 'all' || cat === filter;

        if (show) {
          card.classList.remove('hidden');
          card.style.animation = 'fadeIn .4s ease forwards';
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

// ===== TESTIMONIALS SLIDER =====
function initTestimonials() {
  const track  = $('#testimonials-track');
  const cards  = $$('.testimonial-card', track);
  const dotsEl = $('#t-dots');
  const prevBtn = $('#t-prev');
  const nextBtn = $('#t-next');

  if (!track || cards.length === 0) return;

  let current    = 0;
  let autoTimer  = null;
  let isDragging = false;
  let startX     = 0;

  // Setup: make track a flex row
  track.style.display = 'flex';
  track.style.overflow = 'hidden';
  track.style.borderRadius = '0';
  cards.forEach(card => {
    card.style.minWidth = '100%';
    card.style.boxSizing = 'border-box';
    card.style.marginRight = '0';
  });

  // Create dots
  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 't-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Yorum ${i + 1}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(dot);
  });

  function goTo(idx) {
    current = (idx + cards.length) % cards.length;
    track.style.transform = `translateX(-${current * 100}%)`;

    $$('.t-dot', dotsEl).forEach((d, i) => {
      d.classList.toggle('active', i === current);
      d.setAttribute('aria-selected', i === current ? 'true' : 'false');
    });
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  nextBtn.addEventListener('click', () => { next(); resetAuto(); });
  prevBtn.addEventListener('click', () => { prev(); resetAuto(); });

  // Auto-advance
  function startAuto() {
    autoTimer = setInterval(next, 5000);
  }
  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }
  startAuto();

  // Pause on hover
  track.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.addEventListener('mouseleave', startAuto);

  // Touch/swipe
  track.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? next() : prev();
      resetAuto();
    }
  }, { passive: true });

  // Keyboard
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { prev(); resetAuto(); }
    if (e.key === 'ArrowRight') { next(); resetAuto(); }
  });
}

// ===== LIGHTBOX =====
function initLightbox() {
  const lightbox = $('#lightbox');
  const closeBtn = $('#lightbox-close');
  const content  = $('#lightbox-content');

  $$('.project-zoom').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const card      = btn.closest('.project-card');
      const imgWrap   = card.querySelector('.project-placeholder');
      const title     = card.querySelector('h3')?.textContent || '';
      const desc      = card.querySelector('p')?.textContent || '';

      content.innerHTML = `
        <div style="background:var(--clr-dark2);border-radius:var(--radius-lg);overflow:hidden;max-width:680px;width:90vw;">
          <div style="background:var(--clr-dark3);aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;">
            ${imgWrap ? imgWrap.innerHTML : ''}
          </div>
          <div style="padding:1.5rem;">
            <h3 style="font-family:var(--ff-display);font-size:1.5rem;font-weight:700;margin-bottom:.5rem;">${title}</h3>
            <p style="color:var(--clr-muted);font-size:.9rem;">${desc}</p>
          </div>
        </div>
      `;

      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      closeBtn.focus();
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });
}

// ===== FORM SUBMIT =====
function handleFormSubmit(e) {
  const btn     = document.getElementById('submit-btn');
  const success = document.getElementById('form-success');
  const name    = document.getElementById('name');
  const phone   = document.getElementById('phone');
  const service = document.getElementById('service');

  // Basic validation
  if (!name.value.trim()) {
    name.focus();
    name.style.borderColor = '#e53e3e';
    setTimeout(() => name.style.borderColor = '', 2000);
    return;
  }
  if (!phone.value.trim()) {
    phone.focus();
    phone.style.borderColor = '#e53e3e';
    setTimeout(() => phone.style.borderColor = '', 2000);
    return;
  }
  if (!service.value) {
    service.focus();
    service.style.borderColor = '#e53e3e';
    setTimeout(() => service.style.borderColor = '', 2000);
    return;
  }

  // Simulate submission
  btn.disabled = true;
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .8s linear infinite">
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/>
      <path d="M12 3a9 9 0 019 9" stroke-linecap="round"/>
    </svg>
    <span>Gönderiliyor...</span>
  `;

  setTimeout(() => {
    btn.style.display = 'none';
    success.classList.add('show');
    // Reset form fields
    $$('.form-input, .form-textarea, .form-select').forEach(inp => {
      if (inp.tagName === 'SELECT') inp.selectedIndex = 0;
      else inp.value = '';
    });
  }, 1500);
}

// ===== SCROLL TO TOP =====
function initScrollTop() {
  const btn = $('#scroll-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ===== SET YEAR =====
function setYear() {
  const el = $('#year');
  if (el) el.textContent = new Date().getFullYear();
}

// ===== CSS ANIMATION =====
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(.96); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .nav-link.active { color: var(--clr-gold) !important; }
  .nav-link.active::after { transform: scaleX(1) !important; }
`;
document.head.appendChild(style);
