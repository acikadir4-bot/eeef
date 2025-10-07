import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Building2,
  Clock,
  Briefcase,
  GraduationCap,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import {
  getTimeAgo,
} from '../../utils/dateUtils';
import { generateJobUrl } from '../../utils/seoUtils';
import { useAuthContext } from '../../contexts/AuthContext';
import { useFavorites } from '../../hooks/useFavorites';
import type { JobListing } from '../../types';

interface JobCardProps {
  job: JobListing;
  onDeleted?: () => void;
}

export function JobCard({ job, onDeleted }: JobCardProps) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = user ? isFavorite(job.id) : false;

  const isPremium = job.isPremium && job.premiumEndDate && job.premiumEndDate > Date.now();

  const handleJobClick = () => {
    sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    sessionStorage.setItem(
      'previousPath',
      window.location.pathname + window.location.search
    );

    navigate(generateJobUrl(job));
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/giris');
      return;
    }
    toggleFavorite(job.id);
  };

  // Şirket adının ilk harfini al
  const companyInitial = job.company?.charAt(0).toUpperCase() || 'İ';

  // Logo renkleri
  const logoColors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-orange-500 to-orange-600',
    'from-green-500 to-green-600',
    'from-red-500 to-red-600',
    'from-teal-500 to-teal-600',
  ];
  const colorIndex = job.id ? parseInt(job.id.slice(0, 8), 16) % logoColors.length : 0;
  const logoColor = logoColors[colorIndex];

  return (
    <article
      className="bg-white border-b border-gray-100 hover:bg-red-50 transition-colors cursor-pointer py-3 sm:py-4"
      onClick={handleJobClick}
      itemScope
      itemType="https://schema.org/JobPosting"
    >
      <div className="flex items-start gap-2 sm:gap-3 px-3 sm:px-4">
        {/* Company Logo - Responsive */}
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${logoColor} flex items-center justify-center flex-shrink-0`}>
          <span className="text-white font-semibold text-xs sm:text-sm">{companyInitial}</span>
        </div>

        {/* İçerik */}
        <div className="flex-1 min-w-0">
          {/* Başlık ve Favorileme */}
          <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1">
            <h2
              className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 leading-tight pr-1"
              itemProp="title"
            >
              {job.title}
              {isPremium && (
                <span className="ml-1 sm:ml-1.5 text-xs font-medium text-purple-600">👑</span>
              )}
            </h2>
            
            {/* Minimal Favori Butonu */}
            <button
              onClick={handleFavoriteClick}
              className="p-0.5 sm:p-1 -mt-0.5 sm:-mt-1 flex-shrink-0"
              aria-label={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            >
              {isFav ? (
                <BookmarkCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 fill-current" />
              ) : (
                <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-300 hover:text-gray-400" />
              )}
            </button>
          </div>

          {/* Şirket */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">
            <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
            <span className="truncate">{job.company}</span>
          </div>

          {/* Alt Bilgiler */}
          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-0.5 sm:gap-y-1 text-xs text-gray-500">
            {/* Konum */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-none" itemProp="jobLocation">{job.location}</span>
            </div>

            {/* İş Tipi */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Briefcase className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
              <span itemProp="employmentType">{job.type}</span>
            </div>

            {/* Deneyim */}
            {job.experienceLevel && job.experienceLevel !== 'Deneyimsiz' && (
              <div className="flex items-center gap-0.5 sm:gap-1">
                <GraduationCap className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                <span>{job.experienceLevel}</span>
              </div>
            )}

            {/* Tarih */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
              <span>{getTimeAgo(job.createdAt)}</span>
            </div>
          </div>

          {/* Maaş */}
          {job.salary && (
            <div className="mt-1.5 sm:mt-2 inline-flex items-center gap-0.5 sm:gap-1 text-xs font-medium text-green-700">
              <span className="text-xs sm:text-sm">💰</span>
              <span>{job.salary}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}