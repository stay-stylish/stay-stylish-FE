'use client';

import Script from 'next/script';

// 클라이언트 컴포넌트에서도 NEXT_PUBLIC_* env는 빌드 타임에 문자열로 치환돼서 사용 가능
const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

export function KakaoScriptLoader() {
  return (
    <Script
      src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.9/kakao.min.js"
      integrity="sha384-JpLApTkB8lPskhVMhT+m5Ln8aHlnS0bsIexhaak0jOhAkMYedQoVghPfSpjNi9K1"
      crossOrigin="anonymous"
      strategy="afterInteractive"
      onLoad={() => {
        try {
          if (!kakaoKey) {
            console.warn(
              'NEXT_PUBLIC_KAKAO_JS_KEY가 설정되지 않았습니다. Kakao SDK가 초기화되지 않습니다.'
            );
            return;
          }

          // 타입 헷갈리면 any로 한 번 감싸버리기
          const w = window as any;

          if (w.Kakao && !w.Kakao.isInitialized()) {
            w.Kakao.init(kakaoKey);
            console.log('Kakao SDK initialized');
          }
        } catch (e) {
          console.error('Failed to initialize Kakao SDK', e);
        }
      }}
    />
  );
}
