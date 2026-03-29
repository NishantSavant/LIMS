from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_appointmentrequest_approved_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='labtestorder',
            name='date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='labtestorder',
            name='time_slot',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AlterField(
            model_name='labtestorder',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('sample_collected', 'Sample Collected'),
                    ('in_testing', 'In Testing'),
                    ('results_ready', 'Results Ready'),
                    ('reported', 'Reported'),
                    ('rejected', 'Rejected'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
    ]
