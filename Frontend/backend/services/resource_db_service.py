"""
Database Service for Resource Management
Implements actual database operations with SQLite/PostgreSQL compatibility
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from sqlalchemy import create_engine, and_, or_, func, text
from sqlalchemy.orm import Session, sessionmaker, joinedload
from sqlalchemy.exc import SQLAlchemyError
from decimal import Decimal
import json
import logging
from math import radians, cos, sin, asin, sqrt

from ..models.resource_models import (
    Base, Resource, ResourceAllocation, ResourceRequest,
    ResourceCalendarEntry, ResourceKPI, ResourceNotification,
    ServiceProvider
)

logger = logging.getLogger(__name__)

class ResourceDatabaseService:
    """Service for resource database operations"""
    
    def __init__(self, database_url: str):
        """Initialize database service
        
        Args:
            database_url: Database connection string
                - SQLite: sqlite:///path/to/database.db
                - PostgreSQL: postgresql://user:password@localhost/dbname
        """
        self.engine = create_engine(database_url, echo=False)
        self.SessionLocal = sessionmaker(bind=self.engine, autocommit=False, autoflush=False)
        
        # Create tables if they don't exist
        Base.metadata.create_all(bind=self.engine)
        
        # Detect database type
        self.db_type = 'postgresql' if 'postgresql' in database_url else 'sqlite'
        
    def get_session(self) -> Session:
        """Get database session"""
        return self.SessionLocal()
    
    # ==================== Resources CRUD ====================
    
    def create_resource(self, session: Session, resource_data: Dict[str, Any], provider_id: int) -> Resource:
        """Create a new resource"""
        try:
            # Calculate total hours
            days_diff = (resource_data['end_date'] - resource_data['start_date']).days + 1
            total_hours = days_diff * resource_data.get('daily_hours', 8.0) * resource_data['person_count']
            
            resource = Resource(
                service_provider_id=provider_id,
                total_hours=total_hours,
                **resource_data
            )
            
            # Handle JSON fields for SQLite
            if 'skills' in resource_data and isinstance(resource_data['skills'], list):
                resource.skills_list = resource_data['skills']
            if 'equipment' in resource_data and isinstance(resource_data['equipment'], list):
                resource.equipment_list = resource_data['equipment']
            
            session.add(resource)
            session.commit()
            session.refresh(resource)
            
            # Create initial calendar entries
            self._create_calendar_entries(session, resource)
            
            return resource
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error creating resource: {e}")
            raise
    
    def get_resource(self, session: Session, resource_id: int) -> Optional[Resource]:
        """Get resource by ID"""
        return session.query(Resource).filter(Resource.id == resource_id).first()
    
    def update_resource(self, session: Session, resource_id: int, update_data: Dict[str, Any]) -> Optional[Resource]:
        """Update a resource"""
        try:
            resource = self.get_resource(session, resource_id)
            if not resource:
                return None
            
            # Handle special fields
            if 'skills' in update_data and isinstance(update_data['skills'], list):
                resource.skills_list = update_data.pop('skills')
            if 'equipment' in update_data and isinstance(update_data['equipment'], list):
                resource.equipment_list = update_data.pop('equipment')
            
            # Update fields
            for key, value in update_data.items():
                if hasattr(resource, key):
                    setattr(resource, key, value)
            
            # Recalculate total hours if dates or person count changed
            if any(k in update_data for k in ['start_date', 'end_date', 'person_count', 'daily_hours']):
                days_diff = (resource.end_date - resource.start_date).days + 1
                resource.total_hours = days_diff * resource.daily_hours * resource.person_count
                
                # Update calendar entries
                self._update_calendar_entries(session, resource)
            
            resource.updated_at = datetime.utcnow()
            session.commit()
            session.refresh(resource)
            return resource
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error updating resource: {e}")
            raise
    
    def delete_resource(self, session: Session, resource_id: int) -> bool:
        """Delete a resource"""
        try:
            resource = self.get_resource(session, resource_id)
            if not resource:
                return False
            
            session.delete(resource)
            session.commit()
            return True
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error deleting resource: {e}")
            return False
    
    def list_resources(
        self, 
        session: Session,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Resource]:
        """List resources with filters"""
        query = session.query(Resource)
        
        if filters:
            if 'category' in filters:
                query = query.filter(Resource.category == filters['category'])
            if 'status' in filters:
                query = query.filter(Resource.status == filters['status'])
            if 'service_provider_id' in filters:
                query = query.filter(Resource.service_provider_id == filters['service_provider_id'])
            if 'start_date' in filters:
                query = query.filter(Resource.end_date >= filters['start_date'])
            if 'end_date' in filters:
                query = query.filter(Resource.start_date <= filters['end_date'])
            if 'min_persons' in filters:
                query = query.filter(Resource.person_count >= filters['min_persons'])
        
        return query.limit(limit).offset(offset).all()
    
    def search_resources_geo(
        self,
        session: Session,
        latitude: float,
        longitude: float,
        radius_km: float,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Resource]:
        """Search resources geographically"""
        
        # For SQLite, use simple distance calculation
        # For PostgreSQL, you could use PostGIS extensions
        if self.db_type == 'sqlite':
            # Haversine formula for SQLite
            resources = session.query(Resource).filter(
                and_(
                    Resource.latitude.isnot(None),
                    Resource.longitude.isnot(None)
                )
            ).all()
            
            # Filter by distance in Python
            filtered_resources = []
            for resource in resources:
                distance = self._calculate_distance(
                    latitude, longitude,
                    resource.latitude, resource.longitude
                )
                if distance <= radius_km:
                    filtered_resources.append(resource)
            
            return filtered_resources
        else:
            # PostgreSQL with PostGIS would use ST_DWithin
            # For now, using same approach as SQLite
            return self.search_resources_geo_sqlite(session, latitude, longitude, radius_km, filters)
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points using Haversine formula"""
        # Radius of Earth in kilometers
        R = 6371
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        
        return R * c
    
    # ==================== Allocations ====================
    
    def create_allocation(
        self,
        session: Session,
        allocation_data: Dict[str, Any],
        created_by: int
    ) -> ResourceAllocation:
        """Create a resource allocation"""
        try:
            # Verify resource availability
            resource = self.get_resource(session, allocation_data['resource_id'])
            if not resource:
                raise ValueError("Resource not found")
            
            # Check if resource is available for the period
            if not self._check_resource_availability(
                session,
                resource,
                allocation_data['allocated_start_date'],
                allocation_data['allocated_end_date'],
                allocation_data['allocated_person_count']
            ):
                raise ValueError("Resource not available for the specified period")
            
            # Calculate allocated hours
            days = (allocation_data['allocated_end_date'] - allocation_data['allocated_start_date']).days + 1
            allocated_hours = days * resource.daily_hours * allocation_data['allocated_person_count']
            
            allocation = ResourceAllocation(
                allocated_hours=allocated_hours,
                created_by=created_by,
                **allocation_data
            )
            
            session.add(allocation)
            
            # Update resource status if fully allocated
            if allocation.allocation_status in ['accepted', 'confirmed']:
                resource.status = 'allocated'
            
            # Update calendar entries
            self._update_calendar_for_allocation(session, allocation)
            
            session.commit()
            session.refresh(allocation)
            return allocation
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error creating allocation: {e}")
            raise
    
    def update_allocation_status(
        self,
        session: Session,
        allocation_id: int,
        status: str,
        notes: Optional[str] = None
    ) -> Optional[ResourceAllocation]:
        """Update allocation status"""
        try:
            allocation = session.query(ResourceAllocation).filter(
                ResourceAllocation.id == allocation_id
            ).first()
            
            if not allocation:
                return None
            
            allocation.allocation_status = status
            if notes:
                allocation.notes = notes
            
            # Update timestamps based on status
            now = datetime.utcnow()
            if status == 'invited':
                allocation.invitation_sent_at = now
            elif status == 'offer_requested':
                allocation.offer_requested_at = now
            elif status == 'offer_submitted':
                allocation.offer_submitted_at = now
            elif status in ['accepted', 'rejected']:
                allocation.decision_made_at = now
            
            allocation.updated_at = now
            
            # Update resource status
            if status == 'accepted':
                resource = allocation.resource
                resource.status = 'allocated'
            elif status == 'rejected':
                # Check if resource has other allocations
                other_allocations = session.query(ResourceAllocation).filter(
                    and_(
                        ResourceAllocation.resource_id == allocation.resource_id,
                        ResourceAllocation.id != allocation_id,
                        ResourceAllocation.allocation_status == 'accepted'
                    )
                ).count()
                
                if other_allocations == 0:
                    resource = allocation.resource
                    resource.status = 'available'
            
            session.commit()
            session.refresh(allocation)
            return allocation
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error updating allocation status: {e}")
            raise
    
    def get_allocations_by_trade(self, session: Session, trade_id: int) -> List[ResourceAllocation]:
        """Get all allocations for a trade"""
        return session.query(ResourceAllocation).filter(
            ResourceAllocation.trade_id == trade_id
        ).options(joinedload(ResourceAllocation.resource)).all()
    
    def bulk_create_allocations(
        self,
        session: Session,
        allocations_data: List[Dict[str, Any]],
        created_by: int
    ) -> List[ResourceAllocation]:
        """Create multiple allocations"""
        try:
            allocations = []
            for data in allocations_data:
                allocation = self.create_allocation(session, data, created_by)
                allocations.append(allocation)
            
            return allocations
        except Exception as e:
            session.rollback()
            logger.error(f"Error in bulk allocation creation: {e}")
            raise
    
    # ==================== Calendar ====================
    
    def _create_calendar_entries(self, session: Session, resource: Resource):
        """Create calendar entries for a resource"""
        current_date = resource.start_date
        while current_date <= resource.end_date:
            entry = ResourceCalendarEntry(
                resource_id=resource.id,
                service_provider_id=resource.service_provider_id,
                entry_date=current_date,
                person_count=resource.person_count,
                hours_allocated=resource.daily_hours,
                status='available',
                color='#4CAF50',  # Green for available
                label=f"{resource.category} - {resource.person_count} Personen"
            )
            session.add(entry)
            current_date += timedelta(days=1)
    
    def _update_calendar_entries(self, session: Session, resource: Resource):
        """Update calendar entries when resource changes"""
        # Delete old entries
        session.query(ResourceCalendarEntry).filter(
            ResourceCalendarEntry.resource_id == resource.id
        ).delete()
        
        # Create new entries
        self._create_calendar_entries(session, resource)
    
    def _update_calendar_for_allocation(self, session: Session, allocation: ResourceAllocation):
        """Update calendar entries for an allocation"""
        current_date = allocation.allocated_start_date
        while current_date <= allocation.allocated_end_date:
            # Update existing entry or create new one
            entry = session.query(ResourceCalendarEntry).filter(
                and_(
                    ResourceCalendarEntry.resource_id == allocation.resource_id,
                    ResourceCalendarEntry.entry_date == current_date
                )
            ).first()
            
            if entry:
                if allocation.allocation_status in ['accepted', 'confirmed']:
                    entry.status = 'allocated'
                    entry.color = '#FF9800'  # Orange for allocated
                    entry.allocation_id = allocation.id
                elif allocation.allocation_status == 'pre_selected':
                    entry.status = 'tentative'
                    entry.color = '#2196F3'  # Blue for tentative
            
            current_date += timedelta(days=1)
    
    def get_calendar_entries(
        self,
        session: Session,
        provider_id: int,
        start_date: date,
        end_date: date
    ) -> List[ResourceCalendarEntry]:
        """Get calendar entries for a provider"""
        return session.query(ResourceCalendarEntry).filter(
            and_(
                ResourceCalendarEntry.service_provider_id == provider_id,
                ResourceCalendarEntry.entry_date >= start_date,
                ResourceCalendarEntry.entry_date <= end_date
            )
        ).order_by(ResourceCalendarEntry.entry_date).all()
    
    # ==================== KPIs ====================
    
    def calculate_kpis(
        self,
        session: Session,
        provider_id: int,
        period_start: date,
        period_end: date
    ) -> ResourceKPI:
        """Calculate KPIs for a service provider"""
        try:
            # Get resources in period
            resources = session.query(Resource).filter(
                and_(
                    Resource.service_provider_id == provider_id,
                    Resource.start_date <= period_end,
                    Resource.end_date >= period_start
                )
            ).all()
            
            # Calculate metrics
            total_resources_available = len(resources)
            total_resources_allocated = sum(1 for r in resources if r.status == 'allocated')
            total_resources_completed = sum(1 for r in resources if r.status == 'completed')
            
            # Calculate person days
            total_person_days_available = sum(
                r.person_count * ((min(r.end_date, period_end) - max(r.start_date, period_start)).days + 1)
                for r in resources
            )
            
            # Get allocations
            allocations = session.query(ResourceAllocation).join(Resource).filter(
                and_(
                    Resource.service_provider_id == provider_id,
                    ResourceAllocation.allocated_start_date <= period_end,
                    ResourceAllocation.allocated_end_date >= period_start
                )
            ).all()
            
            total_person_days_allocated = sum(
                a.allocated_person_count * (
                    (min(a.allocated_end_date, period_end) - max(a.allocated_start_date, period_start)).days + 1
                )
                for a in allocations if a.allocation_status in ['accepted', 'confirmed']
            )
            
            total_person_days_completed = sum(
                a.allocated_person_count * (
                    (min(a.allocated_end_date, period_end) - max(a.allocated_start_date, period_start)).days + 1
                )
                for a in allocations if a.allocation_status == 'completed'
            )
            
            # Calculate rates
            utilization_rate = (
                (total_person_days_allocated / total_person_days_available * 100)
                if total_person_days_available > 0 else 0
            )
            
            # Calculate financial metrics
            total_revenue = sum(
                float(a.total_cost) for a in allocations
                if a.allocation_status == 'completed' and a.total_cost
            )
            
            total_potential_revenue = sum(
                float(a.total_cost) for a in allocations
                if a.allocation_status in ['accepted', 'confirmed'] and a.total_cost
            )
            
            # Success metrics
            total_invitations_sent = sum(
                1 for a in allocations if a.invitation_sent_at
            )
            total_offers_submitted = sum(
                1 for a in allocations if a.offer_submitted_at
            )
            total_offers_accepted = sum(
                1 for a in allocations if a.allocation_status == 'accepted'
            )
            
            success_rate = (
                (total_offers_accepted / total_offers_submitted * 100)
                if total_offers_submitted > 0 else 0
            )
            
            # Create or update KPI record
            kpi = session.query(ResourceKPI).filter(
                and_(
                    ResourceKPI.service_provider_id == provider_id,
                    ResourceKPI.period_start == period_start,
                    ResourceKPI.period_end == period_end
                )
            ).first()
            
            if not kpi:
                kpi = ResourceKPI(service_provider_id=provider_id)
                session.add(kpi)
            
            kpi.calculation_date = date.today()
            kpi.period_start = period_start
            kpi.period_end = period_end
            kpi.total_resources_available = total_resources_available
            kpi.total_resources_allocated = total_resources_allocated
            kpi.total_resources_completed = total_resources_completed
            kpi.total_person_days_available = total_person_days_available
            kpi.total_person_days_allocated = total_person_days_allocated
            kpi.total_person_days_completed = total_person_days_completed
            kpi.utilization_rate = utilization_rate
            kpi.total_revenue = Decimal(str(total_revenue))
            kpi.total_potential_revenue = Decimal(str(total_potential_revenue))
            kpi.total_invitations_sent = total_invitations_sent
            kpi.total_offers_submitted = total_offers_submitted
            kpi.total_offers_accepted = total_offers_accepted
            kpi.success_rate = success_rate
            
            session.commit()
            session.refresh(kpi)
            return kpi
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error calculating KPIs: {e}")
            raise
    
    # ==================== Helper Methods ====================
    
    def _check_resource_availability(
        self,
        session: Session,
        resource: Resource,
        start_date: date,
        end_date: date,
        person_count: int
    ) -> bool:
        """Check if resource is available for allocation"""
        # Check date range
        if start_date < resource.start_date or end_date > resource.end_date:
            return False
        
        # Check person count
        allocated_persons = session.query(
            func.sum(ResourceAllocation.allocated_person_count)
        ).filter(
            and_(
                ResourceAllocation.resource_id == resource.id,
                ResourceAllocation.allocation_status.in_(['accepted', 'confirmed']),
                ResourceAllocation.allocated_start_date <= end_date,
                ResourceAllocation.allocated_end_date >= start_date
            )
        ).scalar() or 0
        
        available_persons = resource.person_count - allocated_persons
        return available_persons >= person_count
    
    def create_notification(
        self,
        session: Session,
        user_id: int,
        notification_type: str,
        title: str,
        message: str,
        resource_id: Optional[int] = None,
        allocation_id: Optional[int] = None,
        action_url: Optional[str] = None
    ) -> ResourceNotification:
        """Create a notification"""
        try:
            notification = ResourceNotification(
                user_id=user_id,
                notification_type=notification_type,
                title=title,
                message=message,
                resource_id=resource_id,
                allocation_id=allocation_id,
                action_url=action_url
            )
            session.add(notification)
            session.commit()
            session.refresh(notification)
            return notification
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error creating notification: {e}")
            raise