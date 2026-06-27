from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Book, Member


class LibraryAPITests(APITestCase):
    def setUp(self):
        self.librarian = User.objects.create_user(
            username='libuser', password='Pass1234!', is_staff=True
        )
        self.regular_user = User.objects.create_user(
            username='memberuser', password='Pass1234!', is_staff=False
        )
        self.book = Book.objects.create(
            isbn='111-1', title='Clean Code', author='Robert Martin',
            total_copies=2, available_copies=2,
        )
        self.member = Member.objects.create(name='Aman', email='aman@example.com')

    def _login(self, username, password):
        resp = self.client.post(reverse('login'), {'username': username, 'password': password})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")

    def test_register_and_login(self):
        resp = self.client.post(reverse('register'), {
            'username': 'newuser', 'email': 'new@example.com', 'password': 'StrongPass123!',
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        resp = self.client.post(reverse('login'), {'username': 'newuser', 'password': 'StrongPass123!'})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('access', resp.data)

    def test_issue_and_return_book(self):
        self._login('libuser', 'Pass1234!')

        resp = self.client.post(reverse('issue-book'), {'book_id': self.book.id, 'member_id': self.member.id})
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.book.refresh_from_db()
        self.assertEqual(self.book.available_copies, 1)

        issue_id = resp.data['id']
        resp2 = self.client.post(reverse('return-book'), {'issue_id': issue_id})
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.book.refresh_from_db()
        self.assertEqual(self.book.available_copies, 2)

    def test_cannot_issue_when_no_copies_available(self):
        self.book.available_copies = 0
        self.book.save()
        self._login('libuser', 'Pass1234!')

        resp = self.client.post(reverse('issue-book'), {'book_id': self.book.id, 'member_id': self.member.id})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_regular_member_cannot_create_book(self):
        self._login('memberuser', 'Pass1234!')

        resp = self.client.post(reverse('book-list'), {
            'isbn': '222-2', 'title': 'New Book', 'author': 'Someone', 'total_copies': 1,
        })
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_dashboard_counts(self):
        self._login('libuser', 'Pass1234!')
        resp = self.client.get(reverse('dashboard'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['total_books'], 2)
        self.assertEqual(resp.data['available_books'], 2)
        self.assertEqual(resp.data['total_members'], 1)
