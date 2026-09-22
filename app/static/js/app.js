/**
 * NestSpot - Main Client Logic
 */

let allSpots = [];
let currentBlock = "ALL";
let currentFilter = "ALL";
let currentSearch = "";

document.addEventListener("DOMContentLoaded", () => {
    initEventListeners();
    fetchComplexStats();
    fetchSpots();
});

function initEventListeners() {
    // Block Switcher
    const segmentBtns = document.querySelectorAll(".segment-btn");
    segmentBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            segmentBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentBlock = btn.dataset.block;
            renderParkingGrid(allSpots, currentBlock, currentFilter, currentSearch);
        });
    });

    // Filter Buttons
    const filterBtns = document.querySelectorAll(".filter-btn");
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.dataset.filter;
            renderParkingGrid(allSpots, currentBlock, currentFilter, currentSearch);
        });
    });

    // Search Box
    const searchInput = document.getElementById("spotSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentSearch = e.target.value;
            renderParkingGrid(allSpots, currentBlock, currentFilter, currentSearch);
        });
    }

    // Modal Close
    const closeModalBtn = document.getElementById("closeModalBtn");
    const modalBackdrop = document.getElementById("spotModalBackdrop");
    if (closeModalBtn && modalBackdrop) {
        closeModalBtn.addEventListener("click", () => {
            modalBackdrop.classList.remove("active");
        });
        modalBackdrop.addEventListener("click", (e) => {
            if (e.target === modalBackdrop) {
                modalBackdrop.classList.remove("active");
            }
        });
    }
}

async function fetchComplexStats() {
    try {
        const res = await fetch("/api/spots/summary/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const stats = await res.json();
        
        const summaryBadge = document.getElementById("spotsAvailableSummary");
        if (summaryBadge) {
            summaryBadge.textContent = `${stats.available_now} of ${stats.total_spots} spots free`;
        }

        const countAvail = document.getElementById("countAvailable");
        if (countAvail) countAvail.textContent = stats.available_now;

        const countEv = document.getElementById("countEv");
        if (countEv) countEv.textContent = stats.ev_spots_count;

        const countVac = document.getElementById("countVacation");
        if (countVac) countVac.textContent = stats.vacation_spots_count;
    } catch (err) {
        console.error("Error fetching stats:", err);
    }
}

async function fetchSpots() {
    try {
        const res = await fetch("/api/spots");
        if (!res.ok) throw new Error("Failed to fetch spots");
        allSpots = await res.json();
        renderParkingGrid(allSpots, currentBlock, currentFilter, currentSearch);
    } catch (err) {
        console.error("Error fetching spots:", err);
    }
}

window.handleSpotClick = function(spotId) {
    const spot = allSpots.find(s => s.id === spotId);
    if (!spot) return;
    
    const modalContent = document.getElementById("modalContent");
    const modalBackdrop = document.getElementById("spotModalBackdrop");
    if (modalContent && modalBackdrop) {
        modalContent.innerHTML = renderCleanSpotModal(spot);
        modalBackdrop.classList.add("active");
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
};
