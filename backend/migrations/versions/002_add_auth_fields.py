"""Add email, password_hash, and esp32_enabled columns.

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
    # Add email column (unique)
    op.add_column('patient', sa.Column('email', sa.String(255), nullable=True))
    op.create_unique_constraint('uq_patient_email', 'patient', ['email'])
    op.create_index('ix_patient_email', 'patient', ['email'])
    
    # Add password_hash column
    op.add_column('patient', sa.Column('password_hash', sa.String(255), nullable=True))
    
    # Add esp32_enabled column
    op.add_column('patient', sa.Column('esp32_enabled', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade():
    # Drop esp32_enabled column
    op.drop_column('patient', 'esp32_enabled')
    
    # Drop password_hash column
    op.drop_column('patient', 'password_hash')
    
    # Drop email column and related constraints
    op.drop_index('ix_patient_email', table_name='patient')
    op.drop_constraint('uq_patient_email', 'patient', type_='unique')
    op.drop_column('patient', 'email')
