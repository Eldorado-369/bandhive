from django.urls import path, include
from .views import (
    CustomUserListCreateView, SocialMediaLinksListCreateView, BandListCreateView, 
    BandPortfolioListCreateView, BandServiceListCreateView, EventPackageListCreateView, EventListView, EventCreateView,
    CustomerListCreateView, EventListCreateView, EventDetailView, BookingListCreateView, AvailabilityDetailView, get_bookings_by_event,
    BookingDetailView, AvailabilityListCreateView, FeedbackListCreateView, BandMemberListCreateView, send_email_view,
    PaymentListCreateView, CustomerRegisterView, DisputeListCreateView, BandMemberDetailView, CustomerListView, BookingViewSet,
    BandRegisterView, login_view, CustomLoginView, PendingVerificationsView, PendingVerificationCountView, UpdateVerificationStatusView,
    BandProfileDetailView, get_current_band, ExistingBandsView, DeniedBandsView, BandDetailsView, UserProfileView, BandPortfolioDetailView,
    CustomerVerificationUpdateView, ExistingCustomersView, AllBookingsView, PaymentHistoryView, PendingPaymentsView,
    DeniedCustomersView, CustomerDetailView, PendingBookingsView, CompletedBookingsView, CheckUsernameView, reject_event, SendNotificationView,
    phonepe_callback, ReviewViewSet, UnreadNotificationsView, get_current_user, UserNotificationViewSet, AdminMyNotificationsView, 
    NotificationCreateView, NonAdminUsersView, confirm_payment, TotalBookingsView
)
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from . import views

router = DefaultRouter()
router.register(r'bookings', BookingViewSet)
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'user/notifications', UserNotificationViewSet, basename='user-notification')

urlpatterns = [
    path('', include(router.urls)),
    path('simple-bookings/', get_bookings_by_event, name='simple_bookings'),

    # User Management
    path('users/', CustomUserListCreateView.as_view(), name='user-list-create'),
    path('api/users/non-admins/', NonAdminUsersView.as_view(), name='non-admin-users'),  # Added
    path('customer-register/', CustomerRegisterView.as_view(), name='customer-register'),
    path('band-register/', BandRegisterView.as_view(), name='band-register'),
    path('check-username/', CheckUsernameView.as_view(), name='check_username'),
    
    # Authentication URLs
    path("jwt-login/", login_view, name="jwt_login"),
    path("api/login/", login_view, name="login"),  
    path('pending-verifications/', PendingVerificationsView.as_view(), name='pending_verifications'),
    path('pending-verification-count/', PendingVerificationCountView.as_view(), name='pending_verification_count'),
    path('update-verification/<int:band_id>/', UpdateVerificationStatusView.as_view(), name='update_verification'),
    path("token-login/", CustomLoginView.as_view(), name="custom_token_login"),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Band URLs
    path('band/', get_current_band, name='get-current-band'),
    path('band/<int:pk>/', BandDetailsView.as_view(), name='band-detail'),
    path('band/profile/', BandProfileDetailView.as_view(), name='band-profile-detail'),
    path("existing-bands/", ExistingBandsView.as_view(), name="existing-bands"),
    path("denied-bands/", DeniedBandsView.as_view(), name="denied-bands"),

    # Feature URLs
    path("user/profile/", UserProfileView.as_view(), name="user-profile"),
    path('band-members/', BandMemberListCreateView.as_view(), name='band-member-list-create'),
    path('band-members/<int:pk>/', BandMemberDetailView.as_view(), name='band-member-detail'),
    path('social-media-links/', SocialMediaLinksListCreateView.as_view(), name='social-media-links-list-create'),
    path('bands/', BandListCreateView.as_view(), name='band-list-create'),
    path("band-portfolio/", BandPortfolioListCreateView.as_view(), name="band-portfolio-list-create"),
    path("band-portfolio/<int:pk>/", BandPortfolioDetailView.as_view(), name="band-portfolio-detail"),
    path('band-services/', BandServiceListCreateView.as_view(), name='band-service-list-create'),
    path('event-packages/', EventPackageListCreateView.as_view(), name='event-package-list-create'),
    path('customers/', CustomerListCreateView.as_view(), name='customer-list-create'),
    path('events/', EventListView.as_view(), name='event-list'), 
    path('events/create/', EventCreateView.as_view(), name='event-create'), 
    path('events/<int:pk>/', EventDetailView.as_view(), name='event-detail'),  

    path('all-bookings/', views.AllBookingsView.as_view(), name='all-bookings'),
    path('pending-bookings/', PendingBookingsView.as_view(), name='pending-bookings'),
    path('completed-bookings/', CompletedBookingsView.as_view(), name='completed-bookings'),

    path('bookings/', BookingListCreateView.as_view(), name='booking-list-create'),
    path('bookings/<int:pk>/', BookingListCreateView.as_view(), name='booking-detail'),
    path('confirm-payment/', confirm_payment, name='confirm_payment'),
    path('phonepe-callback/', phonepe_callback, name='phonepe_callback'),
    path("band-customer-ratio/", views.band_customer_ratio, name="band_customer_ratio"),
    path('total-bookings/', TotalBookingsView.as_view(), name='total-bookings'),


    path('pending-bookings/', PendingBookingsView.as_view(), name='pending-bookings'),
    

    path('availabilities/', AvailabilityListCreateView.as_view(), name='availability-list-create'),
    path('availabilities/<int:pk>/', AvailabilityDetailView.as_view(), name='availability-detail'),
    path('feedbacks/', FeedbackListCreateView.as_view(), name='feedback-list-create'),
    path('payments/', PaymentListCreateView.as_view(), name='payment-list-create'),
    path('disputes/', DisputeListCreateView.as_view(), name='dispute-list-create'),

    path('send-email/', send_email_view, name='send-email'),

    path('customer-verification-update/<int:customer_id>/', CustomerVerificationUpdateView.as_view(), name='customer-verification-update'),
    path('customer/<int:pk>/', CustomerDetailView.as_view(), name='customer-detail'),
    path("existing-customers/", ExistingCustomersView.as_view(), name="existing-customers"),
    path("denied-customers/", DeniedCustomersView.as_view(), name="denied-customers"),

    path('payment-history/', PaymentHistoryView.as_view(), name='payment-history'),
    path('pending-payments/', PendingPaymentsView.as_view(), name='pending-payments'),
    path("api/admin/send-notification/", SendNotificationView.as_view(), name="send-notification"),

    path('api/events/<int:event_id>/reject/', reject_event, name='reject-event'),
    path('admin/send-notification/', NotificationCreateView.as_view(), name='send-notification'),
    path('notifications/unread/', UnreadNotificationsView.as_view(), name='unread-notifications'),
    
    path("admin/my-notifications/", AdminMyNotificationsView.as_view(), name="admin-my-notifications"),
    path("api/admin/my-notifications/<int:notification_id>/", AdminMyNotificationsView.as_view(), name="admin-my-notification-detail"),
    path('user/me/', get_current_user, name='get_current_user'),

]