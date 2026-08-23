"""create core schema tables

Revision ID: 0002_create_core_tables
Revises: 0001_initial_empty
Create Date: 2026-08-23 23:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = '0002_create_core_tables'
down_revision: Union[str, None] = '0001_initial_empty'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.Text(), nullable=False),
        sa.Column('role', sa.String(20), nullable=False, server_default='candidate'),
        sa.Column('first_name', sa.String(50), nullable=False),
        sa.Column('last_name', sa.String(50), nullable=False),
        sa.Column('mobile', sa.String(20), nullable=False),
        sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_role', 'users', ['role'])

    # 2. candidate_profiles table
    op.create_table(
        'candidate_profiles',
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('gender', sa.String(20), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=True),
        sa.Column('current_location', sa.String(120), nullable=True),
        sa.Column('current_company', sa.String(120), nullable=True),
        sa.Column('notice_period', sa.String(20), nullable=True),
        sa.Column('current_address', sa.Text(), nullable=True),
        sa.Column('photo_key', sa.Text(), nullable=True),
        sa.Column('is_fresher', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('total_experience_years', sa.Numeric(4, 1), nullable=False, server_default='0.0'),
    )

    # 3. educations table
    op.create_table(
        'educations',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('degree', sa.String(120), nullable=False),
        sa.Column('specialization', sa.String(120), nullable=True),
        sa.Column('institution', sa.String(200), nullable=False),
        sa.Column('year_of_passing', sa.Integer(), nullable=False),
        sa.Column('grade', sa.String(40), nullable=True),
        sa.Column('education_level', sa.String(30), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
    )
    op.create_index('ix_educations_user_id', 'educations', ['user_id'])

    # 4. experiences table
    op.create_table(
        'experiences',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('employer', sa.String(200), nullable=False),
        sa.Column('job_title', sa.String(200), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('is_current', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('responsibilities', sa.String(1000), nullable=True),
    )
    op.create_index('ix_experiences_user_id', 'experiences', ['user_id'])

    # 5. requisitions table
    op.create_table(
        'requisitions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('requisition_code', sa.String(20), nullable=False),
        sa.Column('slug', sa.String(160), nullable=False),
        sa.Column('title', sa.String(100), nullable=False),
        sa.Column('department', sa.String(80), nullable=False),
        sa.Column('location', sa.String(120), nullable=False),
        sa.Column('employment_type', sa.String(30), nullable=False),
        sa.Column('experience_range', sa.String(40), nullable=False),
        sa.Column('openings', sa.Integer(), nullable=False),
        sa.Column('hiring_manager', sa.String(120), nullable=False),
        sa.Column('description_html', sa.Text(), nullable=False),
        sa.Column('max_salary_budget', sa.Numeric(12, 2), nullable=True),
        sa.Column('hiring_complete_by', sa.Date(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('posted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('openings > 0', name='ck_requisitions_openings_positive'),
    )
    op.create_index('ix_requisitions_requisition_code', 'requisitions', ['requisition_code'], unique=True)
    op.create_index('ix_requisitions_slug', 'requisitions', ['slug'], unique=True)
    op.create_index('ix_requisitions_status', 'requisitions', ['status'])
    op.create_index('ix_requisitions_status_posted_at', 'requisitions', ['status', sa.text('posted_at DESC')])

    # 6. applications table
    op.create_table(
        'applications',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('application_code', sa.String(20), nullable=False),
        sa.Column('requisition_id', UUID(as_uuid=True), sa.ForeignKey('requisitions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('candidate_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('cover_note', sa.Text(), nullable=True),
        sa.Column('resume_key', sa.Text(), nullable=True),
        sa.Column('resume_filename', sa.String(255), nullable=True),
        sa.Column('resume_content_type', sa.String(80), nullable=True),
        sa.Column('consent_accuracy', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('consent_privacy', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('snapshot_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('candidate_id', 'requisition_id', name='uq_candidate_requisition'),
    )
    op.create_index('ix_applications_application_code', 'applications', ['application_code'], unique=True)
    op.create_index('ix_applications_requisition_id', 'applications', ['requisition_id'])
    op.create_index('ix_applications_candidate_id', 'applications', ['candidate_id'])
    op.create_index('ix_applications_status', 'applications', ['status'])
    op.create_index('ix_applications_req_submitted', 'applications', ['requisition_id', sa.text('submitted_at DESC')])

    # 7. notifications table
    op.create_table(
        'notifications',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', sa.String(30), nullable=False, server_default='new_application'),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('requisition_id', UUID(as_uuid=True), sa.ForeignKey('requisitions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('application_id', UUID(as_uuid=True), sa.ForeignKey('applications.id', ondelete='SET NULL'), nullable=True),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_user_read_created', 'notifications', ['user_id', 'read_at', sa.text('created_at DESC')])

    # 8. password_reset_tokens table
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token_hash', sa.Text(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_password_reset_tokens_user_id', 'password_reset_tokens', ['user_id'])
    op.create_index('ix_password_reset_tokens_token_hash', 'password_reset_tokens', ['token_hash'], unique=True)


def downgrade() -> None:
    op.drop_table('password_reset_tokens')
    op.drop_table('notifications')
    op.drop_table('applications')
    op.drop_table('requisitions')
    op.drop_table('experiences')
    op.drop_table('educations')
    op.drop_table('candidate_profiles')
    op.drop_table('users')
