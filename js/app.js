const menuBtn = document.querySelector(".menu-btn");
const navMenu = document.querySelector(".nav-menu");

if (menuBtn && navMenu) {

    function openNav() {
        navMenu.classList.add("active");
        menuBtn.setAttribute("aria-expanded", "true");
        menuBtn.setAttribute("aria-label", "Close navigation");
        document.body.classList.add("nav-open");
    }

    function closeNav() {
        navMenu.classList.remove("active");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.setAttribute("aria-label", "Open navigation");
        document.body.classList.remove("nav-open");
    }

    menuBtn.addEventListener("click", () => {
        navMenu.classList.contains("active") ? closeNav() : openNav();
    });

    // Close after selecting a link.
    navMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeNav);
    });

    // Close when tapping/clicking outside the menu.
    document.addEventListener("click", (e) => {
        if (!navMenu.classList.contains("active")) return;
        if (navMenu.contains(e.target) || menuBtn.contains(e.target)) return;
        closeNav();
    });

    // Close on Escape.
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && navMenu.classList.contains("active")) {
            closeNav();
            menuBtn.focus();
        }
    });

    // Reset mobile-only state once the viewport crosses into the
    // horizontal-nav range (matches the 900px breakpoint in sections.css).
    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            closeNav();
        }
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
/* --------------------------------------------------------------------
Project Request — Netlify Function
-------------------------------------------------------------------- */

const projectForm = document.getElementById("projectForm");

if (projectForm) {
projectForm.addEventListener("submit", async (event) => {
event.preventDefault();

    const submitButton = projectForm.querySelector('button[type="submit"]');

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending... ⏳";
    }

    try {
        const formData = new FormData(projectForm);

        const projectData = {
            name: formData.get("name"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            service: formData.get("service"),
            budget: formData.get("budget") || null,
            deadline: formData.get("deadline") || null,
            description: formData.get("message")
        };

        const response = await fetch("/.netlify/functions/create-project", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(projectData)
        });

        const result = await response.json();
        if (!response.ok) {
    let errorMessage = result.error || "Project request could not be submitted.";

    if (result.supabase_status) {
        errorMessage += `\n\nSupabase Status: ${result.supabase_status}`;
    }

    if (result.supabase_response) {
        errorMessage += `\n\nSupabase Response: ${JSON.stringify(result.supabase_response)}`;
    }

    throw new Error(errorMessage);
}


        alert(
            `Project submitted successfully! 🚀\n\nProject Code: ${
                result.project?.project_code || "Pending"
            }`
        );

        projectForm.reset();

    } catch (error) {
        console.error("Project submission error:", error);

        alert(
            error.message ||
            "Something went wrong while submitting your project. Please try again."
        );

    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Submit Request 🚀";
        }
    }
});

}
