import requests
import json

BASE_URL = "http://localhost:8001/api/v1"

def test_login():
    print("Testing Login...")
    login_url = f"{BASE_URL}/auth/djoser/jwt/create/"
    data = {"username": "admin", "password": "admin123"}
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(login_url, json=data, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("Login Successful")
            tokens = response.json()
            print("Tokens:", tokens)
            
            access_token = tokens.get("access")
            if access_token:
                test_get_me(access_token)
            else:
                print("No access token found!")
        else:
            print("Login Failed")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"Error: {e}")

def test_get_me(access_token):
    print("\nTesting Get Current User...")
    me_url = f"{BASE_URL}/users/me/"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(me_url, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            user_data = response.json()
            print("Get User Successful")
            print("User Data:", json.dumps(user_data, indent=2))
            
            employee_id = user_data.get('employee_id')
            if employee_id:
                test_get_employee(access_token, employee_id)
            else:
                print("STILL NO EMPLOYEE ID FOUND!")
        else:
            print("Get User Failed")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"Error: {e}")

def test_get_employee(access_token, employee_id):
    print(f"\nTesting Get Employee Details for ID {employee_id}...")
    # Matches frontend call: /employees/{id}/
    emp_url = f"{BASE_URL}/employees/{employee_id}/"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(emp_url, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("Get Employee Profile Successful!")
            # print("Employee Data:", json.dumps(response.json(), indent=2))
        else:
            print(f"Get Employee Failed with {response.status_code}")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()
