import requests
import json

BASE_URL = "http://localhost:8001/api/v1"

def test_features():
    print("=== Testing Core Features ===")
    
    # 1. Login
    login_url = f"{BASE_URL}/auth/djoser/jwt/create/"
    data = {"username": "admin@example.com", "password": "admin123"}
    headers = {"Content-Type": "application/json"}
    
    try:
        print("1. Logging in...")
        response = requests.post(login_url, json=data, headers=headers)
        if response.status_code != 200:
            print(f"Login Failed: {response.text}")
            return
        
        tokens = response.json()
        access_token = tokens['access']
        auth_headers = {"Authorization": f"Bearer {access_token}"}
        json_headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}

        # 2. Get User
        me_url = f"{BASE_URL}/users/me/"
        res_me = requests.get(me_url, headers=json_headers)
        if res_me.status_code != 200: return
        employee_id = res_me.json().get('employee_id')
        print(f"   Employee ID: {employee_id}")

        if not employee_id: return

        # 3. Upload & Serve Document
        print(f"\n3. Testing Document Upload & Serve...")
        upload_url = f"{BASE_URL}/employees/{employee_id}/upload-document/"
        files = {'documents': ('test.txt', 'content', 'text/plain')}
        res_upload = requests.post(upload_url, headers=auth_headers, files=files, data={'type': 'Test'})
        
        if res_upload.status_code == 201:
            print("   Upload OK")
            # Get Doc ID
            res_emp = requests.get(f"{BASE_URL}/employees/{employee_id}/", headers=json_headers)
            docs = res_emp.json().get('documents', {}).get('files', [])
            if docs:
                doc_id = docs[0]['id']
                serve_url = f"{BASE_URL}/employees/serve-document/{doc_id}/"
                res_serve = requests.get(serve_url, headers=auth_headers)
                if res_serve.status_code == 200:
                    print("   Serve Document OK")
                else:
                    print(f"   Serve Document Failed: {res_serve.status_code}")

        # 4. Nested Update (Simulate Frontend PUT)
        print(f"\n4. Testing Nested Update (GET -> PUT)...")
        # Fetch current data first matching frontend flow
        res_get = requests.get(f"{BASE_URL}/employees/{employee_id}/", headers=json_headers)
        if res_get.status_code != 200:
             print("   Pre-fetch failed")
             return
             
        current_data = res_get.json()
        
        # Modify firstname
        if 'general' not in current_data: current_data['general'] = {}
        current_data['general']['firstname'] = "AdminUpdate"
        
        update_url = f"{BASE_URL}/employees/{employee_id}/"
        res_update = requests.put(update_url, headers=json_headers, json=current_data)
        
        if res_update.status_code == 200:
             print("   Update OK")
             # Serializer returns flat data, so we must GET again to see nested structure and verify persistence
             res_verify = requests.get(update_url, headers=json_headers)
             new_name = res_verify.json().get('general', {}).get('firstname')
             
             print(f"   Verified First Name: {new_name}")
             if new_name == "AdminUpdate":
                 print("   SUCCESS: Nested update persisted.")
             else:
                 print(f"   WARNING: Update did not persist. Got: {new_name}")
        else:
             print(f"   Update Failed: {res_update.status_code} - {res_update.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_features()
