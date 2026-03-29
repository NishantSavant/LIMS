# core/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import JSONField
from django.core.validators import RegexValidator
from django.utils.crypto import get_random_string


class CustomUser(AbstractUser):
    first_name = models.CharField(max_length=50, blank=True)
    middle_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)

    ROLE_CHOICES = [
        ("patient", "Patient"),
        ("doctor", "Doctor"),
        ("lab", "Lab Staff"),
        ("admin", "Admin"),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="patient")
    phone = models.CharField(max_length=15, blank=True, null=True)
    abha_id = models.CharField(max_length=50, unique=True, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ---------- Unique ID generators ----------

def generate_patient_unique_id() -> str:
    # Example: P-XXXXXXXX
    return "P-" + get_random_string(8).upper()


def generate_doctor_unique_id() -> str:
    # Example: D-XXXXXXXX
    return "D-" + get_random_string(8).upper()


def generate_lab_unique_id() -> str:
    # Example: L-XXXXXXXX
    return "L-" + get_random_string(8).upper()


# ---------- Profile models with unique IDs ----------

class PatientProfile(TimestampedModel):
    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
    ]

    BLOOD_GROUP_CHOICES = [
        ("A+", "A+"),
        ("A-", "A-"),
        ("B+", "B+"),
        ("B-", "B-"),
        ("AB+", "AB+"),
        ("AB-", "AB-"),
        ("O+", "O+"),
        ("O-", "O-"),
    ]
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    # unique patient ID stored in this table
    patient_unique_id = models.CharField(
    max_length=20,
    unique=True,
    editable=False,
    default=generate_patient_unique_id,
)


    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=15)
    date_of_birth = models.DateField(blank=True, null=True)
    abha_address = models.CharField(max_length=100, blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES, blank=True, null=True)

    def __str__(self):
        return f"{self.full_name} ({self.patient_unique_id})"


class DoctorProfile(TimestampedModel):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    # unique doctor ID
    doctor_unique_id = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        default=generate_doctor_unique_id,
    )

    full_name = models.CharField(max_length=200)
    specialization = models.CharField(max_length=100)
    registration_no = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return f"Dr. {self.full_name} ({self.doctor_unique_id})"


class LabProfile(TimestampedModel):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    # unique lab ID
    lab_unique_id = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        default=generate_lab_unique_id,
    )

    name = models.CharField(max_length=200)
    address = models.TextField()
    license_no = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return f"{self.name} ({self.lab_unique_id})"


# ---------- Other domain models ----------

class Appointment(TimestampedModel):
    STATUS_CHOICES = [
        ("scheduled", "Scheduled"),
        ("confirmed", "Confirmed"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE)
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, null=True, blank=True)
    lab = models.ForeignKey(LabProfile, on_delete=models.CASCADE, null=True, blank=True)
    date_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="scheduled")

    def __str__(self):
        return f"{self.patient} - {self.date_time}"


class LabTestOrder(TimestampedModel):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("sample_collected", "Sample Collected"),
        ("in_testing", "In Testing"),
        ("results_ready", "Results Ready"),
        ("reported", "Reported"),
    ]

    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE)
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE)
    lab = models.ForeignKey(LabProfile, on_delete=models.CASCADE)
    test_name = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    def __str__(self):
        return f"{self.patient.full_name} - {self.test_name}"


class Sample(models.Model):
    barcode = models.CharField(max_length=50, unique=True)
    sample_type = models.CharField(max_length=50)
    collection_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='collected')
    
    def __str__(self):
        return self.barcode


class LabReport(TimestampedModel):
    sample = models.ForeignKey(Sample, on_delete=models.CASCADE, related_name='reports')
    results = models.JSONField(blank=True, null=True) 
    doctor_notes = models.TextField(blank=True)
    is_flagged = models.BooleanField(default=False)

    # 🔹 New: actual file storage for uploaded report
    report_file = models.FileField(upload_to='reports/', blank=True, null=True)
    report_type = models.CharField(max_length=100, blank=True, null=True) 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Report {self.sample.barcode}"



class Prescription(TimestampedModel):
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE)
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE)
    medicines = JSONField(default=dict)

    def __str__(self):
        return f"Prescription for {self.patient.full_name}"

class DoctorPatientLink(TimestampedModel):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    doctor = models.ForeignKey(
        DoctorProfile, 
        on_delete=models.CASCADE, 
        related_name='patient_links'
    )
    patient = models.ForeignKey(
        PatientProfile, 
        on_delete=models.CASCADE, 
        related_name='doctor_links'
    )
    requested_by = models.CharField(
        max_length=10, 
        choices=[('patient', 'Patient'), ('doctor', 'Doctor')]
    )
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    
    class Meta:
        unique_together = ['doctor', 'patient']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.doctor.doctor_unique_id} ↔ {self.patient.patient_unique_id}"

class AppointmentRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE)
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE)
    date = models.DateField()
    time_slot = models.CharField(max_length=20)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['doctor', 'date', 'time_slot']

# core/models.py ends here

# core/serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import (
    CustomUser,
    PatientProfile,
    DoctorProfile,
    LabProfile,
    Appointment,
    LabTestOrder,
    Sample,
    LabReport,
    Prescription,
    DoctorPatientLink,
    AppointmentRequest, 
)
from rest_framework import serializers
from .models import Sample

class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'password', 'role', 'phone', 'abha_id')
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user

class PatientProfileSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)

    class Meta:
        model = PatientProfile
        # explicitly list fields you want editable from the settings page
        fields = [
            "id",
            "user",
            "patient_unique_id",   # if you want to show it, keep read‑only
            "full_name",
            "date_of_birth",
            "gender",
            "blood_group",
            "phone",
            "abha_address",
            # later: "gender", "blood_group", "city", etc., when you add them
        ]
        read_only_fields = ["id", "user", "patient_unique_id"]

class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = ['id', 'full_name', 'doctor_unique_id', 'specialization']

class LabProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabProfile
        fields = ['id', 'full_name', 'lab_unique_id']


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = '__all__'

class LabTestOrderBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTestOrder
        fields = ["id", "test_name", "created_at"]

class SampleForReportSerializer(serializers.ModelSerializer):
    test_order = LabTestOrderBasicSerializer(read_only=True)

    class Meta:
        model = Sample
        fields = ["id", "barcode", "test_order"]

class LabReportSerializer(serializers.ModelSerializer):
    sample = SampleForReportSerializer(read_only=True)  # nested sample

    class Meta:
        model = LabReport
        fields = [
            'id', 'created_at', 'updated_at', 'results', 'doctor_notes', 
            'is_flagged', 'report_file', 'sample', 'report_type'  # ← EXPLICITLY ADD
        ]


class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = '__all__'

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = [
            "id",
            "patient_id",   # the unique ID field you add
            "name",
            "email",
            # add other fields: phone, dob, etc.
        ]
        read_only_fields = ["patient_id"]

class DoctorPatientLinkSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    doctor_id = serializers.CharField(source='doctor.doctor_unique_id', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_id = serializers.CharField(source='patient.patient_unique_id', read_only=True)
    
    class Meta:
        model = DoctorPatientLink
        fields = [
            'id', 'doctor', 'patient', 'doctor_name', 'doctor_id', 
            'patient_name', 'patient_id', 'requested_by', 'status', 'created_at'
        ]

class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = ['id', 'full_name', 'specialization', 'doctor_unique_id', 'available_slots']

class AppointmentRequestSerializer(serializers.ModelSerializer):
    doctor = DoctorSerializer(read_only=True)
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    patient_id = serializers.CharField(source='patient.patient_unique_id', read_only=True)
    
    class Meta:
        model = AppointmentRequest
        fields = '__all__'

class LabProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabProfile
        fields = ['id', 'name', 'location', 'lab_unique_id']  # Adjust fields



class SampleSerializer(serializers.ModelSerializer):
    """Safe serializer - NO test_order dependency"""
    class Meta:
        model = Sample
        fields = ['id', 'barcode', 'sample_type', 'collection_date', 'status']

class PendingSampleSerializer(serializers.ModelSerializer):
    """Simple pending sample serializer"""
    class Meta:
        model = Sample
        fields = ['id', 'barcode', 'sample_type', 'collection_date', 'status']
# core/serializers.py ends here

# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import *
from django.utils.functional import lazy

router = DefaultRouter()
router.register(r'users', CustomUserViewSet)
router.register(r'patients', PatientProfileViewSet)
router.register(r'doctors', DoctorProfileViewSet)
router.register(r'labs', LabProfileViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'test-orders', LabTestOrderViewSet)
router.register(r'samples', SampleViewSet)
router.register(r'reports', LabReportViewSet)
router.register(r'prescriptions', PrescriptionViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("patients/", PatientListView.as_view(), name="patient-list"),
    path("patient/profile/", MyPatientProfileView.as_view(), name="my-patient-profile"),
    path("doctor/profile/", MyDoctorProfileView.as_view(), name="my-doctor-profile"),
    path("lab/profile/", MyLabProfileView.as_view(), name="my-lab-profile"),
    path('patient/appointment-request/', patient_appointment_request, name='patient_appointment_request'),
    path('patient/appointment-requests/', patient_appointment_requests, name='patient_requests'),
    path('doctor/appointment-requests/pending/', doctor_pending_requests, name='doctor_pending_requests'),
    path('doctor/appointments/upcoming/', doctor_upcoming_appointments, name='doctor_upcoming'),
    path('doctor/appointment/<int:pk>/approve/', approve_appointment, name='approve_appointment'),
    path('doctor/appointment/<int:pk>/reject/', reject_appointment, name='reject_appointment'),
    path('doctors/available/', available_doctors, name='available_doctors'),
    path('labs/available/', available_labs, name='available_labs'),
    path('patient/lab-request/', patient_lab_request, name='patient_lab_request'),
    path('patient/lab-requests/', patient_lab_requests, name='patient_lab_requests'),
    path('lab/patients/search/', lab_patient_search, name='lab_patient_search'),
    path('lab/upload-report/', lab_upload_report, name='lab_upload_report'),
    path('lab/patient/lab-requests/', lab_patient_requests, name='lab-patient-requests'),
    path('patient/lab-reports/', patient_lab_reports, name='patient-lab-reports'),
    path('lab/doctor/lab-reports/', doctor_lab_reports, name='doctor-lab-reports'),
    path('lab/create-sample/', lab_create_sample, name='lab-create-sample'),
    path('lab/pending-samples/', lab_pending_samples, name='lab-pending-samples'),
    path('lab/scan-sample/', lab_scan_sample, name='lab-scan-sample'),
]
# core/urls.py ends here

# core/views.py
from django.db.models import Q
from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action, api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response 
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import *
from .serializers import *
from django.core.files.storage import default_storage
from django.conf import settings
from rest_framework.parsers import MultiPartParser, FormParser

# ✅ ROLE PERMISSIONS (Keep your existing classes)
class IsPatient(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'patient'

class IsDoctor(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'doctor'

class IsLabStaff(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'lab_staff' or request.user.role == 'lab'

class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current logged-in user with ROLE"""
        user = request.user
        serializer = self.get_serializer(user)
        data = serializer.data
        data['role'] = user.role
        return Response(data)

class PatientProfileViewSet(viewsets.ModelViewSet):
    queryset = PatientProfile.objects.all()
    serializer_class = PatientProfileSerializer
    permission_classes = [IsAuthenticated, IsPatient]  # ✅ Patients only!

class MyPatientProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = PatientProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = PatientProfile.objects.get_or_create(
            user=self.request.user,
            defaults={
                "full_name": self.request.user.get_full_name() or self.request.user.username,
                "phone": self.request.user.phone or "",
            },
        )
        return profile

class DoctorProfileViewSet(viewsets.ModelViewSet):
    queryset = DoctorProfile.objects.all()
    serializer_class = DoctorProfileSerializer
    permission_classes = [IsAuthenticated, IsDoctor]   # ✅ Doctors only!

class MyDoctorProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = DoctorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = DoctorProfile.objects.get_or_create(
            user=self.request.user,
            defaults={
                "full_name": self.request.user.get_full_name() or self.request.user.username,
                "specialization": "",
                "registration_no": f"REG-{self.request.user.id}",
            },
        )
        return profile

class LabProfileViewSet(viewsets.ModelViewSet):
    queryset = LabProfile.objects.all()
    serializer_class = LabProfileSerializer
    permission_classes = [IsAuthenticated, IsLabStaff] # ✅ Lab only!

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

class LabTestOrderViewSet(viewsets.ModelViewSet):
    queryset = LabTestOrder.objects.all()
    serializer_class = LabTestOrderBasicSerializer
    permission_classes = [IsAuthenticated]

class SampleViewSet(viewsets.ModelViewSet):
    queryset = Sample.objects.all()
    serializer_class = SampleForReportSerializer
    permission_classes = [IsAuthenticated]

class LabReportViewSet(viewsets.ModelViewSet):
    queryset = LabReport.objects.all()
    serializer_class = LabReportSerializer
    permission_classes = [IsAuthenticated]

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]

class PatientListView(generics.ListAPIView):
    serializer_class = PatientProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = PatientProfile.objects.all().order_by("full_name")

# ✅ DOCTOR-PATIENT LINKING ENDPOINTS (COMPLETE & FIXED)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsPatient])
def patient_request_doctor(request):
    doctor_id = request.data.get('doctor_id')
    doctor = get_object_or_404(DoctorProfile, doctor_unique_id=doctor_id)
    
    # ✅ Get patient profile (matches your MyPatientProfileView)
    patient_profile, _ = PatientProfile.objects.get_or_create(user=request.user)
    
    link, created = DoctorPatientLink.objects.get_or_create(
        doctor=doctor,
        patient=patient_profile,
        defaults={'requested_by': 'patient'}
    )
    
    if not created:
        if link.status == 'accepted':
            return Response({'error': 'Already connected'}, status=status.HTTP_400_BAD_REQUEST)
        link.status = 'pending'
        link.save()
    
    serializer = DoctorPatientLinkSerializer(link)
    return Response({'message': 'Request sent successfully', 'link': serializer.data})

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_pending_requests(request):
    doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
    requests = DoctorPatientLink.objects.filter(
        doctor=doctor_profile,
        status='pending'
    ).order_by('-created_at')
    serializer = DoctorPatientLinkSerializer(requests, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsDoctor])
def accept_patient_request(request, link_id):
    doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
    link = get_object_or_404(
        DoctorPatientLink, 
        id=link_id, 
        doctor=doctor_profile
    )
    link.status = 'accepted'
    link.save()
    serializer = DoctorPatientLinkSerializer(link)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPatient])
def patient_my_doctors(request):
    patient_profile, _ = PatientProfile.objects.get_or_create(user=request.user)
    links = DoctorPatientLink.objects.filter(patient=patient_profile, status='accepted').order_by('-created_at')
    serializer = DoctorPatientLinkSerializer(links, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_my_patients(request):
    doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
    links = DoctorPatientLink.objects.filter(doctor=doctor_profile, status='accepted').order_by('-created_at')
    serializer = DoctorPatientLinkSerializer(links, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_doctors(request):
    doctors = DoctorProfile.objects.filter(is_active=True).select_related('user')
    serializer = DoctorSerializer(doctors, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def patient_appointment_request(request):
    serializer = AppointmentRequestSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(patient_profile=request.user.patientprofile)
        return Response({'message': 'Request created'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPatient])
def patient_appointment_requests(request):
    """FIXED: Get patient's appointment requests"""
    try:
        patient_profile, _ = PatientProfile.objects.get_or_create(user=request.user)
        requests = AppointmentRequest.objects.filter(
            patient=patient_profile,  # ✅ Use PatientProfile
            # doctor=request.user.patient  # ❌ WRONG
        ).select_related('doctor')
        serializer = AppointmentRequestSerializer(requests, many=True)
        return Response(serializer.data)
    except PatientProfile.DoesNotExist:
        return Response([], status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_pending_requests(request):
    """FIXED: Get doctor's pending appointment requests"""
    try:
        # Get doctor's profile first
        doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
        
        requests = AppointmentRequest.objects.filter(
            doctor=doctor_profile,  # ✅ Use DoctorProfile, not request.user.doctor
            status='pending'
        ).select_related('patient')
        
        serializer = AppointmentRequestSerializer(requests, many=True)
        return Response(serializer.data)
    except DoctorProfile.DoesNotExist:
        return Response([], status=200)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def approve_appointment(request, pk):
    appointment = AppointmentRequest.objects.get(id=pk, doctor=request.user.doctor)
    appointment.status = 'approved'
    appointment.save()
    return Response({'message': 'Approved'})

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def reject_appointment(request, pk):
    appointment = AppointmentRequest.objects.get(id=pk, doctor=request.user.doctor)
    appointment.status = 'rejected'
    appointment.save()
    return Response({'message': 'Rejected'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def doctor_upcoming_appointments(request):
    appointments = AppointmentRequest.objects.filter(
        doctor=request.user.doctor, status='approved'
    ).select_related('patient')[:10]
    serializer = AppointmentRequestSerializer(appointments, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_labs(request):
    """Get available labs for patient booking"""
    labs = LabProfile.objects.filter(is_active=True).select_related('user')
    serializer = LabProfileSerializer(labs, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsPatient])
def patient_lab_request(request):
    """Patient lab test booking"""
    serializer = LabTestOrderBasicSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(patient_profile=request.user.patientprofile)  # ✅ Use your PatientProfile
        return Response({'message': 'Lab request created successfully!'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPatient])
def patient_lab_requests(request):
    """Get patient's lab requests"""
    lab_requests = LabTestOrder.objects.filter(patient_profile=request.user.patientprofile)
    serializer = LabTestOrderBasicSerializer(lab_requests, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])  # later you can restrict to IsLabStaff
def lab_patient_search(request):
    """
    Search patients by name / patient ID / phone for lab upload page.
    URL: GET /api/lab/patients/search/?q=TERM
    """
    query = request.GET.get('q', '').strip()
    if not query:
        return Response([], status=200)

    patients = PatientProfile.objects.filter(
        Q(full_name__icontains=query) |
        Q(patient_unique_id__icontains=query) |
        Q(phone__icontains=query)
    ).order_by('full_name')[:25]

    serializer = PatientProfileSerializer(patients, many=True)
    return Response(serializer.data, status=200)



# Add to views.py (same as your MyPatientProfileView/MyDoctorProfileView)
class MyLabProfileView(generics.RetrieveAPIView):
    serializer_class = LabProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return get_object_or_404(LabProfile, user=self.request.user)

@api_view(['POST'])
@permission_classes([IsLabStaff])
@parser_classes([MultiPartParser, FormParser])
def lab_upload_report(request):
    sample_id = request.data.get('sample_id')
    report_file = request.FILES.get('report_file')

    if not sample_id:
        return Response({'error': 'sample_id required'}, status=400)

    try:
        sample = Sample.objects.get(id=sample_id)
    except Sample.DoesNotExist:
        return Response({'error': 'Sample not found'}, status=404)

    # ✅ FIXED - NO patient field needed!
    raw_results = request.data.get('results', '{}')
    try:
        import json
        results_value = json.loads(raw_results) if isinstance(raw_results, str) else raw_results
    except:
        results_value = {"raw": raw_results}

    report = LabReport.objects.create(
        sample=sample,  # ✅ Only sample needed
        report_file=report_file,
        results=results_value,
        doctor_notes=request.data.get('doctor_notes', ''),
        is_flagged=str(request.data.get('is_flagged', 'false')).lower() in ['true', '1', 'yes'],
        report_type=request.data.get('report_type', 'General')
    )

    return Response({
        'message': 'Report uploaded successfully!',
        'report_id': report.id,
        'sample_barcode': sample.barcode
    }, status=201)




@api_view(['GET'])
@permission_classes([IsAuthenticated])  # ← Lab staff only
def lab_patient_requests(request):
    """
    Get lab test orders for a SPECIFIC patient (for lab upload workflow)
    URL: GET /api/patient/lab-requests/?patient_id=123
    """
    patient_id = request.GET.get('patient_id')
    
    if not patient_id:
        return Response({'error': 'patient_id query parameter required'}, status=400)
    
    try:
        patient = PatientProfile.objects.get(id=patient_id)
    except PatientProfile.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=404)
    
    # Get lab test orders for this patient with samples
    lab_requests = LabTestOrder.objects.filter(
        patient_profile=patient
    ).select_related('patient_profile').prefetch_related('samples')
    
    # Format for frontend (test_name + sample info)
    data = []
    for order in lab_requests:
        sample_info = []
        for sample in order.samples.all():
            data.append({
                'id': order.id,
                'test_name': order.test_name,  # Assuming you have this field
                'sample': {
                    'id': sample.id,
                    'barcode': getattr(sample, 'barcode', f'SAMPLE-{sample.id}')
                }
            })
        if not order.samples.exists():
            data.append({
                'id': order.id,
                'test_name': order.test_name,
            })
    
    return Response(data, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPatient])
def patient_lab_reports(request):
    try:
        patient_profile = PatientProfile.objects.get(user=request.user)
        
        # Try direct patient filter first
        reports = LabReport.objects.filter(patient=patient_profile).select_related('patient', 'sample').order_by('-created_at')
        
        # If none found, try through sample chain (backup)
        if not reports.exists():
            reports = LabReport.objects.filter(
                sample__test_order__patient=patient_profile
            ).select_related('patient', 'sample__test_order').order_by('-created_at')
        
        serializer = LabReportSerializer(reports, many=True)
        print(f"Found {reports.count()} reports for patient {patient_profile.id}")
        return Response(serializer.data)
    except Exception as e:
        print(f"Error: {e}")
        return Response([])



@api_view(['GET']) 
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_lab_reports(request):
    """Doctor sees lab reports for their patients"""
    profile = DoctorProfile.objects.get(user=request.user)
    reports = LabReport.objects.filter(
        sample__test_order__doctor=profile
    ).select_related('sample__test_order__patient')[:20]
    serializer = LabReportSerializer(reports, many=True)
    return Response(serializer.data)

# A. CREATE SAMPLE (enter patient_id → auto-generate barcode)
@api_view(['POST'])
@permission_classes([IsLabStaff])
def lab_create_sample(request):
    patient_id = request.data.get('patient_id')
    sample_type = request.data.get('sample_type')
    
    if not patient_id or not sample_type:
        return Response({'error': 'patient_id and sample_type required'}, status=400)
    
    try:
        patient = PatientProfile.objects.get(id=patient_id)
    except PatientProfile.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=404)
    
    # ✅ FIXED - Simple sequential barcode, NO database filter
    import uuid
    last_sample = Sample.objects.order_by('-id').first()
    sample_num = (last_sample.id if last_sample else 0) + 1
    barcode = f"SAMPLE-{patient.patient_unique_id}-{sample_num:04d}"
    
    sample = Sample.objects.create(
        barcode=barcode,
        sample_type=sample_type,
        collection_date=timezone.now()
        # No test_order needed
    )
    
    return Response({
        'success': True,
        'sample_id': sample.id,
        'barcode': sample.barcode,
        'patient_name': patient.full_name,
        'patient_id': patient.id
    }, status=201)


# B. PENDING SAMPLES LIST
@api_view(['GET'])
@permission_classes([IsLabStaff])
def lab_pending_samples(request):
    """Lab sees pending samples - NO relationships needed"""
    
    # ✅ RAW VALUES - No ORM relationships
    pending_samples = Sample.objects.filter(
        status__in=['collected', 'pending']
    ).values(
        'id', 'barcode', 'sample_type', 'collection_date', 'status'
    ).order_by('-collection_date')
    
    samples_list = list(pending_samples)
    
    return Response({
        'pending_count': len(samples_list),
        'samples': samples_list
    })

# C. SCAN BARCODE → AUTO-FILL UPLOAD FORM
@api_view(['POST'])
@permission_classes([IsLabStaff])
def lab_scan_sample(request):
    barcode = request.data.get('barcode')
    try:
        sample = Sample.objects.get(barcode=barcode)
        serializer = SampleSerializer(sample)
        return Response({
            'success': True,
            'sample': serializer.data,
            'patient': sample.test_order.patient.full_name,
            'test_name': sample.test_order.test_name
        })
    except Sample.DoesNotExist:
        return Response({'error': 'Sample not found'}, status=404)
# core/views.py ends here

# core/apps.py
from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
# core/apps.py ends here