from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Event
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Updates the status of PLANNED events with past dates'

    def handle(self, *args, **kwargs):
        now = timezone.now()
        # Find all PLANNED events where the event_date has passed
        overdue_events = Event.objects.filter(
            status='PLANNED',
            event_date__lt=now
        )
        updated_count = 0

        for event in overdue_events:
            logger.info(f"Processing event {event.id}: {event.event_type} on {event.event_date}")
            changed_fields = event.check_and_update_status()
            if changed_fields:
                event.save(update_fields=changed_fields)
                updated_count += 1
                logger.info(f"Updated event {event.id} to {event.status} (Fields: {changed_fields})")
            else:
                logger.info(f"No changes for event {event.id}")

        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated_count} events')
        )