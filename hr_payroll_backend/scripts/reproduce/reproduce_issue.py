import requests
import json

BASE_URL = "http://localhost:8001/api/v1"
LOGIN_URL = f"{BASE_URL}/auth/djoser/jwt/create/"
ANNOUNCEMENT_URL = f"{BASE_URL}/announcements/"

def login():
    response = requests.post(LOGIN_URL, data={"email": "eyob@hrpayroll.com", "password": "eyob1210"})
    if response.status_code == 200:
        return response.json()["access"]
    else:
        print("Login failed:", response.text)
        return None

def test_announcement_upload():
    token = login()
    if not token:
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    # Simulate sending a text file as 'image' (which should fail validation)
    files = {
        'image': ('test.txt', b'This is a text file, not an image.', 'text/plain')
    }
    data = {
        'title': 'Test Announcement',
        'content': 'Body content',
        'priority': 'Normal'
    }
    
    print("Sending POST to", ANNOUNCEMENT_URL)
    response = requests.post(ANNOUNCEMENT_URL, headers=headers, data=data, files=files)
    
    print("Status:", response.status_code)
    print("Response:", response.text)

if __name__ == "__main__":
    test_announcement_upload()
