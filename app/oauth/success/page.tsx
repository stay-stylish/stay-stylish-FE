// app/oauth/success/page.tsx
import { redirect } from "next/navigation";

export default function OAuthSuccessIndexPage() {
    // /oauth/success 로 접근하면 자동으로 실제 처리 화면으로 보냄
    return redirect("/oauth/success/home");
}
