from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from app.models.booking import SecurityVerificationResult
from app.services.booking_service import booking_service

router = APIRouter(prefix="/api/security", tags=["Gate Security"])


@router.get("/verify", response_model=SecurityVerificationResult)
async def verify_plate(
    plate: Annotated[
        str,
        Query(description="Vehicle license plate to verify", min_length=1, max_length=32),
    ],
) -> SecurityVerificationResult:
    """Verify license plate against active resident and visitor permits."""
    if not plate or not plate.strip():
        raise HTTPException(status_code=400, detail="License plate must not be empty")
    return booking_service.verify_license_plate(plate)
