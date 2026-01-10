import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8001/api/v1"

def test_user_sync_and_correction():
    print("=== Testing User Sync & Attendance Correction ===")
    
    # 1. Login as Admin
    print("1. Logging in as Admin...")
    login_url = f"{BASE_URL}/auth/djoser/jwt/create/"
    resp = requests.post(login_url, json={"username": "admin@example.com", "password": "admin123"})
    if resp.status_code != 200:
        print(f"   Login failed: {resp.text}")
        return
    token = resp.json()['access']
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 2. Create New Employee (Should auto-create User)
    print("\n2. Creating New Employee...")
    ts = int(datetime.now().timestamp())
    emp_email = f"testemp{ts}@example.com"
    # IMPORTANT: Structure must match what EmployeeCreateSerializer expects (which we modified to handle nested)
    emp_data = {
        "general": {
            "firstname": "Test",
            "lastname": f"Employee{ts}",
            "emailaddress": emp_email,
            "phonenumber": "1234567890" # Adding fields that might be required
        },
        "job": {
            "jobtitle": "Tester",
            "department": "IT", 
            "status": "Active"
        },
        "payroll": {} # Empty but present
    }
    
    res_create = requests.post(f"{BASE_URL}/employees/", json=emp_data, headers=headers)
    
    if res_create.status_code in [200, 201]:
        # Depending on serializer, it might return 200 or 201
        data = res_create.json()
        emp_id_db = data.get('id')
        print(f"   Employee Created: ID {emp_id_db}, Email {emp_email}")
    else:
        print(f"   Employee Create Failed: {res_create.status_code}")
        print(f"   Response Body: {res_create.text}")
        return

    # 3. Verify User Creation (Try logging in as new user)
    print("\n3. Verifying Auto-User Creation (Login attempt)...")
    # Default password set in signal is "password123"
    res_login_new = requests.post(login_url, json={"username": emp_email, "password": "password123"})
    if res_login_new.status_code == 200:
        print("   SUCCESS: New Employee can log in as User.")
        new_token = res_login_new.json()['access']
        new_headers = {"Authorization": f"Bearer {new_token}", "Content-Type": "application/json"}
    else:
        print(f"   FAIL: New Employee login failed. User not created? {res_login_new.text}")
        return

    # 4. Clock In (as new user)
    print("\n4. New User Clock In...")
    # First get own employee ID
    me_res = requests.get(f"{BASE_URL}/users/me/", headers=new_headers)
    my_emp_id = me_res.json().get('employee_id')
    print(f"   My Employee ID from /users/me/: {my_emp_id}")
    
    res_clock = requests.post(
        f"{BASE_URL}/employees/{my_emp_id}/attendances/clock-in/",
        json={"clock_in_location": "Test Loc"},
        headers=new_headers
    )
    
    att_id = None
    if res_clock.status_code in [200, 201]:
        att_id = res_clock.json().get('attendance_id')
        print(f"   Clock In Successful. Attendance ID: {att_id}")
    elif res_clock.status_code == 400:
         print(f"   Already clocked in. Response: {res_clock.json()}")
         # Search for it
         list_res = requests.get(f"{BASE_URL}/attendances/my/", headers=new_headers)
         if list_res.status_code == 200:
             results = list_res.json().get('results', [])
             if results:
                 att_id = results[0]['id']
                 print(f"   Found existing Attendance ID: {att_id}")
         if not att_id:
             print("   Could not find attendance record to delete.")
             return
    else:
        print(f"   Clock In Failed: {res_clock.text}")
        return

    # 5. Delete Attendance (Correction)
    print(f"\n5. Deleting Attendance Record {att_id}...")
    # Try as Admin
    res_del = requests.delete(f"{BASE_URL}/attendances/{att_id}/", headers=headers)
    
    if res_del.status_code == 204:
        print("   SUCCESS: Attendance record deleted (204 No Content).")
    else:
        print(f"   Delete Failed: {res_del.status_code} - {res_del.text}")
        
    # 6. Verify Deletion
    # Verify via New User's view (should return 404 or empty list)
    res_check = requests.get(f"{BASE_URL}/attendances/{att_id}/", headers=headers)
    if res_check.status_code == 404:
        print("   VERIFIED: Record not found.")
    else:
        print(f"   WARNING: Record still exists? {res_check.status_code}")

if __name__ == "__main__":
    test_user_sync_and_correction()
