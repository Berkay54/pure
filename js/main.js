/* ==========================================================================
   Pure Güzellik — etkileşim ve animasyonlar
   Kütüphaneler: GSAP + ScrollTrigger (kaydırma animasyonları), Lenis (yumuşak kaydırma)
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var lenis = null;

  if (!hasGsap) document.documentElement.classList.add('no-js');

  /* ---------- 1. Yumuşak kaydırma (Lenis, lerp 0.1) ---------- */
  if (!reduceMotion && typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
    }
  }

  /* Sayfa içi bağlantılar */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id.length < 2) { e.preventDefault(); return; }
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { duration: 1.6 });
      else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ---------- 2. Üst bar rengi: koyu bölümlerin üzerinde beyaza döner ---------- */
  var header = document.getElementById('header');
  var darkSections = document.querySelectorAll('.dark-section');
  function checkHeaderColor() {
    var triggerY = header.offsetHeight / 2;
    var isDark = false;
    darkSections.forEach(function (section) {
      var rect = section.getBoundingClientRect();
      if (rect.top <= triggerY && rect.bottom >= triggerY) isDark = true;
    });
    header.classList.toggle('header-light', isDark);
  }
  window.addEventListener('scroll', checkHeaderColor, { passive: true });
  window.addEventListener('resize', checkHeaderColor);
  checkHeaderColor();

  /* ---------- 3. Tam ekran menü ---------- */
  var menu = document.getElementById('menu');
  var menuOpen = document.getElementById('menuOpen');
  var menuClose = document.getElementById('menuClose');

  function openMenu() {
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
    document.documentElement.style.overflow = 'hidden';
    menuClose.focus({ preventScroll: true });
  }
  function closeMenu() {
    if (!menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
    document.documentElement.style.overflow = '';
    menuOpen.focus({ preventScroll: true });
  }
  menuOpen.addEventListener('click', openMenu);
  menuClose.addEventListener('click', closeMenu);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- 4. Görünür olunca çalışan animasyonlar (zoomIn vb.) ---------- */
  var ioEls = document.querySelectorAll('.io');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.15 });
    ioEls.forEach(function (el) { io.observe(el); });
  } else {
    ioEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- 5. Yorum kaydırıcısı ---------- */
  (function () {
    var slider = document.getElementById('slider');
    if (!slider) return;
    var track = slider.querySelector('.slider__track');
    var slides = slider.querySelectorAll('.slide');
    var dotsWrap = slider.querySelector('.slider__dots');
    var index = 0, timer = null, DELAY = 5000;

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', (i + 1) + '. yorum');
      dot.addEventListener('click', function () { go(i); restart(); });
      dotsWrap.appendChild(dot);
    });
    var dots = dotsWrap.querySelectorAll('button');

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translate3d(' + (-index * 100) + '%,0,0)';
      dots.forEach(function (d, k) { d.setAttribute('aria-selected', k === index ? 'true' : 'false'); });
    }
    function start() { if (!reduceMotion) timer = setInterval(function () { go(index + 1); }, DELAY); }
    function stop() { clearInterval(timer); }
    function restart() { stop(); start(); }

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', restart);
    slider.addEventListener('focusin', stop);
    slider.addEventListener('focusout', restart);

    /* Dokunmatik kaydırma */
    var startX = null;
    slider.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; stop(); }, { passive: true });
    slider.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      startX = null; restart();
    });

    go(0); start();
  })();

  /* ---------- 6. GSAP kaydırma animasyonları ---------- */
  if (!hasGsap || reduceMotion) return;
  var gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  /* 6a. Görsel açılması: sağdan sola maske + görselde derinlik etkisi */
  document.querySelectorAll('.reveal').forEach(function (container) {
    var image = container.querySelector('img');
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top 75%',
        toggleActions: 'play none none reverse'
      }
    });
    tl.to(container, { opacity: 1, duration: 0.3 });
    tl.fromTo(container,
      { clipPath: 'inset(0 0 0 100%)' },
      { clipPath: 'inset(0 0 0 0%)', duration: 1.4, ease: 'power3.out' }, 0);
    tl.from(image, { scale: 1.2, x: 80, duration: 1.4, ease: 'power3.out' }, 0);
  });

  var mm = gsap.matchMedia();

  /* 6b. Hero metni: kaydırdıkça sayfadan daha hızlı yukarı kayar */
  gsap.to('#heroContent', {
    y: -200,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=820', scrub: true }
  });

  mm.add('(min-width: 768px)', function () {
    /* 6c. Galerideki ikinci görsel: +100px → -250px dikey paralaks */
    gsap.fromTo('#parallaxImg', { y: 100 }, {
      y: -250,
      ease: 'none',
      scrollTrigger: { trigger: '.gallery', start: 'top 40%', end: '+=1435', scrub: true }
    });

    /* 6d. Yapışkan görsel: metinler üzerinden geçerken 1 → 1.8 büyür */
    gsap.fromTo('#focusSticky', { scale: 1 }, {
      scale: 1.8,
      ease: 'none',
      scrollTrigger: { trigger: '.focus', start: 'top+=390 top', end: 'bottom 62%', scrub: true }
    });
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
