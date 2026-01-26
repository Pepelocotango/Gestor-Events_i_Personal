import React from 'react';
import { useTranslation } from 'react-i18next';
import { useModalStore } from '../../stores/modalStore';
import { CalendarIcon, UsersIcon } from '../../constants';
import { MapPinIcon, VideoCameraIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const GoogleEventDetailsModal: React.FC = () => {
  const { t, i18n } = useTranslation();
  const data = useModalStore(state => state.data);
  const closeModal = useModalStore(state => state.closeModal);

  const event = data?.eventData;

  if (!event) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">{t('modals.google_details.error_loading')}</p>
        <button onClick={closeModal} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          {t('modals.event_details.close_button')}
        </button>
      </div>
    );
  }

  const formatDateTime = (dateTimeStr: string) => {
    return new Date(dateTimeStr).toLocaleString(i18n.language === 'ca' ? 'ca-ES' : i18n.language === 'es' ? 'es-ES' : 'en-GB', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid'
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    // Afegim un dia perquè els esdeveniments "all-day" de Google acaben el dia següent a les 00:00
    const correctedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return correctedDate.toLocaleDateString(i18n.language === 'ca' ? 'ca-ES' : i18n.language === 'es' ? 'es-ES' : 'en-GB', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });
  };

  const renderDescription = (description: string) => {
    if (!description) return <p className="text-muted-foreground">{t('modals.google_details.no_description')}</p>;
    // Substituïm els salts de línia \n per elements <br>
    return <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: description }} />;
  };

  const renderAttendees = (attendees: any[]) => {
    if (!attendees || attendees.length === 0) {
      return <p className="text-muted-foreground">{t('modals.google_details.no_attendees')}</p>;
    }
    return (
      <ul className="space-y-2">
        {attendees.map((attendee, index) => (
          <li key={index} className="flex items-center justify-between text-sm">
            <span className="truncate">{attendee.displayName || attendee.email}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${attendee.responseStatus === 'accepted' ? 'bg-success text-success-foreground' :
                attendee.responseStatus === 'declined' ? 'bg-destructive text-destructive-foreground' :
                  attendee.responseStatus === 'tentative' ? 'bg-yellow-500 text-white' :
                    'bg-muted text-muted-foreground'
              }`}>
              {attendee.responseStatus}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const isAllDay = event.start.date;

  return (
    <div className="p-1 max-h-[80vh] overflow-y-auto">
      <div className="space-y-3">
        {/* Títol */}
        <h2 className="text-xl font-bold text-foreground">{event.summary || t('modals.google_details.untitled_event')}</h2>

        {/* Data i Hora */}
        <div className="flex items-start space-x-3">
          <CalendarIcon className="h-5 w-5 text-muted-foreground mt-1" />
          <div>
            <h3 className="font-semibold text-foreground">{t('modals.google_details.date_time_label')}</h3>
            {isAllDay ? (
              <p className="text-sm">{`${formatDate(event.start.date)} ${t('modals.google_details.all_day_suffix')}`}</p>
            ) : (
              <p className="text-sm">{`${formatDateTime(event.start.dateTime)} - ${formatDateTime(event.end.dateTime)}`}</p>
            )}
          </div>
        </div>

        {/* Ubicació */}
        {event.location && (
          <div className="flex items-start space-x-3">
            <MapPinIcon className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
              <h3 className="font-semibold text-foreground">{t('modals.google_details.location_label')}</h3>
              <p className="text-sm">{event.location}</p>
            </div>
          </div>
        )}

        {/* Videoconferència */}
        {event.hangoutLink && (
          <div className="flex items-start space-x-3">
            <VideoCameraIcon className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
              <h3 className="font-semibold text-foreground">{t('modals.google_details.videoconference_label')}</h3>
              <a href={event.hangoutLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                {event.hangoutLink}
              </a>
            </div>
          </div>
        )}

        {/* Enllaç a Google Calendar */}
        <div className="flex items-start space-x-3">
          <ArrowTopRightOnSquareIcon className="h-5 w-5 text-muted-foreground mt-1" />
          <div>
            <h3 className="font-semibold text-foreground">{t('modals.google_details.view_in_calendar_label')}</h3>
            <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
              {t('modals.google_details.open_new_tab')}
            </a>
          </div>
        </div>


        {/* Descripció */}
        <div>
          <h3 className="font-semibold text-foreground mb-1">{t('modals.google_details.description_label')}</h3>
          <div className="p-2 bg-muted rounded-md max-h-48 overflow-y-auto">
            {renderDescription(event.description)}
          </div>
        </div>

        {/* Assistents */}
        <div className="flex items-start space-x-3">
          <UsersIcon className="h-5 w-5 text-muted-foreground mt-1" />
          <div className="w-full">
            <h3 className="font-semibold text-foreground">{t('modals.google_details.attendees_label')}</h3>
            <div className="p-2 bg-muted rounded-md max-h-48 overflow-y-auto mt-1">
              {renderAttendees(event.attendees)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button onClick={closeModal} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          {t('modals.event_details.close_button')}
        </button>
      </div>
    </div>
  );
};

export default GoogleEventDetailsModal;