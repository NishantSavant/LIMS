# core/views.py - COMPLETE FIXED FILE
from django.db import IntegrityError
from django.db.models import Q
from typing import List, Optional
from rest_framework.views import APIView
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
from django.utils import timezone
from datetime import date, timedelta, datetime
import logging

logger = logging.getLogger(__name__)

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


def _extract_report_tests(raw_reports_required: str) -> List[str]:
    if not raw_reports_required:
        return []
    # Accept comma/newline/semicolon separated report names.
    chunks = []
    for block in str(raw_reports_required).replace(';', '\n').split('\n'):
        chunks.extend([part.strip() for part in block.split(',')])
    seen = set()
    tests = []
    for name in chunks:
        if name and name.lower() not in seen:
            seen.add(name.lower())
            tests.append(name)
    return tests


def _create_timeline_event(case: PatientCase, event_type: str, description: str, actor_role: str = '', actor_name: str = '', metadata: Optional[dict] = None):
    CaseTimelineEvent.objects.create(
        case=case,
        event_type=event_type,
        description=description,
        actor_role=actor_role or '',
        actor_name=actor_name or '',
        metadata=metadata or {},
    )


def _notify_patient(patient: PatientProfile, title: str, message: str):
    Notification.objects.create(
        target_role='patient',
        patient=patient,
        title=title,
        message=message,
    )


def _notify_doctor(doctor: DoctorProfile, title: str, message: str):
    Notification.objects.create(
        target_role='doctor',
        doctor=doctor,
        title=title,
        message=message,
    )


def _notify_lab(lab: LabProfile, title: str, message: str):
    Notification.objects.create(
        target_role='lab',
        lab=lab,
        title=title,
        message=message,
    )

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
                "date_of_birth": None,
                "gender": "",
                "blood_group": "",
                "address": "",
                "emergency_contact": "",
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
def doctor_pending_link_requests(request):
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

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsDoctor])
def reject_patient_request(request, link_id):
    doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
    link = get_object_or_404(
        DoctorPatientLink,
        id=link_id,
        doctor=doctor_profile
    )
    link.status = 'rejected'
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
    """Patient's ALL appointment requests (pending + approved + rejected)."""
    try:
        # Use the SAME relation as you just tested in shell
        patient_profile = PatientProfile.objects.get(user=request.user)
    except PatientProfile.DoesNotExist:
        return Response([])

    qs = (AppointmentRequest.objects
          .filter(patient=patient_profile)
          .order_by('-created_at'))

    logger.debug('patient_appointment_requests user=%s patient_id=%s count=%s', request.user.username, patient_profile.id, qs.count())

    serializer = AppointmentRequestSerializer(qs, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_pending_requests(request):
    doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)

    pending = (AppointmentRequest.objects
               .filter(doctor=doctor_profile, status='pending')
               .select_related('patient__user')
               .order_by('-created_at')[:10])

    serializer = AppointmentRequestSerializer(pending, many=True)
    return Response(serializer.data)




@api_view(['POST'])
@permission_classes([IsAuthenticated, IsDoctor])
def approve_appointment(request, pk):
    """Approve appointment request"""
    try:
        doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
        appointment = get_object_or_404(
            AppointmentRequest, 
            id=pk, 
            doctor=doctor_profile  # ✅ Fixed
        )
        appointment.status = 'approved'
        appointment.approved_at = timezone.now()
        appointment.save()
        return Response({'message': '✅ Approved!'})
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsDoctor])
def reject_appointment(request, pk):
    """Reject appointment request"""
    try:
        doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
        appointment = get_object_or_404(
            AppointmentRequest, 
            id=pk, 
            doctor=doctor_profile  # ✅ Fixed
        )
        appointment.status = 'rejected'
        appointment.save()
        return Response({'message': '❌ Rejected!'})
    except Exception as e:
        return Response({'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_upcoming_appointments(request):
    """Doctor's upcoming approved appointments"""
    try:
        # ✅ FIXED: Same pattern as your other views
        doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
        today = date.today()
        
        appointments = AppointmentRequest.objects.filter(
            doctor=doctor_profile,  # ✅ Use DoctorProfile, not request.user.doctor
            status='approved',
            date__gte=today
        ).select_related('patient').order_by('date')[:10]
        logger.debug('doctor_upcoming_appointments count=%s', appointments.count())
        serializer = AppointmentRequestSerializer(appointments, many=True)
        return Response(serializer.data)
    except DoctorProfile.DoesNotExist:
        return Response([], status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_labs(request):
    """Get available labs for patient booking"""
    labs = LabProfile.objects.all().select_related('user')
    serializer = LabProfileSerializer(labs, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsPatient])
def patient_lab_request(request):
    """Patient lab test booking"""
    payload = request.data.copy()
    if not payload.get('test_name'):
        payload['test_name'] = payload.get('tests') or 'General Lab Test'

    serializer = LabTestOrderBasicSerializer(data=payload)
    if serializer.is_valid():
        patient_profile, _ = PatientProfile.objects.get_or_create(user=request.user)
        model_field_names = {f.name for f in LabTestOrder._meta.fields}
        save_kwargs = {}

        if 'patient_profile' in model_field_names:
            save_kwargs['patient_profile'] = patient_profile
        elif 'patient' in model_field_names:
            save_kwargs['patient'] = patient_profile

        lab_id = payload.get('lab_id')
        if lab_id and 'lab' in model_field_names:
            save_kwargs['lab_id'] = lab_id
        if 'date' in model_field_names and payload.get('date'):
            save_kwargs['date'] = payload.get('date')
        if 'time_slot' in model_field_names and payload.get('time_slot'):
            save_kwargs['time_slot'] = payload.get('time_slot')

        if 'doctor' in model_field_names and not payload.get('doctor_id'):
            link = (DoctorPatientLink.objects
                    .filter(patient=patient_profile, status='accepted')
                    .select_related('doctor')
                    .order_by('-created_at')
                    .first())
            if link:
                save_kwargs['doctor'] = link.doctor

        if 'doctor' in model_field_names and 'doctor' not in save_kwargs and not payload.get('doctor_id'):
            return Response({'doctor_id': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
        if 'lab' in model_field_names and 'lab_id' not in save_kwargs:
            return Response({'lab_id': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)

        if payload.get('doctor_id') and 'doctor' in model_field_names:
            save_kwargs['doctor_id'] = payload.get('doctor_id')

        try:
            serializer.save(**save_kwargs)
        except IntegrityError as exc:
            return Response({'error': f'Invalid booking data: {exc}'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': 'Lab request created successfully!'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPatient])
def patient_lab_requests(request):
    """Get patient's lab requests"""
    patient_profile, _ = PatientProfile.objects.get_or_create(user=request.user)
    model_field_names = {f.name for f in LabTestOrder._meta.fields}
    if 'patient_profile' in model_field_names:
        lab_requests = LabTestOrder.objects.filter(patient_profile=patient_profile)
    else:
        lab_requests = LabTestOrder.objects.filter(patient=patient_profile)
    serializer = LabTestOrderBasicSerializer(lab_requests, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsLabStaff])
def lab_appointment_requests(request):
    """Lab-side list of test requests (acts as lab appointments queue)."""
    lab_profile = get_object_or_404(LabProfile, user=request.user)

    qs = (LabTestOrder.objects
          .filter(lab=lab_profile)
          .select_related('patient', 'doctor')
          .order_by('-created_at'))

    data = [{
        'id': order.id,
        'test_name': order.test_name,
        'date': order.date,
        'time_slot': order.time_slot,
        'status': order.status,
        'created_at': order.created_at,
        'patient_name': getattr(order.patient, 'full_name', 'Unknown'),
        'patient_unique_id': getattr(order.patient, 'patient_unique_id', ''),
        'doctor_name': getattr(order.doctor, 'full_name', 'Unknown'),
    } for order in qs]

    return Response(data, status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsLabStaff])
def lab_approve_request(request, pk):
    """Accept lab request and move it forward in processing."""
    lab_profile = get_object_or_404(LabProfile, user=request.user)
    req = get_object_or_404(LabTestOrder, id=pk, lab=lab_profile)

    if req.status != 'pending':
        return Response({'error': 'Only pending requests can be accepted.'}, status=400)

    req.status = 'sample_collected'
    req.save(update_fields=['status'])
    return Response({'message': 'Request accepted', 'id': req.id, 'status': req.status}, status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsLabStaff])
def lab_reject_request(request, pk):
    """Reject lab request and keep it in history."""
    lab_profile = get_object_or_404(LabProfile, user=request.user)
    req = get_object_or_404(LabTestOrder, id=pk, lab=lab_profile)

    if req.status != 'pending':
        return Response({'error': 'Only pending requests can be rejected.'}, status=400)

    req.status = 'rejected'
    req.save(update_fields=['status'])
    return Response({'message': 'Request rejected', 'id': req.id, 'status': req.status}, status=200)

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

    doctors = DoctorProfile.objects.filter(
        Q(full_name__icontains=query) |
        Q(doctor_unique_id__icontains=query)
    ).select_related('user').order_by('full_name')[:25]

    results = [{
        'type': 'patient',
        'id': p.id,
        'full_name': p.full_name,
        'unique_id': p.patient_unique_id,
        'phone': p.phone or '',
    } for p in patients]

    results += [{
        'type': 'doctor',
        'id': d.id,
        'full_name': d.full_name,
        'unique_id': d.doctor_unique_id,
        'phone': getattr(d.user, 'phone', '') or '',
    } for d in doctors]

    return Response(results, status=200)



# Add to views.py (same as your MyPatientProfileView/MyDoctorProfileView)
class MyLabProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = LabProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, created = LabProfile.objects.get_or_create(
            user=self.request.user,
            defaults={
                "name": self.request.user.get_full_name() or self.request.user.username,
                "address": "",
                "license_no": f"LAB-{self.request.user.id}",
            },
        )
        return profile

@api_view(['POST'])
@permission_classes([IsLabStaff])
@parser_classes([MultiPartParser, FormParser])
def lab_upload_report(request):
    sample_id = request.data.get('sample_id')
    patient_id = request.data.get('patient_id')
    case_request_id = request.data.get('case_request_id')
    report_file = request.FILES.get('report_file')

    if not sample_id or not patient_id:
        return Response({'error': 'sample_id and patient_id required'}, status=400)

    try:
        sample = Sample.objects.get(id=sample_id)
        patient = PatientProfile.objects.get(id=patient_id)
        lab_profile = LabProfile.objects.get(user=request.user)
    except Sample.DoesNotExist:
        return Response({'error': 'Sample not found'}, status=404)
    except PatientProfile.DoesNotExist:
        return Response({'error': 'Patient not found'}, status=404)
    except LabProfile.DoesNotExist:
        return Response({'error': 'Lab profile not found'}, status=404)

    if sample.status == 'completed' or LabReport.objects.filter(sample=sample).exists():
        return Response({'error': 'This sample already has a report uploaded.'}, status=400)

    if sample.patient_id and sample.patient_id != patient.id:
        return Response({'error': 'Sample does not belong to selected patient.'}, status=400)

    raw_results = request.data.get('results', '{}')
    try:
        import json
        results_value = json.loads(raw_results) if isinstance(raw_results, str) else raw_results
    except Exception:
        results_value = {"raw": raw_results}

    report = LabReport.objects.create(
        patient=patient,                      # ✅ valid FK
        sample=sample,
        report_file=report_file,
        results=results_value,
        doctor_notes=request.data.get('doctor_notes', ''),
        is_flagged=str(request.data.get('is_flagged', 'false')).lower() in ['true', '1', 'yes'],
        report_type=request.data.get('report_type', 'General'),
    )

    # Uploaded report means sample workflow is complete.
    sample.status = 'completed'
    sample.save(update_fields=['status'])

    if case_request_id:
        try:
            req = CaseReportRequest.objects.select_related('patient', 'doctor', 'case').get(id=case_request_id)
            if req.patient_id == patient.id and req.status == 'pending':
                req.status = 'completed'
                req.lab_report = report
                req.save(update_fields=['status', 'lab_report', 'updated_at'])
                _create_timeline_event(
                    req.case,
                    'report_uploaded',
                    f"Report uploaded for requested test: {req.test_name}",
                    actor_role='lab',
                    actor_name=lab_profile.name if hasattr(lab_profile, 'name') else 'Lab',
                    metadata={'request_id': req.id, 'report_id': report.id, 'test_name': req.test_name},
                )
                _notify_doctor(
                    req.doctor,
                    'Requested Report Uploaded',
                    f"Lab uploaded report for {patient.full_name}: {req.test_name}.",
                )
                _notify_patient(
                    patient,
                    'New Lab Report Uploaded',
                    f"Your report for {req.test_name} has been uploaded.",
                )
        except CaseReportRequest.DoesNotExist:
            pass

    return Response({
        'message': 'Report uploaded successfully!',
        'report_id': report.id,
        'sample_barcode': sample.barcode,
        'patient_name': patient.full_name,
    }, status=201)


@api_view(['GET'])
@permission_classes([IsLabStaff])
def lab_stats(request):
    """Live stats for lab dashboard."""
    lab_profile = get_object_or_404(LabProfile, user=request.user)
    today = timezone.now().date()

    pending_count = Sample.objects.filter(status__in=['collected', 'pending']).count()
    todays_uploads = LabReport.objects.filter(created_at__date=today).count()
    total_patients = (LabTestOrder.objects
                      .filter(lab=lab_profile)
                      .values('patient_id')
                      .distinct()
                      .count())
    critical_reports = LabReport.objects.filter(is_flagged=True).count()

    return Response({
        'pending_samples': pending_count,
        'todays_uploads': todays_uploads,
        'total_patients': total_patients,
        'critical_reports': critical_reports,
    }, status=200)


@api_view(['GET'])
@permission_classes([IsLabStaff])
def lab_sample_history(request):
    """Recent sample history (pending + completed)."""
    samples = (Sample.objects
               .all()
               .order_by('-collection_date')[:100]
               .values('id', 'barcode', 'sample_type', 'collection_date', 'status'))
    return Response(list(samples), status=200)





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
    except PatientProfile.DoesNotExist:
        return Response([], status=200)

    reports = LabReport.objects.filter(
        patient=patient_profile
    ).select_related('patient', 'sample').order_by('-created_at')

    serializer = LabReportSerializer(reports, many=True)
    return Response(serializer.data)




@api_view(['GET'])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_lab_reports(request):
    """Doctor lab reports. Optional filter: ?patient_id=<patient_unique_id>"""
    try:
        doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)

        patient_unique_id = request.GET.get('patient_id')

        reports_qs = LabReport.objects.select_related('sample', 'patient').order_by('-created_at')

        if patient_unique_id:
            # Only allow doctors to view reports of connected/accepted patients.
            has_access = DoctorPatientLink.objects.filter(
                doctor=doctor_profile,
                patient__patient_unique_id=patient_unique_id,
                status='accepted'
            ).exists()

            if not has_access:
                return Response({'error': 'Unauthorized patient access'}, status=403)

            reports_qs = reports_qs.filter(patient__patient_unique_id=patient_unique_id)

        reports = reports_qs[:50]
        serializer = LabReportSerializer(reports, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.exception('lab reports error: %s', e)
        return Response([], status=200)


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
        collection_date=timezone.now(),
        patient=patient,
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
    pending_samples = Sample.objects.filter(
        status__in=['collected', 'pending']
    ).select_related('patient').values(
        'id', 'barcode', 'sample_type', 'collection_date', 'status').order_by('-collection_date')
    
    return Response(list(pending_samples))


# C. SCAN BARCODE → AUTO-FILL UPLOAD FORM
@api_view(['POST'])
@permission_classes([IsLabStaff])
def lab_scan_sample(request):
    barcode = request.data.get('barcode')
    sample_id = request.data.get('sample_id')
    try:
        if sample_id:
            sample = Sample.objects.get(id=sample_id)
        else:
            sample = Sample.objects.get(barcode=barcode)
        serializer = SampleSerializer(sample)
        return Response({
            'success': True,
            'sample': serializer.data,
            'patient': {
                'id': serializer.data.get('patient_id'),
                'full_name': serializer.data.get('patient_name'),
                'patient_unique_id': serializer.data.get('patient_unique_id'),
            },
            'test_name': None
        })
    except Sample.DoesNotExist:
        return Response({'error': 'Sample not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_doctors(request):
    doctors = DoctorProfile.objects.all().select_related('user')
    serializer = DoctorProfileSerializer(doctors, many=True)
    return Response(serializer.data)

# B. Check Doctor Availability 
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_doctor_availability(request):
    doctor_id = request.GET.get('doctor_id')
    date_str = request.GET.get('date')  # YYYY-MM-DD
    
    if not doctor_id or not date_str:
        return Response({'error': 'doctor_id and date required'}, status=400)
    
    try:
        doctor = DoctorProfile.objects.get(id=doctor_id)
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
    except:
        return Response({'error': 'Invalid doctor or date'}, status=400)
    
    # 30-min slots from 9AM-6PM
    available_slots = []
    start_time = datetime.strptime('09:00', '%H:%M')
    end_time = datetime.strptime('18:00', '%H:%M')
    
    current_time = start_time
    while current_time < end_time:
        slot_datetime = datetime.combine(date_obj, current_time.time())
        
        # Check if slot is booked
        booked = Appointment.objects.filter(
            doctor=doctor,
            date_time=slot_datetime
        ).exists()
        
        if not booked:
            available_slots.append(slot_datetime.strftime('%Y-%m-%dT%H:%M'))
        
        current_time += timedelta(minutes=30)
    
    return Response({
        'doctor_name': doctor.full_name,
        'date': date_str,
        'available_slots': available_slots[:10]  # Limit to first 10
    })

# C. Book Appointment (uses YOUR date_time field)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsPatient])
def book_appointment(request):
    patient_profile, _ = PatientProfile.objects.get_or_create(user=request.user)
    doctor_profile = get_object_or_404(DoctorProfile, id=request.data.get('doctor'))

    date = request.data.get('date')
    time_slot = request.data.get('time_slot')

    if not date or not time_slot:
        return Response(
            {'error': 'date and time_slot are required'},
            status=400
        )

    appt = AppointmentRequest.objects.create(
        patient=patient_profile,
        doctor=doctor_profile,
        date=date,
        time_slot=time_slot,
        status='pending'
    )

    return Response(
        {'message': 'Appointment request sent', 'id': appt.id},
        status=201
    )

# D. Patient Appointments (uses YOUR model)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPatient])
def patient_appointments(request):
    patient_profile, _ = PatientProfile.objects.get_or_create(user=request.user)
    appointments = patient_profile.appointment_set.all().order_by('-date_time')
    serializer = AppointmentSerializer(appointments, many=True)
    return Response(serializer.data)

# E. Doctor Appointments
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_appointments(request):
    doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
    appointments = doctor_profile.appointment_set.filter(
        status__in=['scheduled', 'confirmed']
    ).order_by('date_time')
    serializer = AppointmentSerializer(appointments, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPatient])
def patient_stats(request):
    """Live stats for patient dashboard"""
    profile = PatientProfile.objects.get(user=request.user)
    stats = {
        'total_reports': LabReport.objects.filter(patient=profile).count(),
        'total_prescriptions': Prescription.objects.filter(patient=profile).count(),
    }
    return Response(stats)

# CANCEL - Both doctors & patients can cancel their appointments
class CancelAppointmentView(APIView):
    def post(self, request, pk):
        try:
            appt = AppointmentRequest.objects.get(id=pk)
            
            # PATIENT can cancel own appointments
            if request.user.role == 'patient' and appt.patient.id != request.user.id:
                return Response({'error': 'Unauthorized'}, status=403)
            # DOCTOR can cancel their appointments  
            elif request.user.role == 'doctor' and appt.doctor.id != request.user.id:
                return Response({'error': 'Unauthorized'}, status=403)
            
            if appt.status in ['cancelled', 'completed']:
                return Response({'error': 'Cannot cancel'}, status=400)
                
            appt.status = 'cancelled'
            appt.save()
            return Response({'message': 'Appointment cancelled'})
        except AppointmentRequest.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=404)

# RESCHEDULE - Only if pending/approved
class RescheduleAppointmentView(APIView):
    def patch(self, request, pk):
        try:
            appt = AppointmentRequest.objects.get(id=pk)
                        
            new_date = request.data.get('date')  # "2026-02-20"
            new_time_slot = request.data.get('time_slot')  # "2:00 PM"
            
            if appt.status not in ['pending', 'approved']:
                return Response({'error': 'Cannot reschedule'}, status=400)
                
            appt.date = new_date
            appt.time_slot = new_time_slot
            appt.status = 'pending'  # Reset to pending
            appt.save()
            return Response({'message': 'Appointment rescheduled'})
        except:
            return Response({'error': 'Invalid data'}, status=400)
        
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_past_appointments(request):
    """Past appointments = older than TODAY"""
    profile = DoctorProfile.objects.get(user=request.user)
    today = date.today()
    
    # Past = approved appointments created more than 24 hours ago
    past_appointments = AppointmentRequest.objects.filter(
        doctor=profile,
        status='approved',
        created_at__lt=timezone.now() - timedelta(days=1)
    ).exclude(  # 👈 EXCLUDE upcoming/pending
        status__in=['pending', 'approved'],
        date__gte=today
    ).select_related('patient').order_by('-created_at')
    
    serializer = AppointmentRequestSerializer(past_appointments, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def doctor_patient_detail(request, patient_id):
    logger.debug('doctor_patient_detail requested patient_id=%s', patient_id)
    
    if not patient_id or patient_id == 'undefined':
        return Response({"error": "Invalid patient ID"}, status=400)
    
    try:
        profile = PatientProfile.objects.get(patient_unique_id=patient_id)
        logger.debug('doctor_patient_detail found patient_unique_id=%s', profile.patient_unique_id)
        serializer = PatientProfileSerializer(profile)
        return Response(serializer.data)
    except PatientProfile.DoesNotExist:
        logger.warning('doctor_patient_detail patient not found patient_id=%s', patient_id)
        return Response({"error": f"Patient {patient_id} not found"}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_create_patient_case(request):
    doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
    patient_unique_id = request.data.get('patient_unique_id')

    if not patient_unique_id:
        return Response({'error': 'patient_unique_id is required'}, status=400)

    patient = get_object_or_404(PatientProfile, patient_unique_id=patient_unique_id)

    # Doctor must be connected to the patient.
    has_access = DoctorPatientLink.objects.filter(
        doctor=doctor_profile,
        patient=patient,
        status='accepted'
    ).exists()
    if not has_access:
        return Response({'error': 'You are not authorized for this patient'}, status=403)

    serializer = PatientCaseSerializer(data=request.data)
    if serializer.is_valid():
        case = serializer.save(doctor=doctor_profile, patient=patient)
        _create_timeline_event(
            case,
            'case_created',
            f"Case created for {case.disease_name}",
            actor_role='doctor',
            actor_name=doctor_profile.full_name,
        )
        for test_name in _extract_report_tests(case.reports_required or ''):
            CaseReportRequest.objects.get_or_create(
                case=case,
                patient=patient,
                doctor=doctor_profile,
                test_name=test_name,
                status='pending',
            )
            _create_timeline_event(
                case,
                'report_requested',
                f"Report requested: {test_name}",
                actor_role='doctor',
                actor_name=doctor_profile.full_name,
                metadata={'test_name': test_name},
            )
            lab = LabTestOrder.objects.filter(patient=patient).select_related('lab').order_by('-created_at').first()
            if lab and lab.lab:
                _notify_lab(lab.lab, 'New Report Request', f"{patient.full_name}: {test_name}")

        _notify_patient(
            patient,
            'New Case Created',
            f"Dr. {doctor_profile.full_name} created a case for {case.disease_name}.",
        )
        return Response(PatientCaseSerializer(case).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_patient_cases(request, patient_id):
    doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
    patient = get_object_or_404(PatientProfile, patient_unique_id=patient_id)

    has_access = DoctorPatientLink.objects.filter(
        doctor=doctor_profile,
        patient=patient,
        status='accepted'
    ).exists()
    if not has_access:
        return Response({'error': 'You are not authorized for this patient'}, status=403)

    qs = PatientCase.objects.filter(doctor=doctor_profile, patient=patient)
    serializer = PatientCaseSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_update_patient_case(request, pk):
    doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
    case = get_object_or_404(PatientCase, id=pk, doctor=doctor_profile)

    tracked_fields = ['disease_name', 'medicines_given', 'prescriptions', 'reports_required', 'notes']
    before = {field: getattr(case, field, None) for field in tracked_fields}

    serializer = PatientCaseSerializer(case, data=request.data, partial=True)
    if serializer.is_valid():
        updated_case = serializer.save()

        changed_fields = []
        for field in tracked_fields:
            after_value = getattr(updated_case, field, None)
            if before.get(field) != after_value:
                changed_fields.append(field)

        description = f"Case updated for {updated_case.disease_name}"
        if changed_fields:
            description = f"Case updated ({', '.join(changed_fields)})"

        _create_timeline_event(
            updated_case,
            'case_updated',
            description,
            actor_role='doctor',
            actor_name=doctor_profile.full_name,
            metadata={'changed_fields': changed_fields},
        )

        # Add missing report requests for newly entered report names, keep existing history as-is.
        existing = {
            r.test_name.strip().lower()
            for r in updated_case.report_requests.all()
            if r.test_name
        }
        for test_name in _extract_report_tests(updated_case.reports_required or ''):
            if test_name.lower() not in existing:
                CaseReportRequest.objects.create(
                    case=updated_case,
                    patient=updated_case.patient,
                    doctor=updated_case.doctor,
                    test_name=test_name,
                    status='pending',
                )
                _create_timeline_event(
                    updated_case,
                    'report_requested',
                    f"Report requested: {test_name}",
                    actor_role='doctor',
                    actor_name=doctor_profile.full_name,
                    metadata={'test_name': test_name},
                )
                lab = LabTestOrder.objects.filter(patient=updated_case.patient).select_related('lab').order_by('-created_at').first()
                if lab and lab.lab:
                    _notify_lab(lab.lab, 'New Report Request', f"{updated_case.patient.full_name}: {test_name}")
        _notify_patient(
            updated_case.patient,
            'Case Updated',
            f"Dr. {doctor_profile.full_name} updated your case.",
        )
        return Response(PatientCaseSerializer(updated_case).data)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPatient])
def patient_cases(request):
    patient_profile, _ = PatientProfile.objects.get_or_create(user=request.user)
    qs = PatientCase.objects.filter(patient=patient_profile)
    serializer = PatientCaseSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_case_timeline(request, case_id):
    doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
    case = get_object_or_404(PatientCase, id=case_id, doctor=doctor_profile)
    events = case.timeline_events.all()
    serializer = CaseTimelineEventSerializer(events, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_create_followup_task(request, case_id):
    doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
    case = get_object_or_404(PatientCase, id=case_id, doctor=doctor_profile)

    if request.method == 'GET':
        tasks = FollowUpTask.objects.filter(case=case, doctor=doctor_profile)
        serializer = FollowUpTaskSerializer(tasks, many=True)
        return Response(serializer.data)

    serializer = FollowUpTaskSerializer(data=request.data)
    if serializer.is_valid():
        task = serializer.save(doctor=doctor_profile, patient=case.patient, case=case)
        _create_timeline_event(
            case,
            'followup_created',
            f"Follow-up task created: {task.title}",
            actor_role='doctor',
            actor_name=doctor_profile.full_name,
            metadata={'task_id': task.id, 'due_date': str(task.due_date)},
        )
        _notify_patient(
            case.patient,
            'New Follow-up Task',
            f"Dr. {doctor_profile.full_name} added follow-up: {task.title} (due {task.due_date}).",
        )
        return Response(FollowUpTaskSerializer(task).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_update_followup_task(request, pk):
    doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
    task = get_object_or_404(FollowUpTask, id=pk, doctor=doctor_profile)
    serializer = FollowUpTaskSerializer(task, data=request.data, partial=True)
    if serializer.is_valid():
        updated_task = serializer.save()
        if updated_task.status == 'completed':
            _create_timeline_event(
                updated_task.case,
                'followup_completed',
                f"Follow-up task completed: {updated_task.title}",
                actor_role='doctor',
                actor_name=doctor_profile.full_name,
                metadata={'task_id': updated_task.id},
            )
        return Response(FollowUpTaskSerializer(updated_task).data)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsDoctor])
def doctor_followup_tasks(request):
    doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
    tasks = FollowUpTask.objects.filter(doctor=doctor_profile).select_related('patient', 'case')
    serializer = FollowUpTaskSerializer(tasks, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPatient])
def patient_followup_tasks(request):
    patient_profile, _ = PatientProfile.objects.get_or_create(user=request.user)
    tasks = FollowUpTask.objects.filter(patient=patient_profile).select_related('doctor', 'case')
    serializer = FollowUpTaskSerializer(tasks, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPatient])
def patient_case_timeline(request, case_id):
    patient_profile, _ = PatientProfile.objects.get_or_create(user=request.user)
    case = get_object_or_404(PatientCase, id=case_id, patient=patient_profile)
    events = case.timeline_events.all()
    serializer = CaseTimelineEventSerializer(events, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_notifications(request):
    role = request.user.role
    qs = Notification.objects.none()

    if role == 'patient':
        patient_profile, _ = PatientProfile.objects.get_or_create(user=request.user)
        qs = Notification.objects.filter(target_role='patient', patient=patient_profile)
    elif role == 'doctor':
        doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
        qs = Notification.objects.filter(target_role='doctor', doctor=doctor_profile)
    elif role in ['lab', 'lab_staff']:
        lab_profile, _ = LabProfile.objects.get_or_create(user=request.user)
        qs = Notification.objects.filter(target_role='lab', lab=lab_profile)
    elif role == 'admin':
        qs = Notification.objects.filter(target_role='admin')

    serializer = NotificationSerializer(qs.order_by('-created_at')[:100], many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):
    notif = get_object_or_404(Notification, id=pk)
    role = request.user.role

    allowed = False
    if role == 'patient' and notif.target_role == 'patient':
        patient_profile, _ = PatientProfile.objects.get_or_create(user=request.user)
        allowed = notif.patient_id == patient_profile.id
    elif role == 'doctor' and notif.target_role == 'doctor':
        doctor_profile, _ = DoctorProfile.objects.get_or_create(user=request.user)
        allowed = notif.doctor_id == doctor_profile.id
    elif role in ['lab', 'lab_staff'] and notif.target_role == 'lab':
        lab_profile, _ = LabProfile.objects.get_or_create(user=request.user)
        allowed = notif.lab_id == lab_profile.id
    elif role == 'admin' and notif.target_role == 'admin':
        allowed = True

    if not allowed:
        return Response({'error': 'Unauthorized'}, status=403)

    notif.is_read = True
    notif.save(update_fields=['is_read'])
    return Response({'message': 'Notification marked as read'})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsLabStaff])
def lab_patient_case_report_requests(request):
    """Pending case report requests for a selected patient in lab upload flow."""
    patient_id = request.GET.get('patient_id')
    if not patient_id:
        return Response({'error': 'patient_id query parameter required'}, status=400)

    patient = get_object_or_404(PatientProfile, id=patient_id)
    qs = (CaseReportRequest.objects
          .filter(patient=patient, status='pending')
          .select_related('case', 'doctor')
          .order_by('-created_at'))

    data = [{
        'id': r.id,
        'case_id': r.case_id,
        'test_name': r.test_name,
        'doctor_name': getattr(r.doctor, 'full_name', ''),
        'requested_at': r.created_at,
    } for r in qs]
    return Response(data, status=200)
