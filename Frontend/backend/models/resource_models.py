"""
SQLAlchemy Models for Resource Management System
Compatible with both SQLite (development) and PostgreSQL (production)
"""

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, Boolean, 
    ForeignKey, Text, DECIMAL, Index, UniqueConstraint, CheckConstraint,
    JSON, func
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, backref
from sqlalchemy.dialects import postgresql
from datetime import datetime
import json

Base = declarative_base()

# Helper for JSON field that works with both SQLite and PostgreSQL
def get_json_field():
    """Returns JSON field type compatible with current database"""
    return JSON().with_variant(
        postgresql.JSON(astext_type=Text()),
        'postgresql'
    ).with_variant(
        Text(),
        'sqlite'
    )

class ServiceProvider(Base):
    """Service Provider model - extends existing user model"""
    __tablename__ = 'service_providers_extended'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False, unique=True)
    company_name = Column(String(255))
    company_type = Column(String(100))
    tax_id = Column(String(50))
    trade_license = Column(String(100))
    
    # Relationships
    resources = relationship("Resource", back_populates="provider", cascade="all, delete-orphan")
    resource_kpis = relationship("ResourceKPI", back_populates="provider", cascade="all, delete-orphan")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Resource(Base):
    """Resource model - represents available resources from service providers"""
    __tablename__ = 'resources'
    
    id = Column(Integer, primary_key=True)
    service_provider_id = Column(Integer, ForeignKey('service_providers_extended.id'), nullable=False)
    project_id = Column(Integer, nullable=True)
    
    # Time period
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Resource details
    person_count = Column(Integer, nullable=False)
    daily_hours = Column(Float, default=8.0)
    total_hours = Column(Float)
    
    # Category and type
    category = Column(String(100), nullable=False)
    subcategory = Column(String(100))
    
    # Location
    address_street = Column(String(255))
    address_city = Column(String(100))
    address_postal_code = Column(String(20))
    address_country = Column(String(100), default='Deutschland')
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Status and visibility
    status = Column(String(50), default='available')  # available, allocated, completed, cancelled
    visibility = Column(String(20), default='public')  # public, private, restricted
    
    # Pricing
    hourly_rate = Column(DECIMAL(10, 2))
    daily_rate = Column(DECIMAL(10, 2))
    currency = Column(String(3), default='EUR')
    
    # Additional info - JSON for SQLite compatibility
    description = Column(Text)
    skills = Column(Text)  # JSON array stored as text
    equipment = Column(Text)  # JSON array stored as text
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    provider = relationship("ServiceProvider", back_populates="resources")
    allocations = relationship("ResourceAllocation", back_populates="resource", cascade="all, delete-orphan")
    calendar_entries = relationship("ResourceCalendarEntry", back_populates="resource", cascade="all, delete-orphan")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_resource_provider', 'service_provider_id'),
        Index('idx_resource_dates', 'start_date', 'end_date'),
        Index('idx_resource_category', 'category'),
        Index('idx_resource_status', 'status'),
        Index('idx_resource_location', 'latitude', 'longitude'),
        CheckConstraint('end_date >= start_date', name='check_dates'),
        CheckConstraint('person_count > 0', name='check_person_count'),
    )
    
    @property
    def skills_list(self):
        """Get skills as list"""
        if self.skills:
            try:
                return json.loads(self.skills)
            except:
                return []
        return []
    
    @skills_list.setter
    def skills_list(self, value):
        """Set skills from list"""
        if value:
            self.skills = json.dumps(value)
        else:
            self.skills = '[]'
    
    @property
    def equipment_list(self):
        """Get equipment as list"""
        if self.equipment:
            try:
                return json.loads(self.equipment)
            except:
                return []
        return []
    
    @equipment_list.setter
    def equipment_list(self, value):
        """Set equipment from list"""
        if value:
            self.equipment = json.dumps(value)
        else:
            self.equipment = '[]'


class ResourceAllocation(Base):
    """Resource allocation to trades/projects"""
    __tablename__ = 'resource_allocations'
    
    id = Column(Integer, primary_key=True)
    resource_id = Column(Integer, ForeignKey('resources.id'), nullable=False)
    trade_id = Column(Integer, nullable=False)
    quote_id = Column(Integer)
    
    # Allocation details
    allocated_person_count = Column(Integer, nullable=False)
    allocated_start_date = Column(Date, nullable=False)
    allocated_end_date = Column(Date, nullable=False)
    allocated_hours = Column(Float)
    
    # Status tracking
    allocation_status = Column(String(50), default='pre_selected')
    # pre_selected, invited, offer_requested, offer_submitted, accepted, rejected, completed
    
    # Pricing
    agreed_hourly_rate = Column(DECIMAL(10, 2))
    agreed_daily_rate = Column(DECIMAL(10, 2))
    total_cost = Column(DECIMAL(12, 2))
    
    # Workflow timestamps
    invitation_sent_at = Column(DateTime)
    invitation_viewed_at = Column(DateTime)
    offer_requested_at = Column(DateTime)
    offer_submitted_at = Column(DateTime)
    decision_made_at = Column(DateTime)
    
    # Additional info
    notes = Column(Text)
    rejection_reason = Column(Text)
    priority = Column(Integer, default=0)
    
    # Metadata
    created_by = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    resource = relationship("Resource", back_populates="allocations")
    
    __table_args__ = (
        Index('idx_allocation_resource', 'resource_id'),
        Index('idx_allocation_trade', 'trade_id'),
        Index('idx_allocation_status', 'allocation_status'),
        Index('idx_allocation_dates', 'allocated_start_date', 'allocated_end_date'),
        CheckConstraint('allocated_end_date >= allocated_start_date', name='check_allocation_dates'),
        CheckConstraint('allocated_person_count > 0', name='check_allocation_persons'),
    )


class ResourceRequest(Base):
    """Resource requests from builders"""
    __tablename__ = 'resource_requests'
    
    id = Column(Integer, primary_key=True)
    trade_id = Column(Integer, nullable=False)
    requested_by = Column(Integer, nullable=False)
    
    # Request criteria
    category = Column(String(100), nullable=False)
    subcategory = Column(String(100))
    required_person_count = Column(Integer, nullable=False)
    required_start_date = Column(Date, nullable=False)
    required_end_date = Column(Date, nullable=False)
    
    # Location requirements
    location_address = Column(String(255))
    location_city = Column(String(100))
    location_postal_code = Column(String(20))
    location_latitude = Column(Float)
    location_longitude = Column(Float)
    max_distance_km = Column(Float)
    
    # Budget constraints
    max_hourly_rate = Column(DECIMAL(10, 2))
    max_total_budget = Column(DECIMAL(12, 2))
    
    # Requirements - JSON for SQLite compatibility
    required_skills = Column(Text)  # JSON array
    required_equipment = Column(Text)  # JSON array
    requirements_description = Column(Text)
    
    # Status tracking
    status = Column(String(50), default='open')  # open, searching, fulfilled, cancelled
    deadline_at = Column(DateTime)
    
    # Statistics
    total_resources_found = Column(Integer, default=0)
    total_resources_selected = Column(Integer, default=0)
    total_offers_received = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_request_trade', 'trade_id'),
        Index('idx_request_category', 'category'),
        Index('idx_request_status', 'status'),
        Index('idx_request_dates', 'required_start_date', 'required_end_date'),
        CheckConstraint('required_end_date >= required_start_date', name='check_request_dates'),
    )


class ResourceCalendarEntry(Base):
    """Calendar entries for resource planning"""
    __tablename__ = 'resource_calendar_entries'
    
    id = Column(Integer, primary_key=True)
    resource_id = Column(Integer, ForeignKey('resources.id'))
    allocation_id = Column(Integer, ForeignKey('resource_allocations.id'))
    service_provider_id = Column(Integer, ForeignKey('service_providers_extended.id'), nullable=False)
    
    # Calendar data
    entry_date = Column(Date, nullable=False)
    person_count = Column(Integer, nullable=False)
    hours_allocated = Column(Float)
    
    # Display properties
    status = Column(String(50), default='available')
    color = Column(String(7))  # HEX color
    label = Column(String(255))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    resource = relationship("Resource", back_populates="calendar_entries")
    
    __table_args__ = (
        Index('idx_calendar_date', 'entry_date'),
        Index('idx_calendar_provider', 'service_provider_id'),
        Index('idx_calendar_resource', 'resource_id'),
        UniqueConstraint('resource_id', 'entry_date', name='unique_resource_date'),
    )


class ResourceKPI(Base):
    """KPIs for resource management"""
    __tablename__ = 'resource_kpis'
    
    id = Column(Integer, primary_key=True)
    service_provider_id = Column(Integer, ForeignKey('service_providers_extended.id'), nullable=False)
    
    # KPI period
    calculation_date = Column(Date, default=func.current_date())
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    
    # Resource metrics
    total_resources_available = Column(Integer, default=0)
    total_resources_allocated = Column(Integer, default=0)
    total_resources_completed = Column(Integer, default=0)
    
    # Capacity metrics
    total_person_days_available = Column(Float, default=0)
    total_person_days_allocated = Column(Float, default=0)
    total_person_days_completed = Column(Float, default=0)
    
    # Performance metrics
    utilization_rate = Column(Float)  # percentage
    average_hourly_rate = Column(Float)
    average_daily_rate = Column(Float)
    
    # Financial metrics
    total_revenue = Column(DECIMAL(12, 2))
    total_potential_revenue = Column(DECIMAL(12, 2))
    
    # Success metrics
    total_invitations_sent = Column(Integer, default=0)
    total_offers_submitted = Column(Integer, default=0)
    total_offers_accepted = Column(Integer, default=0)
    success_rate = Column(Float)  # percentage
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    provider = relationship("ServiceProvider", back_populates="resource_kpis")
    
    __table_args__ = (
        Index('idx_kpi_provider', 'service_provider_id'),
        Index('idx_kpi_date', 'calculation_date'),
        Index('idx_kpi_period', 'period_start', 'period_end'),
        UniqueConstraint('service_provider_id', 'calculation_date', 'period_start', 'period_end', 
                        name='unique_provider_period'),
    )


class ResourceNotification(Base):
    """Notifications for resource management"""
    __tablename__ = 'resource_notifications'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    resource_id = Column(Integer, ForeignKey('resources.id'))
    allocation_id = Column(Integer, ForeignKey('resource_allocations.id'))
    
    # Notification details
    notification_type = Column(String(50), nullable=False)
    # invitation, offer_request, offer_submitted, allocation_confirmed, allocation_rejected, reminder
    
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Status
    is_read = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    
    # Action links
    action_url = Column(String(500))
    action_label = Column(String(100))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime)
    
    __table_args__ = (
        Index('idx_notification_user', 'user_id'),
        Index('idx_notification_type', 'notification_type'),
        Index('idx_notification_read', 'is_read'),
        Index('idx_notification_created', 'created_at'),
    )