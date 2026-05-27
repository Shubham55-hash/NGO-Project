// Core DOM Elements
const body = document.body;
const themeToggle = document.getElementById("themeToggle");
const themeText = themeToggle?.querySelector(".theme-toggle-text");
const menuToggle = document.getElementById("menuToggle");
const navActions = document.getElementById("navActions");
const siteHeader = document.querySelector(".site-header");
const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
const modalTriggers = document.querySelectorAll("[data-open-modal]");
const closeModalControls = document.querySelectorAll("[data-close-modal]");
const toast = document.getElementById("toast");
const interestForm = document.getElementById("interestForm");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const themeMeta = document.querySelector('meta[name="theme-color"]');

let toastTimer;
let activeModal = null;
let lastFocusedElement = null;

/* ==========================================================================
   THEME TOGGLE SYSTEM (Preserves light/dark preference)
   ========================================================================== */

const getPreferredTheme = () => {
  const storedTheme = localStorage.getItem("scf-theme");
  if (storedTheme) return storedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const syncThemeLabel = () => {
  const isDark = body.dataset.theme === "dark";
  
  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isDark));
  }
  if (themeText) {
    themeText.textContent = isDark ? "Dark" : "Light";
  }
  if (themeMeta) {
    themeMeta.setAttribute("content", isDark ? "#18161d" : "#f7efe3");
  }
};

// Initialize Theme
body.dataset.theme = getPreferredTheme();
syncThemeLabel();

themeToggle?.addEventListener("click", () => {
  body.dataset.theme = body.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("scf-theme", body.dataset.theme);
  syncThemeLabel();
});

/* ==========================================================================
   MOBILE MENU TOGGLE
   ========================================================================== */

const syncMenuState = (open) => {
  body.classList.toggle("nav-open", open);
  menuToggle?.setAttribute("aria-expanded", String(open));

  if (!navActions) return;

  if (window.innerWidth <= 760) {
    if (open) {
      navActions.style.display = "flex";
      // Force repaint to allow transitions
      navActions.offsetHeight;
      navActions.style.maxHeight = "32rem";
      navActions.style.opacity = "1";
      navActions.style.pointerEvents = "auto";
    } else {
      navActions.style.maxHeight = "0px";
      navActions.style.opacity = "0";
      navActions.style.pointerEvents = "none";
      // Wait for transition before display none
      setTimeout(() => {
        if (!body.classList.contains("nav-open")) {
          navActions.style.display = "none";
        }
      }, 300);
    }
  } else {
    navActions.style.removeProperty("display");
    navActions.style.removeProperty("max-height");
    navActions.style.removeProperty("opacity");
    navActions.style.removeProperty("pointer-events");
  }
};

// Setup initial closed state
syncMenuState(false);

menuToggle?.addEventListener("click", () => {
  syncMenuState(!body.classList.contains("nav-open"));
});

// Close mobile navigation menu on link click
navActions?.querySelectorAll("a, button").forEach((item) => {
  item.addEventListener("click", () => {
    if (window.innerWidth <= 760 && item !== themeToggle) {
      syncMenuState(false);
    }
  });
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) {
    syncMenuState(false);
  }
});

// Navbar scroll shrink transition
window.addEventListener(
  "scroll",
  () => {
    siteHeader?.classList.toggle("is-scrolled", window.scrollY > 20);
  },
  { passive: true }
);

/* ==========================================================================
   SMOOTH SCROLL & ACTIVE LINK OBSERVER
   ========================================================================== */

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    if (!targetId || targetId === "#") return;

    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
      block: "start",
    });
  });
});

// Intersection Observer for Active Page Highlight
const sections = [...document.querySelectorAll("main section[id]")];
if (sections.length && navLinks.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
          if (isCurrent) {
            link.setAttribute("aria-current", "page");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      });
    },
    {
      rootMargin: "-30% 0px -40% 0px",
      threshold: 0.1,
    }
  );
  sections.forEach((section) => sectionObserver.observe(section));
}

/* ==========================================================================
   SCROLL REVEALS & MOTION EFFECTS
   ========================================================================== */

const revealItems = document.querySelectorAll(".reveal, .reveal-card, .stagger-item");

revealItems.forEach((item, index) => {
  if (item.classList.contains("stagger-item")) {
    item.style.setProperty("--stagger-delay", `${index % 4}00ms`);
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const delay = entry.target.dataset.revealDelay;
      if (delay && !prefersReducedMotion.matches) {
        entry.target.style.transitionDelay = `${Number(delay) * 1000}ms`;
      }

      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
);

revealItems.forEach((item) => revealObserver.observe(item));

// Ripple Button Interaction
document.querySelectorAll(".ripple-button").forEach((button) => {
  button.addEventListener("click", (event) => {
    if (prefersReducedMotion.matches) return;

    const ripple = document.createElement("span");
    ripple.className = "ripple";

    const rect = button.getBoundingClientRect();
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;

    button.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  });
});

// Magnetic Hover Attraction
document.querySelectorAll(".magnetic-button").forEach((button) => {
  button.addEventListener("pointermove", (event) => {
    if (prefersReducedMotion.matches) return;

    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;

    button.style.setProperty("--magnet-x", `${x * 0.2}px`);
    button.style.setProperty("--magnet-y", `${y * 0.2}px`);
  });

  ["pointerleave", "blur"].forEach((eventName) => {
    button.addEventListener(eventName, () => {
      button.style.setProperty("--magnet-x", "0px");
      button.style.setProperty("--magnet-y", "0px");
    });
  });
});

// Parallax Calculations
const parallaxItems = document.querySelectorAll("[data-parallax]");
if (parallaxItems.length && !prefersReducedMotion.matches) {
  let ticking = false;

  const applyParallax = () => {
    parallaxItems.forEach((item) => {
      const speed = Number(item.dataset.parallax || 0);
      const rect = item.getBoundingClientRect();
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const offset = (progress - 0.5) * speed;

      item.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    });
    ticking = false;
  };

  const handleParallax = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(applyParallax);
  };

  handleParallax();
  window.addEventListener("scroll", handleParallax, { passive: true });
  window.addEventListener("resize", handleParallax);
}

/* ==========================================================================
   TESTIMONIAL CAROUSEL SLIDER
   ========================================================================== */

const slider = document.getElementById("testimonialSlider");
const slides = slider?.querySelectorAll(".testimonial-slide");
const dots = document.querySelectorAll(".slider-dot");
const prevBtn = document.getElementById("sliderPrev");
const nextBtn = document.getElementById("sliderNext");

let currentSlideIndex = 0;
let slideInterval;

const updateSlider = (index) => {
  if (!slides || !slides.length) return;

  // Handle bounds
  if (index >= slides.length) currentSlideIndex = 0;
  else if (index < 0) currentSlideIndex = slides.length - 1;
  else currentSlideIndex = index;

  slides.forEach((slide, idx) => {
    const isActive = idx === currentSlideIndex;
    slide.classList.toggle("is-active", isActive);
    slide.setAttribute("aria-hidden", String(!isActive));
  });

  dots.forEach((dot, idx) => {
    const isActive = idx === currentSlideIndex;
    dot.classList.toggle("is-active", isActive);
    dot.setAttribute("aria-selected", String(isActive));
  });
};

const nextSlide = () => {
  updateSlider(currentSlideIndex + 1);
};

const prevSlide = () => {
  updateSlider(currentSlideIndex - 1);
};

// Event Listeners for Slider
prevBtn?.addEventListener("click", () => {
  prevSlide();
  resetSlideTimer();
});

nextBtn?.addEventListener("click", () => {
  nextSlide();
  resetSlideTimer();
});

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    const slideTo = parseInt(dot.dataset.slide || "0", 10);
    updateSlider(slideTo);
    resetSlideTimer();
  });
});

const startSlideTimer = () => {
  slideInterval = setInterval(nextSlide, 7000);
};

const resetSlideTimer = () => {
  clearInterval(slideInterval);
  startSlideTimer();
};

// Initialize Slider
if (slides && slides.length) {
  updateSlider(0);
  startSlideTimer();
}

/* ==========================================================================
   MODAL DIALOG & FOCUS MANAGEMENT
   ========================================================================== */

const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const getFocusableElements = (container) =>
  [...container.querySelectorAll(focusableSelector)].filter((element) => !element.hasAttribute("hidden"));

const openModal = (modal) => {
  if (!modal) return;
  lastFocusedElement = document.activeElement;
  activeModal = modal;
  activeModal.classList.add("is-open");
  activeModal.setAttribute("aria-hidden", "false");
  body.classList.add("modal-open");
  document.addEventListener("keydown", handleModalKeys);

  const [firstFocusable] = getFocusableElements(activeModal);
  firstFocusable?.focus();
};

const closeModal = () => {
  if (!activeModal) return;
  activeModal.classList.remove("is-open");
  activeModal.setAttribute("aria-hidden", "true");
  body.classList.remove("modal-open");
  document.removeEventListener("keydown", handleModalKeys);
  lastFocusedElement?.focus();
  activeModal = null;
};

function handleModalKeys(event) {
  if (!activeModal) return;

  if (event.key === "Escape") {
    closeModal();
    return;
  }

  if (event.key !== "Tab") return;

  const focusableElements = getFocusableElements(activeModal);
  if (!focusableElements.length) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

modalTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const modalId = trigger.dataset.openModal;
    const modal = modalId ? document.getElementById(modalId) : null;
    openModal(modal);
  });
});

closeModalControls.forEach((control) => {
  control.addEventListener("click", closeModal);
});

/* ==========================================================================
   FORM VALIDATION & TOAST ALERT SYSTEM
   ========================================================================== */

const showToast = (message) => {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3500);
};

interestForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const nameInput = interestForm.querySelector('input[name="name"]');
  const emailInput = interestForm.querySelector('input[name="email"]');
  const interestInput = interestForm.querySelector('textarea[name="interest"]');

  let isValid = true;

  // Simple, elegant validations
  if (!nameInput.value.trim()) {
    isValid = false;
    nameInput.focus();
  } else if (!emailInput.value.trim() || !emailInput.value.includes("@")) {
    isValid = false;
    emailInput.focus();
  } else if (!interestInput.value.trim()) {
    isValid = false;
    interestInput.focus();
  }

  if (!isValid) return;

  const name = nameInput.value.trim();
  showToast(
    name
      ? `Thank you, ${name}. We've received your interest and will reach out soon.`
      : "Thank you. We've received your interest and will reach out soon."
  );
  
  interestForm.reset();
  closeModal();
});

/* ==========================================================================
   FOOTER EMAIL CAPTURE — validation, shake, success state
   ========================================================================== */

const footerEmailInput  = document.getElementById("footerEmailInput");
const footerEmailSubmit = document.getElementById("footerEmailSubmit");
const footerEmailPill   = document.getElementById("footerEmailPill");
const footerEmailSuccess= document.getElementById("footerEmailSuccess");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const shakeEmailPill = () => {
  if (prefersReducedMotion.matches) return;
  footerEmailPill.classList.remove("is-shaking");
  // Force reflow so re-adding the class triggers the animation again
  void footerEmailPill.offsetWidth;
  footerEmailPill.classList.add("is-shaking");
  footerEmailPill.addEventListener(
    "animationend",
    () => footerEmailPill.classList.remove("is-shaking"),
    { once: true }
  );
};

const markEmailInvalid = () => {
  footerEmailInput.classList.add("is-invalid");
  shakeEmailPill();
  setTimeout(() => footerEmailInput.classList.remove("is-invalid"), 1200);
};

const showEmailSuccess = () => {
  footerEmailPill.style.transition = "opacity 0.2s ease";
  footerEmailPill.style.opacity = "0";
  setTimeout(() => {
    footerEmailPill.style.display = "none";
    footerEmailSuccess.removeAttribute("hidden");
    // Trigger slide & fade animation in the next frame
    requestAnimationFrame(() => {
      footerEmailSuccess.style.opacity = "1";
    });
  }, 200);
};

footerEmailSubmit?.addEventListener("click", () => {
  const val = footerEmailInput?.value.trim() ?? "";
  if (!val || !EMAIL_RE.test(val)) {
    markEmailInvalid();
    footerEmailInput?.focus();
    return;
  }
  showEmailSuccess();
});

// Allow submitting with Enter key from the input
footerEmailInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") footerEmailSubmit?.click();
});
