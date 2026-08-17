const menuBtn = document.querySelector(".menu-btn");
const navMenu = document.querySelector(".nav-menu");

if (menuBtn && navMenu) {
    menuBtn.addEventListener("click", () => {
        const isActive = navMenu.classList.toggle("active");
        menuBtn.setAttribute("aria-expanded", isActive ? "true" : "false");
    });

    navMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navMenu.classList.remove("active");
            menuBtn.setAttribute("aria-expanded", "false");
        });
    });
}

const reveals = document.querySelectorAll(".reveal");

function revealSections() {
    const windowHeight = window.innerHeight;

    reveals.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;

        if (elementTop < windowHeight - 100) {
            element.classList.add("active");
        }
    });
}

window.addEventListener("scroll", revealSections);
window.addEventListener("load", revealSections);
revealSections();

/* --------------------------------------------------------------------
   Page fade-in
-------------------------------------------------------------------- */

window.addEventListener("load", () => {
    document.body.classList.add("is-loaded");
});

/* --------------------------------------------------------------------
   Scroll progress bar
-------------------------------------------------------------------- */

const scrollProgress = document.getElementById("scrollProgress");

function updateScrollProgress() {
    if (!scrollProgress) return;

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    scrollProgress.style.width = percent + "%";
}

window.addEventListener("scroll", updateScrollProgress);
window.addEventListener("resize", updateScrollProgress);
updateScrollProgress();

/* --------------------------------------------------------------------
   Scroll-spy — highlight the active nav link
-------------------------------------------------------------------- */

const navLinks = document.querySelectorAll(".nav-menu a[href^='#']");
const spySections = Array.from(navLinks)
    .map((link) => document.getElementById(link.getAttribute("href").slice(1)))
    .filter(Boolean);

if (navLinks.length && spySections.length && "IntersectionObserver" in window) {
    const spyObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                navLinks.forEach((link) => {
                    link.classList.toggle(
                        "active",
                        link.getAttribute("href") === "#" + entry.target.id
                    );
                });
            });
        },
        { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    spySections.forEach((section) => spyObserver.observe(section));
}

/* --------------------------------------------------------------------
   Back to top
-------------------------------------------------------------------- */

const backToTop = document.getElementById("backToTop");

if (backToTop) {
    window.addEventListener("scroll", () => {
        backToTop.classList.toggle("visible", window.scrollY > 500);
    });

    backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

