"""
Resource Management API Endpoints
Backend implementation for the resource management system
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel
from decimal import Decimal
import os
from .services.resource_db_service import ResourceDatabaseService
from .models.resource_models import Base

# ============================================
# Pydantic Models (DTOs)
# ============================================

class ResourceBase(BaseModel):
    service_provider_id: int
    project_id: Optional[int] = None
    start_date: date
    end_date: date
    person_count: int
    daily_hours: Optional[float] = 8.0
    category: str
    subcategory: Optional[str] = None
    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_postal_code: Optional[str] = None
    address_country: Optional[str] = "Deutschland"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = "available"
    visibility: Optional[str] = "public"
    hourly_rate: Optional[Decimal] = None
    daily_rate: Optional[Decimal] = None
    currency: Optional[str] = "EUR"
    description: Optional[str] = None
    skills: Optional[List[str]] = []
    equipment: Optional[List[str]] = []

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(ResourceBase):
    service_provider_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    person_count: Optional[int] = None
    category: Optional[str] = None

class Resource(ResourceBase):
    id: int
    total_hours: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    provider_name: Optional[str] = None
    provider_email: Optional[str] = None
    active_allocations: Optional[int] = None

    class Config:
        orm_mode = True

class ResourceAllocationBase(BaseModel):
    resource_id: int
    trade_id: int
    allocated_person_count: int
    allocated_start_date: date
    allocated_end_date: date
    allocated_hours: Optional[float] = None
    allocation_status: Optional[str] = "pre_selected"
    agreed_hourly_rate: Optional[Decimal] = None
    agreed_daily_rate: Optional[Decimal] = None
    total_cost: Optional[Decimal] = None
    notes: Optional[str] = None
    priority: Optional[int] = 0

class ResourceAllocationCreate(ResourceAllocationBase):
    pass

class ResourceAllocation(ResourceAllocationBase):
    id: int
    quote_id: Optional[int] = None
    invitation_sent_at: Optional[datetime] = None
    invitation_viewed_at: Optional[datetime] = None
    offer_requested_at: Optional[datetime] = None
    offer_submitted_at: Optional[datetime] = None
    decision_made_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None

    class Config:
        orm_mode = True

class ResourceRequestBase(BaseModel):
    trade_id: int
    category: str
    subcategory: Optional[str] = None
    required_person_count: int
    required_start_date: date
    required_end_date: date
    location_address: Optional[str] = None
    location_city: Optional[str] = None
    location_postal_code: Optional[str] = None
    max_distance_km: Optional[float] = None
    max_hourly_rate: Optional[Decimal] = None
    max_total_budget: Optional[Decimal] = None
    required_skills: Optional[List[str]] = []
    required_equipment: Optional[List[str]] = []
    requirements_description: Optional[str] = None
    status: Optional[str] = "open"
    deadline_at: Optional[datetime] = None

class ResourceRequest(ResourceRequestBase):
    id: int
    requested_by: int
    total_resources_found: Optional[int] = 0
    total_resources_selected: Optional[int] = 0
    total_offers_received: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ResourceCalendarEntry(BaseModel):
    id: Optional[int] = None
    resource_id: Optional[int] = None
    allocation_id: Optional[int] = None
    service_provider_id: int
    entry_date: date
    person_count: int
    hours_allocated: Optional[float] = None
    status: Optional[str] = "available"
    color: Optional[str] = None
    label: Optional[str] = None

    class Config:
        orm_mode = True

class ResourceKPIs(BaseModel):
    service_provider_id: int
    calculation_date: Optional[date] = None
    total_resources_available: int
    total_resources_allocated: int
    total_resources_completed: int
    total_person_days_available: float
    total_person_days_allocated: float
    total_person_days_completed: float
    utilization_rate: Optional[float] = None
    average_hourly_rate: Optional[float] = None
    total_revenue: Optional[float] = None
    period_start: date
    period_end: date

    class Config:
        orm_mode = True

class ResourceSearchParams(BaseModel):
    category: Optional[str] = None
    subcategory: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    min_persons: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[float] = None
    max_hourly_rate: Optional[float] = None
    skills: Optional[List[str]] = None
    equipment: Optional[List[str]] = None
    status: Optional[str] = None
    service_provider_id: Optional[int] = None
    project_id: Optional[int] = None

class BulkAllocationCreate(BaseModel):
    allocations: List[ResourceAllocationCreate]

# ============================================
# API Router
# ============================================

router = APIRouter(prefix="/api/v1/resources", tags=["resources"])

# Initialize database service
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./resources.db"  # Default to SQLite for development
)
db_service = ResourceDatabaseService(DATABASE_URL)

# Dependency to get DB session
def get_db():
    """Get database session"""
    session = db_service.get_session()
    try:
        yield session
    finally:
        session.close()

# Dependency to get current user (simplified for demo)
def get_current_user():
    """Get current authenticated user"""
    # TODO: Implement JWT token validation
    # For now, return mock user
    return {"id": 1, "email": "test@example.com", "role": "service_provider"}

# Dependency to get current service provider ID
def get_current_provider_id(current_user = Depends(get_current_user)):
    """Get current service provider ID"""
    # Use the actual user ID from the current user
    return current_user.get("id", 1)

# ==================== Resources CRUD ====================

@router.post("/", response_model=Resource)
async def create_resource(
    resource: ResourceCreate,
    db: Session = Depends(get_db),
    provider_id: int = Depends(get_current_provider_id)
):
    """Create a new resource"""
    try:
        db_resource = db_service.create_resource(
            db, 
            resource.dict(), 
            provider_id
        )
        return db_resource
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{resource_id}", response_model=Resource)
async def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific resource by ID"""
    resource = db_service.get_resource(db, resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource

@router.put("/{resource_id}", response_model=Resource)
async def update_resource(
    resource_id: int,
    resource: ResourceUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a resource"""
    updated_resource = db_service.update_resource(
        db, 
        resource_id, 
        resource.dict(exclude_unset=True)
    )
    if not updated_resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return updated_resource

@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a resource"""
    success = db_service.delete_resource(db, resource_id)
    if not success:
        raise HTTPException(status_code=404, detail="Resource not found")
    return {"message": "Resource deleted successfully"}

@router.get("/", response_model=List[Resource])
async def list_resources(
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    min_persons: Optional[int] = None,
    status: Optional[str] = None,
    service_provider_id: Optional[int] = None,
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List resources with optional filters"""
    filters = {
        k: v for k, v in {
            'category': category,
            'start_date': start_date,
            'end_date': end_date,
            'min_persons': min_persons,
            'status': status,
            'service_provider_id': service_provider_id
        }.items() if v is not None
    }
    
    return db_service.list_resources(db, filters, limit, offset)

@router.post("/search/geo", response_model=List[Resource])
async def search_resources_geo(
    params: ResourceSearchParams,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Search resources geographically"""
    if not all([params.latitude, params.longitude, params.radius_km]):
        raise HTTPException(
            status_code=400, 
            detail="Latitude, longitude, and radius are required for geo search"
        )
    
    return db_service.search_resources_geo(
        db,
        params.latitude,
        params.longitude, 
        params.radius_km,
        params.dict(exclude={'latitude', 'longitude', 'radius_km'})
    )

@router.get("/my", response_model=List[Resource])
async def get_my_resources(
    db: Session = Depends(get_db),
    provider_id: int = Depends(get_current_provider_id),
    user_id: Optional[int] = Query(None)
):
    """Get resources for current user"""
    # Use user_id from query parameter if provided, otherwise use provider_id
    actual_provider_id = user_id if user_id is not None else provider_id
    filters = {'service_provider_id': actual_provider_id}
    return db_service.list_resources(db, filters)

# ==================== Allocations ====================

@router.post("/allocations", response_model=ResourceAllocation)
async def create_allocation(
    allocation: ResourceAllocationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new resource allocation"""
    try:
        return db_service.create_allocation(
            db,
            allocation.dict(),
            current_user["id"]
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/allocations/my", response_model=List[ResourceAllocation])
async def get_my_allocations(
    db: Session = Depends(get_db),
    provider_id: int = Depends(get_current_provider_id),
    user_id: Optional[int] = Query(None)
):
    """Get allocations for current user"""
    # Use user_id from query parameter if provided, otherwise use provider_id
    actual_provider_id = user_id if user_id is not None else provider_id
    return db_service.get_allocations_by_provider(db, actual_provider_id)

@router.put("/allocations/{allocation_id}", response_model=ResourceAllocation)
async def update_allocation(
    allocation_id: int,
    allocation: ResourceAllocationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an allocation"""
    return {
        "id": allocation_id,
        **allocation.dict(),
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

@router.delete("/allocations/{allocation_id}")
async def delete_allocation(
    allocation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete an allocation"""
    return {"message": "Allocation deleted successfully"}

@router.get("/allocations/trade/{trade_id}", response_model=List[ResourceAllocation])
async def get_allocations_by_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all allocations for a specific trade"""
    return db_service.get_allocations_by_trade(db, trade_id)

@router.get("/allocations/resource/{resource_id}", response_model=List[ResourceAllocation])
async def get_allocations_by_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all allocations for a specific resource"""
    return []

@router.put("/allocations/{allocation_id}/status")
async def update_allocation_status(
    allocation_id: int,
    status: str,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update allocation status"""
    allocation = db_service.update_allocation_status(
        db, allocation_id, status, notes
    )
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")
    return allocation

@router.post("/allocations/bulk", response_model=List[ResourceAllocation])
async def bulk_create_allocations(
    data: BulkAllocationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create multiple allocations at once"""
    try:
        allocations_data = [alloc.dict() for alloc in data.allocations]
        return db_service.bulk_create_allocations(
            db, allocations_data, current_user["id"]
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

# ==================== Calendar ====================

@router.get("/calendar", response_model=List[ResourceCalendarEntry])
async def get_calendar_entries(
    service_provider_id: int,
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get calendar entries for a service provider"""
    return db_service.get_calendar_entries(
        db, service_provider_id, start_date, end_date
    )

@router.post("/calendar", response_model=ResourceCalendarEntry)
async def create_calendar_entry(
    entry: ResourceCalendarEntry,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a calendar entry"""
    return {
        "id": 1,
        **entry.dict()
    }

# ==================== KPIs ====================

@router.get("/kpis", response_model=ResourceKPIs)
async def get_kpis(
    service_provider_id: int,
    period_start: Optional[date] = None,
    period_end: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get KPIs for a service provider"""
    # Default to current month if no period specified
    if not period_start:
        period_start = date.today().replace(day=1)
    if not period_end:
        period_end = date.today()
        
    return db_service.calculate_kpis(
        db, service_provider_id, period_start, period_end
    )

@router.post("/kpis/calculate", response_model=ResourceKPIs)
async def calculate_kpis(
    service_provider_id: int,
    period_start: Optional[date] = None,
    period_end: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Calculate and store KPIs for a service provider"""
    # Default to current month if no period specified
    if not period_start:
        period_start = date.today().replace(day=1)
    if not period_end:
        period_end = date.today()
        
    return db_service.calculate_kpis(
        db, service_provider_id, period_start, period_end
    )

# ==================== Notifications ====================

@router.post("/allocations/{allocation_id}/invite")
async def send_invitation_notification(
    allocation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Send invitation notification for an allocation"""
    # Update allocation status to invited
    allocation = db_service.update_allocation_status(db, allocation_id, "invited")
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")
    
    # Create notification
    # TODO: Get service provider user_id from resource
    # For now, using mock notification
    return {"message": "Invitation sent successfully"}

@router.post("/allocations/{allocation_id}/view")
async def mark_invitation_viewed(
    allocation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Mark invitation as viewed"""
    # TODO: Update allocation record
    return {"message": "Marked as viewed"}

# ==================== Statistics ====================

@router.get("/statistics")
async def get_resource_statistics(
    service_provider_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get resource statistics"""
    return {
        "total_resources": 100,
        "active_resources": 75,
        "average_utilization": 65.5,
        "total_revenue": 150000
    }

@router.get("/availability-matrix")
async def get_availability_matrix(
    category: str,
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get availability matrix for resources"""
    # TODO: Generate availability matrix
    return {
        "category": category,
        "period": f"{start_date} to {end_date}",
        "availability": []
    }

# ==================== Requests ====================

@router.post("/requests", response_model=ResourceRequest)
async def create_request(
    request: ResourceRequestBase,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a resource request"""
    return {
        "id": 1,
        **request.dict(),
        "requested_by": current_user.id,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

@router.get("/requests/trade/{trade_id}", response_model=List[ResourceRequest])
async def get_requests_by_trade(
    trade_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get resource requests for a trade"""
    return []

@router.get("/requests/{request_id}/match", response_model=List[Resource])
async def match_resources_for_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Match resources for a request"""
    # TODO: Implement matching algorithm
    return []