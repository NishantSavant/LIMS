from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0021_doctorprofile_extra_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='sample',
            name='patient',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='samples', to='core.patientprofile'),
        ),
    ]
