import requests

BASE_URL = "http://localhost:8001/api/v1"

def test_request_reset(email):
    print(f"Testing password reset request for: {email}")
    url = f"{BASE_URL}/users/request-reset/"
    response = requests.post(url, json={"email": email})
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.json()}")

if __name__ == "__main__":
    # Test with an existing email if possible
    # Earlier I saw 'news@example.com' or something similar
    test_request_reset("news@example.com")
    test_request_reset("nonexistent@example.com")
