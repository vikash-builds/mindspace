import requests

import config


class OllamaService:
    def __init__(self):
        self.base_url = config.OLLAMA_BASE_URL.rstrip('/')
        self.model = config.OLLAMA_MODEL

    def generate_response(self, prompt, system_prompt, temperature=0.7):
        payload = {
            'model': self.model,
            'prompt': prompt,
            'system': system_prompt,
            'stream': False,
            'options': {
                'temperature': temperature or 0.7,
            },
        }

        response = requests.post(f'{self.base_url}/api/generate', json=payload, timeout=120)
        response.raise_for_status()
        return response.json().get('response', '')


class OpenAIService:
    def __init__(self):
        self.base_url = config.OPENAI_BASE_URL.rstrip('/')
        self.model = config.OPENAI_CHAT_MODEL
        self.api_key = config.OPENAI_API_KEY

    def generate_response(self, prompt, system_prompt, temperature=0.7):
        if not self.api_key:
            raise ValueError('OPENAI_API_KEY is required for hosted generation')

        response = requests.post(
            f'{self.base_url}/chat/completions',
            headers={
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'model': self.model,
                'temperature': temperature or 0.7,
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': prompt},
                ],
            },
            timeout=120,
        )
        response.raise_for_status()
        choices = response.json().get('choices', [])
        if not choices:
            raise ValueError('No completion returned from OpenAI')
        return choices[0].get('message', {}).get('content', '')


class GeminiService:
    def __init__(self):
        self.base_url = config.GEMINI_BASE_URL.rstrip('/')
        self.model = config.GEMINI_CHAT_MODEL
        self.api_key = config.GEMINI_API_KEY

    def generate_response(self, prompt, system_prompt, temperature=0.7):
        if not self.api_key:
            raise ValueError('GEMINI_API_KEY is required for Gemini generation')

        response = requests.post(
            f'{self.base_url}/models/{self.model}:generateContent',
            headers={
                'x-goog-api-key': self.api_key,
                'Content-Type': 'application/json',
            },
            json={
                'system_instruction': {
                    'parts': [
                        {'text': system_prompt},
                    ],
                },
                'contents': [
                    {
                        'role': 'user',
                        'parts': [
                            {'text': prompt},
                        ],
                    },
                ],
                'generationConfig': {
                    'temperature': temperature or 0.7,
                    'responseMimeType': 'text/plain',
                },
            },
            timeout=180,
        )
        response.raise_for_status()
        candidates = response.json().get('candidates', [])
        if not candidates:
            raise ValueError('No completion returned from Gemini')

        parts = (candidates[0].get('content') or {}).get('parts', [])
        content = ''.join(part.get('text', '') for part in parts if part.get('text'))
        if not content:
            raise ValueError('Gemini response was empty')
        return content


class LLMService:
    def __init__(self):
        self.services = {
            'ollama': OllamaService(),
            'openai': OpenAIService(),
            'gemini': GeminiService(),
        }

    def generate_response(self, prompt, system_prompt='You are a helpful assistant.', temperature=0.7, provider=None):
        active_provider = config.get_llm_provider(provider)
        service = self.services.get(active_provider)
        if not service:
            raise ValueError(f'Unsupported LLM provider: {active_provider}')

        try:
            return service.generate_response(prompt, system_prompt, temperature=temperature)
        except Exception as error:
            print(f'{active_provider} generation error: {error}')
            return f'Error connecting to configured LLM provider: {error}'


llm_service = LLMService()
