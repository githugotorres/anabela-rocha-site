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
  document.documentElement.style.setProperty('--scroll', scrollableHeight ? (window.scrollY / scrollableHeight).toFixed(4) : 0);

  if (hero && window.scrollY < window.innerHeight) {
    const shift = window.scrollY * 0.12;
    heroContent.style.transform = `translateY(${shift}px)`;
  }
}, { passive: true });

const setMenu = (isOpen) => {
  siteNav.classList.toggle('open', isOpen);
  header.classList.toggle('menu-open', isOpen);
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
};

menuToggle.addEventListener('click', () => setMenu(!siteNav.classList.contains('open')));

document.querySelectorAll('.site-nav a').forEach((link) => {
  link.addEventListener('click', () => setMenu(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && siteNav.classList.contains('open')) {
    setMenu(false);
    menuToggle.focus();
  }
});

document.addEventListener('click', (event) => {
  if (siteNav.classList.contains('open') && !header.contains(event.target)) setMenu(false);
});

// Vídeos: só carregam e tocam quando estão no ecrã, e pausam quando saem.
// Com "reduzir movimento" ativo ficam parados na imagem de capa.
const autoplayVideos = document.querySelectorAll('video[data-autoplay]');
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) {
        target.play().catch(() => {});
      } else {
        target.pause();
      }
    });
  }, { rootMargin: '200px 0px' });
  autoplayVideos.forEach((video) => videoObserver.observe(video));
}

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

const contactForm = document.querySelector('[data-form]');
let goToStep = () => {};

if (contactForm) {
  const note = contactForm.querySelector('[data-form-note]');
  const noteDefault = note.textContent;
  const submitButton = contactForm.querySelector('[type="submit"]');
  const submitLabel = submitButton.innerHTML;
  const success = contactForm.querySelector('[data-form-success]');
  const steps = [...contactForm.querySelectorAll('[data-step]')];
  const progress = contactForm.querySelector('[data-form-progress]');
  const stepCount = contactForm.querySelector('[data-form-step-count]');
  const steppedQuery = window.matchMedia('(max-width: 760px)');
  const fallbackContact = 'anabelarocha-46953p@adv.oa.pt ou +351 933 453 014';
  let currentStep = 0;

  const showNote = (message, state) => {
    note.textContent = message;
    note.classList.remove('is-success', 'is-error');
    if (state) note.classList.add(state);
  };

  // Em telemóvel o formulário mostra um passo de cada vez; em ecrãs maiores mostra tudo.
  const renderSteps = () => {
    const stepped = steppedQuery.matches;
    contactForm.classList.toggle('is-stepped', stepped);
    steps.forEach((step, index) => {
      step.hidden = stepped && index !== currentStep;
    });
    progress.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
    stepCount.textContent = stepped ? `Passo ${currentStep + 1} de ${steps.length}` : '';
  };

  goToStep = (index, focus = true) => {
    currentStep = Math.max(0, Math.min(index, steps.length - 1));
    renderSteps();
    if (focus && steppedQuery.matches) {
      contactForm.scrollIntoView({ block: 'start' });
      const field = steps[currentStep].querySelector('input:not([type="hidden"]), textarea');
      if (field) field.focus({ preventScroll: true });
    }
  };

  const stepIsValid = (step) => {
    const fields = [...step.querySelectorAll('input, textarea, select')];
    const invalid = fields.find((field) => !field.checkValidity());
    if (invalid) invalid.reportValidity();
    return !invalid;
  };

  contactForm.querySelectorAll('[data-step-next]').forEach((button) => {
    button.addEventListener('click', () => {
      if (stepIsValid(steps[currentStep])) goToStep(currentStep + 1);
    });
  });

  contactForm.querySelectorAll('[data-step-back]').forEach((button) => {
    button.addEventListener('click', () => goToStep(currentStep - 1));
  });

  steppedQuery.addEventListener('change', renderSteps);
  renderSteps();

  const showSuccess = () => {
    contactForm.reset();
    showNote(noteDefault);
    contactForm.classList.add('is-sent');
    success.hidden = false;
    success.focus({ preventScroll: true });
    success.scrollIntoView({ block: 'center' });
  };

  contactForm.querySelector('[data-form-again]').addEventListener('click', () => {
    contactForm.classList.remove('is-sent');
    success.hidden = true;
    goToStep(0);
  });

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Honeypot: só os bots preenchem este campo. Fingimos sucesso e não enviamos nada.
    if (contactForm.elements.website.value.trim() !== '') {
      showSuccess();
      return;
    }

    const endpoint = window.SITE_CONFIG && window.SITE_CONFIG.formEndpoint;
    if (!endpoint) {
      showNote(`O formulário está temporariamente indisponível. Contacte-me por ${fallbackContact}.`, 'is-error');
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'A enviar...';
    showNote('A enviar o seu pedido...');

    try {
      // URLSearchParams faz um pedido "simples" (sem preflight CORS), que o Apps Script aceita.
      const response = await fetch(endpoint, { method: 'POST', body: new URLSearchParams(new FormData(contactForm)) });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'erro');
      showSuccess();
    } catch (error) {
      showNote(`Não foi possível enviar o pedido. Verifique os campos e tente novamente, ou contacte-me por ${fallbackContact}.`, 'is-error');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = submitLabel;
    }
  });
}

// Botões "Pedir reunião": levam ao formulário com o tipo de contacto já escolhido.
document.querySelectorAll('[data-tipo]').forEach((link) => {
  link.addEventListener('click', () => {
    const tipo = contactForm && contactForm.elements.tipo;
    if (tipo) tipo.value = link.dataset.tipo;
    goToStep(0, false);
  });
});

// Barra fixa em telemóvel: aparece depois de começar a descer e esconde-se
// quando o formulário ou o rodapé já estão à vista.
const mobileCta = document.querySelector('[data-mobile-cta]');
if (mobileCta) {
  const ctaTargets = new Set();
  const updateCta = () => {
    const show = window.scrollY > 160 && !ctaTargets.size && !siteNav.classList.contains('open');
    mobileCta.classList.toggle('is-visible', show);
  };
  const ctaObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) ctaTargets.add(target);
      else ctaTargets.delete(target);
    });
    updateCta();
  });
  [contactForm, document.querySelector('.site-footer')].forEach((target) => target && ctaObserver.observe(target));
  window.addEventListener('scroll', updateCta, { passive: true });
  menuToggle.addEventListener('click', updateCta);
}

// Animações. Ficam todas desligadas para quem pede menos movimento no sistema.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (!reduceMotion) {
  const motionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        motionObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  // Títulos: cada palavra sobe por trás de uma máscara, em cascata.
  document.querySelectorAll('h1, h2').forEach((heading) => {
    let index = 0;
    const splitWords = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const fragment = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              fragment.append(part);
              return;
            }
            const word = document.createElement('span');
            const inner = document.createElement('span');
            word.className = 'word';
            inner.textContent = part;
            inner.style.setProperty('--i', index++);
            word.append(inner);
            fragment.append(word);
          });
          child.replaceWith(fragment);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          splitWords(child);
        }
      });
    };
    heading.setAttribute('aria-label', heading.innerText.replace(/\s+/g, ' ').trim());
    splitWords(heading);
    heading.classList.add('split');
    motionObserver.observe(heading);
  });

  // Linha cobre junto ao número de cada secção.
  document.querySelectorAll('.section-label').forEach((label) => motionObserver.observe(label));

  // Imagens e vídeos revelados como uma cortina. O clip-path deixa o elemento sem área visível
  // para o IntersectionObserver, por isso a posição é verificada no scroll.
  let pendingMedia = [...document.querySelectorAll('.office-video-wrap, .office-video-secondary, .visual-story-image, .visual-story-video')];
  pendingMedia.forEach((media) => media.classList.add('media-reveal'));

  const revealMedia = () => {
    pendingMedia = pendingMedia.filter((media) => {
      const rect = media.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0) {
        media.classList.add('is-in');
        return false;
      }
      return true;
    });
    if (!pendingMedia.length) window.removeEventListener('scroll', revealMedia);
  };
  window.addEventListener('scroll', revealMedia, { passive: true });
  revealMedia();

  if (finePointer) {
    // Luz cobre que segue o rato nas secções escuras.
    document.querySelectorAll('.hero, .section-dark, .visual-story').forEach((section) => {
      section.classList.add('has-glow');
      section.addEventListener('pointermove', (event) => {
        const rect = section.getBoundingClientRect();
        section.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        section.style.setProperty('--my', `${event.clientY - rect.top}px`);
      });
      section.addEventListener('pointerleave', () => {
        section.style.removeProperty('--mx');
        section.style.removeProperty('--my');
      });
    });

    // Retrato do hero inclina ligeiramente na direção do rato.
    const heroAside = document.querySelector('.hero-aside');
    if (hero && heroAside) {
      hero.addEventListener('pointermove', (event) => {
        if (!heroAside.classList.contains('visible')) return;
        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;
        heroAside.style.transform = `perspective(1200px) rotateY(${x * 6}deg) rotateX(${y * -6}deg)`;
      });
      hero.addEventListener('pointerleave', () => {
        heroAside.style.transform = '';
      });
    }

    // Botões "magnéticos": acompanham o cursor alguns píxeis.
    document.querySelectorAll('.nav-cta, .submit-button, .map-link').forEach((button) => {
      button.classList.add('magnetic');
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
      });
      button.addEventListener('pointerleave', () => {
        button.style.transform = '';
      });
    });
  }
}
