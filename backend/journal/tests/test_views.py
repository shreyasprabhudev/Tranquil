from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from ..models import JournalEntry
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()

class JournalEntryTests(APITestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create some test journal entries with timezone-aware datetimes
        now = timezone.now()
        
        self.entry1 = JournalEntry.objects.create(
            user=self.user,
            title='First Entry',
            content='This is my first journal entry.',
            mood='😊',
            entry_type='text',
            created_at=now - timedelta(hours=1)
        )
        
        self.entry2 = JournalEntry.objects.create(
            user=self.user,
            title='Second Entry',
            content='This is my second journal entry with more content.',
            mood='😌',
            entry_type='quick',
            is_private=False,
            created_at=now - timedelta(hours=2)
        )
        
        # Create another user's entry
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        self.other_entry = JournalEntry.objects.create(
            user=self.other_user,
            title="Other User's Entry",
            content='This is another user\'s entry.',
            mood='😐',
            entry_type='text',
            created_at=now - timedelta(hours=3)
        )
        
        # Get JWT token for authentication
        response = self.client.post(
            '/api/token/',
            {'username_or_email': 'testuser', 'password': 'testpass123'},
            format='json'
        )
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
    
    def test_create_journal_entry(self):
        """Test creating a new journal entry."""
        url = reverse('journalentry-list')
        data = {
            'title': 'Test Entry',
            'content': 'This is a test journal entry.',
            'mood': '😊',
            'entry_type': 'text',
            'is_private': True,
            'tags': ['test', 'journal']
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(JournalEntry.objects.count(), 4)
        self.assertEqual(JournalEntry.objects.latest('id').title, 'Test Entry')
    
    def test_retrieve_journal_entries(self):
        """Test retrieving a list of journal entries."""
        url = reverse('journalentry-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)  # Should only see user's entries
        self.assertEqual(response.data['results'][0]['title'], 'Second Entry')
    
    def test_retrieve_single_entry(self):
        """Test retrieving a single journal entry."""
        url = reverse('journalentry-detail', args=[self.entry1.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'First Entry')
    
    def test_update_entry(self):
        """Test updating a journal entry."""
        url = reverse('journalentry-detail', args=[self.entry1.id])
        data = {
            'title': 'Updated Entry',
            'content': 'This is an updated journal entry.',
            'mood': '😔',
            'entry_type': 'text',
            'is_private': False
        }
        
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.entry1.refresh_from_db()
        self.assertEqual(self.entry1.title, 'Updated Entry')
        self.assertEqual(self.entry1.mood, '😔')
    
    def test_delete_entry(self):
        """Test deleting a journal entry."""
        url = reverse('journalentry-detail', args=[self.entry1.id])
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(JournalEntry.objects.count(), 2)  # Only user's entry should be deleted
    
    def test_recent_entries(self):
        """Test retrieving recent journal entries."""
        # First, get the current entries that are considered 'recent'
        recent_response = self.client.get(reverse('journalentry-recent'))
        self.assertEqual(recent_response.status_code, status.HTTP_200_OK)
        initial_recent_entries = len(recent_response.data['results'])
        
        # Create a new entry that should be in the recent entries
        new_entry = JournalEntry.objects.create(
            user=self.user,
            title='New Entry',
            content='This is a new journal entry.',
            mood='😊',
            entry_type='text',
            created_at=timezone.now()
        )
        
        # Get recent entries again
        response = self.client.get(reverse('journalentry-recent'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # The new entry should be in the recent entries
        entry_ids = [entry['id'] for entry in response.data['results']]
        self.assertIn(new_entry.id, entry_ids)
        
        # The count should have increased by 1
        self.assertEqual(len(response.data['results']), initial_recent_entries + 1)
    
    def test_stats_endpoint(self):
        """Test the stats endpoint."""
        url = reverse('journalentry-stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_entries'], 2)
        self.assertIn('mood_distribution', response.data)
        self.assertIn('type_distribution', response.data)
    
    def test_filtering(self):
        """Test filtering journal entries."""
        # Test mood filter
        response = self.client.get('/api/entries/?mood=😌')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['mood'], '😌')
        
        # Test entry type filter
        response = self.client.get('/api/entries/?entry_type=quick')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['entry_type'], 'quick')
        
        # Test search
        response = self.client.get('/api/entries/?search=second')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Second Entry')
    
    def test_unauthorized_access(self):
        """Test that users can only access their own entries."""
        # Clear authentication
        self.client.credentials()
        
        # Try to access entries without authentication
        url = reverse('journalentry-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Try to access another user's entry
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')
        url = reverse('journalentry-detail', args=[self.other_entry.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
