from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0020_patientprofile_address_emergency_contact'),
    ]

    operations = [
        migrations.AddField(
            model_name='doctorprofile',
            name='address',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='doctorprofile',
            name='blood_group',
            field=models.CharField(blank=True, max_length=3, null=True),
        ),
        migrations.AddField(
            model_name='doctorprofile',
            name='date_of_birth',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='doctorprofile',
            name='emergency_contact',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='doctorprofile',
            name='gender',
            field=models.CharField(blank=True, max_length=10, null=True),
        ),
    ]
