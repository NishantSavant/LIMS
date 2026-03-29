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
    address = models.TextField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUP_CHOICES, blank=True, null=True)
    emergency_contact = models.CharField(max_length=20, blank=True, null=True)

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
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    blood_group = models.CharField(max_length=3, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=20, blank=True, null=True)

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
        ("rejected", "Rejected"),
    ]

    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE)
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE)
    lab = models.ForeignKey(LabProfile, on_delete=models.CASCADE)
    test_name = models.CharField(max_length=200)
    date = models.DateField(null=True, blank=True)
    time_slot = models.CharField(max_length=20, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    def __str__(self):
        return f"{self.patient.full_name} - {self.test_name}"


class Sample(models.Model):
    barcode = models.CharField(max_length=50, unique=True)
    sample_type = models.CharField(max_length=50)
    collection_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='collected')
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, null=True, blank=True, related_name='samples')
    
    def __str__(self):
        return self.barcode


class LabReport(TimestampedModel):
    sample = models.ForeignKey(Sample, on_delete=models.CASCADE, related_name='reports')
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='lab_reports')
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

# core/models.py - ADD THIS AT THE BOTTOM (after Prescription model)

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
    
    date = models.DateField(null=True, blank=True)  # Appointment date
    time_slot = models.CharField(max_length=20, null=True, blank=True)
    
    # Fix patient address (PatientProfile doesn't have 'address')
    patient_address = models.TextField(blank=True, null=True)
    
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
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)

    
    class Meta:
        unique_together = ['doctor', 'date', 'time_slot']


class PatientCase(TimestampedModel):
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, related_name='patient_cases')
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='cases')
    disease_name = models.CharField(max_length=255)
    medicines_given = models.TextField()
    prescriptions = models.TextField(blank=True, null=True)
    reports_required = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-updated_at', '-created_at']

    def __str__(self):
        return f"{self.patient.full_name} - {self.disease_name}"


class CaseReportRequest(TimestampedModel):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    ]

    case = models.ForeignKey(PatientCase, on_delete=models.CASCADE, related_name='report_requests')
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='case_report_requests')
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, related_name='case_report_requests')
    test_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    lab_report = models.ForeignKey(
        LabReport,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='case_report_requests',
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.patient.full_name} - {self.test_name} ({self.status})"


class CaseTimelineEvent(TimestampedModel):
    EVENT_CHOICES = [
        ('case_created', 'Case Created'),
        ('case_updated', 'Case Updated'),
        ('report_requested', 'Report Requested'),
        ('report_uploaded', 'Report Uploaded'),
        ('followup_created', 'Follow-up Created'),
        ('followup_completed', 'Follow-up Completed'),
    ]

    case = models.ForeignKey(PatientCase, on_delete=models.CASCADE, related_name='timeline_events')
    event_type = models.CharField(max_length=50, choices=EVENT_CHOICES)
    description = models.TextField()
    actor_role = models.CharField(max_length=20, blank=True, null=True)
    actor_name = models.CharField(max_length=255, blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']


class FollowUpTask(TimestampedModel):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    ]

    case = models.ForeignKey(PatientCase, on_delete=models.CASCADE, related_name='followup_tasks')
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, related_name='followup_tasks')
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name='followup_tasks')
    title = models.CharField(max_length=255)
    details = models.TextField(blank=True, null=True)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    class Meta:
        ordering = ['status', 'due_date', '-created_at']


class Notification(TimestampedModel):
    ROLE_CHOICES = [
        ('patient', 'Patient'),
        ('doctor', 'Doctor'),
        ('lab', 'Lab'),
        ('admin', 'Admin'),
    ]

    target_role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    lab = models.ForeignKey(LabProfile, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
