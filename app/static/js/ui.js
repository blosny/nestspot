/**
 * NestSpot – small DOM helpers (modals, escaping, buttons).
 */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
}

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
}

function bindModalDismiss(backdropId, closeBtnId) {
    const backdrop = document.getElementById(backdropId);
    const closeBtn = document.getElementById(closeBtnId);
    if (!backdrop) return;
    if (closeBtn) closeBtn.addEventListener("click", () => closeModal(backdropId));
    backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) closeModal(backdropId);
    });
}

function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
}

function setActiveExclusive(buttons, activeBtn) {
    buttons.forEach((b) => b.classList.remove("active"));
    activeBtn.classList.add("active");
}
