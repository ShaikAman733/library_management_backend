from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Book, BookIssue, Category, Member


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    role = serializers.ChoiceField(choices=['librarian', 'member'], write_only=True, default='member')

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']

    def create(self, validated_data):
        role = validated_data.pop('role', 'member')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            is_staff=(role == 'librarian'),
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']

    def get_role(self, obj):
        return 'librarian' if obj.is_staff else 'member'


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class BookSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)

    class Meta:
        model = Book
        fields = [
            'id', 'isbn', 'title', 'author', 'publisher', 'category', 'category_name',
            'publication_year', 'total_copies', 'available_copies', 'created_at', 'updated_at',
        ]
        read_only_fields = ['available_copies', 'created_at', 'updated_at']

    def validate(self, attrs):
        total = attrs.get('total_copies', getattr(self.instance, 'total_copies', None))
        available = attrs.get('available_copies', getattr(self.instance, 'available_copies', None))
        if total is not None and available is not None and available > total:
            raise serializers.ValidationError('available_copies cannot exceed total_copies.')
        return attrs

    def create(self, validated_data):
        # New books start fully available unless caller explicitly overrides it.
        validated_data.setdefault('available_copies', validated_data.get('total_copies', 0))
        return super().create(validated_data)


class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ['id', 'name', 'email', 'phone_number', 'membership_date', 'status']
        read_only_fields = ['membership_date']


class BookIssueSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    member_name = serializers.CharField(source='member.name', read_only=True)
    is_returned = serializers.BooleanField(read_only=True)

    class Meta:
        model = BookIssue
        fields = [
            'id', 'book', 'book_title', 'member', 'member_name',
            'issue_date', 'due_date', 'return_date', 'is_returned',
        ]
        read_only_fields = ['issue_date', 'return_date']


class IssueBookSerializer(serializers.Serializer):
    book_id = serializers.IntegerField()
    member_id = serializers.IntegerField()
    due_days = serializers.IntegerField(required=False, default=14, min_value=1)


class ReturnBookSerializer(serializers.Serializer):
    issue_id = serializers.IntegerField()
