/**
 * NestSpot - Clean Parking Grid Renderer
 */

const STATUS_MAP = {
    available: { label: "Free", pillClass: "pill-available", dotClass: "ind-available" },
    occupied_by_owner: { label: "Owner Parked", pillClass: "pill-owner", dotClass: "ind-owner" },
    reserved_by_neighbor: { label: "Neighbor Parked", pillClass: "pill-neighbor", dotClass: "ind-neighbor" },
    reserved_by_guest: { label: "Guest Permit", pillClass: "pill-guest", dotClass: "ind-guest" },
    away_vacation: { label: "Vacation (Free)", pillClass: "pill-vacation", dotClass: "ind-available" }
};

function renderParkingGrid(spots, activeBlock = "ALL", activeFilter = "ALL", searchTerm = "") {
    const blockAGrid = document.getElementById("blockAGrid");
    const blockBGrid = document.getElementById("blockBGrid");
    const blockASection = document.getElementById("blockASection");
    const blockBSection = document.getElementById("blockBSection");
    const drivewayDivider = document.getElementById("drivewayDivider");

    if (!blockAGrid || !blockBGrid) return;

    let filtered = spots;

    // Search filter
    if (searchTerm && searchTerm.trim() !== "") {
        const q = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(s =>
            s.spot_number.toLowerCase().includes(q) ||
            s.owner_name.toLowerCase().includes(q) ||
            `d:${s.flat_number}`.toLowerCase().includes(q) ||
            `flat ${s.flat_number}`.toLowerCase().includes(q) ||
            (s.current_vehicle_plate && s.current_vehicle_plate.toLowerCase().includes(q))
        );
    }

    // Status filter
    if (activeFilter === "AVAILABLE") {
        filtered = filtered.filter(s => s.status === "available" || s.status === "away_vacation");
    } else if (activeFilter === "EV") {
        filtered = filtered.filter(s => s.has_ev_charger);
    } else if (activeFilter === "VACATION") {
        filtered = filtered.filter(s => s.is_vacation_mode);
    }

    // Block visibility
    if (activeBlock === "A") {
        blockASection.style.display = "block";
        blockBSection.style.display = "none";
        if (drivewayDivider) drivewayDivider.style.display = "none";
    } else if (activeBlock === "B") {
        blockASection.style.display = "none";
        blockBSection.style.display = "block";
        if (drivewayDivider) drivewayDivider.style.display = "none";
    } else {
        blockASection.style.display = "block";
        blockBSection.style.display = "block";
        if (drivewayDivider) drivewayDivider.style.display = "block";
    }

    const spotsA = filtered.filter(s => s.block === "A");
    const spotsB = filtered.filter(s => s.block === "B");

    blockAGrid.innerHTML = spotsA.length > 0
        ? spotsA.map(createCleanSpotCard).join("")
        : '<div class="empty-state">No matching spots in Block A</div>';

    blockBGrid.innerHTML = spotsB.length > 0
        ? spotsB.map(createCleanSpotCard).join("")
        : '<div class="empty-state">No matching spots in Block B</div>';

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function createCleanSpotCard(spot) {
    const statusMeta = STATUS_MAP[spot.status] || STATUS_MAP.available;
    const isFree = spot.status === "available" || spot.status === "away_vacation";

    return `
        <div class="spot-card ${isFree ? 'status-available' : ''}" onclick="window.handleSpotClick('${spot.id}')">
            <div class="spot-header">
                <span class="spot-id">${spot.spot_number}</span>
                ${spot.has_ev_charger ? `
                    <span class="ev-tag" title="${spot.ev_charger_power || 'EV Wallbox'}">
                        <i data-lucide="zap" style="width:10px;height:10px;"></i> EV
                    </span>
                ` : ''}
            </div>

            <div class="spot-status-pill ${statusMeta.pillClass}">
                <span class="legend-dot ${statusMeta.dotClass}"></span>
                <span>${statusMeta.label}</span>
            </div>

            <div class="spot-footer">
                <span class="spot-owner">Fl. ${spot.flat_number} · ${spot.owner_name.split(' ')[0]}</span>
                ${spot.current_vehicle_plate ? `<span style="font-family: monospace; font-size: 0.65rem; color: #94a3b8;">${spot.current_vehicle_plate}</span>` : ''}
            </div>
        </div>
    `;
}

function renderCleanSpotModal(spot) {
    const statusMeta = STATUS_MAP[spot.status] || STATUS_MAP.available;
    const isFree = spot.status === "available" || spot.status === "away_vacation";

    let scheduleHtml = "";
    if (spot.available_windows && spot.available_windows.length > 0) {
        scheduleHtml = spot.available_windows.map(w => `
            <div style="padding: 0.6rem 0.75rem; background: #0b0f17; border: 1px solid #232f48; border-radius: 6px; margin-top: 0.35rem;">
                <div style="font-size: 0.8rem; font-weight: 600; color: #10b981;">${w.title} (${w.start_time} – ${w.end_time})</div>
                <div style="font-size: 0.7rem; color: #64748b; margin-top: 0.15rem;">Active: ${w.days.join(", ")}</div>
            </div>
        `).join("");
    } else {
        scheduleHtml = `<div style="font-size: 0.75rem; color: #64748b; margin-top: 0.25rem;">No recurring schedule set.</div>`;
    }

    return `
        <div style="margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;">
                <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff;">Spot ${spot.spot_number}</h3>
                <span style="font-size: 0.75rem; color: #94a3b8; background: #1e293b; padding: 0.2rem 0.5rem; border-radius: 4px;">
                    Block ${spot.block} · Flat ${spot.flat_number}
                </span>
            </div>
            <div style="font-size: 0.8rem; color: #94a3b8;">Owner: <strong style="color: #e2e8f0;">${spot.owner_name}</strong></div>
        </div>

        <div style="background: #0b0f17; border: 1px solid #232f48; border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem;">
            <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; margin-bottom: 0.35rem;">Status</div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <span class="spot-status-pill ${statusMeta.pillClass}" style="margin:0;">
                    <span class="legend-dot ${statusMeta.dotClass}"></span> ${statusMeta.label}
                </span>
                ${spot.has_ev_charger ? `
                    <span class="ev-tag" style="font-size:0.75rem; padding: 0.25rem 0.5rem;">
                        ⚡ ${spot.ev_charger_power || 'Wallbox'}
                    </span>
                ` : ''}
            </div>
        </div>

        <div style="margin-bottom: 1.25rem;">
            <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600;">Away Hours Schedule</div>
            ${scheduleHtml}
        </div>

        <div style="display: flex; gap: 0.5rem;">
            ${isFree ? `
                <button class="filter-btn" style="flex:1; justify-content:center; background:#10b981; color:#fff; border:none; font-weight:600;" onclick="window.alert('Sprint 3: Booking for second car')">
                    Park Second Car
                </button>
                <button class="filter-btn" style="flex:1; justify-content:center; background:#3b82f6; color:#fff; border:none; font-weight:600;" onclick="window.alert('Sprint 3: Generate guest permit')">
                    Guest Pass
                </button>
            ` : `
                <button class="filter-btn" style="width:100%; justify-content:center;" onclick="document.getElementById('spotModalBackdrop').classList.remove('active')">
                    Close
                </button>
            `}
        </div>
    `;
}
