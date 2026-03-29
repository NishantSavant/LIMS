from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0015_labtestorder_date_time_slot_and_rejected'),
    ]

    operations = [
        migrations.CreateModel(
            name='PatientCase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('disease_name', models.CharField(max_length=255)),
                ('medicines_given', models.TextField()),
                ('prescriptions', models.TextField(blank=True, null=True)),
                ('reports_required', models.TextField(blank=True, null=True)),
                ('notes', models.TextField(blank=True, null=True)),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='patient_cases', to='core.doctorprofile')),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cases', to='core.patientprofile')),
            ],
            options={
                'ordering': ['-updated_at', '-created_at'],
            },
        ),
    ]
