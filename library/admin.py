from django.contrib import admin

from .models import Book, BookIssue, Category, Member


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name']


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'author', 'isbn', 'category', 'total_copies', 'available_copies']
    list_filter = ['category']
    search_fields = ['title', 'author', 'isbn']


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'email', 'phone_number', 'status', 'membership_date']
    list_filter = ['status']
    search_fields = ['name', 'email', 'phone_number']


@admin.register(BookIssue)
class BookIssueAdmin(admin.ModelAdmin):
    list_display = ['id', 'book', 'member', 'issue_date', 'due_date', 'return_date']
    list_filter = ['issue_date', 'return_date']
