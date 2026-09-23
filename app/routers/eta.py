from fastapi import APIRouter, HTTPException, status

from app.models.eta import ETABroadcastRequest, ETABroadcastStatus
from app.services.eta_service import eta_service

router = APIRouter(prefix="/api/eta", tags=["Live ETA Departure Alerts"])


@router.post("/broadcast", response_model=ETABroadcastStatus, status_code=status.HTTP_201_CREATED)
async def broadcast_eta(req: ETABroadcastRequest) -> ETABroadcastStatus:
    """Broadcast resident departure to notify current occupant and start buffer timer."""
    try:
        return eta_service.broadcast_departure(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/active", response_model=list[ETABroadcastStatus])
async def get_active_eta_alerts() -> list[ETABroadcastStatus]:
    """Retrieve all currently active resident departure arrival alerts."""
    return eta_service.get_active_alerts()


@router.post("/{broadcast_id}/resolve", response_model=ETABroadcastStatus)
async def resolve_eta_alert(broadcast_id: str) -> ETABroadcastStatus:
    """Dismiss or resolve an ETA arrival alert."""
    result = eta_service.resolve_alert(broadcast_id)
    if not result:
        raise HTTPException(status_code=404, detail="ETA alert not found")
    return result
