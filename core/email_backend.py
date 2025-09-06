# core/email_backend.py
from django.core.mail.backends.smtp import EmailBackend as DjangoEmailBackend
import ssl

class CustomEmailBackend(DjangoEmailBackend):
    def open(self):
        if self.connection:
            return False
        try:
            self.connection = self.connection_class(self.host, self.port)
            self.connection.ehlo()
            if self.use_tls:
                context = ssl.create_default_context()
                self.connection.starttls(context=context)
            self.connection.ehlo()
            if self.username and self.password:
                self.connection.login(self.username, self.password)
            return True
        except Exception as e:
            if not self.fail_silently:
                raise
            return False