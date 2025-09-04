from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework import status
import logging
from .models import JournalEntry, Conversation, Message
from .serializers import (
    JournalEntrySerializer, 
    UserSerializer, 
    ConversationSerializer,
    ConversationListSerializer,
    ConversationDetailSerializer,
    MessageSerializer
)
from .services.llm import LLMService
from datetime import datetime, timedelta

# Initialize LLM service
llm_service = LLMService(model_name="phi3")

from rest_framework.decorators import action, api_view, permission_classes
from rest_framework import generics, filters
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Sum
from datetime import datetime, timedelta

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class JournalEntryViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows journal entries to be viewed or edited.
    """
    serializer_class = JournalEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """
        This view should return a list of all journal entries
        for the currently authenticated user.
        """
        queryset = JournalEntry.objects.filter(user=self.request.user)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(
                created_at__date__range=[start_date, end_date]
            )
        
        # Filter by mood
        mood = self.request.query_params.get('mood')
        if mood:
            queryset = queryset.filter(mood=mood)
        
        # Filter by entry type
        entry_type = self.request.query_params.get('entry_type')
        if entry_type:
            queryset = queryset.filter(entry_type=entry_type)
        
        # Search in title and content
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(content__icontains=search)
            )
        
        # Order by most recent by default
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        """Set the user to the current user when creating a new entry."""
        serializer.save(user=self.request.user)
        
    def update(self, request, *args, **kwargs):
        """
        Update a journal entry.
        Only the owner can update their own entries.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Ensure the entry belongs to the current user
        if instance.user != request.user:
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND
            )
            
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        logger.info(f"Successfully updated entry {instance.id}")
        return Response(serializer.data)
        
    def destroy(self, request, *args, **kwargs):
        """
        Delete a journal entry.
        Only the owner can delete their own entries.
        Returns 204 if deleted, 404 if not found, 200 if already deleted.
        """
        entry_id = kwargs.get('pk')
        logger.info(f"DELETE request for entry {entry_id} from user {request.user.id}")
        
        # First check if the entry exists and belongs to the user
        entry_exists = self.get_queryset().filter(pk=entry_id).exists()
        
        if not entry_exists:
            # Check if the entry exists at all (even if not owned by user)
            entry_anywhere = JournalEntry.objects.filter(pk=entry_id).exists()
            if not entry_anywhere:
                logger.info(f"Entry {entry_id} not found, treating as success")
                return Response(status=status.HTTP_204_NO_CONTENT)
            else:
                logger.warning(f"Entry {entry_id} exists but not owned by user {request.user.id}")
                return Response(
                    {"detail": "Not found."},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        try:
            # If we get here, the entry exists and belongs to the user
            response = super().destroy(request, *args, **kwargs)
            logger.info(f"Successfully deleted entry {entry_id}")
            return response
            
        except Exception as e:
            logger.error(f"Error deleting entry {entry_id}: {str(e)}", exc_info=True)
            return Response(
                {"detail": "An error occurred while processing your request."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    def perform_destroy(self, instance):
        """Perform the actual deletion of the instance."""
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent journal entries (last 7 days)."""
        recent_entries = self.get_queryset().filter(
            created_at__gte=datetime.now() - timedelta(days=7)
        )
        page = self.paginate_queryset(recent_entries)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(recent_entries, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get statistics about journal entries."""
        from django.db.models import Count, Avg
        
        # Get mood distribution
        mood_stats = (
            self.get_queryset()
            .values('mood')
            .annotate(count=Count('mood'))
            .order_by('-count')
        )
        
        # Get entry type distribution
        type_stats = (
            self.get_queryset()
            .values('entry_type')
            .annotate(count=Count('entry_type'))
            .order_by('-count')
        )
        
        # Get total entries and word count
        total_entries = self.get_queryset().count()
        total_words = self.get_queryset().aggregate(Sum('word_count'))['word_count__sum'] or 0
        
        return Response({
            'total_entries': total_entries,
            'total_words': total_words,
            'mood_distribution': list(mood_stats),
            'type_distribution': list(type_stats),
        })


import logging
logger = logging.getLogger(__name__)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'date_joined': user.date_joined,
        })

class LLMConversationView(APIView):
    """
    API endpoint for interacting with the LLM for therapeutic conversations.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get conversation history."""
        try:
            history = llm_service.get_conversation_history(str(request.user.id))
            return Response({"conversation": history}, status=status.HTTP_200_OK)
        except Exception as e:
            logging.error(f"Error getting conversation history: {str(e)}")
            return Response(
                {"error": "Failed to retrieve conversation history"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        """Send a message to the LLM and get a response."""
        serializer = ConversationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            message_content = serializer.validated_data['message']
            
            # Get or create conversation
            conversation = Conversation.objects.filter(
                user=request.user,
                is_archived=False
            ).order_by('-updated_at').first()
            
            if not conversation:
                # Create a new conversation if none exists
                conversation = Conversation.objects.create(
                    user=request.user,
                    title=f"Conversation {Conversation.objects.filter(user=request.user).count() + 1}"
                )
            
            # Save user message
            user_message = Message.objects.create(
                conversation=conversation,
                role='user',
                content=message_content
            )
            
            # Get recent journal entries for context (last 3 days)
            recent_entries = JournalEntry.objects.filter(
                user=request.user,
                created_at__gte=datetime.now() - timedelta(days=3)
            ).order_by('-created_at')
            
            context = "\n".join([entry.content for entry in recent_entries[:3]])
            
            # Start or continue conversation in LLM service
            if not llm_service.get_conversation_history(str(request.user.id)):
                llm_service.start_conversation(str(request.user.id))
            
            # Get response from LLM
            response_content = llm_service.continue_conversation(
                user_id=str(request.user.id),
                message=message_content,
                context=context if context else None
            )
            
            # Save bot response
            bot_message = Message.objects.create(
                conversation=conversation,
                role='assistant',
                content=response_content
            )
            
            # Update conversation's updated_at timestamp
            conversation.save()
            
            return Response({"response": response_content}, status=status.HTTP_200_OK)
            
        except Exception as e:
            logging.error(f"Error in LLM conversation: {str(e)}")
            return Response(
                {"error": "Failed to process your message. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request):
        """Clear conversation history."""
        try:
            llm_service.clear_conversation_history(str(request.user.id))
            return Response(
                {"message": "Conversation history cleared"},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logging.error(f"Error clearing conversation history: {str(e)}")
            return Response(
                {"error": "Failed to clear conversation history"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ConversationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing conversations and messages.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConversationDetailSerializer
        return ConversationListSerializer
    
    def get_queryset(self):
        """Return conversations for the current user."""
        queryset = Conversation.objects.filter(user=self.request.user)
        
        # Filter by archived status if provided
        is_archived = self.request.query_params.get('archived')
        if is_archived is not None:
            queryset = queryset.filter(is_archived=is_archived.lower() == 'true')
            
        return queryset.order_by('-updated_at')
    
    def perform_create(self, serializer):
        """Set the user to the current user when creating a conversation."""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get messages for a specific conversation."""
        conversation = self.get_object()
        messages = conversation.messages.all().order_by('created_at')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive or unarchive a conversation."""
        conversation = self.get_object()
        conversation.is_archived = not conversation.is_archived
        conversation.save()
        return Response({'status': 'conversation archived' if conversation.is_archived else 'conversation unarchived'})


class MessageViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing messages within conversations.
    """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return messages for the current user's conversations."""
        return Message.objects.filter(
            conversation__user=self.request.user
        ).order_by('created_at')
    
    def perform_create(self, serializer):
        """Set the role to 'user' when creating a message."""
        conversation_id = self.request.data.get('conversation')
        conversation = Conversation.objects.get(id=conversation_id, user=self.request.user)
        serializer.save(role='user', conversation=conversation)
        
        # Update conversation's updated_at timestamp
        conversation.save()


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        logger.info("Registration attempt started")
        User = get_user_model()
        
        try:
            email = request.data.get('email')
            username = request.data.get('username')
            password = request.data.get('password')
            password2 = request.data.get('password2')
            
            logger.info(f"Registration attempt for username: {username}, email: {email}")
            
            # Basic validation
            required_fields = {
                'email': email,
                'username': username,
                'password': password,
                'password2': password2
            }
            
            missing_fields = [field for field, value in required_fields.items() if not value]
            if missing_fields:
                error_msg = f'Missing required fields: {", ".join(missing_fields)}'
                logger.warning(f"Missing fields: {missing_fields}")
                return Response(
                    {'detail': error_msg},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Check if email already exists
            if User.objects.filter(email=email).exists():
                error_msg = 'A user with this email already exists.'
                logger.warning(f"Email already exists: {email}")
                return Response(
                    {'detail': error_msg},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Check if username already exists
            if User.objects.filter(username=username).exists():
                error_msg = 'A user with this username already exists.'
                logger.warning(f"Username already exists: {username}")
                return Response(
                    {'detail': error_msg},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Check password match
            if password != password2:
                logger.warning("Passwords do not match")
                return Response(
                    {'detail': 'Passwords do not match.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            serializer = UserSerializer(data=request.data)
            
            if serializer.is_valid():
                try:
                    user = serializer.save()
                    if user:
                        logger.info(f"User registered successfully: {email}")
                        return Response(
                            {'detail': 'User registered successfully'},
                            status=status.HTTP_201_CREATED
                        )
                except Exception as e:
                    logger.error(f"Error during user creation: {str(e)}")
                    return Response(
                        {'detail': 'Error creating user. Please try again.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Handle validation errors
            logger.warning(f"Validation errors: {serializer.errors}")
            errors = {}
            for field, error_messages in serializer.errors.items():
                errors[field] = [str(error) for error in error_messages]
                
            return Response(
                {'detail': 'Validation failed', 'errors': errors},
                status=status.HTTP_400_BAD_REQUEST
            )
                
        except Exception as e:
            logger.error(f"Unexpected error during registration: {str(e)}", exc_info=True)
            return Response(
                {'detail': 'An unexpected error occurred. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )