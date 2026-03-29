from django.utils import timezone
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
    PatientCase,
    CaseReportRequest,
    CaseTimelineEvent,
    FollowUpTask,
    Notification,
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
            "address",
            "emergency_contact",
        ]
        read_only_fields = ["id", "user", "patient_unique_id"]

class DoctorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = [
            'id',
            'full_name',
            'doctor_unique_id',
            'specialization',
            'registration_no',
            'date_of_birth',
            'gender',
            'blood_group',
            'address',
            'emergency_contact',
        ]
        read_only_fields = ['id', 'doctor_unique_id']

class LabProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabProfile
        fields = ['id', 'lab_unique_id', 'name', 'address', 'license_no']
        read_only_fields = ['id', 'lab_unique_id']


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = '__all__'

class LabTestOrderBasicSerializer(serializers.ModelSerializer):
    lab_name = serializers.CharField(source='lab.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)

    class Meta:
        model = LabTestOrder
        fields = ["id", "test_name", "date", "time_slot", "status", "created_at", "lab_name", "doctor_name"]
        read_only_fields = ["id", "status", "created_at"]

class SampleForReportSerializer(serializers.ModelSerializer):
    test_order = LabTestOrderBasicSerializer(read_only=True)

    class Meta:
        model = Sample
        fields = ["id", "barcode", "test_order"]

class LabReportSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_unique_id = serializers.CharField(source='patient.patient_unique_id', read_only=True)
    
    class Meta:
        model = LabReport
        fields = [
            'id',
            'created_at',
            'updated_at',
            'results',
            'doctor_notes',
            'is_flagged',
            'report_file',
            'sample',
            'report_type',
            'patient_name',
            'patient_unique_id',
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
    patient_phone = serializers.CharField(source='patient.phone', default='', read_only=True)  # ✅ ADD
    patient_address = serializers.CharField(read_only=True)
    requested_at = serializers.DateTimeField(source='created_at', read_only=True)
    approved_at = serializers.DateTimeField(source='updated_at', read_only=True)
    
        
    class Meta:
        model = DoctorPatientLink
        fields = [
            'id', 'doctor_name', 'doctor_id', 'patient_name', 'patient_id', 
            'patient_phone', 'patient_address', 'date', 'time_slot', 
            'status', 'requested_at', 'approved_at', 'created_at'
        ]


class DoctorBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = ['id', 'full_name', 'specialization', 'doctor_unique_id']


class AppointmentRequestSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    patient_unique_id = serializers.CharField(source='patient.patient_unique_id', read_only=True) 


    class Meta:
        model = AppointmentRequest
        fields = ['id', 'patient_name', 'patient_unique_id', 'doctor_name', 'date', 'time_slot', 'status', 'created_at', 
                  'approved_at', 'rejected_at']

class SampleSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_unique_id = serializers.CharField(source='patient.patient_unique_id', read_only=True)
    patient_id = serializers.IntegerField(source='patient.id', read_only=True)
    class Meta:
        model = Sample
        fields = ['id', 'barcode', 'sample_type', 'collection_date', 'status', 'patient_id', 'patient_name', 'patient_unique_id']

class PendingSampleSerializer(serializers.ModelSerializer):
    """Simple pending sample serializer"""
    class Meta:
        model = Sample
        fields = ['id', 'barcode', 'sample_type', 'collection_date', 'status']
    
    def get_can_cancel(self, obj):
        today = timezone.now().date()
        return obj.status in ['pending', 'approved'] and obj.date >= today
    
    def get_can_reschedule(self, obj):
        today = timezone.now().date()
        return obj.status in ['pending', 'approved'] and obj.date >= today


class PatientCaseSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_unique_id = serializers.CharField(source='patient.patient_unique_id', read_only=True)
    report_requests = serializers.SerializerMethodField()

    class Meta:
        model = PatientCase
        fields = [
            'id',
            'doctor',
            'doctor_name',
            'patient',
            'patient_name',
            'patient_unique_id',
            'disease_name',
            'medicines_given',
            'prescriptions',
            'reports_required',
            'notes',
            'report_requests',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'doctor',
            'doctor_name',
            'patient',
            'patient_name',
            'patient_unique_id',
            'created_at',
            'updated_at',
        ]

    def get_report_requests(self, obj):
        requests = obj.report_requests.select_related('lab_report').all()
        return [{
            'id': r.id,
            'test_name': r.test_name,
            'status': r.status,
            'report_id': r.lab_report.id if r.lab_report else None,
            'report_file': r.lab_report.report_file.url if r.lab_report and r.lab_report.report_file else None,
            'created_at': r.created_at,
            'updated_at': r.updated_at,
        } for r in requests]


class CaseReportRequestSerializer(serializers.ModelSerializer):
    report_file = serializers.CharField(source='lab_report.report_file', read_only=True)
    report_id = serializers.IntegerField(source='lab_report.id', read_only=True)

    class Meta:
        model = CaseReportRequest
        fields = [
            'id',
            'case',
            'patient',
            'doctor',
            'test_name',
            'status',
            'lab_report',
            'report_id',
            'report_file',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'case',
            'patient',
            'doctor',
            'status',
            'lab_report',
            'report_id',
            'report_file',
            'created_at',
            'updated_at',
        ]


class CaseTimelineEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseTimelineEvent
        fields = [
            'id',
            'case',
            'event_type',
            'description',
            'actor_role',
            'actor_name',
            'metadata',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class FollowUpTaskSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)

    class Meta:
        model = FollowUpTask
        fields = [
            'id',
            'case',
            'doctor',
            'doctor_name',
            'patient',
            'patient_name',
            'title',
            'details',
            'due_date',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'case', 'doctor', 'doctor_name', 'patient', 'patient_name', 'created_at', 'updated_at'
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id',
            'target_role',
            'patient',
            'doctor',
            'lab',
            'title',
            'message',
            'is_read',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'target_role', 'patient', 'doctor', 'lab', 'title', 'message', 'created_at', 'updated_at']
