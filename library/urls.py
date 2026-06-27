from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    BookIssueViewSet,
    BookViewSet,
    CategoryViewSet,
    DashboardView,
    IssueBookView,
    LogoutView,
    MeView,
    MemberViewSet,
    RegisterView,
    ReturnBookView,
)

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('books', BookViewSet, basename='book')
router.register('members', MemberViewSet, basename='member')
router.register('issues', BookIssueViewSet, basename='issue')

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', MeView.as_view(), name='me'),

    # Book issue / return
    path('issues/issue/', IssueBookView.as_view(), name='issue-book'),
    path('issues/return/', ReturnBookView.as_view(), name='return-book'),

    # Dashboard
    path('dashboard/', DashboardView.as_view(), name='dashboard'),

    # CRUD routers (categories, books, members, issues)
    path('', include(router.urls)),
]
