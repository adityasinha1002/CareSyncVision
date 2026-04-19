"""Create initial schema from current ORM models.

Revision ID: 001_create_schema
Revises: 
Create Date: 2026-04-18 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '001_create_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create patient table
    op.create_table('patient',
        sa.Column('patient_id', sa.String(36), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('password_hash', sa.String(255), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('medical_conditions', sa.JSON(), nullable=True),
        sa.Column('contact_info', sa.JSON(), nullable=True),
        sa.Column('esp32_enabled', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.PrimaryKeyConstraint('patient_id')
    )
    op.create_index('ix_patient_email', 'patient', ['email'])
    op.create_index('ix_patient_name', 'patient', ['name'])
    op.create_index('ix_patient_created_at', 'patient', ['created_at'])
    op.create_index('ix_patient_active', 'patient', ['active'])

    # Create health_records table
    op.create_table('health_records',
        sa.Column('record_id', sa.String(36), nullable=False),
        sa.Column('patient_id', sa.String(36), nullable=False),
        sa.Column('record_type', sa.String(50), nullable=False),
        sa.Column('image_filename', sa.String(255), nullable=True),
        sa.Column('device_id', sa.String(100), nullable=True),
        sa.Column('session_id', sa.String(100), nullable=True),
        sa.Column('data', sa.JSON(), nullable=True),
        sa.Column('analysis_result', sa.JSON(), nullable=True),
        sa.Column('risk_score', sa.Float(), nullable=True, server_default=sa.text('0.0')),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patient.patient_id']),
        sa.PrimaryKeyConstraint('record_id')
    )
    op.create_index('ix_health_records_patient_id', 'health_records', ['patient_id'])
    op.create_index('ix_health_records_device_id', 'health_records', ['device_id'])
    op.create_index('ix_health_records_risk_score', 'health_records', ['risk_score'])
    op.create_index('ix_health_records_timestamp', 'health_records', ['timestamp'])

    # Create medications table
    op.create_table('medications',
        sa.Column('med_id', sa.String(36), nullable=False),
        sa.Column('patient_id', sa.String(36), nullable=False),
        sa.Column('medication_name', sa.String(255), nullable=False),
        sa.Column('dosage', sa.String(100), nullable=True),
        sa.Column('frequency', sa.String(100), nullable=True),
        sa.Column('scheduled_time', sa.Time(), nullable=True),
        sa.Column('administered', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('administered_time', sa.DateTime(), nullable=True),
        sa.Column('last_taken', sa.DateTime(), nullable=True),
        sa.Column('adherence_status', sa.String(50), nullable=True, server_default=sa.text("'pending'")),
        sa.Column('notes', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patient.patient_id']),
        sa.PrimaryKeyConstraint('med_id')
    )
    op.create_index('ix_medications_patient_id', 'medications', ['patient_id'])
    op.create_index('ix_medications_medication_name', 'medications', ['medication_name'])
    op.create_index('ix_medications_administered', 'medications', ['administered'])

    # Create sessions table
    op.create_table('sessions',
        sa.Column('session_id', sa.String(100), nullable=False),
        sa.Column('patient_id', sa.String(36), nullable=False),
        sa.Column('device_id', sa.String(100), nullable=True),
        sa.Column('authenticated', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('last_activity', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patient.patient_id']),
        sa.PrimaryKeyConstraint('session_id')
    )
    op.create_index('ix_sessions_patient_id', 'sessions', ['patient_id'])
    op.create_index('ix_sessions_started_at', 'sessions', ['started_at'])

    # Create alerts table
    op.create_table('alerts',
        sa.Column('alert_id', sa.String(36), nullable=False),
        sa.Column('patient_id', sa.String(36), nullable=False),
        sa.Column('alert_type', sa.String(50), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('message', sa.String(500), nullable=False),
        sa.Column('acknowledged', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('acknowledged_at', sa.DateTime(), nullable=True),
        sa.Column('acknowledged_by', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['patient_id'], ['patient.patient_id']),
        sa.PrimaryKeyConstraint('alert_id')
    )
    op.create_index('ix_alerts_patient_id', 'alerts', ['patient_id'])
    op.create_index('ix_alerts_alert_type', 'alerts', ['alert_type'])
    op.create_index('ix_alerts_severity', 'alerts', ['severity'])
    op.create_index('ix_alerts_acknowledged', 'alerts', ['acknowledged'])
    op.create_index('ix_alerts_created_at', 'alerts', ['created_at'])


def downgrade():
    # Drop all tables in reverse order (due to foreign keys)
    op.drop_index('ix_medications_administered', table_name='medications')
    op.drop_table('alerts')
    op.drop_table('sessions')
    op.drop_table('medications')
    op.drop_table('health_records')
    op.drop_table('patient')
