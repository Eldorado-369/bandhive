# custom_user_serializers.py
from rest_framework import serializers
from .models import CustomUser

class CustomUserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['email', 'phone_number']
