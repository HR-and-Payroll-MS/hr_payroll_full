import requests
import json

BASE_URL = "http://localhost:8001/api/v1"

def test_email_login():
    print("Testing Login with Email as username...")
    login_url = f"{BASE_URL}/auth/djoser/jwt/create/"
    # The frontend sends the email in the 'username' field of the JSON
    data = {"username": "admin@example.com", "password": "admin123"}
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(login_url, json=data, headers=headers)
        print(f"Status Code: {response.status_code}")
        print("Response:", response.text)
        
        if response.status_code == 200:
            print("Login with Email Successful!")
        else:
            print("Login with Email Failed (Expected for now)")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_email_login()
