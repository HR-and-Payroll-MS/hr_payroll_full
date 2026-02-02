import requests
import json

# Configuration
BASE_URL = 'http://localhost:8001/api/v1'
LOGIN_URL = f'{BASE_URL}/auth/djoser/jwt/create/'
NOTIF_URL = f'{BASE_URL}/notifications/'

# Admin Credentials (created in previous turn)
USERNAME = 'admin'
PASSWORD = 'Admin@123'

def test_notification():
    # 1. Login
    print(f"Logging in as {USERNAME}...")
    try:
        resp = requests.post(LOGIN_URL, data={'username': USERNAME, 'password': PASSWORD})
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} - {resp.text}")
            return
        
        token = resp.json()['access']
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        print("Login success.")

        # 2. Try Sending Notification (Group: HR)
        print("\nTesting Notification Send (Group: HR)...")
        payload_group = {
            "title": "Test Group Notification",
            "message": "This is a test message.",
            "notification_type": "info",
            "receiver_group": "HR", 
            # "link": "" # Optional, leaving out to see if it causes issues
        }
        
        resp = requests.post(NOTIF_URL, json=payload_group, headers=headers)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")

        # 3. Try Sending Notification (Recipient ID: Self likely?)
        # Need an employee ID first. Admin might not have one?
        # Let's try ALL
        print("\nTesting Notification Send (ALL)...")
        payload_all = {
            "title": "Test All Notification",
            "message": "This is a test message for ALL.",
            "notification_type": "info",
            "receivers": ["ALL"]
        }
        resp = requests.post(NOTIF_URL, json=payload_all, headers=headers)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_notification()
