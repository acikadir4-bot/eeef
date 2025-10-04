import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { ref, push } from 'firebase/database';
import { db } from '../lib/firebase';
import { generateSlug } from '../utils/seoUtils';
import { BlogPost } from '../services/blogService';
import { Button } from '../components/ui/Button';
import { FileText, Save, X, Tag, BookOpen, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export function CreateBlogPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'kariyer-rehberi',
    tags: [] as string[],
    tagInput: ''
  });

  const categories = [
    { id: 'kariyer-rehberi', name: 'Kariyer Rehberi', icon: '🚀' },
    { id: 'cv-ipuclari', name: 'CV İpuçları', icon: '📄' },
    { id: 'mulakat-rehberi', name: 'Mülakat Rehberi', icon: '💼' },
    { id: 'is-piyasasi', name: 'İş Piyasası', icon: '📊' },
    { id: 'uzaktan-calisma', name: 'Uzaktan Çalışma', icon: '🏠' },
    { id: 'sektor-analizi', name: 'Sektör Analizi', icon: '🔍' },
    { id: 'kisisel-gelisim', name: 'Kişisel Gelişim', icon: '🌱' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (formData.tagInput.trim() && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const calculateReadTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Blog yazısı paylaşmak için giriş yapmalısınız');
      navigate('/login');
      return;
    }

    if (formData.title.length < 10) {
      toast.error('Başlık en az 10 karakter olmalıdır');
      return;
    }

    if (formData.content.length < 800) {
      toast.error('İçerik en az 800 karakter olmalıdır (SEO için uzun içerik önerilir)');
      return;
    }

    setIsSubmitting(true);

    try {
      // İçeriğe otomatik ana sayfa linkleri ekle
      const contentWithLinks = formData.content +
        `\n\n---\n\n<div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0;">\n` +
        `<h3 style="color: #1e40af; margin-bottom: 10px;">🔍 İş Arıyor musunuz?</h3>\n` +
        `<p style="margin-bottom: 15px;"><strong><a href="/" style="color: #2563eb;">İşBuldum platformunda 50.000+ güncel iş ilanını keşfedin!</a></strong></p>\n` +
        `<ul style="list-style: none; padding: 0;">\n` +
        `<li>✅ <a href="/istanbul-is-ilanlari" style="color: #2563eb;">İstanbul İş İlanları</a></li>\n` +
        `<li>✅ <a href="/ankara-is-ilanlari" style="color: #2563eb;">Ankara İş İlanları</a></li>\n` +
        `<li>✅ <a href="/remote-is-ilanlari" style="color: #2563eb;">Uzaktan Çalışma İlanları</a></li>\n` +
        `<li>✅ <a href="/" style="color: #2563eb;">Tüm İlanları Gör</a></li>\n` +
        `</ul>\n</div>`;

      const blogPost: Omit<BlogPost, 'id'> = {
        title: formData.title,
        content: contentWithLinks,
        excerpt: formData.excerpt || formData.content.substring(0, 150) + '...',
        slug: generateSlug(formData.title),
        category: formData.category,
        tags: formData.tags,
        author: user.email?.split('@')[0] || 'Kullanıcı',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isAIGenerated: false,
        readTime: calculateReadTime(formData.content),
        views: 0,
        likes: 0,
        comments: []
      };

      console.log('Blog yazısı kaydediliyor:', blogPost);

      const blogRef = ref(db, 'blog_posts');
      const newPostRef = await push(blogRef, blogPost);

      console.log('Blog yazısı başarıyla kaydedildi:', newPostRef.key);

      toast.success('Blog yazınız başarıyla yayınlandı!', {
        duration: 4000,
        icon: '🎉'
      });

      // Biraz bekle ve yönlendir
      setTimeout(() => {
        navigate('/blog');
      }, 1000);
    } catch (error: any) {
      console.error('Blog yazısı oluşturma hatası:', error);
      toast.error(`Hata: ${error.message || 'Blog yazısı yayınlanamıyor. Firebase kurallarını kontrol edin.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <FileText className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Giriş Yapın</h2>
          <p className="text-gray-600 mb-6">
            Blog yazısı paylaşmak için giriş yapmalısınız
          </p>
          <Button onClick={() => navigate('/login')}>
            Giriş Yap
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Blog Yazısı Paylaş</h1>
              <p className="text-sm text-gray-600">Deneyimlerinizi ve bilgilerinizi paylaşın</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/blog')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Başlık */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Başlık <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Örn: 2025'te İş Görüşmelerinde Başarılı Olmanın 10 Yolu"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.title.length}/100 karakter
            </p>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleInputChange('category', cat.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.category === cat.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="text-2xl mb-1">{cat.icon}</span>
                  <p className="text-xs font-medium">{cat.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Özet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Özet (İsteğe Bağlı)
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => handleInputChange('excerpt', e.target.value)}
              placeholder="Yazınızın kısa bir özeti (boş bırakılırsa otomatik oluşturulur)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.excerpt.length}/200 karakter
            </p>
          </div>

          {/* İçerik */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İçerik <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Blog yazınızın tam içeriğini buraya yazın. Markdown formatını destekliyoruz."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={15}
              required
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                {formData.content.length} karakter • {calculateReadTime(formData.content)} dakika okuma
              </p>
              <p className="text-xs text-gray-500">
                Minimum 200 karakter
              </p>
            </div>
          </div>

          {/* Etiketler */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Etiketler (Maksimum 10)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={formData.tagInput}
                onChange={(e) => handleInputChange('tagInput', e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Etiket ekle (Enter'a basın)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={20}
                disabled={formData.tags.length >= 10}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!formData.tagInput.trim() || formData.tags.length >= 10}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Tag className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Bilgilendirme */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Blog Yazısı Kuralları:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>İçeriğiniz özgün ve size ait olmalıdır</li>
                  <li>Kariyer, iş arama veya kişisel gelişim konularında olmalıdır</li>
                  <li>Yazım kurallarına dikkat edilmelidir</li>
                  <li>Uygunsuz içerikler yöneticiler tarafından kaldırılabilir</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Butonlar */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/blog')}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || formData.title.length < 10 || formData.content.length < 200}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Yayınlanıyor...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Yayınla</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
