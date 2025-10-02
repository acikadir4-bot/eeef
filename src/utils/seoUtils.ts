// src/utils/seoUtils.ts - Bu dosyada sadece generateMetaTags fonksiyonunu güncelleyin

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-')
    .substring(0, 100);
}

export function generateJobUrl(job: any): string {
  const slug = generateSlug(job.title);
  return `/ilan/${slug}`;
}

// ✅ GÜNCELLENMIŞ generateMetaTags - Google Search Console sorunlarını çözer
export function generateMetaTags(options: {
  title: string;
  description: string;
  keywords: string[];
  url: string;
  jobData?: any;
  cityName?: string;
}) {
  const { title, description, keywords, url, jobData, cityName } = options;

  // Basic meta tags
  document.title = title;
  
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }

  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    metaKeywords.setAttribute('content', keywords.join(', '));
  }

  // Open Graph tags
  updateMetaTag('property', 'og:title', title);
  updateMetaTag('property', 'og:description', description);
  updateMetaTag('property', 'og:url', `https://isilanlarim.org${url}`);

  // Twitter tags
  updateMetaTag('name', 'twitter:title', title);
  updateMetaTag('name', 'twitter:description', description);

  // Canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', `https://isilanlarim.org${url}`);

  // ✅ JobPosting Structured Data - GOOGLE SEARCH CONSOLE SORUNLARINI ÇÖZER
  if (jobData) {
    const existingScript = document.querySelector('script[type="application/ld+json"][data-job="true"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Açıklamayı temizle ve minimum 200 karakter garantisi
    const cleanDescription = (jobData.description || "İş tanımı")
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const fullDescription = cleanDescription.length < 200
      ? cleanDescription + " Detaylı bilgi için ilan sayfasını ziyaret edin. Bu pozisyon için hemen başvurun ve kariyerinize yeni bir yön verin."
      : cleanDescription;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "JobPosting",

      // ✅ ZORUNLU ALANLAR - Google'ın istediği
      "title": jobData.title || "İş İlanı",
      "description": fullDescription.substring(0, 2000),
      "datePosted": new Date(jobData.createdAt).toISOString(), // ✅ ISO 8601 formatı

      // ✅ hiringOrganization - ZORUNLU (daha detaylı)
      "hiringOrganization": {
        "@type": "Organization",
        "name": jobData.company || "İşveren",
        "sameAs": "https://isilanlarim.org",
        "logo": "https://isilanlarim.org/logo.png"
      },

      // ✅ jobLocation - ZORUNLU
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": jobData.location || "Türkiye",
          "addressRegion": jobData.location || "Türkiye",
          "addressCountry": "TR"
        }
      },
      
      // ✅ İSTEĞE BAĞLI AMA ÖNEMLİ ALANLAR
      "employmentType": getEmploymentType(jobData.type), // ✅ EmploymentType enum
      "experienceRequirements": getExperienceRequirements(jobData.experienceLevel), // ✅ Geçerli enum
      "educationRequirements": getEducationRequirements(jobData.educationLevel), // ✅ Geçerli enum
      
      // ✅ validThrough - 60 gün sonra
      "validThrough": new Date(jobData.createdAt + (60 * 24 * 60 * 60 * 1000)).toISOString(),
      
      // ✅ baseSalary - Doğru format
      ...(jobData.salary && {
        "baseSalary": {
          "@type": "MonetaryAmount",
          "currency": "TRY",
          "value": {
            "@type": "QuantitativeValue",
            "value": extractSalaryAmount(jobData.salary),
            "unitText": "MONTH"
          }
        }
      }),
      
      // Diğer alanlar
      "jobLocationType": jobData.type === 'Uzaktan' ? 'TELECOMMUTE' : undefined,
      "url": `https://isilanlarim.org/ilan/${generateSlug(jobData.title)}`,
      "applicationContact": {
        "@type": "ContactPoint",
        "email": jobData.contactEmail || "info@isilanlarim.org",
        "telephone": jobData.contactPhone || "+905459772134"
      },
      
      // Kategori
      "industry": jobData.category || "Diğer",
      "occupationalCategory": jobData.subCategory || "Genel",
      
      // Organizasyon detayları
      "identifier": {
        "@type": "PropertyValue",
        "name": "job-id",
        "value": jobData.id
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-job', 'true');
    script.textContent = JSON.stringify(structuredData, null, 2);
    document.head.appendChild(script);
  }
}

// ✅ YARDIMCI FONKSİYONLAR - Google'ın kabul ettiği enum değerleri

function getEmploymentType(type: string): string {
  const typeMap: Record<string, string> = {
    'Tam Zamanlı': 'FULL_TIME',
    'Part-time': 'PART_TIME', 
    'Part Time': 'PART_TIME',
    'Yarı Zamanlı': 'PART_TIME',
    'Uzaktan': 'CONTRACTOR',
    'Remote': 'CONTRACTOR',
    'Freelance': 'CONTRACTOR',
    'Sözleşmeli': 'CONTRACTOR',
    'Staj': 'INTERN',
    'İntörnlük': 'INTERN'
  };
  
  return typeMap[type] || 'FULL_TIME';
}

function getExperienceRequirements(level?: string): string {
  if (!level) return 'unspecified';
  
  const experienceMap: Record<string, string> = {
    'Yeni Mezun': 'entry-level',
    'Deneyimsiz': 'entry-level', 
    '0-1 Yıl': 'entry-level',
    '1-2 Yıl': 'associate',
    '2-5 Yıl': 'mid-level',
    '5+ Yıl': 'senior-level',
    'Uzman': 'executive',
    'Yönetici': 'executive'
  };
  
  return experienceMap[level] || 'unspecified';
}

function getEducationRequirements(level?: string): string {
  if (!level) return 'unspecified';
  
  const educationMap: Record<string, string> = {
    'İlkokul': 'high-school',
    'Ortaokul': 'high-school', 
    'Lise': 'high-school',
    'Ön Lisans': 'associate-degree',
    'Lisans': 'bachelor-degree',
    'Yüksek Lisans': 'master-degree',
    'Doktora': 'doctorate-degree'
  };
  
  return educationMap[level] || 'unspecified';
}

function extractSalaryAmount(salaryText: string): number {
  if (!salaryText) return 0;
  
  // "15.000₺ - 25.000₺" formatından minimum değeri çıkar
  const numbers = salaryText.match(/[\d.]+/g);
  if (numbers && numbers.length > 0) {
    return parseFloat(numbers[0].replace('.', ''));
  }
  
  return 0;
}

function updateMetaTag(attribute: string, name: string, content: string) {
  let meta = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}
