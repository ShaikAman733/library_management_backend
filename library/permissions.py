from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsLibrarianOrReadOnly(BasePermission):
    """
    Any authenticated user can read (list/retrieve).
    Only librarians (User.is_staff=True) can create/update/delete.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_staff


class IsLibrarian(BasePermission):
    """Only librarians may access this view at all (e.g. issue/return book)."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
