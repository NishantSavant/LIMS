from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class PasswordResetRequestView(APIView):
    """Email a reset link without revealing whether an account exists."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip()
        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password/{uid}/{token}"
            send_mail(
                subject='LIMS password reset',
                message=f'Use this link to reset your password: {reset_url}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        return Response({'detail': 'If an account uses that email address, a reset link has been sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            user_id = force_str(urlsafe_base64_decode(request.data.get('uid', '')))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'detail': 'This reset link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        token = request.data.get('token', '')
        password = request.data.get('password', '')
        if not default_token_generator.check_token(user, token):
            return Response({'detail': 'This reset link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_password(password, user)
        except ValidationError as error:
            return Response({'detail': list(error.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(password)
        user.save(update_fields=['password'])
        return Response({'detail': 'Password reset successful.'})
