import requests
import config
import json

class OllamaService:
    def __init__(self):
        self.base_url = config.OLLAMA_BASE_URL
        self.model = config.OLLAMA_MODEL
        
    def generate_response(self, prompt, system_prompt="You are a helpful assistant.", temperature=0.7):
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "options": {
                "temperature": temperature or 0.7
            }
        }
        
        try:
            response = requests.post(f"{self.base_url}/api/generate", json=payload)
            response.raise_for_status()
            return response.json().get('response', '')
        except Exception as e:
            print(f"Ollama error: {e}")
            return f"Error connecting to local LLM: {str(e)}"

llm_service = OllamaService()
