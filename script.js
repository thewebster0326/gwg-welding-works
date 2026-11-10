(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const header = document.querySelector('[data-header]');
  const progress = document.querySelector('.scroll-progress span');
  const menuButton = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileLinks = mobileMenu.querySelectorAll('a');
  let scrollTicking = false;

  const updateScrollUI = () => {
    const scrollTop = window.scrollY;
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('scrolled', scrollTop > 30);
    progress.style.transform = `scaleX(${scrollRange > 0 ? Math.min(scrollTop / scrollRange, 1) : 0})`;
    scrollTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateScrollUI);
      scrollTicking = true;
    }
  }, { passive: true });
  updateScrollUI();

  const setMenu = (open) => {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  };

  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  mobileLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuButton.focus();
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) setMenu(false);
  });

  const reveals = document.querySelectorAll('.reveal');
  document.querySelectorAll('.services-grid, .process-grid, .values-list').forEach((group) => {
    group.querySelectorAll('.reveal').forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
    });
  });

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    reveals.forEach((element) => revealObserver.observe(element));
  } else {
    reveals.forEach((element) => element.classList.add('is-visible'));
  }

  const navLinks = document.querySelectorAll('.desktop-nav a');
  const navSections = [...navLinks].map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            const active = link.getAttribute('href') === `#${entry.target.id}`;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
          });
        }
      });
    }, { rootMargin: '-25% 0px -65%', threshold: 0 });
    navSections.forEach((section) => sectionObserver.observe(section));
  }

  const heroVisual = document.querySelector('[data-tilt]');
  const heroInner = heroVisual.querySelector('.hero-visual-inner');
  if (finePointer.matches && !reducedMotion.matches) {
    heroVisual.addEventListener('pointermove', (event) => {
      const bounds = heroVisual.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      heroInner.style.setProperty('--hero-rx', `${-y * 6}deg`);
      heroInner.style.setProperty('--hero-ry', `${x * 7}deg`);
    });
    heroVisual.addEventListener('pointerleave', () => {
      heroInner.style.setProperty('--hero-rx', '0deg');
      heroInner.style.setProperty('--hero-ry', '0deg');
    });

    document.querySelectorAll('[data-tilt-card]').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        card.style.setProperty('--card-rx', `${-y * 3}deg`);
        card.style.setProperty('--card-ry', `${x * 3}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--card-rx', '0deg');
        card.style.setProperty('--card-ry', '0deg');
      });
    });
  }

  const filterButtons = document.querySelectorAll('[data-filter]');
  const projectCards = [...document.querySelectorAll('.project-card')];
  const emptyMessage = document.querySelector('.filter-empty');

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle('active', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      let visibleCount = 0;
      projectCards.forEach((card) => {
        const visible = filter === 'all' || card.dataset.category === filter;
        card.hidden = !visible;
        card.classList.remove('filter-enter');
        if (visible) {
          visibleCount += 1;
          card.classList.add('is-visible');
          void card.offsetWidth;
          card.classList.add('filter-enter');
        }
      });
      emptyMessage.hidden = visibleCount > 0;
    });
  });

  const lightbox = document.querySelector('#project-lightbox');
  const lightboxImage = lightbox.querySelector('figure img');
  const lightboxCount = lightbox.querySelector('figcaption span');
  const lightboxTitle = lightbox.querySelector('figcaption strong');
  const closeLightboxButton = lightbox.querySelector('.lightbox-close');
  let currentProject = 0;
  let touchStartX = 0;

  const visibleProjects = () => projectCards.filter((card) => !card.hidden);

  const renderProject = () => {
    const projects = visibleProjects();
    if (!projects.length) return;
    currentProject = (currentProject + projects.length) % projects.length;
    const project = projects[currentProject];
    const thumbnail = project.querySelector('img');
    lightboxImage.src = project.dataset.image;
    lightboxImage.alt = thumbnail.alt;
    lightboxTitle.textContent = project.dataset.title;
    lightboxCount.textContent = `${String(currentProject + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
  };

  projectCards.forEach((card) => {
    card.addEventListener('click', () => {
      currentProject = visibleProjects().indexOf(card);
      renderProject();
      lightbox.showModal();
      document.body.style.overflow = 'hidden';
    });
  });

  const closeLightbox = () => lightbox.close();
  closeLightboxButton.addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => {
    currentProject -= 1;
    renderProject();
  });
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => {
    currentProject += 1;
    renderProject();
  });
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox.addEventListener('close', () => {
    document.body.style.overflow = '';
    lightboxImage.src = '';
  });
  lightbox.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      currentProject -= 1;
      renderProject();
    }
    if (event.key === 'ArrowRight') {
      currentProject += 1;
      renderProject();
    }
  });
  lightbox.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', (event) => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 60) {
      currentProject += distance < 0 ? 1 : -1;
      renderProject();
    }
  }, { passive: true });

  document.querySelectorAll('[data-service]').forEach((link) => {
    link.addEventListener('click', () => {
      const serviceSelect = document.querySelector('#quote-form select[name="service"]');
      serviceSelect.value = link.dataset.service;
    });
  });

  const quoteForm = document.querySelector('#quote-form');
  const formStatus = document.querySelector('#form-status');
  quoteForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!quoteForm.reportValidity()) return;
    const data = new FormData(quoteForm);
    const lines = [
      'Hi GwG Welding Works, I would like to request a quote.',
      '',
      `Name: ${data.get('name')}`,
      `Phone: ${data.get('phone') || 'Not provided'}`,
      `Service: ${data.get('service')}`,
      `Area: ${data.get('area') || 'Not provided'}`,
      '',
      'Project details:',
      data.get('message')
    ];
    const url = `https://wa.me/27656596566?text=${encodeURIComponent(lines.join('\n'))}`;
    const whatsappWindow = window.open(url, '_blank');
    if (whatsappWindow) {
      whatsappWindow.opener = null;
      formStatus.textContent = 'WhatsApp opened with your project details.';
    } else {
      window.location.assign(url);
    }
  });

  document.querySelector('#current-year').textContent = new Date().getFullYear();

  const canvas = document.querySelector('#spark-canvas');
  const context = canvas.getContext('2d');
  let particles = [];
  let animationFrame = 0;
  let canvasVisible = true;

  const createParticle = (initial = false) => ({
    x: Math.random() * canvas.clientWidth,
    y: initial ? Math.random() * canvas.clientHeight : canvas.clientHeight + 10,
    length: Math.random() * 3 + 1,
    speed: Math.random() * 0.35 + 0.12,
    drift: (Math.random() - 0.5) * 0.18,
    opacity: Math.random() * 0.45 + 0.08
  });

  const resizeCanvas = () => {
    if (reducedMotion.matches) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(canvas.clientHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.min(Math.floor(canvas.clientWidth / 32), 45);
    particles = Array.from({ length: count }, () => createParticle(true));
  };

  const drawSparks = () => {
    if (!canvasVisible || document.hidden || reducedMotion.matches) {
      animationFrame = 0;
      return;
    }
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    particles.forEach((particle, index) => {
      context.beginPath();
      context.strokeStyle = `rgba(239, 106, 46, ${particle.opacity})`;
      context.lineWidth = 1;
      context.moveTo(particle.x, particle.y);
      context.lineTo(particle.x - particle.drift * 8, particle.y + particle.length);
      context.stroke();
      particle.y -= particle.speed;
      particle.x += particle.drift;
      if (particle.y < -10 || particle.x < -10 || particle.x > canvas.clientWidth + 10) {
        particles[index] = createParticle();
      }
    });
    animationFrame = window.requestAnimationFrame(drawSparks);
  };

  if (!reducedMotion.matches && context) {
    resizeCanvas();
    drawSparks();
    window.addEventListener('resize', resizeCanvas);
    if ('IntersectionObserver' in window) {
      const canvasObserver = new IntersectionObserver(([entry]) => {
        canvasVisible = entry.isIntersecting;
        if (canvasVisible && !animationFrame) drawSparks();
      });
      canvasObserver.observe(canvas);
    }
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && canvasVisible && !animationFrame) drawSparks();
    });
  }
})();
