/**
 * NestSpot – thin fetch helpers (JSON API).
 */

async function apiRequest(path, options = {}) {
    const res = await fetch(path, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options,
    });
    let payload = null;
    const text = await res.text();
    if (text) {
        try {
            payload = JSON.parse(text);
        } catch {
            payload = text;
        }
    }
    if (!res.ok) {
        const detail = payload && payload.detail ? payload.detail : `Request failed (${res.status})`;
        const err = new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
        err.status = res.status;
        throw err;
    }
    return payload;
}

const NestSpotApi = {
    getStats: () => apiRequest("/api/spots/summary/stats"),
    getSpots: () => apiRequest("/api/spots"),
    getActiveBookings: () => apiRequest("/api/bookings?status=active"),
    getAllBookings: () => apiRequest("/api/bookings"),
    createBooking: (body) => apiRequest("/api/bookings", { method: "POST", body: JSON.stringify(body) }),
    completeBooking: (id) => apiRequest(`/api/bookings/${id}/complete`, { method: "POST" }),
    swapBooking: (id, newSpotId) =>
        apiRequest(`/api/bookings/${id}/swap`, {
            method: "POST",
            body: JSON.stringify({ new_spot_id: newSpotId }),
        }),
    getActiveAlerts: () => apiRequest("/api/eta/active"),
    broadcastEta: (body) => apiRequest("/api/eta/broadcast", { method: "POST", body: JSON.stringify(body) }),
    resolveEta: (id) => apiRequest(`/api/eta/${id}/resolve`, { method: "POST" }),
    verifyPlate: (plate) => apiRequest(`/api/security/verify?plate=${encodeURIComponent(plate)}`),
};
