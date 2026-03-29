from rest_framework import serializers
from django.contrib.auth import get_user_model
from core.models import PatientProfile, DoctorProfile, LabProfile

User = get_user_model()  # core.CustomUser

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    gender = serializers.CharField(required=False, allow_blank=True)
    blood_group = serializers.CharField(required=False, allow_blank=True)
    abha_address = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    emergency_contact = serializers.CharField(required=False, allow_blank=True)
    specialization = serializers.CharField(required=False, allow_blank=True)
    registration_no = serializers.CharField(required=False, allow_blank=True)
    lab_name = serializers.CharField(required=False, allow_blank=True)
    lab_address = serializers.CharField(required=False, allow_blank=True)
    lab_license_no = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "role",
            "first_name",
            "middle_name",
            "last_name",
            "password",
            "phone",
            "date_of_birth",
            "gender",
            "blood_group",
            "abha_address",
            "address",
            "emergency_contact",
            "specialization",
            "registration_no",
            "lab_name",
            "lab_address",
            "lab_license_no",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        phone = validated_data.pop("phone", "")
        date_of_birth = validated_data.pop("date_of_birth", None)
        gender = validated_data.pop("gender", "")
        blood_group = validated_data.pop("blood_group", "")
        abha_address = validated_data.pop("abha_address", "")
        address = validated_data.pop("address", "")
        emergency_contact = validated_data.pop("emergency_contact", "")
        specialization = validated_data.pop("specialization", "")
        registration_no = validated_data.pop("registration_no", "")
        lab_name = validated_data.pop("lab_name", "")
        lab_address = validated_data.pop("lab_address", "")
        lab_license_no = validated_data.pop("lab_license_no", "")
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # Create role-specific profile
        full_name = " ".join(
            part for part in [user.first_name, user.middle_name, user.last_name] if part
        ).strip()

        if user.role == "patient":
            PatientProfile.objects.get_or_create(
                user=user,
                defaults={
                    "full_name": full_name or user.username,
                    "phone": user.phone or phone or "",
                    "date_of_birth": date_of_birth,
                    "gender": gender or None,
                    "blood_group": blood_group or None,
                    "abha_address": abha_address or "",
                    "address": address or "",
                    "emergency_contact": emergency_contact or "",
                },
            )
        elif user.role == "doctor":
            DoctorProfile.objects.get_or_create(
                user=user,
                defaults={
                    "full_name": full_name or user.username,
                    "specialization": specialization or "",
                    "registration_no": registration_no or f"REG-{user.id}",
                    "date_of_birth": date_of_birth,
                    "gender": gender or None,
                    "blood_group": blood_group or None,
                    "address": address or "",
                    "emergency_contact": emergency_contact or "",
                },
            )
        elif user.role == "lab":
            LabProfile.objects.get_or_create(
                user=user,
                defaults={
                    "name": lab_name or full_name or user.username,
                    "address": lab_address or "",
                    "license_no": lab_license_no or f"LAB-{user.id}",
                },
            )

        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username", "role", "first_name", "middle_name", "last_name"]
