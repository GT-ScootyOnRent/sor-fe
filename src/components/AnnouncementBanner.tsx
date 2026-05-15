import { useGetAnnouncementBannersQuery } from '../store/api/announcementBannerApi';
import { useAppSelector } from '../store/hooks';

/**
 * Announcement Banner - Marquee style scrolling text below header.
 * Only renders if there are active announcements for the selected city.
 */
export default function AnnouncementBanner() {
  const selectedCity = useAppSelector((state) => state.city.selectedCity);
  const { data: announcements, isLoading } = useGetAnnouncementBannersQuery(selectedCity?.id);

  // Don't render anything if no announcements or loading
  if (isLoading || !announcements || announcements.length === 0) {
    return null;
  }

  // Join multiple announcements with diamond separator (front and back)
  const announcementText = '  ⬥  ' + announcements
    .map((a) => a.text)
    .join('  ⬥  ') + '  ⬥  ';

  return (
    <div className="marquee-banner">
      <div className="marquee-track">
        <span className="marquee-text">{announcementText}</span>
        <span className="marquee-text">{announcementText}</span>
      </div>
    </div>
  );
}
