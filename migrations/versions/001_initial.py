"""Initial migration - create all tables.

Revision ID: 001_initial
Revises: 
Create Date: 2026-04-18 11:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create patient table
    op.create_table('patient',
        sa.Column('patient_id', sa.String(36), nullable=False),
        sa.Column('email', sa.String(255), nullable=True, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('medical_conditions', sa.JSON(), nullable=True),
        sa.Column('contact_info', sa.JSON(), nullable=True),
        sa.Column('esp32_enabled', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.PrimaryKeyConstraint('patient_id'),
        sa.Index('ix_patient_email', 'email'),
        sa.UniqueConstraint('email', name='uq_patient_email')
    )

    # Create health_record table
    op.create_table('health_record',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.String(36), nullable=False),
        sa.Column('heart_rate', sa.Integer(), nullable=True),
        sa.Column('blood_pressure_systolic', sa.Integer(), nullable=True),
        sa.Column('blood_pressure_diastolic', sa.Integer(), nullable=True),
        sa.Column('temperature', sa.Float(), nullable=True),
        sa.Column('blood_glucose', sa.Float(), nullable=True),
        sa.Column('respiratory_rate', sa.Integer(), nullable=True),
        sa.Column('oxygen_saturation', sa.Float(), nullable=True),
        sa.Column('weight', sa.Float(), nullable=True),
        sa.Column('height', sa.Float(), nullable=True),
        sa.Column('bmi', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patient.patient_id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Create medication table
    op.create_table('medication',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('dosage', sa.String(100), nullable=False),
        sa.Column('frequency', sa.String(100), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('side_effects', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patient.patient_id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Create session table
    op.create_table('session',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.String(36), nullable=False),
        sa.Column('session_type', sa.String(100), nullable=True),
        sa.Column('start_time', sa.DateTime(), nullable=True),
        sa.Column('end_time', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(50), nullable=True),
        sa.Column('data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patient.patient_id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Create alert table
    op.create_table('alert',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.String(36), nullable=False),
        sa.Column('alert_type', sa.String(100), nullable=False),
        sa.Column('severity', sa.String(50), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('data', sa.JSON(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patient.patient_id']),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('alert')
    op.drop_table('session')
    op.drop_table('medication')
    op.drop_table('health_record')
    op.drop_table('patient')
