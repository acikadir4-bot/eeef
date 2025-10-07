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

  // Şirket adının ilk harfini al veya icon göster
  const companyInitial = job.company?.charAt(0).toUpperCase() || 'İ';

  // Logo renkleri - rastgele ama tutarlı
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
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100 ${
        isPremium ? 'ring-2 ring-purple-200' : ''
      }`}
      onClick={handleJobClick}
      itemScope
      itemType="https://schema.org/JobPosting"
    >
      <div className="p-4">
        {/* Header with Logo and Favorite */}
        <div className="flex items-start gap-3 mb-3">
          {/* Company Logo */}
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${logoColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <span className="text-white font-bold text-lg">{companyInitial}</span>
          </div>

          {/* Title and Company */}
          <div className="flex-1 min-w-0">
            <h2
              className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 leading-snug"
              itemProp="title"
            >
              {job.title}
            </h2>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{job.company}</span>
            </div>
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors flex-shrink-0"
            aria-label={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            {isFav ? (
              <BookmarkCheck className="h-5 w-5 text-red-600 fill-current" />
            ) : (
              <Bookmark className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>

        {/* Job Info Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">{getTimeAgo(job.createdAt)}</span>
          </div>

          <span className="text-gray-300">•</span>

          <div className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap" itemProp="employmentType">{job.type}</span>
          </div>

          {job.experienceLevel && job.experienceLevel !== 'Deneyimsiz' && (
            <>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="whitespace-nowrap">{job.experienceLevel}</span>
              </div>
            </>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-700 mb-3">
          <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <span className="truncate" itemProp="jobLocation">{job.location}</span>
        </div>

        {/* Salary if exists */}
        {job.salary && (
          <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium mb-3">
            <span>💰</span>
            <span>{job.salary}</span>
          </div>
        )}

        {/* Premium Badge */}
        {isPremium && (
          <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-xs font-semibold">
            <span>👑</span>
            <span>Premium İlan</span>
          </div>
        )}
      </div>
    </article>
  );
}
