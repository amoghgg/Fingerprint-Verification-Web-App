from django.urls import path
from .views import verify_fingerprint

urlpatterns = [
    path("verify-fingerprint/", verify_fingerprint, name="verify_fingerprint"),
]
