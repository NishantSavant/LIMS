from django.urls import path
from .views import MeView, PasswordResetConfirmView, PasswordResetRequestView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("users/me/", MeView.as_view(), name="me"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
]
