from .models import (
    CustomUser, SocialMediaLinks, Band,BandMember, BandPortfolio, BandService, EventPackage,Review,Notification, NotificationTarget,
    Customer, Event, Booking, EventStatus, BookingStatus, Availability, Feedback, Payment, Dispute, PaymentTransaction, UserNotification
)
from .serializers import (
    CustomUserSerializer, SocialMediaLinksSerializer, BandSerializer, BandMemberSerializer, BandPortfolioSerializer, BandServiceSerializer,BandCustomerRatioSerializer,
    EventPackageSerializer, CustomerSerializer, EventListSerializer, EventDetailSerializer, BookingListSerializer,BookingDetailSerializer, NotificationSerializer,
    BookingDetailSerializer, AvailabilitySerializer, FeedbackSerializer, PaymentSerializer, EventSerializer,PaymentHistorySerializer,ReviewSerializer,
    DisputeSerializer, PendingVerificationSerializer, BandReadSerializer, UserProfileSerializer, BookingSerializer, PaymentTransactionSerializer,
    NotificationSerializer, UserNotificationSerializer
)
from decimal import Decimal
from rest_framework import viewsets, permissions
from django.http import JsonResponse
from django.db.models import Count
from django.contrib.auth.models import User
import time
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.db.models import Count
from django.utils import timezone
from .serializers import CustomUserSerializer, BandSerializer
import logging

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password
from rest_framework import generics, status, viewsets
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
import jwt
import datetime
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.conf import settings
import datetime
import logging
from django.contrib.auth.hashers import make_password
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.mail import send_mail
logger = logging.getLogger(__name__)
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import Booking, Payment, PaymentTransaction
from django.utils import timezone
import requests
import hashlib


@api_view(["GET"])
def band_customer_ratio(request):
    try:
        user_counts = (
            CustomUser.objects.filter(is_verified=1)
            .values("user_type")
            .annotate(count=Count("user_type"))
            .exclude(user_type="Admin")  
        )

        ratio_data = [
            {"name": "Bands", "value": 0},
            {"name": "Customers", "value": 0},
        ]

        for entry in user_counts:
            if entry["user_type"] == "Band":
                ratio_data[0]["value"] = entry["count"]
            elif entry["user_type"] == "Customer":
                ratio_data[1]["value"] = entry["count"]

        serializer = BandCustomerRatioSerializer(ratio_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error in band_customer_ratio: {e}")
        return Response(
            {"error": "Internal server error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
class TotalBookingsView(APIView):
    def get(self, request):
        total_bookings = Booking.objects.filter(
            payment_status__in=['PARTIALLY_PAID', 'FULLY_PAID']
        ).count()
        return Response({'total_bookings': total_bookings}, status=status.HTTP_200_OK)

        
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    user = request.user
    return Response({
        "username": user.username,
        "id": user.id,
    })
        
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_email_view(request):
        try:
            to_email = request.data.get('to_email')
            subject = request.data.get('subject')
            message = request.data.get('message')
            send_mail(subject, message, 'eldhokshajee@gmail.com', [to_email], fail_silently=True)
            logger.info(f"Email sent to {to_email}")
            return Response({"message": "Email sent successfully"}, status=200)
        except Exception as e:
            logger.error(f"Email sending failed: {str(e)}")
            return Response({"error": "Failed to send email"}, status=500)


def get_bookings_by_event(request):
    event_id = request.GET.get('event', None)
    if event_id:
        bookings = Booking.objects.filter(event=event_id).values('id', 'event', 'status', 'total_amount', 'advance_amount', 'remaining_amount')
        print("Bookings for event", event_id, ":", list(bookings))
        return JsonResponse(list(bookings), safe=False)
    return JsonResponse([], safe=False)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    try:
        username = request.data.get("username")
        password = request.data.get("password")
        user_type = request.data.get("userType")

        logger.info(f"=== Login Attempt Debug ===")
        logger.info(f"Received credentials - Username: {username}, UserType: {user_type}")

        User = get_user_model()
        try:
            user = User.objects.get(username=username)
            logger.info(f"""
            Database User Found:
            - Username: {user.username}
            - User Type: {user.user_type}
            - Is Verified: {user.is_verified}
            - Is Active: {user.is_active}
            """)

            password_valid = user.check_password(password)
            logger.info(f"Direct password check result: {password_valid}")

            authenticated_user = authenticate(request=request, username=username, password=password)
            logger.info(f"Authentication result: {'Success' if authenticated_user else 'Failed'}")

            if not authenticated_user:
                if not password_valid:
                    logger.warning("Authentication failed: Invalid password")
                    return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
                else:
                    logger.warning("Password valid but authentication failed - possible backend issue")
                    authenticated_user = user if password_valid else None

            if authenticated_user:
                if authenticated_user.user_type != user_type:
                    logger.warning(f"User type mismatch: {authenticated_user.user_type} vs {user_type}")
                    return Response({"error": "Invalid user type"}, status=status.HTTP_401_UNAUTHORIZED)

                if authenticated_user.is_verified != 1:
                    logger.warning(f"User not verified: {authenticated_user.is_verified}")
                    return Response({"error": "Account not verified"}, status=status.HTTP_401_UNAUTHORIZED)

                # Generate token
                refresh = RefreshToken.for_user(authenticated_user)
                logger.info(f"Login successful for user: {username}")

                return Response({
                    "token": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": {
                        "id": authenticated_user.id,
                        "username": authenticated_user.username,
                        "email": authenticated_user.email,
                        "user_type": authenticated_user.user_type,
                        "is_verified": authenticated_user.is_verified
                    }
                })
            else:
                logger.warning("Authentication failed after all checks")
                return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        except User.DoesNotExist:
            logger.warning(f"No user found with username: {username}")
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response({"error": f"Login failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


     
class PendingVerificationsView(APIView):
    def get(self, request):
        pending_bands = Band.objects.filter(user__is_verified=0)
        serializer = PendingVerificationSerializer(pending_bands, many=True, context={'request': request})
        return Response(serializer.data)
    
class PendingVerificationCountView(APIView):
    def get(self, request):
        pending_count = Band.objects.filter(user__is_verified=0).count()
        return Response({'pending_count': pending_count})

class UpdateVerificationStatusView(APIView):
    def post(self, request, band_id):
        status_value = request.data.get('status')

        if status_value not in [-1, 1]:
            return Response(
                {'error': 'Invalid status value. Use -1 for rejection or 1 for approval.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            band = Band.objects.get(id=band_id)
            user = band.user
            user.is_verified = status_value
            user.save()
            return Response(
                {'message': f'Verification status updated to {status_value} successfully.'},
                status=status.HTTP_200_OK
            )
        except Band.DoesNotExist:
            return Response(
                {'error': 'Band not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class CustomerRegisterView(generics.CreateAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                customer = serializer.save()
                # Generate tokens for immediate login
                refresh = RefreshToken.for_user(customer.user)
                logger.info(f"Customer {customer.id} registered successfully for user {customer.user.username}")
                return Response({
                    'message': 'Customer registered successfully',
                    'id': customer.id,
                    'name': customer.name,
                    'token': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': {
                        'id': customer.user.id,
                        'username': customer.user.username,
                        'email': customer.user.email,
                        'user_type': customer.user.user_type,
                        'is_verified': customer.user.is_verified,
                    }
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"Customer registration failed: {str(e)}")
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        logger.error(f"Validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)    



class BandRegisterView(generics.CreateAPIView):
    serializer_class = BandSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            logger.debug(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            band = serializer.save()
            user = band.user  
            refresh = RefreshToken.for_user(user)
            logger.info(f"Band {band.id} registered successfully for user {user.id}")
            return Response({
                'message': 'Band registration pending verification',
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id
                },
                'band': {
                    'id': band.id,
                    'name': band.name,
                    'status': 'pending'
                }
            }, status=status.HTTP_201_CREATED)
        except IntegrityError as e:
            logger.warning(f"IntegrityError during band registration: {str(e)}")
            if "UNIQUE constraint failed: core_customuser.email" in str(e):
                return Response({
                    'email': ['This email is already registered. Please use a different email or log in.']
                }, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                'error': 'A database error occurred. Please try again later.'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Unexpected error during band registration: {str(e)}", exc_info=True)
            return Response({
                'error': 'An unexpected error occurred. Please try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class CheckUsernameView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        username = request.query_params.get('username', '').strip()
        if not username:
            return Response({
                'error': 'Username is required'
            }, status=400)
        
        exists = CustomUser.objects.filter(username=username).exists()
        logger.debug(f"Checked username '{username}': {'exists' if exists else 'available'}")
        return Response({
            'username': username,
            'available': not exists
        }, status=200)
                        
class CustomUserListCreateView(generics.ListCreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer



class CustomLoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user_type = request.data.get('userType')

        if not username or not password:
            logger.warning("Login attempt with missing credentials")
            return Response({
                'error': 'Please provide both username and password'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)

        if user is None:
            logger.info(f"Authentication failed for username: {username}")
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Verify user type
        if user.user_type != user_type:
            logger.info(f"User type mismatch: {user.user_type} != {user_type}")
            return Response({
                'error': 'Invalid user type'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check verification status
        if not user.is_verified:
            logger.info(f"User not verified: {username}, is_verified: {user.is_verified}")
            return Response({
                'error': 'Account not verified'  
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        logger.info(f"Login successful for {username} ({user_type})")
        
        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'user_type': user.user_type
            }
        }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_band(request):
    """
    Return the band profile for the logged-in user.
    """
    try:
       
        band = request.user.band_profile
        serializer = BandSerializer(band)
        return Response(serializer.data)
    except Band.DoesNotExist:
        return Response({"error": "Band profile not found"}, status=404)
    

class CustomerVerificationUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, customer_id):
        logger.info(f"User: {request.user}, Attempting to update customer {customer_id} to status {request.data.get('status')}")
        if request.user.user_type != "Admin":
            logger.warning(f"Unauthorized attempt by {request.user.username}")
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        status_value = request.data.get('status')
        if status_value not in [-1, 1]:
            return Response({'error': 'Invalid status value'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            customer = Customer.objects.get(id=customer_id)
            logger.info(f"Before update: Customer {customer.id}, is_verified={customer.user.is_verified}")
            customer.user.is_verified = status_value
            customer.user.save()
            customer.user.refresh_from_db()  # Ensure we get the latest DB state
            logger.info(f"After update: Customer {customer.id}, is_verified={customer.user.is_verified}")
            serializer = CustomerSerializer(customer, context={'request': request})
            return Response({
                'message': f'Customer verification status updated to {status_value}.',
                'customer': serializer.data
            }, status=status.HTTP_200_OK)
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error: {str(e)}", exc_info=True)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                            
class BandProfileDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = BandSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.band_profile
    

class CustomerListView(APIView):
    def get(self, request):
        customers = Customer.objects.all()
        serializer = CustomerSerializer(customers, many=True, context={'request': request})
        return Response(serializer.data)
    
class AllBookingsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        all_events = Event.objects.select_related('band', 'customer').prefetch_related('bookings')
        serializer = EventDetailSerializer(all_events, many=True, context={'request': request})
        logger.info(f"Fetched {len(all_events)} events for all bookings")
        return Response(serializer.data)
    
class PendingBookingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Fetch events with status='PENDING' (no booking yet)
        pending_events = Event.objects.filter(
            status='PENDING'
        ).select_related('band', 'customer')
        serializer = EventDetailSerializer(pending_events, many=True, context={'request': request})
        logger.info(f"Fetched {len(pending_events)} pending bookings (Event.status='PENDING')")
        return Response(serializer.data)

class CompletedBookingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            completed_bookings = Booking.objects.filter(
                payment_status='FULLY_PAID',
                status='CONFIRMED'
            ).select_related(
                'event__band',
                'event__customer',
                'event__customer__user' 
            ).prefetch_related(
                'payments',
                'payments__transaction'
            ).distinct()

            serializer = BookingDetailSerializer(completed_bookings, many=True, context={'request': request})
            logger.info(f"Fetched {len(completed_bookings)} completed bookings")
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error fetching completed bookings: {str(e)}")
            return Response(
                {"error": "Failed to fetch completed bookings", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BandMemberListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if hasattr(request.user, 'band_profile'):
            members = request.user.band_profile.members.all()
            serializer = BandMemberSerializer(members, many=True)
            return Response(serializer.data)
        return Response({"error": "Band profile not found"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        if hasattr(request.user, 'band_profile'):
            serializer = BandMemberSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(band=request.user.band_profile)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response({"error": "Band profile not found"}, status=status.HTTP_404_NOT_FOUND)
    
class BandMemberDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, band):
        return get_object_or_404(BandMember, pk=pk, band=band)

    def put(self, request, pk):
        if hasattr(request.user, 'band_profile'):
            member = self.get_object(pk, request.user.band_profile)
            serializer = BandMemberSerializer(member, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response({"error": "Band profile not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        if hasattr(request.user, 'band_profile'):
            member = self.get_object(pk, request.user.band_profile)
            member.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({"error": "Band profile not found"}, status=status.HTTP_404_NOT_FOUND)

class ExistingBandsView(APIView):
    def get(self, request):
        existing_bands = Band.objects.filter(user__is_verified=1)  
        serializer = BandReadSerializer(existing_bands, many=True, context={'request': request})
        return Response(serializer.data)
    
class DeniedBandsView(APIView): 
    def get(self, request):
        # Fetch bands where the associated user is rejected (is_verified = -1)
        denied_bands = Band.objects.filter(user__is_verified=-1)
        serializer = BandReadSerializer(denied_bands, many=True)
        return Response(serializer.data)
    
class CustomerDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.user_type != "Admin":
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        customer = get_object_or_404(Customer, id=pk)
        serializer = CustomerSerializer(customer, context={'request': request})
        logger.info(f"Fetched details for customer {pk} by {request.user.username}")
        return Response(serializer.data)
    
class ExistingCustomersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != "Admin":
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        existing_customers = Customer.objects.filter(user__is_verified=1)  # Ensure this filter is correct
        serializer = CustomerSerializer(existing_customers, many=True, context={'request': request})
        logger.info(f"Fetched {len(existing_customers)} existing customers: {[c.id for c in existing_customers]}")
        return Response(serializer.data)
    
class DeniedCustomersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != "Admin":
            logger.warning(f"Unauthorized attempt by {request.user.username} (Type: {request.user.user_type})")
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        denied_customers = Customer.objects.filter(user__is_verified=-1)
        serializer = CustomerSerializer(denied_customers, many=True, context={'request': request})
        logger.info(f"Fetched {len(denied_customers)} denied customers for {request.user.username}")
        return Response(serializer.data)

class BandDetailsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk):
        band = get_object_or_404(Band, id=pk)
        members = BandMember.objects.filter(band=band)
        portfolio = BandPortfolio.objects.filter(band=band)
        band_data = BandSerializer(band, context={'request': request}).data
        band_data["members"] = BandMemberSerializer(members, many=True, context={'request': request}).data
        band_data["portfolio"] = BandPortfolioSerializer(portfolio, many=True, context={'request': request}).data
        print("Band Data Sent:", band_data)  # Debug log
        return Response(band_data)
        
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})  # Pass request context
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        logger.error(f"Validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class SocialMediaLinksListCreateView(generics.ListCreateAPIView):
    queryset = SocialMediaLinks.objects.all()
    serializer_class = SocialMediaLinksSerializer

class BandListCreateView(generics.ListCreateAPIView):
    queryset = Band.objects.all()
    serializer_class = BandSerializer

class BandPortfolioListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if hasattr(request.user, 'band_profile'):
            portfolio_items = request.user.band_profile.portfolio.all()
            serializer = BandPortfolioSerializer(portfolio_items, many=True, context={'request': request})
            return Response(serializer.data)
        return Response({"error": "Band profile not found"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        if hasattr(request.user, 'band_profile'):
            # Pass band in context explicitly
            context = {'request': request, 'band': request.user.band_profile}
            serializer = BandPortfolioSerializer(data=request.data, context=context)
            if serializer.is_valid():
                serializer.save()  # band is now handled in serializer.create()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            logger.error(f"Portfolio creation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response({"error": "Band profile not found"}, status=status.HTTP_404_NOT_FOUND)
            
class BandPortfolioDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, band):
        return get_object_or_404(BandPortfolio, pk=pk, band=band)

    def put(self, request, pk):
        if hasattr(request.user, 'band_profile'):
            portfolio = self.get_object(pk, request.user.band_profile)
            serializer = BandPortfolioSerializer(portfolio, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response({"error": "Band profile not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        if hasattr(request.user, 'band_profile'):
            portfolio = self.get_object(pk, request.user.band_profile)
            portfolio.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({"error": "Band profile not found"}, status=status.HTTP_404_NOT_FOUND)
    
class BandServiceListCreateView(generics.ListCreateAPIView):
    queryset = BandService.objects.all()
    serializer_class = BandServiceSerializer
class EventListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EventDetailSerializer

    def get_queryset(self):
        band_id = self.request.query_params.get('band')
        user = self.request.user
        logger.info(f"User: {user.id}, Type: {user.user_type}, Band ID: {band_id}")

        if not band_id:
            return Event.objects.none()

        try:
            band = Band.objects.get(id=band_id)
            if user.user_type == 'Band' and band.user != user:
                logger.warning(f"User {user.id} not authorized for band {band_id}")
                return Event.objects.none()
            elif user.user_type == 'Customer':
                return Event.objects.filter(band=band_id, customer__user=user)

            # For band users: PENDING/PLANNED events not CONFIRMED with payment
            confirmed_event_ids = Booking.objects.filter(
                status="CONFIRMED",
                payment_status__in=["PARTIALLY_PAID", "FULLY_PAID"]
            ).values_list('event', flat=True)
            queryset = Event.objects.filter(
                band_id=band_id,
                event_date__gt=timezone.now(),
                status__in=['PENDING', 'PLANNED']
            ).exclude(id__in=confirmed_event_ids)
            logger.info(f"Queryset: {queryset.query}")
            logger.info(f"Events found: {list(queryset)}")
            return queryset

        except Band.DoesNotExist:
            logger.error(f"Band {band_id} not found")
            return Event.objects.none()
class EventCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info(f"Received POST data: {request.data}")
        try:
            customer = request.user.customer_profile
        except Customer.DoesNotExist:
            try:
                customer = Customer.objects.create(
                    user=request.user,
                    name=request.user.username,
                    phone=request.user.phone_number or "",
                    location=""
                )
            except Exception as e:
                return Response(
                    {"error": f"Failed to create customer profile: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        data = request.data.copy()
        data['status'] = 'PENDING'
        serializer = EventSerializer(data=data)
        if serializer.is_valid():
            event = serializer.save(customer=customer)
            try:
                # Ensure NotificationTarget is imported correctly
                from core import NotificationTarget  # Adjust 'your_app'
                Notification.objects.create(
                    title=f"New Event Request: {event.event_type}",
                    message=f"{request.user.username} has requested your band for {event.event_type} on {event.event_date}. Budget: ₹{event.budget}",
                    notification_type='INFO',
                    target_type=NotificationTarget.SPECIFIC,  # Verify this
                    created_by=request.user,
                    specific_users=[event.band.user]
                )
            except AttributeError as e:
                logger.error(f"NotificationTarget error: {str(e)}")
                # Proceed without notification, event is still created
                logger.warning("Notification not created due to invalid target_type, but event saved successfully")
            except Exception as e:
                logger.error(f"Error creating notification: {str(e)}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(
            {"error": "Invalid data provided.", "details": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
class EventViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = EventSerializer

    def get_queryset(self):
        user = self.request.user
        if user.user_type == "Band":
            try:
                band = user.band_profile
                return Event.objects.filter(band=band, status="PENDING").exclude(
                    id__in=Booking.objects.filter(status="CONFIRMED").values_list("event_id", flat=True)
                )
            except AttributeError:
                return Event.objects.none()
        elif user.user_type == "Customer":
            try:
                return Event.objects.filter(customer=user.customer_profile)
            except Customer.DoesNotExist:
                return Event.objects.none()
        return Event.objects.none()    
# views.py
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_event(request, event_id):
    try:
        event = Event.objects.get(id=event_id, status='PENDING')
        if request.user.user_type != 'Band' or event.band.user != request.user:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        event.status = 'REJECTED'
        event.save()
        # Notify the customer
        Notification.objects.create(
            title=f"Event Rejected: {event.event_type}",
            message=f"Your request for {event.band.name} on {event.event_date} was rejected.",
            notification_type='ERROR',
            target_type=NotificationTarget.SPECIFIC,
            created_by=request.user,
            specific_users=[event.customer.user]
        )
        return Response({"message": "Event rejected"}, status=status.HTTP_200_OK)
    except Event.DoesNotExist:
        return Response({"error": "Event not found"}, status=status.HTTP_404_NOT_FOUND)
    
class EventPackageListCreateView(generics.ListCreateAPIView):
    queryset = EventPackage.objects.all()
    serializer_class = EventPackageSerializer

class CustomerListCreateView(generics.ListCreateAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

class EventListCreateView(generics.ListCreateAPIView):
    queryset = Event.objects.all()
    serializer_class = EventListSerializer

class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Event.objects.all()
    serializer_class = EventDetailSerializer
    permission_classes = [IsAuthenticated]

    def put(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.user_type != 'Band' or instance.band.user != request.user:
            return Response({"error": "Only the band can update this event"}, status=403)
        logger.info(f"PUT request data: {request.data}")
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class BookingListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        logger.info(f"Authenticated user: {user} (ID: {user.id}), Type: {user.user_type}")
        
        if user.user_type == 'Band':
            try:
                band = user.band_profile
                logger.info(f"Band profile: {band} (ID: {band.id})")
                bookings = Booking.objects.filter(
                    event__band=band,
                    status="CONFIRMED",
                    payment_status__in=["PARTIALLY_PAID", "FULLY_PAID"]
                )
                logger.info(f"Queryset: {bookings.query}")
                logger.info(f"Bookings found: {list(bookings)}")
            except Band.DoesNotExist:
                logger.error("Band profile not found for user:", user)
                return Response({"error": "Band profile not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            bookings = Booking.objects.filter(event__customer__user=user)
            logger.info(f"Customer bookings: {list(bookings)}")

        serializer = BookingSerializer(bookings, many=True)
        logger.info(f"Serialized data: {serializer.data}")
        return Response(serializer.data, status=status.HTTP_200_OK)
    def post(self, request):
        event_id = request.data.get('event')
        if not event_id or not Event.objects.filter(id=event_id).exists():
            return Response({"error": "Invalid or missing event ID"}, status=status.HTTP_400_BAD_REQUEST)

        event = Event.objects.get(id=event_id)
        if request.user.user_type == 'Band':
            try:
                band = request.user.band_profile
                if event.band != band:
                    return Response({"error": "You can only accept events for your band"}, status=status.HTTP_403_FORBIDDEN)
            except Band.DoesNotExist:
                return Response({"error": "Band profile not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = BookingSerializer(data=request.data)
        if serializer.is_valid():
            booking = serializer.save()
            Notification.objects.create(
                title=f"Booking Accepted: {event.event_type}",
                message=f"Your request for {event.band.name} on {event.event_date} has been accepted.",
                notification_type='SUCCESS',
                target_type=NotificationTarget.SPECIFIC,
                created_by=request.user,
                specific_users=[event.customer.user]
            )
            event_serializer = EventSerializer(event)
            return Response({"booking": serializer.data, "event": event_serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
def update_event(request, pk):
    try:
        event = Event.objects.get(pk=pk)
        if event.status != "PENDING":
            return Response({"error": "Event cannot be updated"}, status=400)
        
        serializer = EventSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    except Event.DoesNotExist:
        logger.error(f"Event {pk} not found")
        return Response({"error": "Event not found"}, status=404)
    

PHONEPE_MERCHANT_ID = "PGTESTPAYUAT143"
PHONEPE_SALT_KEY = "ab3ab177-b468-4791-8071-275c404d8ab0"
PHONEPE_SALT_INDEX = "1"
PHONEPE_STATUS_API = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status"

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_payment(request):
    logger.info(f"Request data received: {request.data}")
    transaction_id = request.data.get('transaction_id')
    booking_id = request.data.get('booking_id')

    if not (transaction_id and booking_id):
        logger.error("Missing transaction_id or booking_id")
        return Response({"status": "failure", "error": "Missing required fields"}, status=400)

    try:
        booking = Booking.objects.get(id=booking_id)
        logger.info(f"Booking found: ID={booking_id}, Status={booking.status}")
    except Booking.DoesNotExist:
        logger.error(f"Booking {booking_id} not found")
        return Response({"status": "failure", "error": "Booking not found"}, status=404)

    # Verify payment status with PhonePe
    status_url = f"{PHONEPE_STATUS_API}/{PHONEPE_MERCHANT_ID}/{transaction_id}"
    string_to_hash = f"/pg/v1/status/{PHONEPE_MERCHANT_ID}/{transaction_id}{PHONEPE_SALT_KEY}"
    checksum = hashlib.sha256(string_to_hash.encode()).hexdigest() + f"###{PHONEPE_SALT_INDEX}"

    logger.info(f"Calling PhonePe status API: {status_url}")
    response = requests.get(
        status_url,
        headers={
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
            "X-MERCHANT-ID": PHONEPE_MERCHANT_ID,
            "accept": "application/json",
        }
    )

    if response.status_code != 200:
        logger.error(f"PhonePe status check failed: {response.status_code} - {response.text}")
        return Response({"status": "failure", "error": "Payment verification failed"}, status=500)

    payment_data = response.json()
    logger.info(f"PhonePe status response: {payment_data}")

    if not payment_data.get("success") or payment_data.get("code") != "PAYMENT_SUCCESS":
        logger.error(f"Payment not successful: {payment_data}")
        return Response({"status": "failure", "error": payment_data.get('code', 'Unknown error')}, status=400)

    # Get the actual payment amount from PhonePe (in paise, convert to rupees)
    phonepe_amount = Decimal(payment_data.get('data', {}).get('amount', 0)) / 100  # Assuming amount is in paise
    logger.info(f"PhonePe payment amount: {phonepe_amount}")

    # Validate against band-set advance_amount
    if phonepe_amount != booking.advance_amount:
        logger.error(f"Payment amount {phonepe_amount} does not match required advance_amount {booking.advance_amount}")
        return Response({"status": "failure", "error": "Payment amount does not match required advance"}, status=400)

    try:
        with transaction.atomic():
            logger.info(f"Starting atomic transaction for booking {booking_id}")
            # Use PhonePe amount instead of frontend amount
            booking.advance_amount = phonepe_amount  # Should already match, just confirming
            booking.remaining_amount = booking.total_amount - phonepe_amount
            booking.payment_status = "PARTIALLY_PAID" if booking.remaining_amount > 0 else "FULLY_PAID"
            booking.status = "CONFIRMED"
            booking.save(update_fields=['advance_amount', 'remaining_amount', 'payment_status', 'status'])
            logger.info(f"Booking updated: Status={booking.status}, Payment Status={booking.payment_status}")

            event = booking.event
            event.status = "PLANNED"
            event.save(update_fields=['status'])
            logger.info(f"Event updated: ID={event.id}, Status={event.status}")

            if Payment.objects.filter(transaction_id=transaction_id).exists():
                    existing_payment = Payment.objects.get(transaction_id=transaction_id)
                    if existing_payment.booking == booking:
                        logger.info(f"Transaction {transaction_id} already processed for booking {booking_id}")
                        booking_serializer = BookingSerializer(booking)
                        return Response({"status": "success", "booking": booking_serializer.data}, status=200)
                    else:
                        logger.error(f"Duplicate transaction_id {transaction_id} used for a different booking")
                        return Response({"status": "failure", "error": "Transaction ID already used for another booking"}, status=400)

            payment = Payment.objects.create(
                booking=booking,
                amount=phonepe_amount,  # Use verified amount
                payment_method="UPI",
                transaction_id=transaction_id,
                payment_date=timezone.now()
            )
            logger.info(f"Payment created: ID={payment.id}, Transaction ID={transaction_id}")

            PaymentTransaction.objects.create(
                payment=payment,
                transaction_id=transaction_id,
                amount=phonepe_amount,
                status="Success",
                masked_card_details="XXXX",
                payment_gateway="PhonePe",
                transaction_time=timezone.now()
            )
            logger.info(f"PaymentTransaction created for Payment ID={payment.id}")

            # Notifications...
            band_notification = Notification.objects.create(
                title=f"Payment Received: {event.event_type}",
                message=f"{event.customer.user.username} paid ₹{phonepe_amount} for {event.event_date}.",
                notification_type='SUCCESS',
                target_type='SPECIFIC',
                created_by=event.customer.user
            )
            band_notification.specific_users.set([event.band.user])

            customer_notification = Notification.objects.create(
                title="Payment Successful",
                message=f"Your payment of ₹{phonepe_amount} for {event.band.name} has been processed.",
                notification_type='SUCCESS',
                target_type='SPECIFIC',
                created_by=event.customer.user
            )
            customer_notification.specific_users.set([event.customer.user])

        # Email sending
        customer_email = event.customer.user.email
        subject = "Payment Successful - BandHive Booking Confirmation"
        message = (
            f"Dear {event.customer.user.username},\n\n"
            f"Your payment of ₹{phonepe_amount} is confirmed.\n\n"
            f"Booking Details:\n"
            f"- Band: {event.band.name}\n"
            f"- Event: {event.event_type}\n"
            f"- Date: {event.event_date}\n"
            f"- Transaction ID: {transaction_id}\n"
            f"- Amount Paid: ₹{phonepe_amount}\n"
            f"- Remaining Amount: ₹{booking.remaining_amount}\n"
            f"- Status: {event.status}\n\n"
            f"Thank you!"
        )
        try:
            logger.info(f"Sending email to {customer_email}")
            send_mail(subject, message, 'eldhokshajee@gmail.com', [customer_email], fail_silently=True)
            logger.info(f"Email sent successfully to {customer_email}")
        except Exception as e:
            logger.error(f"Email sending failed: {str(e)}")

        booking_serializer = BookingSerializer(booking)
        logger.info(f"Payment confirmed successfully for booking {booking_id}")
        return Response({"status": "success", "booking": booking_serializer.data}, status=200)

    except Exception as e:
        logger.error(f"Transaction failed: {str(e)}", exc_info=True)
        return Response({"status": "failure", "error": f"Transaction processing failed: {str(e)}"}, status=500)
                
@api_view(['POST'])
@permission_classes([AllowAny])
def phonepe_callback(request):
    transaction_id = request.data.get('merchantTransactionId')
    status_code = request.data.get('code')
    amount = float(request.data.get('amount', 0)) / 100

    if not transaction_id:
        logger.error("Missing transaction ID in callback")
        return Response({"status": "failure", "error": "Missing transaction ID"}, status=400)

    try:
        booking_id = int(transaction_id.split("TXN")[1].split("T")[0])
        booking = Booking.objects.get(id=booking_id)
    except (IndexError, ValueError, Booking.DoesNotExist):
        logger.error(f"Invalid or missing booking ID from transaction_id: {transaction_id}")
        return Response({"status": "failure", "error": "Invalid or missing booking ID"}, status=404)

    if status_code == "PAYMENT_SUCCESS":
        with transaction.atomic():
            booking.advance_amount = amount
            booking.remaining_amount = booking.total_amount - amount
            booking.payment_status = "PARTIALLY_PAID" if booking.remaining_amount > 0 else "FULLY_PAID"
            booking.status = "CONFIRMED"  # Set to CONFIRMED after payment
            booking.save(update_fields=['advance_amount', 'remaining_amount', 'payment_status', 'status'])

            event = booking.event
            event.status = "PLANNED"
            event.save()

            payment = Payment.objects.create(
                booking=booking,
                amount=amount,
                payment_method="UPI",
                transaction_id=transaction_id,
                payment_date=timezone.now()
            )
            PaymentTransaction.objects.create(
                payment=payment,
                transaction_id=transaction_id,
                amount=amount,
                status="Success",
                masked_card_details="XXXX",
                payment_gateway="PhonePe",
                transaction_time=timezone.now()
            )

            logger.info(f"Event {event.id} status: {event.status}")
            logger.info(f"Booking {booking.id} payment_status: {booking.payment_status}, status: {booking.status}")

            Notification.objects.create(
                title=f"Payment Received: {event.event_type}",
                message=f"{event.customer.user.username} paid ₹{amount} for {event.event_date}.",
                notification_type='SUCCESS',
                target_type=NotificationTarget.SPECIFIC,
                created_by=event.customer.user,
                specific_users=[event.band.user]
            )
            Notification.objects.create(
                title="Payment Successful",
                message=f"Your payment of ₹{amount} for {event.band.name} has been processed.",
                notification_type='SUCCESS',
                target_type=NotificationTarget.SPECIFIC,
                created_by=event.customer.user,
                specific_users=[event.customer.user]
            )

            customer_email = event.customer.user.email
            subject = "Payment Successful - BandHive Booking Confirmation"
            message = (
                f"Dear {event.customer.user.username},\n\n"
                f"Your payment of ₹{amount} is confirmed.\n\n"
                f"Booking Details:\n"
                f"- Band: {event.band.name}\n"
                f"- Event: {event.event_type}\n"
                f"- Date: {event.event_date}\n"
                f"- Transaction ID: {transaction_id}\n"
                f"- Amount Paid: ₹{amount}\n"
                f"- Remaining Amount: ₹{booking.remaining_amount}\n"
                f"- Status: {event.status}\n\n"
                f"Thank you!"
            )
            # send_mail(subject, message, 'eldhokshajee@gmail.com', [customer_email], fail_silently=True)
            # logger.info(f"Email sent to {customer_email}")

        try:
            logger.info(f"Sending email to {customer_email}")
            send_mail(subject, message, 'eldhokshajee@gmail.com', [customer_email], fail_silently=True)
            logger.info(f"Email sent to {customer_email}")
        except Exception as e:
            logger.error(f"Email sending failed: {str(e)}")

        event_serializer = EventSerializer(event)
        booking_serializer = BookingSerializer(booking)
        return Response({
            "status": "success",
            "event": event_serializer.data,
            "booking": booking_serializer.data
        }, status=200)
    else:
        logger.error(f"Payment failed: {status_code}")
        return Response({"status": "failure", "error": status_code}, status=400)

class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingDetailSerializer


class BookingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Booking.objects.all()

        if user.is_authenticated:
            if user.user_type == 'Band':
                try:
                    band = user.band_profile
                    # Only confirmed bookings for this band
                    queryset = queryset.filter(
                        event__band=band,
                        status="CONFIRMED"
                    )
                except Band.DoesNotExist:
                    logger.warning(f"No band profile for user {user.username}")
                    queryset = Booking.objects.none()
            elif user.user_type == 'Customer':
                try:
                    customer = user.customer_profile
                    queryset = queryset.filter(event__customer=customer)
                except Customer.DoesNotExist:
                    logger.warning(f"No customer profile for user {user.username}")
                    queryset = Booking.objects.none()
            else:
                queryset = Booking.objects.none()

        event_id = self.request.query_params.get('event', None)
        if event_id:
            queryset = queryset.filter(event=event_id)

        logger.info(f"Bookings for user {user.username} (Type: {user.user_type}): {list(queryset.values('id', 'event', 'status'))}")
        return queryset


class AvailabilityListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        band_id = request.query_params.get('band')
        if band_id and band_id != 'null':  # Check for valid band_id
            try:
                band_id = int(band_id)  # Ensure it's an integer
                availabilities = Availability.objects.filter(band__id=band_id)
            except ValueError:
                return Response({"error": "Invalid band ID"}, status=400)
        else:
            availabilities = Availability.objects.all()
        serializer = AvailabilitySerializer(availabilities, many=True)
        return Response(serializer.data)

    def post(self, request):
        if hasattr(request.user, 'band_profile'):
            data = request.data.copy()
            data['band'] = request.user.band_profile.id
            serializer = AvailabilitySerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)
        return Response({"error": "Band profile not found"}, status=404)
    

    
class AvailabilityDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, band):
        return get_object_or_404(Availability, pk=pk, band=band)

    def put(self, request, pk):
        if hasattr(request.user, 'band_profile'):
            availability = self.get_object(pk, request.user.band_profile)
            serializer = AvailabilitySerializer(availability, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
        return Response({"error": "Band profile not found"}, status=404)

    def delete(self, request, pk):
        if hasattr(request.user, 'band_profile'):
            availability = self.get_object(pk, request.user.band_profile)
            availability.delete()
            return Response(status=204)
        return Response({"error": "Band profile not found"}, status=404)

class FeedbackListCreateView(generics.ListCreateAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer


# views.py

class PaymentHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != "Admin":
            logger.warning(f"Unauthorized attempt by {request.user.username}")
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        # Fetch all payments with related booking, event, band, and customer data
        payments = Payment.objects.select_related('booking__event__band', 'booking__event__customer').prefetch_related('transaction')
        
        serializer = PaymentHistorySerializer(payments, many=True, context={'request': request})
        logger.info(f"Fetched {len(payments)} payments for payment history")
        return Response(serializer.data)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_history(request):
    try:
        if request.user.user_type == "Customer":
            customer = Customer.objects.get(user=request.user)
            bookings = Booking.objects.filter(event__customer=customer)
            payments = Payment.objects.filter(booking__in=bookings)
        elif request.user.user_type == "Admin":
            payments = Payment.objects.all()
        elif request.user.user_type == "Band":
            band = request.user.band_profile
            bookings = Booking.objects.filter(event__band=band)
            payments = Payment.objects.filter(booking__in=bookings)
        else:
            return Response({"error": "Unauthorized access"}, status=status.HTTP_403_FORBIDDEN)

        serializer = PaymentHistorySerializer(payments, many=True, context={'request': request})
        logger.info(f"Payment history fetched for user {request.user.username}: {len(payments)} records")
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Customer.DoesNotExist:
        logger.error(f"Customer profile not found for user {request.user.username}")
        return Response({"error": "Customer profile not found"}, status=status.HTTP_404_NOT_FOUND)
    except Band.DoesNotExist:
        logger.error(f"Band profile not found for user {request.user.username}")
        return Response({"error": "Band profile not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error fetching payment history: {str(e)}")
        return Response({"error": "An error occurred while fetching payment history"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PendingPaymentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != "Admin":
            logger.warning(f"Unauthorized attempt by {request.user.username}")
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        pending_payments = Booking.objects.filter(
            payment_status='UNPAID',
            status__in=['CONFIRMED', 'PENDING']  # Include only active statuses
        ).select_related('event__band', 'event__customer').prefetch_related('payments')
        
        serializer = BookingSerializer(pending_payments, many=True, context={'request': request})
        logger.info(f"Fetched {len(pending_payments)} bookings with unpaid payments")
        return Response(serializer.data)
        
class PaymentListCreateView(generics.ListCreateAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    
class DisputeListCreateView(generics.ListCreateAPIView):
    queryset = Dispute.objects.all()
    serializer_class = DisputeSerializer



class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Review.objects.all()
        band_id = self.request.query_params.get("band", None)
        if band_id is not None:
            queryset = queryset.filter(band_id=band_id)
        return queryset

    def perform_create(self, serializer):
        # Get or create the Customer instance for the logged-in user
        customer, created = Customer.objects.get_or_create(
            user=self.request.user,
            defaults={
                "name": self.request.user.username,  # Fallback name
                "phone": "0000000000",  # Dummy value, update later
                "location": "Unknown",  # Dummy value
            }
        )
        serializer.save(customer=customer)

    def destroy(self, request, *args, **kwargs):
        review = self.get_object()
        if review.customer.user != request.user:
            raise PermissionDenied("You can only delete your own reviews.")
        review.delete()
        return Response(status=204)
    
class NotificationCreateView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = NotificationSerializer(data=request.data)
        if serializer.is_valid():
            notification = serializer.save(created_by=request.user)
            # Create UserNotification entries based on target_type
            users = CustomUser.objects.all()
            if notification.target_type == 'CUSTOMER':
                users = users.filter(user_type='CUSTOMER')
            elif notification.target_type == 'BAND':
                users = users.filter(user_type='BAND')
            # For 'ALL', use all users
            for user in users:
                UserNotification.objects.create(user=user, notification=notification)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UnreadNotificationsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        unread_notifications = Notification.objects.filter(is_read__isnull=True)
        unread_count = unread_notifications.count()
        serializer = NotificationSerializer(unread_notifications, many=True)
        return Response({
            'unread_count': unread_count,
            'notifications': serializer.data
        })

class SendNotificationView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        title = request.data.get("title")
        message = request.data.get("message")
        notification_type = request.data.get("notification_type")
        target_type = request.data.get("target_type")

        logger.info(f"Received: Title={title}, Target={target_type}, Type={notification_type}, User={request.user.username}")

        if not title or not message:
            logger.error("Missing title or message")
            return Response({"detail": "Title and message are required"}, status=status.HTTP_400_BAD_REQUEST)

        if target_type not in ["ALL", "CUSTOMER", "BAND"]:
            logger.error(f"Invalid target_type: {target_type}")
            return Response({"detail": "Invalid target type"}, status=status.HTTP_400_BAD_REQUEST)

        # Create the notification
        try:
            notification = Notification.objects.create(
                title=title,
                message=message,
                notification_type=notification_type,
                target_type=target_type,
                created_by=request.user
            )
            logger.info(f"Notification created: ID={notification.id}")
        except Exception as e:
            logger.error(f"Failed to create notification: {str(e)}")
            return Response({"detail": f"Failed to create notification: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Determine target users
        target_users = CustomUser.objects.filter(is_staff=False)
        if target_type == "CUSTOMER":
            target_users = target_users.filter(user_type="Customer")
        elif target_type == "BAND":
            target_users = target_users.filter(user_type="Band")

        user_count = target_users.count()
        logger.info(f"Target users found: {user_count} (Target={target_type})")

        if user_count == 0:
            logger.warning(f"No users found for target_type={target_type}")

        # Create UserNotification entries
        created_count = 0
        for user in target_users:
            try:
                UserNotification.objects.create(
                    user=user,
                    notification=notification
                )
                created_count += 1
                logger.debug(f"Created UserNotification for {user.username} (ID={user.id})")
            except Exception as e:
                logger.error(f"Failed to create UserNotification for {user.username}: {str(e)}")

        logger.info(f"Created {created_count} UserNotification entries")
        return Response({"detail": f"Notification sent successfully, notified {created_count} users"}, status=status.HTTP_201_CREATED)
                                    
class UserNotificationViewSet(viewsets.ModelViewSet):
    serializer_class = UserNotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserNotification.objects.filter(
            user=self.request.user,
            is_deleted=False,
            is_archived=False
        )

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.mark_as_read()
        return Response(self.get_serializer(notification).data)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        notification = self.get_object()
        notification.archive()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class AdminMyNotificationsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Fetch notifications created by the admin
        notifications = Notification.objects.filter(created_by=request.user, is_deleted=False).order_by("-created_at")
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)
    
class TopBandsBookingsView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        top_bands = Band.objects.annotate(
            booking_count=Count('event__booking')
        ).order_by('-booking_count')[:5]
        serializer = BandSerializer(top_bands, many=True, context={'request': request})
        return Response(serializer.data)
    
class NonAdminUsersView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        non_admin_users = CustomUser.objects.filter(is_staff=False)
        serializer = CustomUserSerializer(non_admin_users, many=True)
        logger.info(f"Fetched {non_admin_users.count()} non-admin users")
        return Response(serializer.data)
