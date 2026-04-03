import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  LogOut,
  PlusCircle,
  Edit2,
  Trash2,
  FileText,
  Newspaper as NewspaperIcon,
  Users,
  Search,
  Loader2,
  X,
  Image as ImageIcon,
  Calendar,
  ClipboardCheck,
  Play,
  Download,
  StopCircle,
  Bell,
  Check,
  RefreshCw
} from "lucide-react";
import { supabase, apiFetch, apiFetchAuth, uploadImage, API_BASE_URL } from "../../utils/supabase-client";
import { publicAnonKey } from "/utils/supabase/info";
import type { Article, NewsItem, GalleryItem, Activity } from "../data/mock-data";
import { MarkdownEditor } from "../components/markdown-editor";

type TabType = "articles" | "news" | "gallery" | "activities" | "review";

export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("articles");
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Review management state
  const [reviewSessions, setReviewSessions] = useState<any[]>([]);
  const [selectedReviewSession, setSelectedReviewSession] = useState<string | null>(null);
  const [reviewStatusData, setReviewStatusData] = useState<any[]>([]);
  const [reviewStatusLoading, setReviewStatusLoading] = useState(false);
  const [showStartForm, setShowStartForm] = useState(false);
  const [newReviewTitle, setNewReviewTitle] = useState("");
  const [startingReview, setStartingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate("/admin/login");
        return;
      }
      setAuthenticated(true);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (authenticated) {
      fetchData();
    }
  }, [authenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [articlesRes, newsRes, galleryRes, activitiesRes] = await Promise.all([
        apiFetch("/articles"),
        apiFetch("/news"),
        apiFetch("/gallery"),
        apiFetch("/activities"),
      ]);
      const [articlesData, newsData, galleryData, activitiesData] = await Promise.all([
        articlesRes.json(),
        newsRes.json(),
        galleryRes.json(),
        activitiesRes.json(),
      ]);
      setArticles(articlesData.articles || []);
      setNews(newsData.news || []);
      setGallery(galleryData.gallery || []);
      setActivities(activitiesData.activities || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Review management functions
  const fetchReviewSessions = async () => {
    try {
      const res = await apiFetchAuth("/review/sessions");
      if (res.ok) {
        const data = await res.json();
        const sorted = (data.sessions || []).sort(
          (a: any, b: any) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        );
        setReviewSessions(sorted);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviewStatus = async (sessionId: string) => {
    setReviewStatusLoading(true);
    setSelectedReviewSession(sessionId);
    try {
      const res = await apiFetchAuth(`/review/sessions/${sessionId}/status`);
      if (res.ok) {
        const data = await res.json();
        setReviewStatusData(data.status || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReviewStatusLoading(false);
    }
  };

  const startAllReviewSessions = async () => {
    if (!newReviewTitle.trim()) return;
    setStartingReview(true);
    setReviewMessage(null);
    try {
      const res = await apiFetchAuth("/review/sessions/start-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newReviewTitle.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        const summary = data.sessions.map((s: any) => `${s.team} (${s.members}명)`).join(", ");
        setReviewMessage({ type: "success", text: `세션 생성 완료: ${summary}` });
        setNewReviewTitle("");
        setShowStartForm(false);
        fetchReviewSessions();
      } else {
        setReviewMessage({ type: "error", text: data.error || "세션 생성 실패" });
      }
    } catch {
      setReviewMessage({ type: "error", text: "세션 생성에 실패했습니다." });
    } finally {
      setStartingReview(false);
    }
  };

  const endReviewSession = async (sessionId: string) => {
    if (!confirm("이 세션을 종료하시겠습니까?")) return;
    try {
      const res = await apiFetchAuth(`/review/sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
      if (res.ok) {
        setReviewMessage({ type: "success", text: "세션이 종료되었습니다." });
        fetchReviewSessions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const exportReviewCsv = async (sessionId: string, type: "common" | "leader") => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const url = `${API_BASE_URL}/review/sessions/${sessionId}/export?type=${type}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${publicAnonKey}`, "x-user-token": session.access_token },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${sessionId}_${type}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const sendReviewReminder = async (sessionId: string) => {
    setReviewMessage(null);
    setReviewMessage({ type: "success", text: "리마인더 발송 중..." });
    try {
      const res = await apiFetchAuth(`/review/sessions/${sessionId}/remind`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setReviewMessage({ type: "success", text: data.message });
      } else {
        setReviewMessage({ type: "error", text: data.error || "발송 실패" });
      }
    } catch {
      setReviewMessage({ type: "error", text: "리마인더 발송에 실패했습니다." });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  // ============ Delete Handlers ============

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("정말로 이 아티클을 삭제하시겠습니까?")) return;
    try {
      const res = await apiFetchAuth(`/articles/${id}`, { method: "DELETE" });
      if (res.ok) {
        setArticles(articles.filter((a) => a.id !== id));
      } else {
        alert("아티클 삭제에 실패했습니다.");
      }
    } catch (error) {
      alert("인증이 만료되었습니다. 다시 로그인해주세요.");
      navigate("/admin/login");
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm("정말로 이 뉴스를 삭제하시겠습니까?")) return;
    try {
      const res = await apiFetchAuth(`/news/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNews(news.filter((n) => n.id !== id));
      } else {
        alert("뉴스 삭제에 실패했습니다.");
      }
    } catch (error) {
      alert("인증이 만료되었습니다. 다시 로그인해주세요.");
      navigate("/admin/login");
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm("정말로 이 갤러리 항목을 삭제하시겠습니까?")) return;
    try {
      const res = await apiFetchAuth(`/gallery/${id}`, { method: "DELETE" });
      if (res.ok) {
        setGallery(gallery.filter((g) => g.id !== id));
      } else {
        alert("갤러리 삭제에 실패했습니다.");
      }
    } catch (error) {
      alert("인증이 만료되었습니다. 다시 로그인해주세요.");
      navigate("/admin/login");
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm("정말로 이 액티비티를 삭제하시겠습니까?")) return;
    try {
      const res = await apiFetchAuth(`/activities/${id}`, { method: "DELETE" });
      if (res.ok) {
        setActivities(activities.filter((a) => a.id !== id));
      } else {
        alert("액티비티 삭제에 실패했습니다.");
      }
    } catch (error) {
      alert("인증이 만료되었습니다. 다시 로그인해주세요.");
      navigate("/admin/login");
    }
  };

  // ============ Edit Handlers ============

  const handleEditArticle = (article: Article) => {
    setEditingId(article.id);
    setFormData({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      author: article.author,
      team: article.team,
      date: article.date,
      tags: article.tags?.join(", ") || "",
    });
    setImagePreview(article.imageUrl || null);
    setActiveTab("articles");
    setShowAddModal(true);
  };

  const handleEditNews = (newsItem: NewsItem) => {
    setEditingId(newsItem.id);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      date: newsItem.date,
      category: newsItem.category,
    });
    setImagePreview(newsItem.imageUrl || null);
    setActiveTab("news");
    setShowAddModal(true);
  };

  const handleEditGallery = (item: GalleryItem) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      date: item.date,
    });
    setImagePreview(item.imageUrl || null);
    setActiveTab("gallery");
    setShowAddModal(true);
  };

  const handleEditActivity = (item: Activity) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      description: item.description,
      content: item.content,
      category: item.category,
      date: item.date,
    });
    setImagePreview(item.imageUrl || null);
    setActiveTab("activities");
    setShowAddModal(true);
  };

  // ============ Update Handlers ============

  const handleUpdateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    try {
      let imageUrl = imagePreview || "";
      if (imageFile) imageUrl = await uploadImage(imageFile);

      const res = await apiFetchAuth(`/articles/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title, excerpt: formData.excerpt, content: formData.content,
          author: formData.author, team: formData.team,
          date: formData.date || new Date().toISOString().split('T')[0],
          imageUrl, tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setArticles(articles.map(a => a.id === editingId ? data.article : a));
        closeModal();
        alert("아티클이 수정되었습니다!");
      } else {
        alert("아티클 수정에 실패했습니다.");
      }
    } catch (error) {
      alert("인증이 만료되었습니다. 다시 로그인해주세요.");
      navigate("/admin/login");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    try {
      let imageUrl: string | undefined = imagePreview || undefined;
      if (imageFile) imageUrl = await uploadImage(imageFile);

      const res = await apiFetchAuth(`/news/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title, content: formData.content,
          date: formData.date || new Date().toISOString().split('T')[0],
          category: formData.category, ...(imageUrl && { imageUrl }),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNews(news.map(n => n.id === editingId ? data.news : n));
        closeModal();
        alert("뉴스가 수정되었습니다!");
      } else {
        alert("뉴스 수정에 실패했습니다.");
      }
    } catch (error) {
      alert("인증이 만료되었습니다. 다시 로그인해주세요.");
      navigate("/admin/login");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    try {
      let imageUrl = imagePreview || "";
      if (imageFile) imageUrl = await uploadImage(imageFile);

      const res = await apiFetchAuth(`/gallery/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title, description: formData.description,
          category: formData.category, date: formData.date || new Date().toISOString().split('T')[0],
          imageUrl,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGallery(gallery.map(g => g.id === editingId ? data.gallery : g));
        closeModal();
        alert("갤러리가 수정되었습니다!");
      } else {
        alert("갤러리 수정에 실패했습니다.");
      }
    } catch (error) {
      alert("인증이 만료되었습니다. 다시 로그인해주세요.");
      navigate("/admin/login");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    try {
      let imageUrl: string | undefined = imagePreview || undefined;
      if (imageFile) imageUrl = await uploadImage(imageFile);

      const res = await apiFetchAuth(`/activities/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title, description: formData.description, content: formData.content,
          category: formData.category, date: formData.date || new Date().toISOString().split('T')[0],
          ...(imageUrl && { imageUrl }),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActivities(activities.map(a => a.id === editingId ? data.activity : a));
        closeModal();
        alert("액티비티가 수정되었습니다!");
      } else {
        alert("액티비티 수정에 실패했습니다.");
      }
    } catch (error) {
      alert("인증이 만료되었습니다. 다시 로그인해주세요.");
      navigate("/admin/login");
    } finally {
      setSubmitting(false);
    }
  };

  // ============ Filtering ============

  const filteredArticles = articles.filter(
    (article) =>
      article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNews = news.filter((item) =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGallery = gallery.filter((item) =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActivities = activities.filter((item) =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ============ Image ============

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setFormData({});
    setEditingId(null);
    clearImage();
  };

  // ============ Add Handlers ============

  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let imageUrl = "";
      if (imageFile) imageUrl = await uploadImage(imageFile);

      const res = await apiFetchAuth("/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title, excerpt: formData.excerpt, content: formData.content,
          author: formData.author, team: formData.team,
          date: formData.date || new Date().toISOString().split('T')[0],
          imageUrl, tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setArticles([data.article, ...articles]);
        closeModal();
        alert("아티클이 추가되었습니다!");
      } else {
        alert("아티클 추가에 실패했습니다.");
      }
    } catch (error) {
      alert("인증이 만료되었습니다. 다시 로그인해주세요.");
      navigate("/admin/login");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) imageUrl = await uploadImage(imageFile);

      const res = await apiFetchAuth("/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title, content: formData.content,
          date: formData.date || new Date().toISOString().split('T')[0],
          category: formData.category, ...(imageUrl && { imageUrl }),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNews([data.news, ...news]);
        closeModal();
        alert("뉴스가 추가되었습니다!");
      } else {
        alert("뉴스 추가에 실패했습니다.");
      }
    } catch (error) {
      alert("인증이 만료되었습니다. 다시 로그인해주세요.");
      navigate("/admin/login");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      } else {
        alert("갤러리에는 이미지가 필수입니다.");
        setSubmitting(false);
        return;
      }

      const res = await apiFetchAuth("/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title, description: formData.description,
          category: formData.category, date: formData.date || new Date().toISOString().split('T')[0],
          imageUrl,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGallery([data.gallery, ...gallery]);
        closeModal();
        alert("갤러리가 추가되었습니다!");
      } else {
        alert("갤러리 추가에 실패했습니다.");
      }
    } catch (error) {
      alert("인증이 만료되었습니다. 다시 로그인해주세요.");
      navigate("/admin/login");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) imageUrl = await uploadImage(imageFile);

      const res = await apiFetchAuth("/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title, description: formData.description, content: formData.content,
          category: formData.category, date: formData.date || new Date().toISOString().split('T')[0],
          ...(imageUrl && { imageUrl }),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActivities([data.activity, ...activities]);
        closeModal();
        alert("액티비티가 추가되었습니다!");
      } else {
        alert("액티비티 추가에 실패했습니다.");
      }
    } catch (error) {
      alert("인증이 만료되었습니다. 다시 로그인해주세요.");
      navigate("/admin/login");
    } finally {
      setSubmitting(false);
    }
  };

  // ============ Form Submit Router ============

  const getSubmitHandler = () => {
    if (editingId) {
      switch (activeTab) {
        case "articles": return handleUpdateArticle;
        case "news": return handleUpdateNews;
        case "gallery": return handleUpdateGallery;
        case "activities": return handleUpdateActivity;
      }
    }
    switch (activeTab) {
      case "articles": return handleAddArticle;
      case "news": return handleAddNews;
      case "gallery": return handleAddGallery;
      case "activities": return handleAddActivity;
    }
  };

  const getModalTitle = () => {
    const action = editingId ? "수정" : "추가";
    switch (activeTab) {
      case "articles": return `아티클 ${action}`;
      case "news": return `뉴스 ${action}`;
      case "gallery": return `갤러리 ${action}`;
      case "activities": return `액티비티 ${action}`;
    }
  };

  const getAddButtonLabel = () => {
    switch (activeTab) {
      case "articles": return "아티클 추가";
      case "news": return "뉴스 추가";
      case "gallery": return "갤러리 추가";
      case "activities": return "액티비티 추가";
    }
  };

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case "articles": return "아티클 검색...";
      case "news": return "뉴스 검색...";
      case "gallery": return "갤러리 검색...";
      case "activities": return "액티비티 검색...";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">KHUX 관리자</h1>
                <p className="text-xs text-muted-foreground">콘텐츠 관리 시스템</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">아티클</p>
                <p className="text-xl font-bold">{articles.length}</p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <NewspaperIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">뉴스</p>
                <p className="text-xl font-bold">{news.length}</p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">갤러리</p>
                <p className="text-xl font-bold">{gallery.length}</p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">액티비티</p>
                <p className="text-xl font-bold">{activities.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-border">
            <div className="flex gap-6 overflow-x-auto">
              {([
                { key: "articles" as TabType, icon: FileText, label: "아티클 관리" },
                { key: "news" as TabType, icon: NewspaperIcon, label: "뉴스 관리" },
                { key: "gallery" as TabType, icon: ImageIcon, label: "갤러리 관리" },
                { key: "activities" as TabType, icon: Calendar, label: "액티비티 관리" },
                { key: "review" as TabType, icon: ClipboardCheck, label: "피어리뷰 관리" },
              ]).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setSearchQuery(""); if (key === "review") fetchReviewSessions(); }}
                  className={`pb-4 px-2 font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === key
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  {activeTab === key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search and Add (hidden for review tab) */}
        {activeTab !== "review" && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getSearchPlaceholder()}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors" onClick={() => { setFormData({}); setShowAddModal(true); }}>
              <PlusCircle className="h-5 w-5" />
              {getAddButtonLabel()}
            </button>
          </div>
        )}

        {/* Content List */}
        {activeTab === "articles" && (
          <div className="space-y-4">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">아티클이 없습니다</div>
            ) : (
              filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} onDelete={handleDeleteArticle} onEdit={handleEditArticle} />
              ))
            )}
          </div>
        )}

        {activeTab === "news" && (
          <div className="space-y-4">
            {filteredNews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">뉴스가 없습니다</div>
            ) : (
              filteredNews.map((item) => (
                <NewsCardAdmin key={item.id} news={item} onDelete={handleDeleteNews} onEdit={handleEditNews} />
              ))
            )}
          </div>
        )}

        {activeTab === "gallery" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGallery.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">갤러리가 없습니다</div>
            ) : (
              filteredGallery.map((item) => (
                <GalleryCardAdmin key={item.id} item={item} onDelete={handleDeleteGallery} onEdit={handleEditGallery} />
              ))
            )}
          </div>
        )}

        {activeTab === "activities" && (
          <div className="space-y-4">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">액티비티가 없습니다</div>
            ) : (
              filteredActivities.map((item) => (
                <ActivityCardAdmin key={item.id} item={item} onDelete={handleDeleteActivity} onEdit={handleEditActivity} />
              ))
            )}
          </div>
        )}

        {/* Review Management Tab */}
        {activeTab === "review" && (
          <div className="space-y-6">
            {/* Start Session */}
            {!showStartForm ? (
              <button
                onClick={() => setShowStartForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <Play className="w-4 h-4" />
                새 피어리뷰 시작
              </button>
            ) : (
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-semibold">새 피어리뷰 세션 시작</h3>
                <p className="text-sm text-muted-foreground">
                  모든 팀의 세션이 일괄 생성되고, 디스코드 역할 기반으로 팀원이 자동 등록됩니다.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newReviewTitle}
                    onChange={(e) => setNewReviewTitle(e.target.value)}
                    placeholder="세션 제목 (예: 4월 피어리뷰)"
                    className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    disabled={startingReview}
                    onKeyDown={(e) => { if (e.key === "Enter") startAllReviewSessions(); }}
                  />
                  <button
                    onClick={startAllReviewSessions}
                    disabled={startingReview || !newReviewTitle.trim()}
                    className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {startingReview ? "생성 중..." : "시작"}
                  </button>
                  <button
                    onClick={() => { setShowStartForm(false); setNewReviewTitle(""); }}
                    className="px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-accent transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {reviewMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                reviewMessage.type === "error"
                  ? "bg-destructive/10 border border-destructive/20 text-destructive"
                  : "bg-green-50 border border-green-200 text-green-700"
              }`}>
                {reviewMessage.text}
              </div>
            )}

            {/* Session List */}
            {reviewSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">리뷰 세션이 없습니다.</div>
            ) : (
              reviewSessions.map((sess) => (
                <div key={sess.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{sess.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          sess.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                        }`}>
                          {sess.active ? "진행 중" : "종료"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {sess.team_name} — {sess.members?.length || 0}명 — {new Date(sess.started_at).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => fetchReviewStatus(sess.id)}
                        className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-accent transition-colors"
                      >
                        현황 보기
                      </button>
                      <button
                        onClick={() => sendReviewReminder(sess.id)}
                        className="p-1.5 text-blue-500 hover:text-blue-600 transition-colors"
                        title="미완료자 확인"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => exportReviewCsv(sess.id, "common")}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        title="공통 리뷰 CSV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => exportReviewCsv(sess.id, "leader")}
                        className="p-1.5 text-amber-500 hover:text-amber-600 transition-colors"
                        title="리더 평가 CSV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {sess.active && (
                        <button
                          onClick={() => endReviewSession(sess.id)}
                          className="p-1.5 text-destructive hover:text-destructive/80 transition-colors"
                          title="세션 종료"
                        >
                          <StopCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status detail */}
                  {selectedReviewSession === sess.id && (
                    <div className="border-t border-border p-5">
                      {reviewStatusLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" /> 불러오는 중...
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-[1fr,120px,120px,80px] gap-4 text-xs text-muted-foreground font-medium pb-2 border-b border-border">
                            <span>이름</span>
                            <span className="text-center">공통 리뷰</span>
                            <span className="text-center">리더 평가</span>
                            <span className="text-center">상태</span>
                          </div>
                          {reviewStatusData.map((member: any) => (
                            <div
                              key={member.discord_id}
                              className="grid grid-cols-[1fr,120px,120px,80px] gap-4 items-center text-sm py-1.5"
                            >
                              <div className="flex items-center gap-2">
                                <span>{member.display_name}</span>
                                {member.is_leader && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">Leader</span>
                                )}
                              </div>
                              <span className="text-center text-muted-foreground">
                                {member.common_done}/{member.common_total}
                              </span>
                              <span className="text-center text-muted-foreground">
                                {member.leader_done}/{member.leader_total}
                              </span>
                              <div className="flex justify-center">
                                {member.complete ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <X className="w-4 h-4 text-destructive" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-border rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{getModalTitle()}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={getSubmitHandler()} className="p-6 space-y-4">
              {/* Article Form */}
              {activeTab === "articles" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">제목 *</label>
                    <input type="text" required value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="아티클 제목" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">요약 *</label>
                    <textarea required value={formData.excerpt || ""} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" rows={2} placeholder="아티클 요약" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">본문 * (마크다운 지원)</label>
                    <MarkdownEditor
                      value={formData.content || ""}
                      onChange={(content) => setFormData({ ...formData, content })}
                      placeholder="마크다운으로 작성하세요... 이미지는 드래그 & 드롭 또는 Ctrl+V로 붙여넣기할 수 있습니다."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">작성자 *</label>
                      <input type="text" required value={formData.author || ""} onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="작성자 이름" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">팀 *</label>
                      <select required value={formData.team || ""} onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                        <option value="">팀 선택</option>
                        <option value="Leaders">Leaders</option>
                        <option value="Education">Education</option>
                        <option value="Operations">Operations</option>
                        <option value="Growth">Growth</option>
                        <option value="Brand">Brand</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">태그 (쉼표로 구분)</label>
                    <input type="text" value={formData.tags || ""} onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="UX, Design, Research" />
                  </div>
                </>
              )}

              {/* News Form */}
              {activeTab === "news" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">제목 *</label>
                    <input type="text" required value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="뉴스 제목" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">내용 *</label>
                    <textarea required value={formData.content || ""} onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" rows={6} placeholder="뉴스 내용" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">카테고리 *</label>
                    <div className="flex gap-2">
                      <select
                        value={["Recruitment", "Event", "Project", "Announcement"].includes(formData.category || "") ? formData.category : "__custom__"}
                        onChange={(e) => {
                          if (e.target.value === "__custom__") {
                            setFormData({ ...formData, category: "" });
                          } else {
                            setFormData({ ...formData, category: e.target.value });
                          }
                        }}
                        className="w-1/2 px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="">카테고리 선택</option>
                        <option value="Recruitment">Recruitment</option>
                        <option value="Event">Event</option>
                        <option value="Project">Project</option>
                        <option value="Announcement">Announcement</option>
                        <option value="__custom__">직접 입력</option>
                      </select>
                      {(!formData.category || !["Recruitment", "Event", "Project", "Announcement"].includes(formData.category)) && (
                        <input type="text" required value={formData.category === "__custom__" ? "" : formData.category || ""}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          placeholder="카테고리 직접 입력"
                          className="w-1/2 px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Gallery Form */}
              {activeTab === "gallery" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">제목 *</label>
                    <input type="text" required value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="갤러리 제목" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">설명</label>
                    <textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" rows={3} placeholder="갤러리 설명" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">카테고리 *</label>
                      <input type="text" required value={formData.category || ""} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="행사, 워크숍, 프로젝트 등" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">날짜</label>
                      <input type="date" value={formData.date || ""} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                  </div>
                </>
              )}

              {/* Activity Form */}
              {activeTab === "activities" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">제목 *</label>
                    <input type="text" required value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="액티비티 제목" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">간단 설명 *</label>
                    <input type="text" required value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="액티비티 간단 설명" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">상세 내용 *</label>
                    <textarea required value={formData.content || ""} onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" rows={6} placeholder="액티비티 상세 내용" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">카테고리 *</label>
                      <input type="text" required value={formData.category || ""} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="세미나, 프로젝트, 워크숍 등" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">날짜</label>
                      <input type="date" value={formData.date || ""} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                  </div>
                </>
              )}

              {/* Image Upload (shared) */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {activeTab === "gallery" ? "이미지 첨부 *" : "썸네일 첨부 (선택)"}
                </label>
                <input type="file" accept="image/*" onChange={handleImageChange}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                {imagePreview && (
                  <div className="mt-3 relative inline-block">
                    <img src={imagePreview} alt="미리보기" className="max-h-40 rounded-lg border border-border" />
                    <button type="button" onClick={clearImage}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors" disabled={submitting}>
                  취소
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? (editingId ? "수정 중..." : "추가 중...") : (editingId ? "수정하기" : "추가하기")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Card Components ============

function ArticleCard({ article, onDelete, onEdit }: { article: Article, onDelete: (id: string) => void, onEdit: (article: Article) => void }) {
  return (
    <div className="p-6 bg-card border border-border rounded-xl hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">{article.team}</span>
            <span className="text-sm text-muted-foreground">{article.date}</span>
          </div>
          <h3 className="text-lg font-medium mb-2">{article.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{article.excerpt}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>작성자: {article.author}</span>
            <span>•</span>
            <span>태그: {article.tags?.join(", ")}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors" onClick={() => onEdit(article)}><Edit2 className="h-4 w-4" /></button>
          <button className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors" onClick={() => onDelete(article.id)}><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

function NewsCardAdmin({ news, onDelete, onEdit }: { news: NewsItem, onDelete: (id: string) => void, onEdit: (news: NewsItem) => void }) {
  return (
    <div className="p-6 bg-card border border-border rounded-xl hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">{news.category}</span>
            <span className="text-sm text-muted-foreground">{news.date}</span>
          </div>
          <h3 className="text-lg font-medium mb-2">{news.title}</h3>
          <p className="text-sm text-muted-foreground">{news.content}</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors" onClick={() => onEdit(news)}><Edit2 className="h-4 w-4" /></button>
          <button className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors" onClick={() => onDelete(news.id)}><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

function GalleryCardAdmin({ item, onDelete, onEdit }: { item: GalleryItem, onDelete: (id: string) => void, onEdit: (item: GalleryItem) => void }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all">
      <div className="aspect-video bg-muted relative">
        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{item.category}</span>
          <span className="text-xs text-muted-foreground">{item.date}</span>
        </div>
        <h3 className="font-medium mb-1">{item.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <button className="flex-1 flex items-center justify-center gap-1 p-2 hover:bg-muted rounded-lg transition-colors text-sm" onClick={() => onEdit(item)}>
            <Edit2 className="h-3.5 w-3.5" /> 편집
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors text-sm" onClick={() => onDelete(item.id)}>
            <Trash2 className="h-3.5 w-3.5" /> 삭제
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityCardAdmin({ item, onDelete, onEdit }: { item: Activity, onDelete: (id: string) => void, onEdit: (item: Activity) => void }) {
  return (
    <div className="p-6 bg-card border border-border rounded-xl hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          {item.imageUrl && (
            <img src={item.imageUrl} alt={item.title} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">{item.category}</span>
              <span className="text-sm text-muted-foreground">{item.date}</span>
            </div>
            <h3 className="text-lg font-medium mb-1">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors" onClick={() => onEdit(item)}><Edit2 className="h-4 w-4" /></button>
          <button className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors" onClick={() => onDelete(item.id)}><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
