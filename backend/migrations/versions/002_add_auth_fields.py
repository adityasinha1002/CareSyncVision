"""Placeholder migration - auth fields already in initial.

Revision ID: 002_add_auth_fields
Revises: 001_initial
Create Date: 2026-04-18 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '002_add_auth_fields'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade():
    # Email, password_hash, and esp32_enabled are already in the initial migration
    # This is a placeholder to maintain migration history
    pass


def downgrade():
    # Placeholder
    pass
