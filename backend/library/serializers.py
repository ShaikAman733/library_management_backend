from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.utils.text import slugify
from rest_framework import serializers

from .models import Book, BookIssue, Category, Member


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            is_staff=False,
        )


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
        instance = getattr(self, 'instance', None)
        total_copies = attrs.get('total_copies', instance.total_copies if instance else None)

        if instance and 'total_copies' in attrs and total_copies < instance.available_copies:
            raise serializers.ValidationError('total_copies cannot be less than the currently available copies.')

        return attrs

    def create(self, validated_data):
        validated_data.setdefault('available_copies', validated_data.get('total_copies', 0))
        return super().create(validated_data)


class MemberSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Member
        fields = ['id', 'name', 'email', 'phone_number', 'membership_date', 'status', 'password']
        read_only_fields = ['membership_date']

    def _build_username(self, validated_data, member):
        if validated_data.get('email'):
            return validated_data['email']

        candidate = slugify(member.name) or f'member-{member.pk}'
        candidate = candidate[:150]
        base = candidate
        count = 1
        while User.objects.filter(username=candidate).exists():
            candidate = f'{base[:148-len(str(count))]}{count}'
            count += 1
        return candidate

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        member = super().create(validated_data)

        if password:
            username = self._build_username(validated_data, member)
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'email': validated_data.get('email', '')},
            )
            user.set_password(password)
            user.email = validated_data.get('email', user.email)
            user.save()

        return member


class BookIssueSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    member_name = serializers.CharField(source='member.name', read_only=True)
    status = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = BookIssue
        fields = [
            'id', 'book', 'book_title', 'member', 'member_name',
            'issue_date', 'due_date', 'return_date', 'status',
        ]
        read_only_fields = ['issue_date', 'return_date']

    def get_status(self, obj):
        return 'returned' if obj.return_date else 'issued'


class IssueBookSerializer(serializers.Serializer):
    book_id = serializers.IntegerField()
    member_id = serializers.IntegerField(required=False, allow_null=True)
    due_days = serializers.IntegerField(required=False, default=14, min_value=1, max_value=60)


class ReturnBookSerializer(serializers.Serializer):
    issue_id = serializers.IntegerField()
