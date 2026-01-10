import requests
import json
import time

BASE_URL = "http://localhost:8001/api/v1"

def test_today_endpoint():
    print("=== Testing 'Today' Attendance Endpoint ===")
    
    # 1. Login
    login_url = f"{BASE_URL}/auth/djoser/jwt/create/"
    data = {"username": "admin@example.com", "password": "admin123"}
    headers = {"Content-Type": "application/json"}
    
    print("1. Logging in...")
    response = requests.post(login_url, json=data, headers=headers)
    if response.status_code != 200:
        print(f"Login Failed: {response.text}")
        return
    
    access_token = response.json()['access']
    json_headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    
    # 2. Get User ID
    res_me = requests.get(f"{BASE_URL}/users/me/", headers=json_headers)
    employee_id = res_me.json().get('employee_id')
    print(f"   Employee ID: {employee_id}")

    # 3. Call 'Today' Endpoint
    print("\n3. Calling /attendances/today/...")
    today_url = f"{BASE_URL}/employees/{employee_id}/attendances/today/"
    res = requests.get(today_url, headers=json_headers)
    
    if res.status_code == 200:
        data = res.json()
        print(f"   Response: {json.dumps(data, indent=2)}")
        punches = data.get('punches', [])
        if punches:
            print(f"   SUCCESS: Found {len(punches)} punches.")
        else:
            print("   NOTE: No punches found (maybe not clocked in yet today?)")
    else:
        print(f"   FAILED: {res.status_code} - {res.text}")

if __name__ == "__main__":
    test_today_endpoint()
