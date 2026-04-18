#!/usr/bin/env python3
"""
Phase 3 Testing Script - Manual Health Data Input
Tests all endpoints and validation on Render production
"""

import requests
import json
from datetime import datetime
import time
import sys

# Configuration
API_BASE = "https://caresynvision-api.onrender.com/api"
TEST_EMAIL = f"testuser_{int(time.time())}@test.com"
TEST_PASSWORD = "TestPass123"
TEST_FIRST_NAME = "Test"
TEST_LAST_NAME = "User"

print("=" * 80)
print("PHASE 3 RENDER TESTING - MANUAL HEALTH DATA INPUT")
print("=" * 80)
print(f"\n🚀 Testing API Base URL: {API_BASE}")
print(f"📧 Test Email: {TEST_EMAIL}\n")

# Test 1: Health Check
print("\n--- TEST 1: Health Check ---")
try:
    response = requests.get(f"{API_BASE}/health", timeout=10)
    print(f"✓ Health endpoint: {response.status_code}")
    print(f"  Response: {response.json()}")
except Exception as e:
    print(f"✗ Health check failed: {e}")
    sys.exit(1)

# Test 2: User Registration
print("\n--- TEST 2: User Registration ---")
token = None
patient_id = None
try:
    response = requests.post(
        f"{API_BASE}/auth/register",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "first_name": TEST_FIRST_NAME,
            "last_name": TEST_LAST_NAME
        },
        timeout=10
    )
    print(f"✓ Registration endpoint: {response.status_code}")
    if response.status_code == 201:
        data = response.json()
        print(f"  Message: {data.get('message')}")
        token = data.get('data', {}).get('token')
        patient_id = data.get('data', {}).get('patient_id')
        print(f"  Patient ID: {patient_id}")
        print(f"  Token: {token[:20]}..." if token else "  No token received")
    else:
        print(f"  Response: {response.json()}")
        sys.exit(1)
except Exception as e:
    print(f"✗ Registration failed: {e}")
    sys.exit(1)

# Test 3: User Login
print("\n--- TEST 3: User Login ---")
try:
    response = requests.post(
        f"{API_BASE}/auth/login",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        },
        timeout=10
    )
    print(f"✓ Login endpoint: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        login_token = data.get('data', {}).get('token')
        login_patient_id = data.get('data', {}).get('patient_id')
        print(f"  Patient ID: {login_patient_id}")
        print(f"  Token: {login_token[:20]}..." if login_token else "  No token received")
    else:
        print(f"  Response: {response.json()}")
        sys.exit(1)
except Exception as e:
    print(f"✗ Login failed: {e}")
    sys.exit(1)

# Test 4: Submit Vital Signs
print("\n--- TEST 4: Submit Vital Signs ---")
headers = {"Authorization": f"Bearer {token}"} if token else {}
vitals_data = {
    "heart_rate": 72,
    "systolic_bp": 120,
    "diastolic_bp": 80,
    "temperature": 98.6,
    "weight": 175.5,
    "notes": "Normal reading taken in morning"
}

try:
    response = requests.post(
        f"{API_BASE}/health/vitals",
        json=vitals_data,
        headers=headers,
        timeout=10
    )
    print(f"✓ Submit vitals endpoint: {response.status_code}")
    if response.status_code == 201:
        data = response.json()
        print(f"  Message: {data.get('message')}")
        record = data.get('record', {})
        print(f"  Record ID: {record.get('record_id')}")
        print(f"  Timestamp: {record.get('timestamp')}")
    else:
        print(f"  Response: {response.json()}")
        sys.exit(1)
except Exception as e:
    print(f"✗ Submit vitals failed: {e}")
    sys.exit(1)

# Test 5: Get Recent Vitals
print("\n--- TEST 5: Get Recent Vitals ---")
try:
    response = requests.get(
        f"{API_BASE}/health/vitals/recent?limit=5",
        headers=headers,
        timeout=10
    )
    print(f"✓ Get recent vitals endpoint: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        count = data.get('count', 0)
        print(f"  Records retrieved: {count}")
        vitals = data.get('vitals', [])
        if vitals:
            for i, vital in enumerate(vitals[:2]):  # Show first 2
                print(f"\n  Record {i+1}:")
                print(f"    HR: {vital['data']['heart_rate']} BPM")
                print(f"    BP: {vital['data']['systolic_bp']}/{vital['data']['diastolic_bp']} mmHg")
                print(f"    Temp: {vital['data']['temperature']}°F")
                print(f"    Weight: {vital['data']['weight']} lbs")
                print(f"    Notes: {vital['data'].get('notes', 'N/A')}")
    else:
        print(f"  Response: {response.json()}")
        sys.exit(1)
except Exception as e:
    print(f"✗ Get recent vitals failed: {e}")
    sys.exit(1)

# Test 6: Validation - Invalid Heart Rate
print("\n--- TEST 6: Validation - Out of Range Value ---")
invalid_vitals = {
    "heart_rate": 300,  # Invalid: too high
    "systolic_bp": 120,
    "diastolic_bp": 80,
    "temperature": 98.6,
    "weight": 175.5
}
try:
    response = requests.post(
        f"{API_BASE}/health/vitals",
        json=invalid_vitals,
        headers=headers,
        timeout=10
    )
    print(f"✓ Validation test endpoint: {response.status_code}")
    if response.status_code != 201:
        print(f"  ✓ Correctly rejected invalid data")
        print(f"  Error: {response.json().get('error', 'Unknown error')}")
    else:
        print(f"  ✗ Should have rejected invalid data!")
        sys.exit(1)
except Exception as e:
    print(f"✗ Validation test failed: {e}")
    sys.exit(1)

# Test 7: Validation - Missing Required Field
print("\n--- TEST 7: Validation - Missing Required Field ---")
missing_field_vitals = {
    "heart_rate": 72,
    "systolic_bp": 120,
    # Missing diastolic_bp
    "temperature": 98.6,
    "weight": 175.5
}
try:
    response = requests.post(
        f"{API_BASE}/health/vitals",
        json=missing_field_vitals,
        headers=headers,
        timeout=10
    )
    print(f"✓ Missing field test endpoint: {response.status_code}")
    if response.status_code != 201:
        print(f"  ✓ Correctly rejected incomplete data")
        print(f"  Error: {response.json().get('error', 'Unknown error')}")
    else:
        print(f"  ✗ Should have rejected incomplete data!")
        sys.exit(1)
except Exception as e:
    print(f"✗ Missing field test failed: {e}")
    sys.exit(1)

# Summary
print("\n" + "=" * 80)
print("✅ PHASE 3 TESTING COMPLETE")
print("=" * 80)
print("\nTest Summary:")
print("✓ Health check endpoint working")
print("✓ User registration endpoint working")
print("✓ User login endpoint working")
print("✓ Vital signs submission endpoint working")
print("✓ Recent vitals retrieval endpoint working")
print("✓ Input validation working (rejects invalid data)")
print("\n✨ All Phase 3 tests passed! Ready for production!")
print("\n📊 Test Account Created:")
print(f"   Email: {TEST_EMAIL}")
print(f"   Password: {TEST_PASSWORD}")
print(f"   Patient ID: {patient_id}")
