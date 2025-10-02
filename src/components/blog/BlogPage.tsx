import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, MessageCircle, Heart, Share2, Tag, TrendingUp, Sparkles, PenLine } from 'lucide-react';
import { blogService, BlogPost } from '../../services/blogService';
import { formatDate, getTimeAgo } from '../../utils/dateUtils';
import { Button } from '../ui/Button';

export function BlogPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const blogPosts = await blogService.getRecentPosts(20);
        setPosts(blogPosts);
      } catch (error) {
        console.error('Blog yazıları yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const categories = [
    { id: 'all', name: 'Tümü', icon: '📚' },
    { id: 'kariyer-rehberi', name: 'Kariyer Rehberi', icon: '🚀' },
    { id: 'cv-ipuclari', name: 'CV İpuçları', icon: '📄' },
    { id: 'mulakat-rehberi', name: 'Mülakat Rehberi', icon: '💼' },
    { id: 'is-piyasasi', name: 'İş Piyasası', icon: '📊' },
    { id: 'uzaktan-calisma', name: 'Uzaktan Çalışma', icon: '🏠' },
    { id: 'sektör-analizi', name: 'Sektör Analizi', icon: '🔍' }
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Blog yazıları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          <Sparkles className="h-8 w-8 text-blue-600" />
          İşBuldum Blog - Kariyer Rehberi
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
          AI destekli kariyer tavsiyeleri, iş arama stratejileri ve güncel iş piyasası analizleri.
          Her gün yeni içerik, uzman yorumları ve pratik rehberler.
        </p>
        <button
          onClick={() => navigate('/blog/yeni')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          <PenLine className="h-5 w-5" />
          <span className="font-medium">Blog Yazısı Paylaş</span>
        </button>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
              }`}
            >
              <span>{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Blog Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz Blog Yazısı Yok</h3>
          <p className="text-gray-600">AI asistanımız yakında ilk blog yazılarını oluşturacak.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* AI Info */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">Güncel İçerik Üretimi</h3>
        </div>
        <p className="text-blue-800 mb-4">
          Platform editörlerimiz tarafından güncel iş piyasası verileri analiz edilerek özgün içerikler oluşturulmaktadır. 
          Her gün yeni, güncel ve faydalı kariyer rehberleri yayınlanır.
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-blue-700">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Güncel İş Piyasası Analizi
          </span>
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Uzman Kariyer Tavsiyeleri
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            Kullanıcı Etkileşimi
          </span>
        </div>
      </div>
    </div>
  );
}

// Blog Card Component
const BlogCard: React.FC<{ post: BlogPost }> = ({ post }) => {
  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="p-6">
        {/* Category & AI Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {post.category}
          </span>
          {post.isAIGenerated && (
            <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              AI
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
          <Link to={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
          {post.excerpt}
        </p>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(post.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readTime} dk
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {post.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {post.comments?.length || 0}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
              #{tag}
            </span>
          ))}
        </div>

        {/* Read More Button */}
        <Link
          to={`/blog/${post.slug}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          Devamını Oku
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>
    </article>
  );
};