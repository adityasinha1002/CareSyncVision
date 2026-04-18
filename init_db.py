#!/usr/bin/env python
"""
Initialize database with demo user
Run after migrations: FLASK_APP=main python init_db.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app import create_app, db
from backend.app.models.patient_model import Patient

def init_demo_user():
    """Create demo user if it doesn't exist"""
    app = create_app()
    
    with app.app_context():
        # Check if demo user already exists
        demo_user = Patient.query.filter_by(email='demo@example.com').first()
        
        if demo_user:
            print("✅ Demo user already exists")
            return
        
        # Create demo user
        demo_user = Patient(
            email='demo@example.com',
            name='Demo User',
            age=45,
            active=True
        )
        demo_user.set_password('DemoPass123')
        
        try:
            db.session.add(demo_user)
            db.session.commit()
            print(f"✅ Demo user created successfully!")
            print(f"   Email: demo@example.com")
            print(f"   Password: DemoPass123")
            print(f"   Patient ID: {demo_user.patient_id}")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating demo user: {e}")
            return False
    
    return True

if __name__ == '__main__':
    success = init_demo_user()
    sys.exit(0 if success else 1)
