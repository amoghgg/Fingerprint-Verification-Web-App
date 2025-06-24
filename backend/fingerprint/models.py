from django.db import models

class VerificationLog(models.Model):
    fingerprint = models.TextField()
    verified = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.fingerprint} - {'✔' if self.verified else '✖'} @ {self.timestamp}"
