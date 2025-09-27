"""
Create resource management tables

Revision ID: 001
Create Date: 2024-01-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    """Create resource management tables"""
    
    # Service Providers Extended
    op.create_table(
        'service_providers_extended',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('company_name', sa.String(255), nullable=True),
        sa.Column('company_type', sa.String(100), nullable=True),
        sa.Column('tax_id', sa.String(50), nullable=True),
        sa.Column('trade_license', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    
    # Resources
    op.create_table(
        'resources',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('service_provider_id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('person_count', sa.Integer(), nullable=False),
        sa.Column('daily_hours', sa.Float(), nullable=True),
        sa.Column('total_hours', sa.Float(), nullable=True),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('subcategory', sa.String(100), nullable=True),
        sa.Column('address_street', sa.String(255), nullable=True),
        sa.Column('address_city', sa.String(100), nullable=True),
        sa.Column('address_postal_code', sa.String(20), nullable=True),
        sa.Column('address_country', sa.String(100), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('status', sa.String(50), nullable=True),
        sa.Column('visibility', sa.String(20), nullable=True),
        sa.Column('hourly_rate', sa.DECIMAL(10, 2), nullable=True),
        sa.Column('daily_rate', sa.DECIMAL(10, 2), nullable=True),
        sa.Column('currency', sa.String(3), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('skills', sa.Text(), nullable=True),
        sa.Column('equipment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['service_provider_id'], ['service_providers_extended.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('end_date >= start_date', name='check_dates'),
        sa.CheckConstraint('person_count > 0', name='check_person_count')
    )
    
    # Create indexes for resources
    op.create_index('idx_resource_provider', 'resources', ['service_provider_id'])
    op.create_index('idx_resource_dates', 'resources', ['start_date', 'end_date'])
    op.create_index('idx_resource_category', 'resources', ['category'])
    op.create_index('idx_resource_status', 'resources', ['status'])
    op.create_index('idx_resource_location', 'resources', ['latitude', 'longitude'])
    
    # Resource Allocations
    op.create_table(
        'resource_allocations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('resource_id', sa.Integer(), nullable=False),
        sa.Column('trade_id', sa.Integer(), nullable=False),
        sa.Column('quote_id', sa.Integer(), nullable=True),
        sa.Column('allocated_person_count', sa.Integer(), nullable=False),
        sa.Column('allocated_start_date', sa.Date(), nullable=False),
        sa.Column('allocated_end_date', sa.Date(), nullable=False),
        sa.Column('allocated_hours', sa.Float(), nullable=True),
        sa.Column('allocation_status', sa.String(50), nullable=True),
        sa.Column('agreed_hourly_rate', sa.DECIMAL(10, 2), nullable=True),
        sa.Column('agreed_daily_rate', sa.DECIMAL(10, 2), nullable=True),
        sa.Column('total_cost', sa.DECIMAL(12, 2), nullable=True),
        sa.Column('invitation_sent_at', sa.DateTime(), nullable=True),
        sa.Column('invitation_viewed_at', sa.DateTime(), nullable=True),
        sa.Column('offer_requested_at', sa.DateTime(), nullable=True),
        sa.Column('offer_submitted_at', sa.DateTime(), nullable=True),
        sa.Column('decision_made_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['resource_id'], ['resources.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('allocated_end_date >= allocated_start_date', name='check_allocation_dates'),
        sa.CheckConstraint('allocated_person_count > 0', name='check_allocation_persons')
    )
    
    # Create indexes for allocations
    op.create_index('idx_allocation_resource', 'resource_allocations', ['resource_id'])
    op.create_index('idx_allocation_trade', 'resource_allocations', ['trade_id'])
    op.create_index('idx_allocation_status', 'resource_allocations', ['allocation_status'])
    op.create_index('idx_allocation_dates', 'resource_allocations', ['allocated_start_date', 'allocated_end_date'])
    
    # Resource Requests
    op.create_table(
        'resource_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('trade_id', sa.Integer(), nullable=False),
        sa.Column('requested_by', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('subcategory', sa.String(100), nullable=True),
        sa.Column('required_person_count', sa.Integer(), nullable=False),
        sa.Column('required_start_date', sa.Date(), nullable=False),
        sa.Column('required_end_date', sa.Date(), nullable=False),
        sa.Column('location_address', sa.String(255), nullable=True),
        sa.Column('location_city', sa.String(100), nullable=True),
        sa.Column('location_postal_code', sa.String(20), nullable=True),
        sa.Column('location_latitude', sa.Float(), nullable=True),
        sa.Column('location_longitude', sa.Float(), nullable=True),
        sa.Column('max_distance_km', sa.Float(), nullable=True),
        sa.Column('max_hourly_rate', sa.DECIMAL(10, 2), nullable=True),
        sa.Column('max_total_budget', sa.DECIMAL(12, 2), nullable=True),
        sa.Column('required_skills', sa.Text(), nullable=True),
        sa.Column('required_equipment', sa.Text(), nullable=True),
        sa.Column('requirements_description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(50), nullable=True),
        sa.Column('deadline_at', sa.DateTime(), nullable=True),
        sa.Column('total_resources_found', sa.Integer(), nullable=True),
        sa.Column('total_resources_selected', sa.Integer(), nullable=True),
        sa.Column('total_offers_received', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('required_end_date >= required_start_date', name='check_request_dates')
    )
    
    # Create indexes for requests
    op.create_index('idx_request_trade', 'resource_requests', ['trade_id'])
    op.create_index('idx_request_category', 'resource_requests', ['category'])
    op.create_index('idx_request_status', 'resource_requests', ['status'])
    op.create_index('idx_request_dates', 'resource_requests', ['required_start_date', 'required_end_date'])
    
    # Resource Calendar Entries
    op.create_table(
        'resource_calendar_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('resource_id', sa.Integer(), nullable=True),
        sa.Column('allocation_id', sa.Integer(), nullable=True),
        sa.Column('service_provider_id', sa.Integer(), nullable=False),
        sa.Column('entry_date', sa.Date(), nullable=False),
        sa.Column('person_count', sa.Integer(), nullable=False),
        sa.Column('hours_allocated', sa.Float(), nullable=True),
        sa.Column('status', sa.String(50), nullable=True),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('label', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['allocation_id'], ['resource_allocations.id'], ),
        sa.ForeignKeyConstraint(['resource_id'], ['resources.id'], ),
        sa.ForeignKeyConstraint(['service_provider_id'], ['service_providers_extended.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('resource_id', 'entry_date', name='unique_resource_date')
    )
    
    # Create indexes for calendar
    op.create_index('idx_calendar_date', 'resource_calendar_entries', ['entry_date'])
    op.create_index('idx_calendar_provider', 'resource_calendar_entries', ['service_provider_id'])
    op.create_index('idx_calendar_resource', 'resource_calendar_entries', ['resource_id'])
    
    # Resource KPIs
    op.create_table(
        'resource_kpis',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('service_provider_id', sa.Integer(), nullable=False),
        sa.Column('calculation_date', sa.Date(), nullable=True),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('total_resources_available', sa.Integer(), nullable=True),
        sa.Column('total_resources_allocated', sa.Integer(), nullable=True),
        sa.Column('total_resources_completed', sa.Integer(), nullable=True),
        sa.Column('total_person_days_available', sa.Float(), nullable=True),
        sa.Column('total_person_days_allocated', sa.Float(), nullable=True),
        sa.Column('total_person_days_completed', sa.Float(), nullable=True),
        sa.Column('utilization_rate', sa.Float(), nullable=True),
        sa.Column('average_hourly_rate', sa.Float(), nullable=True),
        sa.Column('average_daily_rate', sa.Float(), nullable=True),
        sa.Column('total_revenue', sa.DECIMAL(12, 2), nullable=True),
        sa.Column('total_potential_revenue', sa.DECIMAL(12, 2), nullable=True),
        sa.Column('total_invitations_sent', sa.Integer(), nullable=True),
        sa.Column('total_offers_submitted', sa.Integer(), nullable=True),
        sa.Column('total_offers_accepted', sa.Integer(), nullable=True),
        sa.Column('success_rate', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['service_provider_id'], ['service_providers_extended.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('service_provider_id', 'calculation_date', 'period_start', 'period_end', name='unique_provider_period')
    )
    
    # Create indexes for KPIs
    op.create_index('idx_kpi_provider', 'resource_kpis', ['service_provider_id'])
    op.create_index('idx_kpi_date', 'resource_kpis', ['calculation_date'])
    op.create_index('idx_kpi_period', 'resource_kpis', ['period_start', 'period_end'])
    
    # Resource Notifications
    op.create_table(
        'resource_notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('resource_id', sa.Integer(), nullable=True),
        sa.Column('allocation_id', sa.Integer(), nullable=True),
        sa.Column('notification_type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=True),
        sa.Column('is_archived', sa.Boolean(), nullable=True),
        sa.Column('action_url', sa.String(500), nullable=True),
        sa.Column('action_label', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['allocation_id'], ['resource_allocations.id'], ),
        sa.ForeignKeyConstraint(['resource_id'], ['resources.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for notifications
    op.create_index('idx_notification_user', 'resource_notifications', ['user_id'])
    op.create_index('idx_notification_type', 'resource_notifications', ['notification_type'])
    op.create_index('idx_notification_read', 'resource_notifications', ['is_read'])
    op.create_index('idx_notification_created', 'resource_notifications', ['created_at'])

def downgrade():
    """Drop resource management tables"""
    op.drop_table('resource_notifications')
    op.drop_table('resource_kpis')
    op.drop_table('resource_calendar_entries')
    op.drop_table('resource_requests')
    op.drop_table('resource_allocations')
    op.drop_table('resources')
    op.drop_table('service_providers_extended')