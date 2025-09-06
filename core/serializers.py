from rest_framework import serializers
from .models import CustomUser, SocialMediaLinks, Band, BandMember, BandPortfolio, PortfolioImage, BandService, EventPackage, Customer, Event, Booking, Availability, Feedback, Dispute, PortfolioImage, Payment, PaymentTransaction, Review, Notification, UserNotification
from django.contrib.auth.hashers import make_password
from django.conf import settings
from .custom_user_serializers import CustomUserMinimalSerializer
from django.conf import settings
import logging
logger = logging.getLogger(__name__)

class CustomUserSerializer(serializers.ModelSerializer):
    terms_accepted = serializers.BooleanField(required=True)
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'password', 'phone_number', 'user_type', 'is_verified', 'terms_accepted']
        extra_kwargs = {
            'password': {'write_only': True},
            'user_type': {'read_only': True}, 
            'phone_number': {'required': True, 'allow_blank': False},
            'is_verified': {'required': False, 'default': 0}
        }

        def validate_terms_accepted(self, value):
                if isinstance(value, str):
                    value = value.lower() == 'true'  # Convert string "true" to boolean
                if not value:
                    raise serializers.ValidationError("You must accept the terms and conditions to register.")
                return value

    def create(self, validated_data):
        # Handle password hashing in the serializer
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password:
            instance.password = make_password(password)
        instance.save()
        return instance

class BandSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField() #newely added
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    phone_number = serializers.CharField(write_only=True)
    # Nested field for reading email/phone from CustomUser
    user_details = CustomUserMinimalSerializer(source='user', read_only=True)
    # Expose created_at as joined_date for clarity
    joined_date = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Band
        fields = [
             'id',# newly  added for member management
             'username', 'email', 'password', 'phone_number',  # User fields
            'name', 'genre', 'description', 'location',
            'base_price', 'verification_image', 'document_type',
            'user_details',   # Nested custom user info for reading
            'joined_date',    # Expose created_at as joined_date
            'profile_image', #newly added
        ]
        

    def create(self, validated_data):
        # Extract user data
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'password': make_password(validated_data.pop('password')),  # Hash the password
            'phone_number': validated_data.pop('phone_number'),
            'user_type': 'Band',
            'is_verified': 0  # Set to pending (0) for bands
        }

        # Create the user
        user = CustomUser.objects.create(**user_data)  # Changed from create_user to create

        # Create the band
        band = Band.objects.create(user=user, **validated_data)
        return band
    
    def get_profile_image(self, obj):
            if obj.user and obj.user.profile_image:
                request = self.context.get('request')
                return request.build_absolute_uri(obj.user.profile_image.url) if request else obj.user.profile_image.url
            return None
    

    
class BandReadSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()
    joined_date = serializers.DateTimeField(source='created_at', read_only=True)  # Add this line

    class Meta:
        model = Band
        fields = [
            "id", "name", "genre", "description", "location",
            "base_price", "verification_image", "document_type",
            "profile_image", "joined_date"  # Add joined_date here
        ]

    def get_profile_image(self, obj):
        if obj.user and obj.user.profile_image:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.user.profile_image.url) if request else obj.user.profile_image.url
        return None
class CustomerSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(required=False)  # Optional for reading, required for creation
    email = serializers.CharField(source='user.email', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)
    is_verified = serializers.IntegerField(source='user.is_verified', read_only=True)
    joined_date = serializers.DateTimeField(source='created_at', read_only=True)  # Add this line

    class Meta:
        model = Customer
        fields = ['id', 'user', 'name', 'email', 'phone_number', 'location', 'address', 'preferred_genres', 'is_verified', 'joined_date']
        extra_kwargs = {
            'name': {'required': True},
            'location': {'required': False},
            'address': {'required': False},
            'preferred_genres': {'required': False},
        }

    def create(self, validated_data):
        logger.info(f"Validated data received: {validated_data}")
        user_data = validated_data.pop('user', None)
        if user_data:
            logger.info(f"User data: {user_data}")
            user_data['user_type'] = 'Customer'
            user_serializer = CustomUserSerializer(data=user_data)
            if user_serializer.is_valid():
                user = user_serializer.save()
            else:
                raise serializers.ValidationError({'user': user_serializer.errors})
        else:
            raise serializers.ValidationError({'user': 'User data is required for registration'})
        if 'phone' not in validated_data and user_data.get('phone_number'):
            validated_data['phone'] = user_data['phone_number']
            logger.info(f"Syncing Customer.phone with user.phone_number: {validated_data['phone']}")

        customer = Customer.objects.create(user=user, **validated_data)
        logger.info(f"Customer created: ID={customer.id}, Phone={customer.phone}")
        return customer
    def to_representation(self, instance):
        # Ensure read-only fields are populated from user even when user isn't in input data
        representation = super().to_representation(instance)
        if instance.user:
            representation['email'] = instance.user.email
            representation['phone_number'] = instance.user.phone_number
            representation['is_verified'] = instance.user.is_verified
        return representation



class PendingVerificationSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source='user.email', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)
    verification_status = serializers.IntegerField(source='user.is_verified', read_only=True)
    applied_date = serializers.DateTimeField(source='created_at', read_only=True)
    verification_image = serializers.SerializerMethodField()

    class Meta:
        model = Band
        fields = [
            'id',
            'name',
            'genre',
            'description',
            'location',
            'email',
            'phone_number',
            'verification_status',
            'applied_date',
            'verification_image',
            'base_price',
        ]

    def get_verification_image(self, obj):
        if obj.verification_image:
            return self.context['request'].build_absolute_uri(obj.verification_image.url)
        return None   
         

class BandMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = BandMember
        fields = [
            'id', 'band', 'name', 'role', 'is_active',
            'join_date', 'experience_years', 'profile_image', 'bio',
            'phone_number', 'email', 'social_media_links',
            'additional_instruments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_social_media_links(self, value):
        if value is not None and not isinstance(value, dict):
            raise serializers.ValidationError("Social media links must be a dictionary")
        return value

    def validate_experience_years(self, value):
        if value < 0:
            raise serializers.ValidationError("Experience years cannot be negative")
        if value > 70:
            raise serializers.ValidationError("Experience years cannot exceed 70")
        return value
    
class CustomUserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'phone_number']


# New serializer for profile updates
class UserProfileSerializer(serializers.ModelSerializer):
    profile_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'phone_number', 'profile_image']
        extra_kwargs = {
            'username': {'read_only': True},
            'email': {'required': False},
            'phone_number': {'required': False}
        }

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def validate_profile_image(self, value):
        if value.size > 2 * 1024 * 1024:
            raise serializers.ValidationError("Image size must be less than 2MB.")
        return value
        
class SocialMediaLinksSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialMediaLinks
        fields = '__all__'
 
class PortfolioImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioImage
        fields = ['id', 'image']

class BandPortfolioSerializer(serializers.ModelSerializer):
    images = PortfolioImageSerializer(many=True, read_only=True)
    video_url = serializers.URLField(required=False, allow_null=True)

    class Meta:
        model = BandPortfolio
        fields = ['id', 'band', 'title', 'description', 'video_url', 'is_featured', 'created_at', 'images']
        read_only_fields = ['created_at']
        extra_kwargs = {'band': {'required': False}}  # Band is optional in request data

    def create(self, validated_data):
        # Get band from save kwargs if provided, otherwise expect it in validated_data
        band = self.context.get('band') or validated_data.get('band')
        if not band:
            raise serializers.ValidationError({"band": "This field is required."})
        validated_data['band'] = band  # Ensure band is included
        portfolio = BandPortfolio.objects.create(**validated_data)
        images = self.context['request'].FILES.getlist('images')
        for image in images:
            PortfolioImage.objects.create(portfolio=portfolio, image=image)
        return portfolio
                    
class BandServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = BandService
        fields = '__all__'

class EventPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventPackage
        fields = '__all__'

class BandListSerializer(serializers.ModelSerializer):
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    total_bookings = serializers.IntegerField(read_only=True)

    class Meta:
        model = Band
        fields = ['id', 'name', 'genre', 'base_price', 'average_rating', 'total_bookings']

class BandDetailSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    portfolio = BandPortfolioSerializer(many=True, read_only=True)
    services = BandServiceSerializer(many=True, read_only=True)
    packages = EventPackageSerializer(many=True, read_only=True)
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)

    class Meta:
        model = Band
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'average_rating', 'total_bookings']

class CustomerMinimalSerializer(serializers.ModelSerializer):
    user = CustomUserMinimalSerializer(read_only=True)

    class Meta:
        model = Customer
        fields = ['id', 'user']

class BandMinimalSerializer(serializers.ModelSerializer):
    user = CustomUserMinimalSerializer(read_only=True)

    class Meta:
        model = Band
        fields = ['id', 'name', 'user']


class EventSerializer(serializers.ModelSerializer):
    band = serializers.PrimaryKeyRelatedField(queryset=Band.objects.all())
    band_detail = BandSerializer(source='band', read_only=True)
    customer = serializers.PrimaryKeyRelatedField(read_only=True)
    customer_detail = CustomerSerializer(source='customer', read_only=True)

    class Meta:
        model = Event
        fields = [
           
              'customer', 'customer_detail', 'band', 'band_detail', 'event_type',
            'event_date', 'location', 'budget', 'status', 'expected_audience',
            'requirements', 'duration', 'setup_time', 'needs_sound_system',
            'needs_lighting', 'additional_notes', 'created_at'
        ]
        read_only_fields = ['customer', 'created_at']

    def validate(self, data):
        logger.info(f"Validated event data: {data}")
        if 'band' not in data or not data['band']:
            raise serializers.ValidationError({"band": "Band ID is required."})
        return data
    
    

class EventMinimalSerializer(serializers.ModelSerializer):
    band = BandSerializer(read_only=True)  # Nested serializer to include 'name'
    customer = CustomerSerializer(read_only=True)

    class Meta:
        model = Event
        fields = ['id', 'band', 'customer', 'event_type', 'event_date', 'location', 'status', 'budget']

class EventDetailSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    band = BandSerializer(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'customer', 'band', 'event_type', 'event_date', 'location',
            'expected_audience', 'requirements', 'duration', 'setup_time',
            'status', 'budget', 'needs_sound_system', 'needs_lighting',
            'additional_notes', 'created_at', 'updated_at'
        ]

class EventListSerializer(serializers.ModelSerializer):
    band_name = serializers.CharField(source='band.name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = Event
        fields = ['id', 'event_type', 'event_date', 'location', 'status', 'band_name', 'customer_name']

class EventDetailWithBandListSerializer(serializers.ModelSerializer):
    band = BandListSerializer(read_only=True)
    customer = CustomerSerializer(read_only=True)

    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = ['id', 'transaction_id', 'amount', 'status', 'masked_card_details', 'payment_gateway', 'transaction_time']

class PaymentSerializer(serializers.ModelSerializer):
    transaction = PaymentTransactionSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'booking', 'amount', 'payment_method', 'transaction_id', 'payment_date', 'refund_amount', 'refund_reason', 'gateway_response', 'transaction']
        

class BookingSerializer(serializers.ModelSerializer):
    event = serializers.PrimaryKeyRelatedField(queryset=Event.objects.all(), required=False)  # Allow optional for updates
    event_detail = EventMinimalSerializer(source='event', read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    band_name = serializers.CharField(source='event.band.name', read_only=True)
    customer_name = serializers.CharField(source='event.customer.name', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'event', 'status', 'total_amount', 'advance_amount',
            'remaining_amount', 'payment_status', 'booking_date', 'terms_accepted',
            'created_at', 'updated_at', 'payments', 'event_detail',
            'band_name', 'customer_name'
        ]
        extra_kwargs = {
            'total_amount': {'required': False},  # Optional for updates
            'remaining_amount': {'required': False},  # Optional for updates
            'advance_amount': {'required': False},  # Optional for updates
        }

    def update(self, instance, validated_data):
        # Handle partial updates gracefully
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
    
    def get_band(self, obj):
        # Define how the 'band' field should be serialized
        if obj.event and obj.event.band:
            return BandMinimalSerializer(obj.event.band).data
        return None
    
class BookingListSerializer(serializers.ModelSerializer):
    event_type = serializers.CharField(source='event.event_type', read_only=True)
    band_name = serializers.CharField(source='event.band.name', read_only=True)
    customer_name = serializers.CharField(source='event.customer.name', read_only=True)
    event_date = serializers.DateTimeField(source='event.event_date', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'event_type', 'band_name', 'customer_name', 'event_date', 'status', 'total_amount']

class BookingDetailSerializer(serializers.ModelSerializer):
    event = EventDetailSerializer(read_only=True)
    band = BandDetailSerializer(read_only=True)
    customer = CustomerSerializer(read_only=True)
    payments = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_payments(self, obj):
        return PaymentSerializer(obj.payments.all(), many=True).data

class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = ['id', 'band', 'date', 'start_time', 'end_time', 'is_available', 'special_price', 'unavailability_reason']

    def validate(self, data):
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("End time must be after start time")
        return data

class FeedbackSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = Feedback
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['created_at', 'gateway_response']

class PaymentHistorySerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    date = serializers.DateTimeField(source='payment_date', read_only=True)
    payment_status = serializers.CharField(source='booking.payment_status', read_only=True, default='UNPAID')  # From Booking
    transaction = PaymentTransactionSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id',           
            'user',         
            'amount',       
            'date',         
            'payment_status',  
            'payment_method',  
            'transaction_id',  
            'transaction',     
        ]

    def get_user(self, obj):
        """
        Get the customer's username from the associated booking's event.
        """
        try:
            booking = obj.booking
            if booking and booking.event and booking.event.customer:
                return booking.event.customer.user.username
            return "Unknown User"
        except AttributeError:
            return "Unknown User"


class DisputeSerializer(serializers.ModelSerializer):
    raised_by_name = serializers.CharField(source='raised_by.username', read_only=True)

    class Meta:
        model = Dispute
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class ReviewSerializer(serializers.ModelSerializer):
    customer = serializers.ReadOnlyField(source="customer.user.username")  # Fixed source

    class Meta:
        model = Review
        fields = ["id", "band", "customer", "rating", "comment", "created_at"]

    def validate(self, data):
        print("Incoming review data:", data)
        if "band" not in data:
            raise serializers.ValidationError("Band is required.")
        return data
    
class BandCustomerRatioSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=10)
    value = serializers.IntegerField()

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'target_type', 'created_at']

class UserNotificationSerializer(serializers.ModelSerializer):
    notification = NotificationSerializer()  # Nested serializer to include Notification details

    class Meta:
        model = UserNotification
        fields = ['id', 'user', 'notification', 'is_read', 'read_at', 'is_archived', 'archived_at']
        read_only_fields = ['user']