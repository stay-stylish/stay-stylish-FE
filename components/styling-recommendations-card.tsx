"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

interface RecommendationItem {
  category: string
  link: string
}

interface FeedbackState {
  [key: string]: {
    status: 'LIKE' | 'DISLIKE' | null;
    loading: boolean;
  };
}

interface StylingRecommendationsProps {
  recommendationText: string
  recommendedCategories: RecommendationItem[]
  feedbackStates: FeedbackState
  setFeedbackStates: React.Dispatch<React.SetStateAction<FeedbackState>>
  onFeedback: (categoryName: string, status: 'LIKE' | 'DISLIKE') => Promise<void>
}

import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { useState } from 'react'

export default function StylingRecommendationsCard({
  recommendationText,
  recommendedCategories,
  feedbackStates,
  setFeedbackStates,
  onFeedback
}: StylingRecommendationsProps) {
  const handleFeedback = (category: string, newStatus: 'LIKE' | 'DISLIKE') => {
    const currentState = feedbackStates[category]?.status;
    setFeedbackStates(prev => ({
      ...prev,
      [category]: {
        status: currentState === newStatus ? null : newStatus,
        loading: false
      }
    }));
  }

  const handleSaveFeedback = async () => {
    // 피드백이 있는 카테고리만 필터링
    const feedbacksToSave = Object.entries(feedbackStates)
      .filter(([_, state]) => state.status !== null)
      .map(([category, state]) => ({
        category,
        status: state.status as 'LIKE' | 'DISLIKE'
      }));

    if (feedbacksToSave.length === 0) {
      alert('저장할 피드백이 없습니다.');
      return;
    }

    // 모든 피드백 카테고리의 로딩 상태를 true로 설정
    const updatedStates = { ...feedbackStates };
    feedbacksToSave.forEach(({ category }) => {
      updatedStates[category] = { 
        ...updatedStates[category], 
        loading: true 
      };
    });
    setFeedbackStates(updatedStates);

    try {
      // 각 피드백을 순차적으로 저장
      for (const { category, status } of feedbacksToSave) {
        await onFeedback(category, status);
      }
      alert('피드백이 성공적으로 저장되었습니다.');
      
      // 피드백 저장 후 모든 피드백 상태 초기화
      setFeedbackStates({});
    } catch (error) {
      console.error('피드백 저장 실패:', error);
      alert('피드백 저장에 실패했습니다.');
    }
  }
  // 각 카테고리마다 무신사(짝수 인덱스), W컨셉(홀수 인덱스) 순서로 링크가 2개씩
  const groupedCategories: { category: string; musinsaLink: string; wconceptLink: string }[] = []
  
  for (let i = 0; i < recommendedCategories.length; i += 2) {
    const category = recommendedCategories[i].category
    const wconceptLink = recommendedCategories[i]?.link || "#"
    const musinsaLink = recommendedCategories[i + 1]?.link || "#"
    
    groupedCategories.push({
      category,
      musinsaLink,
      wconceptLink,
    })
  }
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Recommendation Text Card */}
      <Card className="border-2 border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-900">오늘의 스타일링 추천</CardTitle>
          <CardDescription>AI가 생성한 맞춤형 스타일링 조언</CardDescription>
        </CardHeader>
        <CardContent className="relative min-h-[100px]">
          {recommendationText ? (
            <p className="text-lg text-slate-700 leading-relaxed">{recommendationText}</p>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                </div>
                <p className="text-slate-600">새로운 추천을 불러오는 중...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommended Categories Card */}
      <Card className="border-2 border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">추천 아이템</CardTitle>
          <CardDescription>아이콘을 클릭하여 쇼핑하기</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {groupedCategories.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                {/* Category Name */}
                <span className="text-base font-semibold text-slate-900">{item.category}</span>

                {/* Icon Buttons */}
                <div className="flex items-center gap-3">
                  <div className="flex gap-2 mr-2">
                    <button
                      onClick={() => handleFeedback(item.category, 'LIKE')}
                      disabled={feedbackStates[item.category]?.loading}
                      className={`p-2 rounded-full transition-colors ${
                        feedbackStates[item.category]?.status === 'LIKE'
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title={`${item.category} 카테고리 좋아요`}
                    >
                      <ThumbsUp 
                        className={`w-5 h-5 ${
                          feedbackStates[item.category]?.status === 'LIKE' ? 'fill-current' : ''
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleFeedback(item.category, 'DISLIKE')}
                      disabled={feedbackStates[item.category]?.loading}
                      className={`p-2 rounded-full transition-colors ${
                        feedbackStates[item.category]?.status === 'DISLIKE'
                          ? 'text-red-600 bg-red-50'
                          : 'text-slate-600 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title={`${item.category} 카테고리 싫어요`}
                    >
                      <ThumbsDown 
                        className={`w-5 h-5 ${
                          feedbackStates[item.category]?.status === 'DISLIKE' ? 'fill-current' : ''
                        }`}
                      />
                    </button>
                  </div>
                  
                  {/* Musinsa Logo Button with Image */}
                  <a href={item.musinsaLink} target="_blank" rel="noopener noreferrer">
                    <button className="w-11 h-11 rounded-full overflow-hidden hover:opacity-80 transition-all duration-200 shadow-md hover:shadow-lg">
                      <Image 
                        src="/musinsa-logo.png" 
                        alt="무신사" 
                        width={44} 
                        height={44}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  </a>

                  {/* WConcept Logo Button with Image */}
                  <a href={item.wconceptLink} target="_blank" rel="noopener noreferrer">
                    <button className="w-11 h-11 rounded-full overflow-hidden hover:opacity-80 transition-all duration-200 shadow-md hover:shadow-lg">
                      <Image 
                        src="/wconcept-logo.png" 
                        alt="W컨셉" 
                        width={44} 
                        height={44}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* 피드백 저장 버튼 */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSaveFeedback}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg 
                shadow-md hover:shadow-lg transition-all font-semibold disabled:opacity-50"
              disabled={Object.values(feedbackStates).some(state => state?.loading)}
            >
              피드백 저장하기
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
