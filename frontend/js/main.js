// ./js/main.js
import { router } from "./router.js";

// ===== Mobile menu (silencioso, sin alerts) =====
function setupMobileMenu() {
    const menuBtn =
        document.querySelector("[data-menu-btn]") || document.getElementById("menuBtn");
    const menuPane =
        document.querySelector("[data-menu-panel]") || document.getElementById("mobileMenu");

    // Si no hay elementos, no hacemos nada
    if (!menuBtn || !menuPane) return;

    // Evitar handlers duplicados si re-renderiza
    menuBtn.__mbBound && menuBtn.removeEventListener("click", menuBtn.__mbBound, { capture: false });
    let outsideHandler = menuPane.__mbOutsideHandler;
    let escHandler = menuPane.__mbEscHandler;
    if (outsideHandler) document.removeEventListener("click", outsideHandler, true);
    if (escHandler) document.removeEventListener("keydown", escHandler);

    function toggleMenu(ev) {
        ev?.preventDefault?.();
        ev?.stopPropagation?.();
        try {
            const isOpen = menuPane.dataset.open === "true";
            menuPane.dataset.open = String(!isOpen);
            menuPane.hidden = isOpen;
            menuBtn.setAttribute("aria-expanded", String(!isOpen));
            console.debug("[menu] toggle", { open: !isOpen });
        } catch (err) {
            console.error("[menu] toggle error", err);
        }
    }

    const onBtnClick = (ev) => toggleMenu(ev);
    menuBtn.addEventListener("click", onBtnClick, { passive: false });
    menuBtn.__mbBound = onBtnClick;

    // Cerrar al hacer click fuera
    outsideHandler = (ev) => {
        try {
            if (menuPane.hidden) return;
            if (!menuPane.contains(ev.target) && ev.target !== menuBtn) {
                toggleMenu(ev);
            }
        } catch (err) {
            console.error("[menu] outside-click error", err);
        }
    };
    document.addEventListener("click", outsideHandler, true);
    menuPane.__mbOutsideHandler = outsideHandler;

    // Cerrar con ESC
    escHandler = (ev) => {
        if (ev.key === "Escape" && !menuPane.hidden) {
            toggleMenu(ev);
        }
    };
    document.addEventListener("keydown", escHandler);
    menuPane.__mbEscHandler = escHandler;
}

document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("app");
    router.init(root);
    setupMobileMenu();
});

// Re-aplicar bindings si tu SPA re-renderiza el header en cambios de ruta
window.addEventListener("hashchange", () => {
    // pequeño defer para esperar al re-render
    setTimeout(setupMobileMenu, 0);
});
