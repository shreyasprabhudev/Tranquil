from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'entries', views.JournalEntryViewSet, basename='journalentry')
router.register(r'conversations', views.ConversationViewSet, basename='conversation')
router.register(r'messages', views.MessageViewSet, basename='message')

# Legacy conversation endpoint (will be deprecated in the future)
conversation_legacy_patterns = [
    path('', views.LLMConversationView.as_view(), name='llm-conversation'),
]

urlpatterns = [
    path('', include(router.urls)),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('user/me/', views.UserProfileView.as_view(), name='user-profile'),
    # Legacy conversation endpoint (temporarily maintained for backward compatibility)
    path('conversation/', include(conversation_legacy_patterns)),
]