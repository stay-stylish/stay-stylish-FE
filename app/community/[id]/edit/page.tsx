'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
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
        const postData = result.data || result;
        
        setTitle(postData.title);
        setContent(postData.content);
      } catch (err) {
        console.error('Error fetching post:', err);
        toast({
          title: '오류',
          description: err instanceof Error ? err.message : '게시글을 불러올 수 없습니다.',
          variant: 'destructive',
        });
        router.push('/community');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchPost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: '입력 오류',
        description: '제목과 내용을 모두 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const token = getAccessToken();
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/community/posts/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '게시글 수정에 실패했습니다.');
      }

      toast({
        title: '성공',
        description: '게시글이 수정되었습니다.',
      });

      router.push(`/community/${params.id}`);
    } catch (err) {
      console.error('Error updating post:', err);
      toast({
        title: '오류',
        description: err instanceof Error ? err.message : '게시글 수정 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push(`/community/${params.id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          취소
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>게시글 수정</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  placeholder="게시글 제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {title.length}/100
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">내용</Label>
                <Textarea
                  id="content"
                  placeholder="게시글 내용을 입력하세요&#10;&#10;이미지를 추가하려면:&#10;- 마크다운: ![설명](이미지URL)&#10;- HTML: <img src='이미지URL' />&#10;- 직접 URL: https://example.com/image.jpg"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isSubmitting}
                  rows={15}
                  className="resize-y"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !content.trim()}
                >
                  {isSubmitting ? '수정 중...' : '수정 완료'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
