from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_patientcase'),
    ]

    operations = [
        migrations.CreateModel(
            name='CaseReportRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('test_name', models.CharField(max_length=255)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('completed', 'Completed')], default='pending', max_length=20)),
                ('case', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='report_requests', to='core.patientcase')),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='case_report_requests', to='core.doctorprofile')),
                ('lab_report', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='case_report_requests', to='core.labreport')),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='case_report_requests', to='core.patientprofile')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
