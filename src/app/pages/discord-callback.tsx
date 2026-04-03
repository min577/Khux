import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { setReviewToken } from "../../utils/review-auth";
import { API_BASE_URL } from "../../utils/supabase-client";
import { publicAnonKey } from "/utils/supabase/info";

export function DiscordCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("인증 코드가 없습니다.");
      return;
    }

    fetch(`${API_BASE_URL}/discord/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ code }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Authentication failed");
        return res.json();
      })
      .then((data) => {
        if (data.token) {
          setReviewToken(data.token);
          navigate("/review");
        } else {
          throw new Error("No token received");
        }
      })
      .catch((err) => {
        console.error("Discord callback error:", err);
        setError("디스코드 인증에 실패했습니다. 다시 시도해주세요.");
      });
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <a
              href="/review/login"
              className="inline-block py-2 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              로그인 페이지로 돌아가기
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">디스코드 인증 처리 중...</p>
      </div>
    </div>
  );
}
