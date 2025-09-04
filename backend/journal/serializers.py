from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator
from django.core.validators import RegexValidator
from .models import JournalEntry, Conversation, Message
from typing import Optional, Dict, List, Any

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(
            queryset=User.objects.all(),
            message='A user with this email already exists.'
        )]
    )
    username = serializers.CharField(
        required=True,
        max_length=150,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message='A user with this username already exists.'
            ),
            RegexValidator(
                regex='^[\w.@+-]+$',
                message='Enter a valid username. This value may contain only letters, numbers, and @/./+/-/_ characters.'
            )
        ]
    )
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password2')
        extra_kwargs = {
            'username': {
                'min_length': 3, 
                'max_length': 150,
                'required': True
            },
            'email': {
                'max_length': 255,
                'required': True
            },
            'password': {
                'write_only': True,
                'required': True
            }
        }
        
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        # Remove password2 from the data
        validated_data.pop('password2', None)
        
        # Create user with the validated data
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        return user

class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model."""
    class Meta:
        model = Message
        fields = ['id', 'role', 'content', 'created_at', 'metadata']
        read_only_fields = ['id', 'created_at']

class ConversationListSerializer(serializers.ModelSerializer):
    """Serializer for listing conversations with basic info."""
    message_count = serializers.IntegerField(source='messages.count', read_only=True)
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'title', 'created_at', 'updated_at', 'is_archived', 'message_count', 'last_message']
        read_only_fields = ['id', 'created_at', 'updated_at', 'message_count', 'last_message']
    
    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return {
                'content': last_msg.content[:100] + ('...' if len(last_msg.content) > 100 else ''),
                'role': last_msg.role,
                'created_at': last_msg.created_at
            }
        return None

class ConversationDetailSerializer(serializers.ModelSerializer):
    """Serializer for conversation details with messages."""
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Conversation
        fields = ['id', 'title', 'created_at', 'updated_at', 'is_archived', 'messages']
        read_only_fields = ['id', 'created_at', 'updated_at', 'messages']

class ConversationSerializer(serializers.Serializer):
    """Legacy serializer for LLM conversation messages."""
    message = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=2000,
        help_text="The message to send to the LLM"
    )

    class Meta:
        fields = ['message']

class JournalEntrySerializer(serializers.ModelSerializer):
    """Serializer for JournalEntry model with validation and custom methods."""
    
    # Make user read-only and default to current user
    user = serializers.PrimaryKeyRelatedField(
        read_only=True,
        default=serializers.CurrentUserDefault()
    )
    
    # Make these fields read-only as they're auto-generated
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    word_count = serializers.IntegerField(read_only=True)
    sentiment_score = serializers.FloatField(read_only=True)
    
    class Meta:
        model = JournalEntry
        fields = [
            'id', 'user', 'title', 'content', 'mood', 'entry_type',
            'created_at', 'updated_at', 'is_private', 'tags',
            'word_count', 'sentiment_score'
        ]
    
    def validate_mood(self, value):
        """Validate that mood is one of the allowed choices."""
        valid_moods = [choice[0] for choice in JournalEntry.MOOD_CHOICES]
        if value not in valid_moods:
            raise serializers.ValidationError("Invalid mood selection.")
        return value
    
    def validate_entry_type(self, value):
        """Validate that entry_type is one of the allowed choices."""
        valid_types = [choice[0] for choice in JournalEntry.ENTRY_TYPES]
        if value not in valid_types:
            raise serializers.ValidationError("Invalid entry type.")
        return value
    
    def create(self, validated_data):
        """Create a new journal entry with the current user."""
        # Ensure the current user is set as the entry's user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update a journal entry, preserving read-only fields."""
        # Remove read-only fields from the update
        read_only_fields = ['user', 'created_at', 'word_count', 'sentiment_score']
        for field in read_only_fields:
            validated_data.pop(field, None)
            
        return super().update(instance, validated_data)