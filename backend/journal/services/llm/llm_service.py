"""
LLM Service implementation for local language model interactions.
Handles conversation management and model interactions via Ollama.
"""
import os
import json
from typing import Dict, List, Optional
import requests
from dotenv import load_dotenv

load_dotenv()

class LLMService:
    """Service for interacting with local LLM via Ollama."""
    
    def __init__(self, model_name: str = "phi3"):
        """Initialize the LLM service with a specific model.
        
        Args:
            model_name: Name of the Ollama model to use (default: phi3)
        """
        self.base_url = os.getenv("OLLAMA_API_URL", "http://localhost:11434")
        self.model_name = model_name
        self.conversations: Dict[str, List[Dict]] = {}
        self._ensure_model_available()
    
    def _ensure_model_available(self):
        """Ensure the specified model is available, pull if necessary."""
        try:
            # Check if Ollama server is reachable
            version_response = requests.get(f"{self.base_url}/api/version")
            if version_response.status_code != 200:
                raise RuntimeError(f"Ollama server returned status {version_response.status_code}")
                
            print(f"Connected to Ollama server (Version: {version_response.text.strip()})")
            
            # Check if model is available
            response = requests.get(f"{self.base_url}/api/tags")
            if response.status_code != 200:
                raise RuntimeError(f"Failed to list models: {response.text}")
                
            try:
                models_data = response.json()
                models = [model["name"] for model in models_data.get("models", [])]
                print(f"Available models: {models}")
                
                if self.model_name not in models:
                    print(f"Model {self.model_name} not found. Pulling from Ollama...")
                    self._pull_model()
                    
            except ValueError as e:
                print(f"Unexpected response format: {response.text}")
                raise RuntimeError("Failed to parse Ollama API response") from e
                
        except requests.exceptions.RequestException as e:
            raise RuntimeError(
                f"Failed to connect to Ollama server at {self.base_url}: {str(e)}. "
                "Please ensure Ollama is running and the URL is correct."
            ) from e
    
    def _pull_model(self):
        """Pull the specified model from Ollama."""
        try:
            response = requests.post(
                f"{self.base_url}/api/pull",
                json={"name": self.model_name},
                stream=True
            )
            response.raise_for_status()
            
            # Stream the download progress
            for line in response.iter_lines():
                if line:
                    status = json.loads(line)
                    if "status" in status:
                        print(status["status"])
                        
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Failed to pull model {self.model_name}") from e
    
    def start_conversation(self, user_id: str, system_prompt: Optional[str] = None) -> str:
        """Start a new conversation.
        
        Args:
            user_id: Unique identifier for the user
            system_prompt: Optional system prompt to initialize the conversation
            
        Returns:
            str: The initial response from the model
        """
        if not system_prompt:
            system_prompt = (
                "You are a supportive, empathetic AI therapist. Your role is to help users "
                "reflect on their thoughts and feelings in a non-judgmental way. Ask open-ended "
                "questions and provide thoughtful responses based on their journal entries."
            )
        
        self.conversations[user_id] = [
            {"role": "system", "content": system_prompt}
        ]
        
        return "Hello! I'm here to help you reflect on your thoughts and feelings. " \
               "How can I assist you today?"
    
    def continue_conversation(
        self, 
        user_id: str, 
        message: str, 
        context: Optional[str] = None
    ) -> str:
        """Continue an existing conversation.
        
        Args:
            user_id: Unique identifier for the user
            message: User's message
            context: Additional context (e.g., recent journal entries)
            
        Returns:
            str: The model's response
        """
        if user_id not in self.conversations:
            self.start_conversation(user_id)
        
        # Add user message to conversation history
        self.conversations[user_id].append({"role": "user", "content": message})
        
        # Prepare the prompt with context if provided
        messages = self.conversations[user_id].copy()
        
        if context:
            # Insert context after system message
            messages.insert(1, {"role": "system", "content": f"Context from user's journal: {context}"})
        
        try:
            response = requests.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model_name,
                    "messages": messages,
                    "stream": False
                },
                timeout=60  # 60 second timeout
            )
            response.raise_for_status()
            
            assistant_message = response.json()["message"]["content"]
            
            # Add assistant's response to conversation history
            self.conversations[user_id].append({"role": "assistant", "content": assistant_message})
            
            return assistant_message
            
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Failed to get response from model: {str(e)}")
    
    def end_conversation(self, user_id: str):
        """End a conversation and clear its history."""
        if user_id in self.conversations:
            del self.conversations[user_id]
    
    def get_conversation_history(self, user_id: str) -> List[Dict]:
        """Get the conversation history for a user."""
        return self.conversations.get(user_id, [])
    
    def clear_conversation_history(self, user_id: str):
        """Clear conversation history for a user."""
        if user_id in self.conversations:
            self.conversations[user_id] = self.conversations[user_id][:1]  # Keep only system message
