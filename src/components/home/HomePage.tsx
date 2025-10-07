import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { SearchHero } from './SearchHero';
import { JobList } from './JobList';
import { JobFilters } from './JobFilters';
import { FavoriteJobs } from './FavoriteJobs';
import { SEOJobContent } from '../job/SEOJobContent';
import { useJobs } from '../../hooks/useJobs';
import { useJobFilters } from '../../hooks/useJobFilters';
import { jobCategories } from '../../data/jobCategories';
import { useAuthContext } from '../../contexts/AuthContext';
import { generateMetaTags } from '../../utils/seoUtils';
import { checkJobDates } from '../../utils/dateUtils';
import { Heart, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export function HomePage() {
  const { user } = useAuthContext();
  const { pageNumber } = useParams();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const { jobs, categories, loading, error, refetchJobs } = useJobs(undefined, searchTerm, 40);
  const { filters, updateFilters, filteredJobs } = useJobFilters(jobs);

  useEffect(() => {
    // SEO meta tags
    generateMetaTags({
      title: 'İş İlanları 2025 - Güncel İş Fırsatları',
      description: 'Türkiye\'nin en güncel iş ilanları sitesi. Mühendis, garson, kurye, resepsiyon görevlisi ve binlerce iş fırsatı. Ücretsiz CV oluştur ve hemen başvur.',
      keywords: ['iş ilanları', 'iş fırsatları', 'kariyer', 'cv oluştur', 'iş ara'],
      url: window.location.pathname
    });

    // Yeni ilan oluşturulduğunda bildirim göster
    if (location.state?.newJobCreated) {
      toast.success('🎉 İlanınız başarıyla yayınlandı ve en üstte görünüyor!', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#10B981',
          color: '#FFFFFF',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '500'
        },
        icon: '🚀'
      });
      
      // State'i temizle
      window.history.replaceState({}, document.title);
    }
  }, [pageNumber, location.state]);

  // Scroll pozisyonunu geri yükle - İlanlar yüklendikten SONRA
  useEffect(() => {
    if (!loading && jobs.length > 0) {
      const scrollPosition = sessionStorage.getItem('scrollPosition');
      const previousPath = sessionStorage.getItem('previousPath');
      
      if (scrollPosition && previousPath) {
        // pathname kontrolü - search params olmadan karşılaştır
        const currentPath = window.location.pathname;
        const savedPath = previousPath.split('?')[0];
        
        if (currentPath === savedPath || previousPath.includes(currentPath)) {
          // İçerik render olduktan sonra scroll yap
          requestAnimationFrame(() => {
            setTimeout(() => {
              window.scrollTo({
                top: parseInt(scrollPosition),
                behavior: 'instant' // Anlık geçiş, smooth değil
              });
              sessionStorage.removeItem('scrollPosition');
              sessionStorage.removeItem('previousPath');
            }, 150);
          });
        }
      } else if (location.state?.scrollToTop) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    // Debug: İlan tarihlerini kontrol et
    if (jobs.length > 0) {
      checkJobDates(jobs);
    }
  }, [loading, jobs.length, location.state]);

  const getCategoryName = (categoryId: string) => {
    const category = jobCategories.find(c => c.id === categoryId);
    return category ? `${category.name} İlanları` : 'Tüm İlanlar';
  };

  return (
    <div className="space-y-8">
      <SearchHero
        onSearch={setSearchTerm}
        onLocationChange={(city) => updateFilters({ city })}
        onCategorySelect={(category) => updateFilters({ category, subCategory: '' })}
        availableCategories={categories}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar - Sadece Filtreler */}
        <div className="lg:col-span-3">
          <JobFilters
            filters={filters}
            onFilterChange={updateFilters}
            availableCategories={categories}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-4 text-gray-600">İlanlar yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : (
            <JobList jobs={filteredJobs} onJobDeleted={refetchJobs} />
          )}
        </div>
      </div>

      {/* SEO Content */}
      <SEOJobContent />
    </div>
  );
}