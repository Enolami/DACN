# Generated manually
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0006_alter_user_options_alter_user_managers_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='oauth_provider',
            field=models.CharField(blank=True, help_text="OAuth provider(s) linked to this account (e.g., 'google', 'facebook', or 'google,facebook' for multiple)", max_length=50, null=True),
        ),
    ]

