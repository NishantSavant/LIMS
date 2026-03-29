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
    path('', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("patients/", PatientListView.as_view(), name="patient-list"),
    path("patient/profile/", MyPatientProfileView.as_view(), name="my-patient-profile"),
    path("doctor/profile/", MyDoctorProfileView.as_view(), name="my-doctor-profile"),
    path("lab/profile/", MyLabProfileView.as_view(), name="my-lab-profile"),
    path('doctor/link-requests/', doctor_pending_link_requests, name='doctor_link_requests'),
    path('doctor/patient-request/<int:link_id>/accept/', accept_patient_request, name='accept_patient_request'),
    path('doctor/patient-request/<int:link_id>/reject/', reject_patient_request, name='reject_patient_request'),
    path('patient/appointment-request/', patient_appointment_request, name='patient_request'),
    path('patient/appointment-requests/', patient_appointment_requests, name='patient_requests'),
    path('doctor/pending-requests/', doctor_pending_requests, name='doctor-pending-requests'),
    path('doctor/appointments/upcoming/', doctor_upcoming_appointments, name='doctor_upcoming'),
    path('doctor/appointments/<int:pk>/approve/', approve_appointment, name='approve-appointment'),
    path('doctor/appointments/<int:pk>/reject/', reject_appointment, name='reject-appointment'),
    path('labs-available/', available_labs, name='labs-available'),
    path('patient/lab-request/', patient_lab_request, name='patient_lab_request'),
    path('patient/lab-requests/', patient_lab_requests, name='patient_lab_requests'),
    path('lab/appointments/requests/', lab_appointment_requests, name='lab-appointment-requests'),
    path('lab/appointments/<int:pk>/approve/', lab_approve_request, name='lab-approve-request'),
    path('lab/appointments/<int:pk>/reject/', lab_reject_request, name='lab-reject-request'),
    path('lab/patients/search/', lab_patient_search, name='lab_patient_search'),
    path('lab/patient/case-report-requests/', lab_patient_case_report_requests, name='lab_patient_case_report_requests'),
    path('lab/upload-report/', lab_upload_report, name='lab_upload_report'),
    path('lab/patient/lab-requests/', lab_patient_requests, name='lab-patient-requests'),
    path('patient/lab-reports/', patient_lab_reports, name='patient-lab-reports'),
    path('doctor/lab-reports/', doctor_lab_reports, name='doctor-lab-reports'),
    path('lab/create-sample/', lab_create_sample, name='lab-create-sample'),
    path('lab/pending-samples/', lab_pending_samples, name='lab-pending-samples'),
    path('lab/stats/', lab_stats, name='lab-stats'),
    path('lab/sample-history/', lab_sample_history, name='lab-sample-history'),
    path('lab/scan-sample/', lab_scan_sample, name='lab-scan-sample'),
    path('available-doctors/', available_doctors, name='available-doctors'),
    path('appointments/availability/', check_doctor_availability, name='check-availability'),
    path('book-appointment/', book_appointment, name='book-appointment'),
    path('patient/appointments/', patient_appointments, name='patient-appointments'),
    path('doctor/appointments/', doctor_appointments, name='doctor-appointments'),
    path('patient/stats/', patient_stats, name='patient_stats'),
    path('appointments/<int:pk>/cancel/', CancelAppointmentView.as_view(), name='cancel-appointment'),
    path('appointments/<int:pk>/reschedule/', RescheduleAppointmentView.as_view(), name='reschedule-appointment'),
    path('doctor/appointments/past/', doctor_past_appointments, name='doctor_past_appointments'),
    path('doctor/patient/<str:patient_id>/', doctor_patient_detail, name='doctor_patient_detail'),
    path('doctor/patient-cases/', doctor_create_patient_case, name='doctor_create_patient_case'),
    path('doctor/patient/<str:patient_id>/cases/', doctor_patient_cases, name='doctor_patient_cases'),
    path('doctor/patient-cases/<int:pk>/', doctor_update_patient_case, name='doctor_update_patient_case'),
    path('doctor/patient-cases/<int:case_id>/timeline/', doctor_case_timeline, name='doctor_case_timeline'),
    path('doctor/patient-cases/<int:case_id>/followups/', doctor_create_followup_task, name='doctor_create_followup_task'),
    path('doctor/followups/', doctor_followup_tasks, name='doctor_followup_tasks'),
    path('doctor/followups/<int:pk>/', doctor_update_followup_task, name='doctor_update_followup_task'),
    path('patient/cases/', patient_cases, name='patient_cases'),
    path('patient/cases/<int:case_id>/timeline/', patient_case_timeline, name='patient_case_timeline'),
    path('patient/followups/', patient_followup_tasks, name='patient_followup_tasks'),
    path('notifications/', my_notifications, name='my_notifications'),
    path('notifications/<int:pk>/read/', mark_notification_read, name='mark_notification_read'),
]
