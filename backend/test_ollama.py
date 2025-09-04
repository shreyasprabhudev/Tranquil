import requests
import json

def test_ollama_connection():
    base_url = "http://localhost:11434"
    
    try:
        # Test basic connectivity
        print("Testing Ollama connection...")
        version = requests.get(f"{base_url}/api/version").text
        print(f"Ollama version: {version}")
        
        # Test models endpoint
        print("\nFetching available models...")
        response = requests.get(f"{base_url}/api/tags")
        print(f"Status code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            try:
                models = response.json()
                print("\nAvailable models:")
                for model in models.get('models', []):
                    print(f"- {model.get('name')} (size: {model.get('size', 'N/A')}B)")
            except json.JSONDecodeError:
                print("Failed to decode JSON response")
                print(f"Raw response: {response.text}")
    
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to Ollama: {str(e)}")
        print("Please ensure Ollama is running and accessible at http://localhost:11434")

if __name__ == "__main__":
    test_ollama_connection()
