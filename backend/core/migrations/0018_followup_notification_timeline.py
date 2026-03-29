from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0017_casereportrequest'),
    ]

    operations = [
        migrations.CreateModel(
            name='CaseTimelineEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('event_type', models.CharField(choices=[('case_created', 'Case Created'), ('case_updated', 'Case Updated'), ('report_requested', 'Report Requested'), ('report_uploaded', 'Report Uploaded'), ('followup_created', 'Follow-up Created'), ('followup_completed', 'Follow-up Completed')], max_length=50)),
                ('description', models.TextField()),
                ('actor_role', models.CharField(blank=True, max_length=20, null=True)),
                ('actor_name', models.CharField(blank=True, max_length=255, null=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('case', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='timeline_events', to='core.patientcase')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('target_role', models.CharField(choices=[('patient', 'Patient'), ('doctor', 'Doctor'), ('lab', 'Lab'), ('admin', 'Admin')], max_length=20)),
                ('title', models.CharField(max_length=255)),
                ('message', models.TextField()),
                ('is_read', models.BooleanField(default=False)),
                ('doctor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='core.doctorprofile')),
                ('lab', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='core.labprofile')),
                ('patient', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='core.patientprofile')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='FollowUpTask',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('title', models.CharField(max_length=255)),
                ('details', models.TextField(blank=True, null=True)),
                ('due_date', models.DateField()),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('completed', 'Completed')], default='pending', max_length=20)),
                ('case', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='followup_tasks', to='core.patientcase')),
                ('doctor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='followup_tasks', to='core.doctorprofile')),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='followup_tasks', to='core.patientprofile')),
            ],
            options={
                'ordering': ['status', 'due_date', '-created_at'],
            },
        ),
    ]
