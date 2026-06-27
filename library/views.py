from datetime import timedelta

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import filters, generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Book, BookIssue, Category, Member
from .permissions import IsLibrarian, IsLibrarianOrReadOnly
from .serializers import (
    BookIssueSerializer,
    BookSerializer,
    CategorySerializer,
    IssueBookSerializer,
    MemberSerializer,
    RegisterSerializer,
    ReturnBookSerializer,
    UserSerializer,
)


# ------------------------------------------------------------------
# Auth
# ------------------------------------------------------------------
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': 'Logged out successfully.'}, status=status.HTTP_205_RESET_CONTENT)


# ------------------------------------------------------------------
# Catalog: Categories & Books
# ------------------------------------------------------------------
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsLibrarianOrReadOnly]


class BookViewSet(viewsets.ModelViewSet):
    """
    Supports ?search=<text> across title, author, isbn, category name.
    Supports ?category=<id> exact filter.
    """
    queryset = Book.objects.select_related('category').all()
    serializer_class = BookSerializer
    permission_classes = [IsLibrarianOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'author', 'isbn', 'category__name']

    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs


# ------------------------------------------------------------------
# Members
# ------------------------------------------------------------------
class MemberViewSet(viewsets.ModelViewSet):
    """Supports ?search=<text> across name, email, phone_number."""
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    permission_classes = [IsLibrarianOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'email', 'phone_number']


# ------------------------------------------------------------------
# Book Issue / Return
# ------------------------------------------------------------------
class BookIssueViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only history of issues. Filter with ?member=<id> or ?book=<id>."""
    queryset = BookIssue.objects.select_related('book', 'member').all()
    serializer_class = BookIssueSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        member_id = self.request.query_params.get('member')
        book_id = self.request.query_params.get('book')
        if member_id:
            qs = qs.filter(member_id=member_id)
        if book_id:
            qs = qs.filter(book_id=book_id)
        return qs


class IssueBookView(APIView):
    permission_classes = [IsLibrarian]

    @transaction.atomic
    def post(self, request):
        serializer = IssueBookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            book = Book.objects.select_for_update().get(pk=data['book_id'])
        except Book.DoesNotExist:
            return Response({'detail': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            member = Member.objects.get(pk=data['member_id'])
        except Member.DoesNotExist:
            return Response({'detail': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)

        if member.status != 'Active':
            return Response({'detail': 'Member is not active.'}, status=status.HTTP_400_BAD_REQUEST)

        if book.available_copies <= 0:
            return Response({'detail': 'No available copies for this book.'}, status=status.HTTP_400_BAD_REQUEST)

        book.available_copies -= 1
        book.save(update_fields=['available_copies'])

        issue = BookIssue.objects.create(
            book=book,
            member=member,
            due_date=timezone.now().date() + timedelta(days=data['due_days']),
        )
        return Response(BookIssueSerializer(issue).data, status=status.HTTP_201_CREATED)


class ReturnBookView(APIView):
    permission_classes = [IsLibrarian]

    @transaction.atomic
    def post(self, request):
        serializer = ReturnBookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        issue_id = serializer.validated_data['issue_id']

        try:
            issue = BookIssue.objects.select_for_update().select_related('book').get(pk=issue_id)
        except BookIssue.DoesNotExist:
            return Response({'detail': 'Issue record not found.'}, status=status.HTTP_404_NOT_FOUND)

        if issue.return_date is not None:
            return Response({'detail': 'This book has already been returned.'}, status=status.HTTP_400_BAD_REQUEST)

        issue.return_date = timezone.now().date()
        issue.save(update_fields=['return_date'])

        book = issue.book
        if book.available_copies < book.total_copies:
            book.available_copies += 1
            book.save(update_fields=['available_copies'])

        return Response(BookIssueSerializer(issue).data, status=status.HTTP_200_OK)


# ------------------------------------------------------------------
# Dashboard
# ------------------------------------------------------------------
class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        totals = Book.objects.aggregate(
            total_books=Sum('total_copies'),
            available_books=Sum('available_copies'),
        )
        total_books = totals['total_books'] or 0
        available_books = totals['available_books'] or 0
        issued_books = total_books - available_books
        total_members = Member.objects.count()

        return Response({
            'total_books': total_books,
            'available_books': available_books,
            'issued_books': issued_books,
            'total_members': total_members,
        })
