from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
import uuid

class UserManager(BaseUserManager):
    """Custom user model manager where email is the unique identifier"""
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        if not username:
            raise ValueError(_('The Username must be set'))
            
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        return self.create_user(username, email, password, **extra_fields)

class User(AbstractUser):
    email = models.EmailField(_('email address'), unique=True)
    username = models.CharField(_('username'), max_length=150, unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    objects = UserManager()
    
    def __str__(self):
        return self.email

class JournalEntry(models.Model):
    """Model representing a journal entry with mood tracking and content."""
    MOOD_CHOICES = [
        ('😊', 'Happy'),
        ('😢', 'Sad'),
        ('😐', 'Neutral'),
        ('😡', 'Angry'),
        ('😴', 'Tired'),
        ('😨', 'Anxious'),
        ('😌', 'Peaceful'),
        ('😔', 'Reflective'),
        ('😤', 'Frustrated'),
        ('🤗', 'Grateful'),
    ]

    ENTRY_TYPES = [
        ('text', 'Text Entry'),
        ('voice', 'Voice Note'),
        ('quick', 'Quick Note'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='journal_entries')
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    mood = models.CharField(max_length=2, choices=MOOD_CHOICES, default='😐')
    entry_type = models.CharField(max_length=10, choices=ENTRY_TYPES, default='text')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_private = models.BooleanField(default=True)
    tags = models.JSONField(default=list, blank=True)
    word_count = models.PositiveIntegerField(default=0)
    sentiment_score = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Journal Entries'
        
    def __str__(self):
        return f"{self.user.username}'s entry on {self.created_at.strftime('%Y-%m-%d')}"


class Conversation(models.Model):
    """Model representing a conversation thread."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    title = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-updated_at']
        
    def __str__(self):
        return f"{self.title or 'Untitled'} - {self.user.username}"
    
    def save(self, *args, **kwargs):
        if not self.title and hasattr(self, 'messages'):
            # Auto-generate title from first message if not provided
            first_msg = self.messages.first()
            if first_msg:
                self.title = first_msg.content[:50] + ('...' if len(first_msg.content) > 50 else '')
        super().save(*args, **kwargs)


class Message(models.Model):
    """Model representing a message in a conversation."""
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    metadata = models.JSONField(default=dict, blank=True)  # For storing additional data like tokens, etc.
    
    class Meta:
        ordering = ['created_at']
        
    def __str__(self):
        return f"{self.role}: {self.content[:30]}..."