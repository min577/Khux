import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
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
  RefreshCw,
  UserPlus,
  Lock,
  Plus
} from "lucide-react";
import { supabase, apiFetch, apiFetchAuth, uploadImage, API_BASE_URL } from "../../utils/supabase-client";
import { publicAnonKey } from "/utils/supabase/info";
import type { Article, NoticeItem, GalleryItem, Activity } from "../data/mock-data";
import { MarkdownEditor } from "../components/markdown-editor";
import { AdminRecruitTab } from "./admin-recruit";

type TabType = "articles" | "notice" | "gallery" | "activities" | "review" | "recruit";

const PROJECT_TEAM_PRESETS: { key: string; name: string; members: string[] }[] = [
  { key: "team_a", name: "TEAM A", members: ["전지원", "강예빈", "한유민", "최정윤"] },
  { key: "team_b", name: "TEAM B", members: ["이수민", "정예원", "이신유", "이유진"] },
  { key: "team_c", name: "TEAM C", members: ["김민우", "곽슬기", "한지원", "고민서", "이유나"] },
  { key: "team_d", name: "TEAM D", members: ["박진홍", "송유영", "서지은", "이혜린", "한가람"] },
];

export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("articles");
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
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

  // Review access control
  const [reviewUnlocked, setReviewUnlocked] = useState(false);
  const [reviewPin, setReviewPin] = useState("");
  const [reviewPinError, setReviewPinError] = useState("");
  const [reviewHasPin, setReviewHasPin] = useState<boolean | null>(null);
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");

  // Review management state
  const [reviewSessions, setReviewSessions] = useState<any[]>([]);
  const [selectedReviewSession, setSelectedReviewSession] = useState<string | null>(null);
  const [reviewStatusData, setReviewStatusData] = useState<any[]>([]);
  const [reviewStatusLoading, setReviewStatusLoading] = useState(false);
  const [showStartForm, setShowStartForm] = useState(false);
  const [newReviewTitle, setNewReviewTitle] = useState("");
  const [startingReview, setStartingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expandedReviewGroup, setExpandedReviewGroup] = useState<string | null>(null);
  const [expandedReviewTeam, setExpandedReviewTeam] = useState<string | null>(null);
  // Project-team custom session form
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customTeamKey, setCustomTeamKey] = useState("team_a");
  const [customTeamName, setCustomTeamName] = useState("TEAM A");
  const [customMembers, setCustomMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState("");
  const [creatingCustom, setCreatingCustom] = useState(false);

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

  // Check review PIN status when review tab is selected
  useEffect(() => {
    if (activeTab === "review" && !reviewUnlocked && authenticated) {
      apiFetchAuth("/review-pin/status")
        .then(r => r.json())
        .then(d => setReviewHasPin(d.hasPin ?? false))
        .catch(() => setReviewHasPin(false));
    }
  }, [activeTab, authenticated]);

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
      setNotices(newsData.news || []);
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

  // Custom (project-team) session helpers
  const applyPreset = (key: string) => {
    const preset = PROJECT_TEAM_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    setCustomTeamKey(preset.key);
    setCustomTeamName(preset.name);
    setCustomMembers([...preset.members]);
  };

  const addMember = () => {
    const name = memberInput.trim();
    if (!name) return;
    if (customMembers.includes(name)) {
      setMemberInput("");
      return;
    }
    setCustomMembers([...customMembers, name]);
    setMemberInput("");
  };

  const removeMember = (name: string) => {
    setCustomMembers(customMembers.filter((m) => m !== name));
  };

  const resetCustomForm = () => {
    setShowCustomForm(false);
    setCustomTitle("");
    setCustomTeamKey("team_a");
    setCustomTeamName("TEAM A");
    setCustomMembers([]);
    setMemberInput("");
  };

  const createCustomSession = async () => {
    if (!customTitle.trim() || !customTeamName.trim() || customMembers.length === 0) return;
    setCreatingCustom(true);
    setReviewMessage(null);
    try {
      const res = await apiFetchAuth("/review/sessions/create-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: customTitle.trim(),
          team_key: customTeamKey.trim(),
          team_name: customTeamName.trim(),
          member_names: customMembers,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const notFoundMsg = data.not_found && data.not_found.length > 0
          ? ` (매칭 실패: ${data.not_found.join(", ")})`
          : "";
        setReviewMessage({ type: "success", text: `${customTeamName} 세션 생성 완료 — ${data.matched}명${notFoundMsg}` });
        resetCustomForm();
        fetchReviewSessions();
      } else {
        const notFoundMsg = data.not_found && data.not_found.length > 0
          ? ` — 매칭 실패: ${data.not_found.join(", ")}`
          : "";
        setReviewMessage({ type: "error", text: `${data.error || "세션 생성 실패"}${notFoundMsg}` });
      }
    } catch {
      setReviewMessage({ type: "error", text: "세션 생성에 실패했습니다." });
    } finally {
      setCreatingCustom(false);
    }
  };

  const deleteReviewSession = async (sessionId: string, label: string) => {
    if (!confirm(`"${label}" 세션을 삭제하시겠습니까?\n관련된 모든 리뷰 데이터도 함께 삭제됩니다.`)) return;
    try {
      const res = await apiFetchAuth(`/review/sessions/${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedReviewSession === sessionId) setSelectedReviewSession(null);
        if (expandedReviewTeam === sessionId) setExpandedReviewTeam(null);
        setReviewMessage({ type: "success", text: `"${label}" 세션이 삭제되었습니다.` });
        fetchReviewSessions();
      } else {
        const data = await res.json().catch(() => ({}));
        setReviewMessage({ type: "error", text: data.error || "삭제 실패" });
      }
    } catch {
      setReviewMessage({ type: "error", text: "삭제 중 오류가 발생했습니다." });
    }
  };

  const endReviewGroup = async (title: string) => {
    if (!confirm(`"${title}" 피어리뷰를 종료하시겠습니까? 모든 팀의 세션이 종료됩니다.`)) return;
    try {
      const sessionsToEnd = reviewSessions.filter((s) => s.title === title && s.active);
      await Promise.all(
        sessionsToEnd.map((s) =>
          apiFetchAuth(`/review/sessions/${s.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active: false }),
          })
        )
      );
      setReviewMessage({ type: "success", text: `"${title}" 피어리뷰가 종료되었습니다.` });
      fetchReviewSessions();
    } catch (err) {
      console.error(err);
      setReviewMessage({ type: "error", text: "종료에 실패했습니다." });
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

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("정말로 이 공지사항을 삭제하시겠습니까?")) return;
    try {
      const res = await apiFetchAuth(`/news/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotices(notices.filter((n) => n.id !== id));
      } else {
        alert("공지사항 삭제에 실패했습니다.");
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

  const handleEditNotice = (noticeItem: NoticeItem) => {
    setEditingId(noticeItem.id);
    setFormData({
      title: noticeItem.title,
      content: noticeItem.content,
      date: noticeItem.date,
      category: noticeItem.category,
      pinned: noticeItem.pinned || false,
    });
    setImagePreview(noticeItem.imageUrl || null);
    setActiveTab("notice");
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

  const handleUpdateNotice = async (e: React.FormEvent) => {
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
          category: formData.category, pinned: formData.pinned || false,
          ...(imageUrl && { imageUrl }),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotices(notices.map(n => n.id === editingId ? data.news : n));
        closeModal();
        alert("공지사항이 수정되었습니다!");
      } else {
        alert("공지사항 수정에 실패했습니다.");
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

  const filteredNotices = notices.filter((item) =>
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

  const handleAddNotice = async (e: React.FormEvent) => {
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
          category: formData.category, pinned: formData.pinned || false,
          ...(imageUrl && { imageUrl }),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotices([data.news, ...notices]);
        closeModal();
        alert("공지사항이 추가되었습니다!");
      } else {
        alert("공지사항 추가에 실패했습니다.");
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
        case "notice": return handleUpdateNotice;
        case "gallery": return handleUpdateGallery;
        case "activities": return handleUpdateActivity;
      }
    }
    switch (activeTab) {
      case "articles": return handleAddArticle;
      case "notice": return handleAddNotice;
      case "gallery": return handleAddGallery;
      case "activities": return handleAddActivity;
    }
  };

  const getModalTitle = () => {
    const action = editingId ? "수정" : "추가";
    switch (activeTab) {
      case "articles": return `아티클 ${action}`;
      case "notice": return `공지사항 ${action}`;
      case "gallery": return `갤러리 ${action}`;
      case "activities": return `액티비티 ${action}`;
    }
  };

  const getAddButtonLabel = () => {
    switch (activeTab) {
      case "articles": return "아티클 추가";
      case "notice": return "공지사항 추가";
      case "gallery": return "갤러리 추가";
      case "activities": return "액티비티 추가";
    }
  };

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case "articles": return "아티클 검색...";
      case "notice": return "공지사항 검색...";
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

            <div className="flex items-center gap-2">
              <Link
                to="/admin/applications"
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
              >
                <Users className="h-4 w-4" />
                지원서 검토
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </button>
            </div>
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
                <p className="text-xs text-muted-foreground">공지사항</p>
                <p className="text-xl font-bold">{notices.length}</p>
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
                { key: "notice" as TabType, icon: NewspaperIcon, label: "공지사항 관리" },
                { key: "gallery" as TabType, icon: ImageIcon, label: "갤러리 관리" },
                { key: "activities" as TabType, icon: Calendar, label: "액티비티 관리" },
                { key: "review" as TabType, icon: ClipboardCheck, label: "피어리뷰 관리" },
                { key: "recruit" as TabType, icon: UserPlus, label: "리크루팅 설정" },
              ]).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === "review" && !reviewUnlocked) {
                      setActiveTab(key);
                      setSearchQuery("");
                      return;
                    }
                    setActiveTab(key);
                    setSearchQuery("");
                    if (key === "review") fetchReviewSessions();
                  }}
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

        {/* Search and Add (hidden for review/recruit tabs) */}
        {activeTab !== "review" && activeTab !== "recruit" && (
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

        {activeTab === "notice" && (
          <div className="space-y-4">
            {filteredNotices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">공지사항이 없습니다</div>
            ) : (
              filteredNotices.map((item) => (
                <NoticeCardAdmin key={item.id} notice={item} onDelete={handleDeleteNotice} onEdit={handleEditNotice} />
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

        {/* Review Management Tab - PIN Gate */}
        {activeTab === "review" && !reviewUnlocked && (
          <div className="flex items-center justify-center py-20">
            <div className="w-full max-w-sm text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">피어리뷰 접근 제한</h2>

              <p className="text-sm text-muted-foreground mb-6">
                {reviewHasPin === false
                  ? "PIN이 아직 설정되지 않았습니다. 최초 PIN을 설정하세요."
                  : "최고 관리자만 접근할 수 있습니다. PIN을 입력하세요."}
              </p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setReviewPinError("");

                if (reviewHasPin === false) {
                  // PIN 설정 모드
                  if (reviewPin.length < 4) { setReviewPinError("PIN은 4자리 이상이어야 합니다."); return; }
                  if (reviewPin !== newPinConfirm) { setReviewPinError("PIN이 일치하지 않습니다."); return; }
                  try {
                    const res = await apiFetchAuth("/review-pin", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ pin: reviewPin }),
                    });
                    if (res.ok) {
                      setReviewUnlocked(true);
                      setReviewPin("");
                      setNewPinConfirm("");
                      setReviewHasPin(true);
                      fetchReviewSessions();
                      alert("PIN이 설정되었습니다!");
                    } else { setReviewPinError("PIN 설정에 실패했습니다."); }
                  } catch { setReviewPinError("PIN 설정에 실패했습니다."); }
                } else {
                  // PIN 확인 모드
                  try {
                    const res = await apiFetchAuth("/review-pin/verify", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ pin: reviewPin }),
                    });
                    const data = await res.json();
                    if (data.valid) {
                      setReviewUnlocked(true);
                      setReviewPin("");
                      fetchReviewSessions();
                    } else {
                      setReviewPinError("PIN이 올바르지 않습니다.");
                    }
                  } catch { setReviewPinError("인증에 실패했습니다."); }
                }
              }} className="space-y-3">
                <input type="password" value={reviewPin} onChange={(e) => setReviewPin(e.target.value)}
                  placeholder={reviewHasPin === false ? "새 PIN (4자리 이상)" : "PIN 입력"}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" autoFocus />
                {reviewHasPin === false && (
                  <input type="password" value={newPinConfirm} onChange={(e) => setNewPinConfirm(e.target.value)} placeholder="PIN 확인"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                )}
                {reviewPinError && <p className="text-sm text-destructive">{reviewPinError}</p>}
                <button type="submit" disabled={reviewHasPin === false ? (!reviewPin || !newPinConfirm) : !reviewPin}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {reviewHasPin === false ? "PIN 설정" : "확인"}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "review" && reviewUnlocked && (
          <div className="space-y-6">
            {/* Header with create button */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">피어리뷰 세션</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPinChange(!showPinChange)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  PIN 변경
                </button>
                {!showStartForm && !showCustomForm && (
                  <>
                    <button
                      onClick={() => setShowCustomForm(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-lg font-medium hover:bg-accent transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      프로젝트 팀 세션
                    </button>
                    <button
                      onClick={() => setShowStartForm(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" />
                      새 피어리뷰 생성
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* PIN Change Form */}
            {showPinChange && (
              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-sm">PIN 변경</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (newPin.length < 4) { alert("PIN은 4자리 이상이어야 합니다."); return; }
                  if (newPin !== newPinConfirm) { alert("PIN이 일치하지 않습니다."); return; }
                  try {
                    const res = await apiFetchAuth("/review-pin", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ pin: newPin }),
                    });
                    if (res.ok) {
                      alert("PIN이 변경되었습니다!");
                      setNewPin("");
                      setNewPinConfirm("");
                      setShowPinChange(false);
                    }
                  } catch { alert("PIN 변경에 실패했습니다."); }
                }} className="flex gap-2">
                  <input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="새 PIN (4자리 이상)"
                    className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  <input type="password" value={newPinConfirm} onChange={(e) => setNewPinConfirm(e.target.value)} placeholder="PIN 확인"
                    className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  <button type="submit" disabled={!newPin || !newPinConfirm}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">변경</button>
                  <button type="button" onClick={() => { setShowPinChange(false); setNewPin(""); setNewPinConfirm(""); }}
                    className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors">취소</button>
                </form>
              </div>
            )}

            {/* Start form (inline) */}
            {showStartForm && (
              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-sm">새 피어리뷰 세션 시작 (부서별 일괄)</h3>
                <p className="text-xs text-muted-foreground">디스코드 역할 기반으로 모든 부서팀 세션이 일괄 생성됩니다.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newReviewTitle}
                    onChange={(e) => setNewReviewTitle(e.target.value)}
                    placeholder="세션 제목 (예: 4월 피어리뷰)"
                    className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    disabled={startingReview}
                    onKeyDown={(e) => { if (e.key === "Enter") startAllReviewSessions(); }}
                    autoFocus
                  />
                  <button
                    onClick={startAllReviewSessions}
                    disabled={startingReview || !newReviewTitle.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {startingReview ? "생성 중..." : "생성"}
                  </button>
                  <button
                    onClick={() => { setShowStartForm(false); setNewReviewTitle(""); }}
                    className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {/* Custom (project-team) form */}
            {showCustomForm && (
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">프로젝트 팀 세션 만들기</h3>
                  <button
                    onClick={resetCustomForm}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    title="닫기"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  프리셋을 선택하거나 멤버를 자유롭게 추가/제거할 수 있습니다. 입력한 이름은 디스코드 닉네임과 매칭됩니다.
                </p>

                <div className="flex flex-wrap gap-2">
                  {PROJECT_TEAM_PRESETS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => applyPreset(p.key)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        customTeamKey === p.key
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setCustomTeamKey("custom");
                      setCustomTeamName("");
                      setCustomMembers([]);
                    }}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      customTeamKey === "custom"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    직접 입력
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">세션 제목</label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="예: 4월 프로젝트 피어리뷰"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      disabled={creatingCustom}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">팀 이름</label>
                    <input
                      type="text"
                      value={customTeamName}
                      onChange={(e) => setCustomTeamName(e.target.value)}
                      placeholder="예: TEAM A"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      disabled={creatingCustom}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-2">
                    멤버 ({customMembers.length}명)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
                    {customMembers.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic py-1">멤버를 추가하세요</span>
                    ) : (
                      customMembers.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent text-sm rounded-full"
                        >
                          {name}
                          <button
                            onClick={() => removeMember(name)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            disabled={creatingCustom}
                            title="제거"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={memberInput}
                      onChange={(e) => setMemberInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addMember();
                        }
                      }}
                      placeholder="멤버 이름 (Enter로 추가)"
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      disabled={creatingCustom}
                    />
                    <button
                      onClick={addMember}
                      disabled={creatingCustom || !memberInput.trim()}
                      className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> 추가
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    onClick={resetCustomForm}
                    disabled={creatingCustom}
                    className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={createCustomSession}
                    disabled={
                      creatingCustom ||
                      !customTitle.trim() ||
                      !customTeamName.trim() ||
                      customMembers.length === 0
                    }
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {creatingCustom ? "생성 중..." : "세션 생성"}
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

            {/* Grouped Session List */}
            {reviewSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">리뷰 세션이 없습니다.</div>
            ) : (
              (() => {
                // Group sessions by title
                const groups: Record<string, { title: string; active: boolean; started_at: string; sessions: any[] }> = {};
                reviewSessions.forEach((sess) => {
                  const key = sess.title;
                  if (!groups[key]) {
                    groups[key] = { title: sess.title, active: sess.active, started_at: sess.started_at, sessions: [] };
                  }
                  groups[key].sessions.push(sess);
                  if (sess.active) groups[key].active = true;
                });

                return Object.entries(groups).map(([key, group]) => (
                  <div key={key} className="bg-card border border-border rounded-xl overflow-hidden">
                    {/* Group header */}
                    <div className="p-5 flex items-center justify-between">
                      <button
                        onClick={() => setExpandedReviewGroup(expandedReviewGroup === key ? null : key)}
                        className="flex items-center gap-3 hover:opacity-70 transition-opacity"
                      >
                        <svg className={`w-5 h-5 text-muted-foreground transition-transform ${expandedReviewGroup === key ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        <h3 className="font-semibold text-lg">{group.title}</h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          group.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                        }`}>
                          {group.active ? "진행 중" : "종료"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {group.sessions.length}개 팀
                        </span>
                      </button>
                      {group.active && (
                        <button
                          onClick={() => endReviewGroup(group.title)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-destructive/30 text-destructive bg-destructive/5 rounded-lg hover:bg-destructive/10 transition-colors"
                        >
                          <StopCircle className="w-3.5 h-3.5" />
                          피어리뷰 종료
                        </button>
                      )}
                    </div>

                    {/* Expanded team list */}
                    {expandedReviewGroup === key && (
                      <div className="border-t border-border">
                        {group.sessions.map((sess) => (
                          <div key={sess.id} className="border-b border-border/50 last:border-0">
                            {/* Team header */}
                            <button
                              onClick={() => {
                                if (expandedReviewTeam === sess.id) {
                                  setExpandedReviewTeam(null);
                                } else {
                                  setExpandedReviewTeam(sess.id);
                                  fetchReviewStatus(sess.id);
                                }
                              }}
                              className="w-full px-5 py-4 flex items-center justify-between hover:bg-accent/20 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-medium">{sess.team_name}</span>
                                <span className="text-sm text-muted-foreground">{sess.members?.length || 0}명</span>
                              </div>
                              <svg className={`w-4 h-4 text-muted-foreground transition-transform ${expandedReviewTeam === sess.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {/* Team detail */}
                            {expandedReviewTeam === sess.id && (
                              <div className="px-5 pb-5 space-y-4">
                                {/* Action buttons */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={() => sendReviewReminder(sess.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                  >
                                    <Bell className="w-3.5 h-3.5" />
                                    리마인드 발송
                                  </button>
                                  <button
                                    onClick={() => exportReviewCsv(sess.id, "common")}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    공통 리뷰 CSV
                                  </button>
                                  <button
                                    onClick={() => exportReviewCsv(sess.id, "leader")}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-amber-200 text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    리더 평가 CSV
                                  </button>
                                  <button
                                    onClick={() => deleteReviewSession(sess.id, `${sess.title} — ${sess.team_name}`)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-destructive/30 text-destructive bg-destructive/5 rounded-lg hover:bg-destructive/10 transition-colors ml-auto"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    세션 삭제
                                  </button>
                                  {/* 세션 종료는 그룹 레벨에서 처리 */}
                                </div>

                                {/* Status table */}
                                {reviewStatusLoading && selectedReviewSession === sess.id ? (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" /> 불러오는 중...
                                  </div>
                                ) : selectedReviewSession === sess.id && (
                                  <div className="overflow-x-auto border border-border rounded-lg">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                                          <th className="text-left font-medium px-4 py-2.5 min-w-[200px]">이름</th>
                                          <th className="text-center font-medium px-4 py-2.5 min-w-[100px]">공통 리뷰</th>
                                          <th className="text-center font-medium px-4 py-2.5 min-w-[100px]">리더 평가</th>
                                          <th className="text-center font-medium px-4 py-2.5 min-w-[80px]">상태</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {reviewStatusData.map((member: any) => (
                                          <tr key={member.discord_id} className="border-b border-border/50 last:border-0">
                                            <td className="px-4 py-2.5">
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium">{member.display_name}</span>
                                                {member.is_leader && (
                                                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">Leader</span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="text-center px-4 py-2.5">
                                              <span className={member.common_done >= member.common_total ? "text-green-600 font-medium" : "text-muted-foreground"}>
                                                {member.common_done}/{member.common_total}
                                              </span>
                                            </td>
                                            <td className="text-center px-4 py-2.5">
                                              <span className={member.leader_done >= member.leader_total ? "text-green-600 font-medium" : "text-muted-foreground"}>
                                                {member.leader_done}/{member.leader_total}
                                              </span>
                                            </td>
                                            <td className="text-center px-4 py-2.5">
                                              {member.complete ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                  <Check className="w-3 h-3" /> 완료
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full">
                                                  <X className="w-3 h-3" /> 미완료
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ));
              })()
            )}
          </div>
        )}

        {activeTab === "recruit" && <AdminRecruitTab />}
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

              {/* Notice Form */}
              {activeTab === "notice" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">제목 *</label>
                    <input type="text" required value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="공지사항 제목" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">내용 *</label>
                    <textarea required value={formData.content || ""} onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" rows={6} placeholder="공지사항 내용" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">카테고리 *</label>
                    <div className="flex gap-2">
                      <select
                        value={["일반", "모집", "행사", "프로젝트", "긴급"].includes(formData.category || "") ? formData.category : "__custom__"}
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
                        <option value="일반">일반</option>
                        <option value="모집">모집</option>
                        <option value="행사">행사</option>
                        <option value="프로젝트">프로젝트</option>
                        <option value="긴급">긴급</option>
                        <option value="__custom__">직접 입력</option>
                      </select>
                      {(!formData.category || !["일반", "모집", "행사", "프로젝트", "긴급"].includes(formData.category)) && (
                        <input type="text" required value={formData.category === "__custom__" ? "" : formData.category || ""}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          placeholder="카테고리 직접 입력"
                          className="w-1/2 px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formData.pinned || false} onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                        className="sr-only peer" />
                      <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <span className="text-sm font-medium">상단 고정</span>
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

function NoticeCardAdmin({ notice, onDelete, onEdit }: { notice: NoticeItem, onDelete: (id: string) => void, onEdit: (notice: NoticeItem) => void }) {
  return (
    <div className={`p-6 bg-card border border-border rounded-xl hover:shadow-md transition-all ${notice.pinned ? "border-primary/30 bg-primary/[0.02]" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {notice.pinned && <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded font-bold">고정</span>}
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full">{notice.category}</span>
            <span className="text-sm text-muted-foreground">{notice.date}</span>
          </div>
          <h3 className="text-lg font-medium mb-2">{notice.title}</h3>
          <p className="text-sm text-muted-foreground">{notice.content}</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors" onClick={() => onEdit(notice)}><Edit2 className="h-4 w-4" /></button>
          <button className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors" onClick={() => onDelete(notice.id)}><Trash2 className="h-4 w-4" /></button>
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
