from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import serializers
from django.core.exceptions import ValidationError

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Remove the default username field
        self.fields.pop('username', None)
        # Add both email and username fields as not required
        self.fields['email'] = serializers.EmailField(required=False, allow_blank=True)
        self.fields['username'] = serializers.CharField(required=False, allow_blank=True)
        self.fields['username_or_email'] = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        email = attrs.get('email')
        username = attrs.get('username')
        username_or_email = attrs.get('username_or_email')
        password = attrs.get('password')

        print(f"[Auth] Login attempt - Email: {email}, Username: {username}, UsernameOrEmail: {username_or_email}")

        # Check if we have the required fields
        if not password or (not email and not username and not username_or_email):
            error_msg = 'Please provide both username/email and password'
            print(f"[Auth] Validation error: {error_msg}")
            raise ValidationError(error_msg)

        try:
            # Determine the lookup field and value
            if email:
                lookup = {'email__iexact': email}
            elif username:
                lookup = {'username__iexact': username}
            else:  # username_or_email
                if '@' in username_or_email:
                    lookup = {'email__iexact': username_or_email}
                else:
                    lookup = {'username__iexact': username_or_email}

            user = User.objects.get(**lookup)
            print(f"[Auth] Found user: {user.username} (ID: {user.id})")

            if not user.check_password(password):
                error_msg = 'Invalid password'
                print(f"[Auth] {error_msg} for user: {user.username}")
                raise ValidationError('Invalid username/email or password')

            if not user.is_active:
                error_msg = 'Account is inactive'
                print(f"[Auth] {error_msg} for user: {user.username}")
                raise ValidationError('This account is inactive')

            refresh = self.get_token(user)
            print(f"[Auth] Login successful for user: {user.username}")

            return {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_staff': user.is_staff,
                    'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                }
            }
            
        except User.DoesNotExist:
            error_msg = f'No account found with {lookup}: {username_or_email}'
            print(f"[Auth] {error_msg}")
            raise ValidationError('Invalid username/email or password')
        except Exception as e:
            print(f"[Auth] Unexpected error during login: {str(e)}")
            raise ValidationError('An error occurred during login')

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
