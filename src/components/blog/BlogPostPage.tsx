import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, get, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { Calendar, Clock, User, Heart, Share2, MessageCircle, Sparkles, ArrowLeft } from 'lucide-react';
import { BlogPost, BlogComment, blogService } from '../../services/blogService';
import { formatDate, getTimeAgo } from '../../utils/dateUtils';
import { useAuthContext } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      if (!slug) {
        console.error('❌ Slug bulunamadı!');
        setLoading(false);
        toast.error('Blog yazısı bulunamadı');
        return;
      }

      console.log('📖 Blog yazısı yükleniyor, slug:', slug);

      try {
        // Blog yazısını slug ile bul
        const postsRef = ref(db, 'blog_posts');
        const snapshot = await get(postsRef);

        if (!snapshot.exists()) {
          console.error('❌ Firebase\'de hiç blog yazısı yok!');
          setLoading(false);
          toast.error('Henüz blog yazısı eklenmemiş');
          return;
        }

        const posts = snapshot.val();
        const postCount = Object.keys(posts || {}).length;
        console.log(`📚 Firebase'de ${postCount} blog yazısı bulundu`);

        // Tüm slug'ları listele
        const allSlugs = Object.values(posts).map((p: any) => p.slug);
        console.log('📝 Mevcut slug\'lar:', allSlugs);

        const foundPost = Object.entries(posts).find(([id, data]: [string, any]) => {
          return data.slug === slug;
        });

        if (!foundPost) {
          console.error('❌ Blog yazısı bulunamadı! Slug eşleşmedi:', slug);
          console.error('🔍 Aranan slug:', slug);
          console.error('📝 Mevcut slug\'lar:', allSlugs);
          setLoading(false);
          toast.error(`"${slug}" slug'ına sahip blog yazısı bulunamadı`);
          return;
        }

        const [postId, postData] = foundPost;
        const blogPost = { id: postId, ...postData } as BlogPost;
        console.log('✅ Blog yazısı bulundu:', blogPost.title);
        setPost(blogPost);

        // Görüntülenme sayısını artır
        try {
          await update(ref(db, `blog_posts/${postId}`), {
            views: (blogPost.views || 0) + 1
          });
        } catch (updateError) {
          console.error('⚠️ Görüntülenme güncellenemedi:', updateError);
        }

        // Yorumları yükle
        try {
          const commentsRef = ref(db, `blog_comments/${postId}`);
          const commentsSnapshot = await get(commentsRef);

          if (commentsSnapshot.exists()) {
            const commentsData = Object.entries(commentsSnapshot.val()).map(([id, data]) => ({
              id,
              ...data
            })) as BlogComment[];

            setComments(commentsData.sort((a, b) => a.createdAt - b.createdAt));
          }
        } catch (commentsError) {
          console.error('⚠️ Yorumlar yüklenemedi:', commentsError);
        }
      } catch (error) {
        console.error('❌ Blog yazısı yüklenirken hata:', error);
        toast.error('Blog yazısı yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [slug]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      toast.error('Lütfen bir yorum yazın');
      return;
    }

    if (!post) return;

    try {
      setSubmittingComment(true);
      
      const userName = user?.email?.split('@')[0] || 'Anonim Kullanıcı';
      
      const success = await blogService.addCommentWithAIResponse(
        post.id,
        userName,
        commentText.trim(),
        user?.id
      );

      if (success) {
        setCommentText('');
        toast.success('Yorumunuz eklendi! AI asistanı yakında yanıtlayacak.');
        
        // Yorumları yeniden yükle
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error('Yorum eklenirken hata oluştu');
      }

    } catch (error) {
      console.error('Yorum gönderme hatası:', error);
      toast.error('Yorum gönderilirken hata oluştu');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;

    try {
      await update(ref(db, `blog_posts/${post.id}`), {
        likes: (post.likes || 0) + 1
      });
      
      setPost(prev => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null);
      toast.success('Beğendiniz!');
    } catch (error) {
      console.error('Beğeni hatası:', error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link kopyalandı');
      }
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Blog Yazısı Bulunamadı</h2>
        <Button onClick={() => navigate('/blog')}>
          Blog Ana Sayfasına Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/blog')}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        Blog Ana Sayfası
      </button>

      {/* Article */}
      <article className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {post.category}
            </span>
            {post.isAIGenerated && (
              <span className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                AI Üretimi
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {post.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(post.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.readTime} dakika okuma
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors"
              >
                <Heart className="h-4 w-4" />
                {post.likes || 0}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Paylaş
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <span key={index} className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          <div 
            className="prose max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Comments Section */}
        <div className="p-6 sm:p-8 border-t border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            Yorumlar ({comments.length})
          </h3>

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <div className="space-y-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Yorumunuzu yazın... AI asistanımız size yanıt verecek!"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {commentText.length}/500 karakter
                </span>
                <Button
                  type="submit"
                  isLoading={submittingComment}
                  disabled={!commentText.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Yorum Gönder
                </Button>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-4">
                {/* User Comment */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900">{comment.userName}</span>
                    <span className="text-xs text-gray-500">{getTimeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>

                {/* AI Response */}
                {comment.aiResponse && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200 ml-8">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="font-medium text-purple-900">AI Asistan</span>
                      <span className="text-xs text-purple-600">Otomatik Yanıt</span>
                    </div>
                    <p className="text-purple-800">{comment.aiResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {comments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>Henüz yorum yok. İlk yorumu siz yapın!</p>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}