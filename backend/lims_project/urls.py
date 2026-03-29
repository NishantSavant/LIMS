from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView  # add
from core import views
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/", include("core.urls")),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),  # new
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),  # optional
    path('api/doctor/patient-request/', views.patient_request_doctor, name='patient_request_doctor'),
    path('api/doctor/pending-requests/', views.doctor_pending_requests, name='doctor_pending_requests'),
    path('api/doctor/patient-request/<int:link_id>/accept/', views.accept_patient_request, name='accept_patient_request'),
    path('api/patient/my-doctors/', views.patient_my_doctors),
    path('api/doctor/my-patients/', views.doctor_my_patients),
    path('api/doctor/available-doctors/', views.available_doctors, name='available_doctors'),
    path('api/lab/available-labs/', views.available_labs, name='available_labs'),
    path('api/patient/lab-request/', views.patient_lab_request, name='patient_lab_request'),
    path('api/patient/lab-requests/', views.patient_lab_requests, name='patient_lab_requests'),
    path('api/lab/patients/search/', views.lab_patient_search, name='lab_patient_search'),
    path('api/lab/upload-report/', views.lab_upload_report, name='lab_upload_report'),
    path('api/lab/patient/lab-requests/', views.lab_patient_requests, name  ='lab-patient-requests'),
    path('api/patient/lab-reports/', views.patient_lab_reports, name='patient-lab-reports'),
    path('api/lab/doctor/lab-reports/', views.doctor_lab_reports, name='doctor-lab-reports'),
    path('available-doctors/', views.available_doctors, name='available-doctors'),
    path('appointments/availability/', views.check_doctor_availability, name='check-availability'),
    path('book-appointment/', views.book_appointment, name='book-appointment'),
    path('patient/appointments/', views.patient_appointments, name='patient-appointments'),
    path('doctor/appointments/', views.doctor_appointments, name='doctor-appointments'),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
