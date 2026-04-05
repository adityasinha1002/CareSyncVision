"""
Database Models and initialization
Uses SQLAlchemy ORM for database operations
"""

from datetime import datetime
from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

Base = declarative_base()


class Patient(Base):
    """Patient information table"""
    __tablename__ = 'patients'
    
    patient_id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    age = Column(Integer)
    medical_conditions = Column(JSON, default=[])
    contact_info = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    active = Column(Boolean, default=True)
    
    # Relationships
    health_records = relationship('HealthRecord', back_populates='patient', cascade='all, delete')
    medications = relationship('Medication', back_populates='patient', cascade='all, delete')
    sessions = relationship('Session', back_populates='patient', cascade='all, delete')
    alerts = relationship('Alert', back_populates='patient', cascade='all, delete')


class HealthRecord(Base):
    """Patient health data records"""
    __tablename__ = 'health_records'
    
    record_id = Column(String(36), primary_key=True)
    patient_id = Column(String(36), ForeignKey('patients.patient_id'), nullable=False)
    record_type = Column(String(50), nullable=False)  # 'image', 'vital', 'behavioral'
    image_filename = Column(String(255))
    device_id = Column(String(100))
    session_id = Column(String(100))
    data = Column(JSON)
    
    # Analysis results
    analysis_result = Column(JSON)
    risk_score = Column(Float, default=0.0)
    
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationship
    patient = relationship('Patient', back_populates='health_records')


class Medication(Base):
    """Medication schedule and administration"""
    __tablename__ = 'medications'
    
    med_id = Column(String(36), primary_key=True)
    patient_id = Column(String(36), ForeignKey('patients.patient_id'), nullable=False)
    medication_name = Column(String(255), nullable=False)
    dosage = Column(String(100))
    scheduled_time = Column(DateTime)
    
    # Administration tracking
    administered = Column(Boolean, default=False)
    administered_time = Column(DateTime)
    notes = Column(String(500))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    patient = relationship('Patient', back_populates='medications')


class Session(Base):
    """Patient authentication sessions"""
    __tablename__ = 'sessions'
    
    session_id = Column(String(100), primary_key=True)
    patient_id = Column(String(36), ForeignKey('patients.patient_id'), nullable=False)
    device_id = Column(String(100))
    authenticated = Column(Boolean, default=False)
    started_at = Column(DateTime, default=datetime.utcnow, index=True)
    ended_at = Column(DateTime)
    last_activity = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    patient = relationship('Patient', back_populates='sessions')


class Alert(Base):
    """System alerts and notifications"""
    __tablename__ = 'alerts'
    
    alert_id = Column(String(36), primary_key=True)
    patient_id = Column(String(36), ForeignKey('patients.patient_id'), nullable=False)
    alert_type = Column(String(50), nullable=False)  # 'health', 'medication', 'behavioral', 'system'
    severity = Column(String(20), nullable=False)  # 'low', 'medium', 'high', 'critical'
    message = Column(String(500), nullable=False)
    
    acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime)
    acknowledged_by = Column(String(100))
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationship
    patient = relationship('Patient', back_populates='alerts')


def init_db(database_url='postgresql://user:password@localhost/caresynvision'):
    """
    Initialize database with schema
    
    Args:
        database_url: PostgreSQL connection string
    """
    engine = create_engine(database_url, echo=False)
    Base.metadata.create_all(engine)
    return engine


def get_session(engine):
    """Get database session"""
    Session = sessionmaker(bind=engine)
    return Session()
