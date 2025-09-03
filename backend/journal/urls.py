from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'entries', views.JournalEntryViewSet, basename='journalentry')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('user/me/', views.UserProfileView.as_view(), name='user-profile'),
]