const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const hero = document.querySelector('.hero');
const heroContent = document.querySelector('.hero-content');
const progressBar = document.createElement('div');
const carousel = document.querySelector('[data-carousel]');

progressBar.className = 'scroll-progress';
document.body.append(progressBar);

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 24);
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.transform = `scaleX(${scrollableHeight ? window.scrollY / scrollableHeight : 0})`;

  if (hero && window.scrollY < window.innerHeight) {
    const shift = window.scrollY * 0.12;
    hero.style.backgroundPosition = `center ${shift}px`;
    heroContent.style.transform = `translateY(${shift}px)`;
  }
}, { passive: true });

menuToggle.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.site-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

document.querySelectorAll('.practice-item, .principles div, .office-photo-grid img').forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
});

if (carousel) {
  const slides = [...carousel.querySelectorAll('.carousel-slide')];
  let activeSlide = 0;

  window.setInterval(() => {
    slides[activeSlide].classList.remove('is-active');
    activeSlide = (activeSlide + 1) % slides.length;
    slides[activeSlide].classList.add('is-active');
  }, 4000);
}

document.querySelector('[data-form]').addEventListener('submit', (event) => {
  event.preventDefault();
  const note = document.querySelector('[data-form-note]');
  note.textContent = 'Pedido recebido. Entrarei em contacto com a maior brevidade.';
  note.style.color = '#d7b495';
  event.target.reset();
});
