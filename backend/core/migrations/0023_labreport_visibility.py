from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0022_sample_patient"),
    ]

    operations = [
        migrations.AddField(
            model_name="labreport",
            name="is_visible_to_patient",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="labreport",
            name="approved_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="approved_lab_reports",
                to="core.doctorprofile",
            ),
        ),
        migrations.AddField(
            model_name="labreport",
            name="approved_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
