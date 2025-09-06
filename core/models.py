from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from django.conf import settings
import logging
logger = logging.getLogger(__name__)
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import logging


def verification_image_upload_path(instance, filename):
    return f'verification_images/{instance.name}/{filename}'

def profile_image_upload_path(instance, filename):
    return f'profile_images/{instance.username}/{filename}'

class UserStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    INACTIVE = 'INACTIVE', 'Inactive'
    BANNED = 'BANNED', 'Banned'

class CustomUser(AbstractUser):
    USER_TYPE_CHOICES = (
        ('Admin', 'Admin'),
        ('Customer', 'Customer'),
        ('Band', 'Band'),
    )
    VERIFICATION_STATUS = [
        (-1, "Rejected"),
        (0, "Pending"),
        (1, "Verified"),
    ]
    email = models.EmailField(unique=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='Customer')
    created_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=10, choices=UserStatus.choices, default=UserStatus.ACTIVE)
    is_verified = models.IntegerField(choices=VERIFICATION_STATUS, default=0)  # Changed to IntegerField
    profile_image = models.ImageField(upload_to=profile_image_upload_path, null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    phone_number = models.CharField(max_length=15, null=False, blank=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, related_name='created_users')
    updated_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, related_name='updated_users')
    groups = models.ManyToManyField(
        'auth.Group', related_name='core_customuser_set', blank=True, help_text='The groups this user belongs to.'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission', related_name='core_customuser_set', blank=True, help_text='Specific permissions for this user.'
    )
    date_joined = models.DateTimeField(auto_now_add=True)
    terms_accepted = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        if not self.pk:  # New user
            if self.user_type == "Customer":
                self.is_verified = 1  # New customers default to Verified
            elif self.user_type == "Band" and self.is_verified not in [-1, 0, 1]:
                self.is_verified = 0  # New bands default to Pending
            elif self.user_type == "Admin":
                self.is_verified = 1  # Admins are auto-verified
        super().save(*args, **kwargs)

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save()

    def __str__(self):
        return self.username
    

class Band(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='band_profile', null=True, blank=True)
    name = models.CharField(max_length=100)
    genre = models.CharField(max_length=100)
    description = models.TextField()
    location = models.CharField(max_length=100)
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    verification_image = models.ImageField(upload_to=verification_image_upload_path, null=True, blank=True)
    document_type = models.CharField(max_length=50, null=True, blank=True)
    member_count = models.IntegerField(default=1)
    max_travel_distance = models.IntegerField(default=50)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_bookings = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.base_price < Decimal("0.01"):
            raise ValidationError({'base_price': 'Base price must be a positive value.'})
        return self.base_price

    def __str__(self):
        return self.name

class Customer(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='customer_profile')
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    location = models.CharField(max_length=100)
    address = models.CharField(max_length=255, null=True, blank=True)
    preferred_genres = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.username
    
class BandMember(models.Model):
    band = models.ForeignKey('Band', on_delete=models.CASCADE, related_name='members')
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    join_date = models.DateField()
    experience_years = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(70)]
    )
    profile_image = models.ImageField(upload_to='band_members/', null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    social_media_links = models.JSONField(null=True, blank=True)
    additional_instruments = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['band', 'email']
        ordering = ['role', 'join_date']

    def __str__(self):
        return f"{self.name} - {self.role} at {self.band.name}"


class SocialMediaLinks(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    facebook = models.URLField(null=True, blank=True)
    instagram = models.URLField(null=True, blank=True)
    youtube = models.URLField(null=True, blank=True)
    twitter = models.URLField(null=True, blank=True)
    website = models.URLField(null=True, blank=True)


class BandPortfolio(models.Model):
    band = models.ForeignKey(Band, on_delete=models.CASCADE, related_name='portfolio')
    title = models.CharField(max_length=100)
    description = models.TextField()
    video_url = models.URLField(null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

class PortfolioImage(models.Model):
    portfolio = models.ForeignKey(BandPortfolio, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='portfolio/')

class BandService(models.Model):
    band = models.ForeignKey(Band, on_delete=models.CASCADE, related_name='services')
    service_name = models.CharField(max_length=100)
    description = models.TextField()
    additional_cost = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)

class EventPackage(models.Model):
    band = models.ForeignKey(Band, on_delete=models.CASCADE, related_name='packages')
    name = models.CharField(max_length=100)
    description = models.TextField()
    duration = models.DurationField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    includes_sound_system = models.BooleanField(default=False)
    includes_lighting = models.BooleanField(default=False)
    max_audience_size = models.IntegerField()
    terms_and_conditions = models.TextField()


class EventStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    PLANNED = 'PLANNED', 'Planned'
    ONGOING = 'ONGOING', 'Ongoing'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'

class Event(models.Model):
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE, related_name='events')
    band = models.ForeignKey('Band', on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=100)
    event_date = models.DateTimeField()
    location = models.CharField(max_length=100)
    expected_audience = models.IntegerField(default=0)
    requirements = models.TextField()
    duration = models.DurationField()
    setup_time = models.DurationField()
    status = models.CharField(max_length=15, choices=EventStatus.choices, default=EventStatus.PENDING)
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    needs_sound_system = models.BooleanField(default=False)
    needs_lighting = models.BooleanField(default=False)
    additional_notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def check_and_update_status(self):
        """
        Update the event status and related booking based on conditions.
        Returns a list of fields that were changed.
        """
        if not self.pk:
            logger.info("Event not saved yet, skipping status check")
            return []

        now = timezone.now()
        changed_fields = []

        if self.status in [EventStatus.COMPLETED, EventStatus.CANCELLED]:
            logger.info(f"Event {self.id}: Already {self.status}, no update needed")
            return []

        if self.event_date < now and self.status == EventStatus.PLANNED:
            booking = self.bookings.first()
            if not booking:
                logger.info(f"Event {self.id}: No booking found, cancelling event")
                self.status = EventStatus.CANCELLED
                changed_fields.append('status')
                return changed_fields

            logger.info(f"Event {self.id}: Booking {booking.id}, status={booking.status}, payment_status={booking.payment_status}")

            # Scenario 1: CONFIRMED booking with PARTIALLY_PAID
            if booking.status == "CONFIRMED" and booking.payment_status == "PARTIALLY_PAID":
                booking.payment_status = "FULLY_PAID"
                booking.remaining_amount = 0
                booking.save(update_fields=['payment_status', 'remaining_amount'])
                self.status = EventStatus.COMPLETED
                changed_fields.append('status')
                logger.info(f"Event {self.id}: Updated to COMPLETED, booking {booking.id} to FULLY_PAID")

            # Scenario 2: PENDING booking with UNPAID
            elif booking.status == "PENDING" and booking.payment_status == "UNPAID":
                booking.status = "CANCELLED"
                booking.cancellation_reason = "Event date passed without payment"
                booking.save(update_fields=['status', 'cancellation_reason'])
                self.status = EventStatus.CANCELLED
                changed_fields.append('status')
                logger.info(f"Event {self.id}: Updated to CANCELLED, booking {booking.id} cancelled")

        return changed_fields


    def create_or_update_booking(self):

            if not self.pk:
                return

            existing_booking = self.bookings.first()
            if existing_booking:
                existing_booking.total_amount = self.budget
                existing_booking.special_requests = self.requirements
                existing_booking.save(update_fields=['total_amount', 'special_requests'])

    def save(self, *args, **kwargs):
        status_changed_fields = self.check_and_update_status()
        if 'update_fields' in kwargs and kwargs['update_fields'] is not None:
            update_fields = set(kwargs['update_fields']) | set(status_changed_fields)
            if update_fields:
                kwargs['update_fields'] = list(update_fields)
            super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)
        self.create_or_update_booking()

    def __str__(self):
        return f"{self.event_type} on {self.event_date} at {self.location}"





class PaymentStatus(models.TextChoices):
    UNPAID = 'UNPAID', 'Unpaid'
    PARTIALLY_PAID = 'PARTIALLY_PAID', 'Partially Paid'
    FULLY_PAID = 'FULLY_PAID', 'Fully Paid'

class BookingStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    CONFIRMED = 'CONFIRMED', 'Confirmed'
    CANCELLED = 'CANCELLED', 'Cancelled'
    COMPLETED = 'COMPLETED', 'Completed'


class Booking(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='bookings')
    status = models.CharField(max_length=10, choices=BookingStatus.choices, default=BookingStatus.PENDING)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    advance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=15, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)
    booking_date = models.DateTimeField(default=timezone.now)
    cancellation_reason = models.TextField(null=True, blank=True)
    special_requests = models.TextField(null=True, blank=True)
    terms_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # def __str__(self):
    #     return f"Booking for {self.event} by {self.event.customer}"

    def __str__(self):
        return f"Booking for {self.event.event_type} by {self.event.customer.user.username if self.event.customer else 'Unknown Customer'}"

    
    def clean(self):
        if self.total_amount <= 0:
            raise ValidationError({'total_amount': 'Total amount must be positive'})
        if self.advance_amount < 0 or self.advance_amount > self.total_amount:
            raise ValidationError({'advance_amount': 'Advance amount must be between 0 and total amount'})
        if self.remaining_amount != self.total_amount - self.advance_amount:
            raise ValidationError({'remaining_amount': 'Remaining amount must equal total minus advance'})
        

class Availability(models.Model):
    band = models.ForeignKey(Band, on_delete=models.CASCADE, related_name='availabilities')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    special_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    unavailability_reason = models.CharField(max_length=200, null=True, blank=True)

    class Meta:
        unique_together = ['band', 'date', 'start_time', 'end_time']

    def __str__(self):
        return f"Availability on {self.date} ({self.start_time}-{self.end_time})"

class FeedbackCategory(models.TextChoices):
    PUNCTUALITY = 'PUNCTUALITY', 'Punctuality'
    PERFORMANCE = 'PERFORMANCE', 'Performance Quality'
    PROFESSIONALISM = 'PROFESSIONALISM', 'Professionalism'
    VALUE = 'VALUE', 'Value for Money'

class Feedback(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='feedbacks')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='feedbacks')
    category = models.CharField(max_length=15, choices=FeedbackCategory.choices)
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    band_response = models.TextField(null=True, blank=True)
    images = models.ImageField(upload_to='feedback_images/', null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Feedback by {self.customer} for {self.booking}"

# class PaymentStatus(models.TextChoices):
#     PENDING = 'Pending', 'Pending'
#     COMPLETED = 'Completed', 'Completed'
#     FAILED = 'Failed', 'Failed'
#     REFUNDED = 'Refunded', 'Refunded'

class PaymentMethod(models.TextChoices):
    CREDIT_CARD = 'Credit Card', 'Credit Card'
    DEBIT_CARD = 'Debit Card', 'Debit Card'
    NET_BANKING = 'Net Banking', 'Net Banking'
    UPI = 'UPI', 'UPI'
    WALLET = 'Wallet', 'Wallet'

class Payment(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=15, choices=PaymentMethod.choices)
    transaction_id = models.CharField(max_length=100, unique=True)
    payment_date = models.DateTimeField(auto_now_add=True)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    refund_reason = models.TextField(null=True, blank=True)
    gateway_response = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Payment of {self.amount} for {self.booking}"

class PaymentTransaction(models.Model):
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='transaction', null=True, blank=True)
    transaction_id = models.CharField(max_length=255, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=[
        ('Success', 'Success'),
        ('Failure', 'Failure'),
        ('Pending', 'Pending'),
    ])
    masked_card_details = models.CharField(max_length=4)  # last 4 digits of the card
    payment_gateway = models.CharField(max_length=50, default='PhonePe')
    transaction_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Transaction {self.transaction_id} - {self.status}"

    class Meta:
        verbose_name = 'Payment Transaction'
        verbose_name_plural = 'Payment Transactions'

class Dispute(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='disputes')
    raised_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    description = models.TextField()
    status = models.CharField(max_length=20)
    resolution = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Dispute for booking {self.booking.id}"
    
@receiver(post_save, sender=Payment)
def update_booking_payment_status(sender, instance, created, **kwargs):
    if created:  # Trigger on creation only, no status check
        booking = instance.booking
        booking.advance_amount = instance.amount
        booking.remaining_amount = booking.total_amount - booking.advance_amount
        if booking.remaining_amount <= 0:
            booking.payment_status = "FULLY_PAID"
            booking.status = "CONFIRMED"
        else:
            booking.payment_status = "PARTIALLY_PAID"
            booking.status = "CONFIRMED"
        booking.save()
        logger.info(f"Booking {booking.id} updated: payment_status={booking.payment_status}, status={booking.status}")

class Review(models.Model):
    band = models.ForeignKey("Band", related_name="reviews", on_delete=models.CASCADE)
    customer = models.ForeignKey("Customer", related_name="reviews", on_delete=models.CASCADE)  # Updated
    rating = models.IntegerField(default=0)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Review by {self.customer.user.username} for {self.band.name}"
    
# ***************************************************************
    
# Notification Models
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from core.models import CustomUser

class NotificationType(models.TextChoices):
    INFO = 'INFO', 'Information'
    WARNING = 'WARNING', 'Warning'
    SUCCESS = 'SUCCESS', 'Success'
    ERROR = 'ERROR', 'Error'

class NotificationTarget(models.TextChoices):
    ALL = 'ALL', 'All Users'
    CUSTOMER = 'CUSTOMER', 'Customers Only'
    BAND = 'BAND', 'Bands Only'
    SPECIFIC = 'SPECIFIC', 'Specific Users'
    # Removed ADMIN as a target

class Notification(models.Model):
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20, 
        choices=NotificationType.choices, 
        default=NotificationType.INFO
    )
    target_type = models.CharField(
        max_length=20,
        choices=NotificationTarget.choices,
        default=NotificationTarget.ALL
    )
    specific_users = models.ManyToManyField(
        CustomUser, 
        blank=True, 
        related_name='specific_notifications'
    )
    priority = models.PositiveSmallIntegerField(default=1)  # 1=low, 2=medium, 3=high
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='created_notifications'
    )
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title

    def clean(self):
        # Validation to prevent admins from targeting themselves in specific_users
        if self.target_type == NotificationTarget.SPECIFIC:
            if not self.specific_users.exists():
                raise ValidationError("Specific users must be selected for SPECIFIC target type.")
            if self.created_by and self.created_by in self.specific_users.all():
                raise ValidationError("Admins cannot target themselves in specific notifications.")
            # Filter out admins from specific_users
            admins = CustomUser.objects.filter(is_staff=True)
            if self.specific_users.filter(is_staff=True).exists():
                raise ValidationError("Admins cannot be included in specific notifications.")

    class Meta:
        ordering = ['-created_at']

class UserNotification(models.Model):
    user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    notification = models.ForeignKey(
        Notification, 
        on_delete=models.CASCADE, 
        related_name='user_notifications'
    )
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.notification.title}"

    def mark_as_read(self):
        self.is_read = True
        self.read_at = timezone.now()
        self.save()

    def archive(self):
        self.is_archived = True
        self.archived_at = timezone.now()
        self.save()

    def delete_notification(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    class Meta:
        ordering = ['-notification__created_at']
        unique_together = ['user', 'notification']