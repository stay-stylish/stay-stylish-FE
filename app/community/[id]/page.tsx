'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, ArrowLeft, Share2, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface KakaoShare {
  Link: {
    sendDefault: (options: any) => void;
  };
}

declare global {
  interface Window {
    Kakao?: KakaoShare;
  }
}

interface PostDetail {
  id: number;
  title: string;
  content: string;
  authorNickname: string;
  likeCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
}

// Helper functions moved outside component to avoid re-creation
const extractImages = (content: string): string[] => {
  const images: string[] = [];
  
  // Markdown image pattern: ![alt](url)
  const markdownPattern = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
  let match;
  while ((match = markdownPattern.exec(content)) !== null) {
    images.push(match[1]);
  }
  
  // HTML img tag pattern: <img src="url">
  const htmlPattern = /<img[^>]+src=["']([^"']+)["']/gi;
  while ((match = htmlPattern.exec(content)) !== null) {
    images.push(match[1]);
  }
  
  // Direct URL pattern (http:// or https:// followed by image extension)
  const urlPattern = /https?:\/\/[^\s<]+\.(?:jpg|jpeg|png|gif|webp)/gi;
  while ((match = urlPattern.exec(content)) !== null) {
    if (!images.includes(match[0])) {
      images.push(match[0]);
    }
  }
  
  return images;
};

const renderContent = (content: string) => {
  // Remove image markdown/HTML from text content
  let textContent = content
    .replace(/!\[.*?\]\(https?:\/\/[^\s)]+\)/g, '')
    .replace(/<img[^>]+>/gi, '')
    .replace(/https?:\/\/[^\s<]+\.(?:jpg|jpeg|png|gif|webp)/gi, '')
    .trim();
  
  return textContent.split('\n').map((line, index) => (
    <p key={index} className="mb-2">
      {line}
    </p>
  ));
};

export default function CommunityPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getAccessToken, user } = useAuth();
  const { toast } = useToast();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        setIsLoading(true);
        const token = getAccessToken();
        
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`/api/community/posts/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('게시글을 불러오는데 실패했습니다.');
        }

        const result = await response.json();
        console.log('Post detail response:', result);
        
        // 백엔드 ApiResponse 구조: { success, message, data: PostResponse }
        const postData = result.data || result;
        setPost(postData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        toast({
          title: '오류',
          description: err instanceof Error ? err.message : '게시글을 불러올 수 없습니다.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchPostDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleLike = async () => {
    try {
      const token = getAccessToken();
      
      if (!token) {
        router.push('/login');
        return;
      }

      // 낙관적 업데이트
      const wasLiked = isLiked;
      setIsLiked(!isLiked);
      if (post) {
        setPost({
          ...post,
          likeCount: post.likeCount + (wasLiked ? -1 : 1),
        });
      }

      // 백엔드 API 호출
      const response = await fetch(`/api/community/posts/${params.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // 실패 시 롤백
        setIsLiked(wasLiked);
        if (post) {
          setPost({
            ...post,
            likeCount: post.likeCount + (wasLiked ? 1 : -1),
          });
        }
        throw new Error('좋아요 처리에 실패했습니다.');
      }

      const result = await response.json();
      const likeData = result.data || result;
      
      // 백엔드 응답으로 최종 상태 업데이트
      setIsLiked(likeData.liked);
      if (post) {
        setPost({
          ...post,
          likeCount: likeData.likeCount,
        });
      }
    } catch (err) {
      console.error('Like error:', err);
      toast({
        title: '오류',
        description: err instanceof Error ? err.message : '좋아요 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      if (!post) return;

      const token = getAccessToken();
      
      if (!token) {
        router.push('/login');
        return;
      }

      const platform = 'KAKAO';
      // 공유 URL 생성
      const shareUrl = window.location.href;
      
      // 소셜 미디어 공유
      if (platform === 'KAKAO') {
        // 카카오톡 공유 (window.Kakao API 필요)
        if (window.Kakao) {
          window.Kakao.Link.sendDefault({
            objectType: 'feed',
            content: {
              title: post.title,
              description: post.content.substring(0, 100) + '...',
              imageUrl: extractImages(post.content)[0] || '',
              link: {
                mobileWebUrl: shareUrl,
                webUrl: shareUrl,
              },
            },
            buttons: [
              {
                title: '자세히 보기',
                link: {
                  mobileWebUrl: shareUrl,
                  webUrl: shareUrl,
                },
              },
            ],
          });
        } else {
          // 카카오톡 API가 없는 경우 URL 복사로 대체
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: 'URL이 복사되었습니다',
            description: '원하는 곳에 붙여넣어 공유하세요.',
          });
        }
      }

      // 백엔드 API 호출하여 공유 수 증가
      const response = await fetch(`/api/community/posts/${post.id}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform }),
      });

      if (!response.ok) {
        throw new Error('공유 처리에 실패했습니다.');
      }

      const result = await response.json();
      const shareData = result.data || result;
      
      // 공유 수 업데이트
      setPost(prev => prev ? {
        ...prev,
        shareCount: shareData.shareCount,
      } : null);

      toast({
        title: '공유 완료',
        description: '게시글이 공유되었습니다.',
      });
    } catch (err) {
      console.error('Share error:', err);
      toast({
        title: '오류',
        description: err instanceof Error ? err.message : '공유 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    router.push('/community');
  };

  const handleEdit = () => {
    router.push(`/community/${post?.id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const token = getAccessToken();
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/community/posts/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('게시글 삭제에 실패했습니다.');
      }

      toast({
        title: '성공',
        description: '게시글이 삭제되었습니다.',
      });

      router.push('/community');
    } catch (err) {
      console.error('Error deleting post:', err);
      toast({
        title: '오류',
        description: err instanceof Error ? err.message : '게시글 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 작성자 확인
  const isAuthor = user && post && user.nickname === post.authorNickname;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Back Button Skeleton */}
          <Skeleton className="h-10 w-32 mb-4" />
          
          {/* Card Skeleton */}
          <Card>
            <CardHeader>
              {/* Author Info Skeleton */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>
              
              {/* Title Skeleton */}
              <Skeleton className="h-8 w-3/4 mb-4" />
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Image Skeleton */}
              <Skeleton className="w-full aspect-square rounded-lg" />
              
              {/* Content Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              
              {/* Action Buttons Skeleton */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-red-500 mb-4">{error || '게시글을 찾을 수 없습니다.'}</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const images = extractImages(post.content);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {post.authorNickname?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{post.authorNickname}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              {isAuthor && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    disabled={isDeleting}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    수정
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {isDeleting ? '삭제 중...' : '삭제'}
                  </Button>
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
          </CardHeader>

          <CardContent>
            {images.length > 0 && (
              <div className="mb-6">
                {images.length === 1 ? (
                  <img
                    src={images[0]}
                    alt="게시글 이미지"
                    className="w-full rounded-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`게시글 이미지 ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="prose max-w-none mb-6">
              {renderContent(post.content)}
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                variant={isLiked ? 'default' : 'outline'}
                size="sm"
                onClick={handleLike}
                className="flex items-center gap-2"
              >
                <Heart
                  className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`}
                />
                <span>{post.likeCount}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span>{post.shareCount}</span>
              </Button>
            </div>

            {post.updatedAt !== post.createdAt && (
              <p className="text-xs text-muted-foreground mt-4">
                수정됨: {new Date(post.updatedAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
