from django.db import migrations

def set_terms_accepted(apps, schema_editor):
    CustomUser = apps.get_model('core', 'CustomUser')
    CustomUser.objects.all().update(terms_accepted=True)

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0024_customuser_terms_accepted'),
    ]

    operations = [
        migrations.RunPython(set_terms_accepted),
    ]