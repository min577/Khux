import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.ts";
const app = new Hono();

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Initialize default admin account on startup
async function initializeDefaultAdmin() {
  try {
    const defaultEmail = 'admin@khux.com';
    const defaultPassword = 'admin';
    
    // Check if admin user already exists
    const { data: users } = await supabase.auth.admin.listUsers();
    const adminExists = users?.users?.some(user => user.email === defaultEmail);
    
    if (!adminExists) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: defaultEmail,
        password: defaultPassword,
        user_metadata: { name: 'KHUX Admin', role: 'admin' },
        email_confirm: true
      });
      
      if (error) {
        console.log(`Failed to create default admin: ${error.message}`);
      } else {
        console.log('✅ Default admin account created: admin@khux.com / admin');
      }
    } else {
      console.log('ℹ️ Default admin account already exists');
    }
  } catch (error) {
    console.log(`Error initializing default admin: ${error}`);
  }
}

// Initialize admin account
initializeDefaultAdmin();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "x-user-token", "x-review-token", "x-bot-key"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-d0140d55/health", (c) => {
  return c.json({ status: "ok" });
});

// ============ Admin Authentication ============

// Admin signup endpoint
app.post("/make-server-d0140d55/admin/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'admin' },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Error creating admin user during signup: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Unexpected error during admin signup: ${error}`);
    return c.json({ error: "Failed to create admin user" }, 500);
  }
});

// ============ Articles CRUD ============

// Get all articles
app.get("/make-server-d0140d55/articles", async (c) => {
  try {
    const articles = await kv.getByPrefix("article:");
    return c.json({ articles: articles || [] });
  } catch (error) {
    console.log(`Error fetching articles: ${error}`);
    return c.json({ error: "Failed to fetch articles" }, 500);
  }
});

// Get single article by ID
app.get("/make-server-d0140d55/articles/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const article = await kv.get(`article:${id}`);
    
    if (!article) {
      return c.json({ error: "Article not found" }, 404);
    }
    
    return c.json({ article });
  } catch (error) {
    console.log(`Error fetching article: ${error}`);
    return c.json({ error: "Failed to fetch article" }, 500);
  }
});

// Create new article (protected)
app.post("/make-server-d0140d55/articles", async (c) => {
  try {
    const accessToken = c.req.header('x-user-token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: "Unauthorized - Invalid or missing access token" }, 401);
    }

    const articleData = await c.req.json();
    const id = crypto.randomUUID();
    const article = {
      id,
      ...articleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`article:${id}`, article);
    return c.json({ article }, 201);
  } catch (error) {
    console.log(`Error creating article: ${error}`);
    return c.json({ error: "Failed to create article" }, 500);
  }
});

// Update article (protected)
app.put("/make-server-d0140d55/articles/:id", async (c) => {
  try {
    const accessToken = c.req.header('x-user-token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: "Unauthorized - Invalid or missing access token" }, 401);
    }

    const id = c.req.param("id");
    const existingArticle = await kv.get(`article:${id}`);
    
    if (!existingArticle) {
      return c.json({ error: "Article not found" }, 404);
    }

    const updates = await c.req.json();
    const updatedArticle = {
      ...existingArticle,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`article:${id}`, updatedArticle);
    return c.json({ article: updatedArticle });
  } catch (error) {
    console.log(`Error updating article ${c.req.param("id")}: ${error}`);
    return c.json({ error: "Failed to update article" }, 500);
  }
});

// Delete article (protected)
app.delete("/make-server-d0140d55/articles/:id", async (c) => {
  try {
    const accessToken = c.req.header('x-user-token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: "Unauthorized - Invalid or missing access token" }, 401);
    }

    const id = c.req.param("id");
    await kv.del(`article:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting article ${c.req.param("id")}: ${error}`);
    return c.json({ error: "Failed to delete article" }, 500);
  }
});

// ============ News CRUD ============

// Get all news
app.get("/make-server-d0140d55/news", async (c) => {
  try {
    const news = await kv.getByPrefix("news:");
    return c.json({ news: news || [] });
  } catch (error) {
    console.log(`Error fetching news: ${error}`);
    return c.json({ error: "Failed to fetch news" }, 500);
  }
});

// Get single news item by ID
app.get("/make-server-d0140d55/news/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const newsItem = await kv.get(`news:${id}`);
    
    if (!newsItem) {
      return c.json({ error: "News not found" }, 404);
    }
    
    return c.json({ news: newsItem });
  } catch (error) {
    console.log(`Error fetching news item: ${error}`);
    return c.json({ error: "Failed to fetch news" }, 500);
  }
});

// Create new news (protected)
app.post("/make-server-d0140d55/news", async (c) => {
  try {
    const accessToken = c.req.header('x-user-token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: "Unauthorized - Invalid or missing access token" }, 401);
    }

    const newsData = await c.req.json();
    const id = crypto.randomUUID();
    const newsItem = {
      id,
      ...newsData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`news:${id}`, newsItem);
    return c.json({ news: newsItem }, 201);
  } catch (error) {
    console.log(`Error creating news: ${error}`);
    return c.json({ error: "Failed to create news" }, 500);
  }
});

// Update news (protected)
app.put("/make-server-d0140d55/news/:id", async (c) => {
  try {
    const accessToken = c.req.header('x-user-token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: "Unauthorized - Invalid or missing access token" }, 401);
    }

    const id = c.req.param("id");
    const existingNews = await kv.get(`news:${id}`);
    
    if (!existingNews) {
      return c.json({ error: "News not found" }, 404);
    }

    const updates = await c.req.json();
    const updatedNews = {
      ...existingNews,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`news:${id}`, updatedNews);
    return c.json({ news: updatedNews });
  } catch (error) {
    console.log(`Error updating news ${c.req.param("id")}: ${error}`);
    return c.json({ error: "Failed to update news" }, 500);
  }
});

// Delete news (protected)
app.delete("/make-server-d0140d55/news/:id", async (c) => {
  try {
    const accessToken = c.req.header('x-user-token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      return c.json({ error: "Unauthorized - Invalid or missing access token" }, 401);
    }

    const id = c.req.param("id");
    await kv.del(`news:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting news ${c.req.param("id")}: ${error}`);
    return c.json({ error: "Failed to delete news" }, 500);
  }
});

// ============ Gallery CRUD ============

// Get all gallery items
app.get("/make-server-d0140d55/gallery", async (c) => {
  try {
    const items = await kv.getByPrefix("gallery:");
    return c.json({ gallery: items || [] });
  } catch (error) {
    console.log(`Error fetching gallery: ${error}`);
    return c.json({ error: "Failed to fetch gallery" }, 500);
  }
});

// Get single gallery item
app.get("/make-server-d0140d55/gallery/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const item = await kv.get(`gallery:${id}`);
    if (!item) return c.json({ error: "Gallery item not found" }, 404);
    return c.json({ gallery: item });
  } catch (error) {
    console.log(`Error fetching gallery item: ${error}`);
    return c.json({ error: "Failed to fetch gallery item" }, 500);
  }
});

// Create gallery item (protected)
app.post("/make-server-d0140d55/gallery", async (c) => {
  try {
    const accessToken = c.req.header('x-user-token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) return c.json({ error: "Unauthorized" }, 401);

    const data = await c.req.json();
    const id = crypto.randomUUID();
    const item = { id, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await kv.set(`gallery:${id}`, item);
    return c.json({ gallery: item }, 201);
  } catch (error) {
    console.log(`Error creating gallery item: ${error}`);
    return c.json({ error: "Failed to create gallery item" }, 500);
  }
});

// Update gallery item (protected)
app.put("/make-server-d0140d55/gallery/:id", async (c) => {
  try {
    const accessToken = c.req.header('x-user-token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    const existing = await kv.get(`gallery:${id}`);
    if (!existing) return c.json({ error: "Gallery item not found" }, 404);

    const updates = await c.req.json();
    const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await kv.set(`gallery:${id}`, updated);
    return c.json({ gallery: updated });
  } catch (error) {
    console.log(`Error updating gallery item: ${error}`);
    return c.json({ error: "Failed to update gallery item" }, 500);
  }
});

// Delete gallery item (protected)
app.delete("/make-server-d0140d55/gallery/:id", async (c) => {
  try {
    const accessToken = c.req.header('x-user-token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    await kv.del(`gallery:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting gallery item: ${error}`);
    return c.json({ error: "Failed to delete gallery item" }, 500);
  }
});

// ============ Activities CRUD ============

// Get all activities
app.get("/make-server-d0140d55/activities", async (c) => {
  try {
    const items = await kv.getByPrefix("activity:");
    return c.json({ activities: items || [] });
  } catch (error) {
    console.log(`Error fetching activities: ${error}`);
    return c.json({ error: "Failed to fetch activities" }, 500);
  }
});

// Get single activity
app.get("/make-server-d0140d55/activities/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const item = await kv.get(`activity:${id}`);
    if (!item) return c.json({ error: "Activity not found" }, 404);
    return c.json({ activity: item });
  } catch (error) {
    console.log(`Error fetching activity: ${error}`);
    return c.json({ error: "Failed to fetch activity" }, 500);
  }
});

// Create activity (protected)
app.post("/make-server-d0140d55/activities", async (c) => {
  try {
    const accessToken = c.req.header('x-user-token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) return c.json({ error: "Unauthorized" }, 401);

    const data = await c.req.json();
    const id = crypto.randomUUID();
    const item = { id, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await kv.set(`activity:${id}`, item);
    return c.json({ activity: item }, 201);
  } catch (error) {
    console.log(`Error creating activity: ${error}`);
    return c.json({ error: "Failed to create activity" }, 500);
  }
});

// Update activity (protected)
app.put("/make-server-d0140d55/activities/:id", async (c) => {
  try {
    const accessToken = c.req.header('x-user-token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    const existing = await kv.get(`activity:${id}`);
    if (!existing) return c.json({ error: "Activity not found" }, 404);

    const updates = await c.req.json();
    const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await kv.set(`activity:${id}`, updated);
    return c.json({ activity: updated });
  } catch (error) {
    console.log(`Error updating activity: ${error}`);
    return c.json({ error: "Failed to update activity" }, 500);
  }
});

// Delete activity (protected)
app.delete("/make-server-d0140d55/activities/:id", async (c) => {
  try {
    const accessToken = c.req.header('x-user-token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    await kv.del(`activity:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting activity: ${error}`);
    return c.json({ error: "Failed to delete activity" }, 500);
  }
});

// ============ Image Upload ============

// Upload image to Supabase Storage (protected)
app.post("/make-server-d0140d55/upload-image", async (c) => {
  try {
    const accessToken = c.req.header('x-user-token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) return c.json({ error: "Unauthorized" }, 401);

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    if (!file) return c.json({ error: "No file provided" }, 400);

    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'images');
    if (!bucketExists) {
      await supabase.storage.createBucket('images', { public: true });
    }

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.log(`Upload error: ${uploadError.message}`);
      return c.json({ error: uploadError.message }, 500);
    }

    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return c.json({ url: urlData.publicUrl });
  } catch (error) {
    console.log(`Error uploading image: ${error}`);
    return c.json({ error: "Failed to upload image" }, 500);
  }
});

// Proxy-upload: fetch external image URL and upload to storage (protected)
app.post("/make-server-d0140d55/proxy-upload-image", async (c) => {
  try {
    const accessToken = c.req.header('x-user-token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) return c.json({ error: "Unauthorized" }, 401);

    const { url } = await c.req.json();
    if (!url) return c.json({ error: "No URL provided" }, 400);

    // Fetch the image from external URL
    const imgRes = await fetch(url);
    if (!imgRes.ok) return c.json({ error: "Failed to fetch image" }, 400);

    const contentType = imgRes.headers.get('content-type') || 'image/png';
    const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg'
      : contentType.includes('gif') ? 'gif'
      : contentType.includes('webp') ? 'webp'
      : 'png';

    const arrayBuffer = await imgRes.arrayBuffer();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `uploads/${fileName}`;

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'images');
    if (!bucketExists) {
      await supabase.storage.createBucket('images', { public: true });
    }

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, arrayBuffer, { contentType, upsert: false });

    if (uploadError) return c.json({ error: uploadError.message }, 500);

    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return c.json({ url: urlData.publicUrl });
  } catch (error) {
    console.log(`Error proxy uploading image: ${error}`);
    return c.json({ error: "Failed to proxy upload image" }, 500);
  }
});

// ============ Applications CRUD ============

// Get all applications (protected - admin only)
app.get("/make-server-d0140d55/applications", async (c) => {
  try {
    const accessToken = c.req.header('x-user-token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) return c.json({ error: "Unauthorized" }, 401);

    const items = await kv.getByPrefix("application:");
    return c.json({ applications: items || [] });
  } catch (error) {
    console.log(`Error fetching applications: ${error}`);
    return c.json({ error: "Failed to fetch applications" }, 500);
  }
});

// Submit application (public)
app.post("/make-server-d0140d55/applications", async (c) => {
  try {
    const data = await c.req.json();

    if (!data.name || !data.studentId || !data.major || !data.phone || !data.email || !data.team || !data.motivation) {
      return c.json({ error: "Required fields are missing" }, 400);
    }

    const id = crypto.randomUUID();
    const application = {
      id,
      ...data,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };

    await kv.set(`application:${id}`, application);
    return c.json({ application: { id, status: "pending" } }, 201);
  } catch (error) {
    console.log(`Error submitting application: ${error}`);
    return c.json({ error: "Failed to submit application" }, 500);
  }
});

// Update application status (protected - admin only)
app.put("/make-server-d0140d55/applications/:id", async (c) => {
  try {
    const accessToken = c.req.header('x-user-token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    const existing = await kv.get(`application:${id}`);
    if (!existing) return c.json({ error: "Application not found" }, 404);

    const updates = await c.req.json();
    const updated = { ...existing, ...updates, id };
    await kv.set(`application:${id}`, updated);
    return c.json({ application: updated });
  } catch (error) {
    console.log(`Error updating application: ${error}`);
    return c.json({ error: "Failed to update application" }, 500);
  }
});

// Delete application (protected - admin only)
app.delete("/make-server-d0140d55/applications/:id", async (c) => {
  try {
    const accessToken = c.req.header('x-user-token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    await kv.del(`application:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting application: ${error}`);
    return c.json({ error: "Failed to delete application" }, 500);
  }
});

// ============ Initialize Sample Data ============
// This endpoint populates the database with sample data (one-time use)
app.post("/make-server-d0140d55/init-sample-data", async (c) => {
  try {
    // Sample articles
    const sampleArticles = [
      {
        id: "1",
        title: "UX 디자인의 미래: AI와 함께하는 사용자 경험",
        excerpt: "인공지능 기술이 UX 디자인 분야에 어떤 혁신을 가져올 수 있는지 살펴봅니다.",
        content: `인공지능 기술의 발전으로 UX 디자인 분야는 새로운 전환점을 맞이하고 있습니다. AI는 사용자의 행동 패턴을 분석하고, 개인화된 경험을 제공하며, 디자이너의 작업 효율성을 높이는 데 크게 기여하고 있습니다.\n\n특히 생성형 AI는 프로토타이핑 과정을 혁신하고 있으며, 머신러닝을 활용한 사용자 분석은 더욱 정교한 인사이트를 제공합니다. 하지만 동시에 우리는 기술과 인간 중심 디자인의 균형을 어떻게 맞출 것인가에 대한 고민도 필요합니다.\n\n본 아티클에서는 AI 시대의 UX 디자이너가 갖춰야 할 역량과 미래 전망에 대해 심도 있게 다룹니다.`,
        author: "김지원",
        team: "Education",
        date: "2026-02-20",
        imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
        tags: ["AI", "UX Design", "Future"],
      },
      {
        id: "2",
        title: "모바일 앱 디자인 트렌드 2026",
        excerpt: "2026년 주목해야 할 모바일 앱 디자인 트렌드를 분석합니다.",
        content: `2026년 모바일 앱 디자인 트렌드는 미니멀리즘과 개인화의 조화를 추구합니다. 사용자들은 더욱 직관적이고 간결한 인터페이스를 원하며, 동시에 자신만의 경험을 원합니다.\n\n다크 모드의 진화, 마이크로 인터랙션의 정교화, 그리고 접근성을 고려한 디자인이 핵심 키워드입니다. 또한 제스처 기반 내비게이션과 음성 인터페이스의 통합이 더욱 중요해지고 있습니다.\n\n본 아티클에서는 실제 사례와 함께 이러한 트렌드를 어떻게 적용할 수 있는지 구체적으로 살펴봅니다.`,
        author: "박서연",
        team: "Brand",
        date: "2026-02-15",
        imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800",
        tags: ["Mobile", "Design Trends", "UI"],
      },
      {
        id: "3",
        title: "사용자 리서치 방법론: 인터뷰부터 데이터 분석까지",
        excerpt: "효과적인 사용자 리서치를 위한 다양한 방법론을 소개합니다.",
        content: `사용자 리서치는 성공적인 제품 디자인의 핵심입니다. 이 글에서는 정성적 연구와 정량적 연구 방법을 모두 다루며, 각 상황에 맞는 적절한 리서치 방법을 선택하는 방법을 알아봅니다.\n\n심층 인터뷰, 설문조사, A/B 테스팅, 사용성 테스트 등 다양한 방법론의 장단점을 비교하고, 실제 프로젝트에서 어떻게 활용할 수 있는지 사례를 통해 설명합니다.\n\n또한 리서치 데이터를 효과적으로 분석하고 인사이트를 도출하는 프로세스도 함께 다룹니다.`,
        author: "이준호",
        team: "Education",
        date: "2026-02-10",
        imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
        tags: ["Research", "UX", "Methodology"],
      },
      {
        id: "4",
        title: "디자인 시스템 구축 가이드",
        excerpt: "확장 가능하고 일관성 있는 디자인 시스템을 만드는 방법을 알아봅니다.",
        content: `디자인 시스템은 제품의 일관성을 유지하고 팀의 협업 효율성을 높이는 핵심 도구입니다. 이 아티클에서는 디자인 시스템을 처음부터 구축하는 전체 과정을 다룹니다.\n\n컬러 팔레트, 타이포그래피, 컴포넌트 라이브러리 구성부터 문서화와 유지보수까지, 실무에서 바로 적용할 수 있는 구체적인 가이드를 제공합니다.\n\n또한 Figma와 같은 도구를 활용한 효율적인 디자인 시스템 관리 방법도 함께 소개합니다.`,
        author: "최민지",
        team: "Brand",
        date: "2026-02-05",
        imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
        tags: ["Design System", "Branding", "Tools"],
      },
    ];

    // Sample news
    const sampleNews = [
      {
        id: "1",
        title: "KHUX 4기 리크루팅 시작!",
        content: "2026년 상반기 KHUX 4기 멤버를 모집합니다. Operation, Education, Brand, PR 팀에서 함께할 열정적인 분들을 기다립니다. 지원 기간은 3월 1일부터 3월 15일까지입니다.",
        date: "2026-02-22",
        category: "Recruitment",
      },
      {
        id: "2",
        title: "KHUX X 테크 기업 협업 프로젝트 진행",
        content: "KHUX가 국내 유명 테크 기업과 함께 UX 개선 프로젝트를 진행합니다. 학회 멤버들이 실제 서비스의 사용자 경험을 분석하고 개선안을 제안하는 귀중한 기회가 될 것입니다.",
        date: "2026-02-18",
        category: "Project",
      },
      {
        id: "3",
        title: "2월 정기 세미나 개최 안내",
        content: "이번 달 정기 세미나는 '사용자 중심 디자인 사고'를 주제로 진행됩니다. 현직 UX 디자이너를 초청하여 실무 경험을 공유하는 시간을 가질 예정입니다. 2월 28일 오후 7시, 경희대학교 학생회관에서 진행됩니다.",
        date: "2026-02-15",
        category: "Event",
      },
      {
        id: "4",
        title: "KHUX 블로그 리뉴얼 완료",
        content: "더 나은 사용자 경험을 제공하기 위해 KHUX 공식 블로그를 전면 리뉴얼했습니다. 새로운 디자인과 개선된 내비게이션으로 학회 소식과 아티클을 더욱 편리하게 접할 수 있습니다.",
        date: "2026-02-10",
        category: "Announcement",
      },
      {
        id: "5",
        title: "3기 멤버 프로젝트 전시회 성황리 종료",
        content: "KHUX 3기 멤버들의 1년간의 프로젝트 결과물을 전시하는 행사가 성황리에 종료되었습니다. 많은 학생들이 방문하여 높은 관심을 보여주셨습니다. 프로젝트 결과물은 온라인에서도 확인하실 수 있습니다.",
        date: "2026-02-05",
        category: "Event",
      },
    ];

    // Sample gallery
    const sampleGallery = [
      { id: "1", title: "3기 OT & 팀빌딩", description: "KHUX 3기 오리엔테이션과 팀빌딩 현장입니다.", imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800", category: "행사", date: "2025-09-01" },
      { id: "2", title: "UX 리서치 워크숍", description: "사용자 인터뷰 실습과 어피니티 다이어그램 워크숍 진행", imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800", category: "워크숍", date: "2025-10-15" },
      { id: "3", title: "기업 연계 프로젝트 발표", description: "테크 기업과의 협업 프로젝트 최종 발표 현장", imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800", category: "프로젝트", date: "2025-12-10" },
      { id: "4", title: "디자인 시스템 스터디", description: "Figma를 활용한 디자인 시스템 구축 스터디", imageUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800", category: "스터디", date: "2025-11-20" },
      { id: "5", title: "3기 프로젝트 전시회", description: "한 학기 동안의 프로젝트 결과물 전시", imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800", category: "행사", date: "2026-01-15" },
      { id: "6", title: "네트워킹 데이", description: "현직 UX 디자이너와 함께한 네트워킹 행사", imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800", category: "행사", date: "2026-02-01" },
    ];

    // Sample activities
    const sampleActivities = [
      { id: "1", title: "정기 세미나", description: "매주 진행되는 UX/UI 관련 세미나", content: "매주 목요일 저녁, KHUX 멤버들이 모여 UX/UI 관련 주제에 대해 발표하고 토론합니다.", date: "2026-03-01", category: "세미나", imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800" },
      { id: "2", title: "UX 리서치 프로젝트", description: "실제 서비스를 대상으로 한 사용자 리서치", content: "팀별로 실제 서비스를 선정하여 사용자 리서치를 진행합니다.", date: "2026-02-15", category: "프로젝트", imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800" },
      { id: "3", title: "디자인 스프린트", description: "5일간의 집중 디자인 스프린트 프로그램", content: "Google Ventures의 디자인 스프린트 방법론을 기반으로 진행합니다.", date: "2026-01-20", category: "워크숍", imageUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800" },
      { id: "4", title: "포트폴리오 리뷰", description: "현직 디자이너와 함께하는 포트폴리오 피드백 세션", content: "현직 UX/UI 디자이너를 초청하여 멤버들의 포트폴리오를 리뷰합니다.", date: "2026-02-28", category: "네트워킹", imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800" },
    ];

    // Store articles
    for (const article of sampleArticles) {
      await kv.set(`article:${article.id}`, article);
    }

    // Store news
    for (const newsItem of sampleNews) {
      await kv.set(`news:${newsItem.id}`, newsItem);
    }

    // Store gallery
    for (const item of sampleGallery) {
      await kv.set(`gallery:${item.id}`, item);
    }

    // Store activities
    for (const item of sampleActivities) {
      await kv.set(`activity:${item.id}`, item);
    }

    return c.json({
      success: true,
      message: "Sample data initialized successfully",
      counts: {
        articles: sampleArticles.length,
        news: sampleNews.length,
        gallery: sampleGallery.length,
        activities: sampleActivities.length,
      }
    });
  } catch (error) {
    console.log(`Error initializing sample data: ${error}`);
    return c.json({ error: "Failed to initialize sample data" }, 500);
  }
});

// ============ Review System Configuration ============

const DISCORD_CLIENT_ID = "1487816060777533532";
const DISCORD_GUILD_ID = "1469604778496757783";
const DISCORD_REDIRECT_URI = "https://khux.vercel.app/auth/discord/callback";

const TEAM_ROLES: Record<string, { name: string; role_id: string }> = {
  operation: { name: "Operation", role_id: "1476978398890033212" },
  education: { name: "Education", role_id: "1476976964274356457" },
  growth_brand: { name: "Growth-Brand", role_id: "1476977815709552713" },
  growth_pr: { name: "Growth-PR", role_id: "1476977666073559204" },
};

const REVIEW_CRITERIA = [
  { name: "커뮤니케이션 참여도", desc: "팀 내 소통에 얼마나 적극적으로 참여했나요? (응답 속도, 의사 전달의 명확성, 논의 참여도 등)" },
  { name: "책임감 및 과업 수행도", desc: "맡은 역할을 책임감 있게 수행했나요? (마감 기한 준수, 작업 완성도, 성실성 등)" },
  { name: "팀 이해도 및 협업 기여도", desc: "팀 전체의 역할과 일정 흐름을 충분히 이해하고 있었나요? (디스코드/스레드 내용 숙지, 진행 상황 팔로우업 등)" },
];

const LEADER_CRITERIA = [
  { name: "리더십 및 팀 운영 능력", desc: "프로젝트를 체계적으로 이끌고 있었나요? (일정 관리, 역할 분배, 의사결정 등)" },
  { name: "커뮤니케이션 및 조율 능력", desc: "팀원 간 의견을 잘 조율하고 원활한 소통 환경을 만들었나요?" },
  { name: "문제 대응 및 방향성 제시", desc: "문제에 대해 적절히 대응하고, 팀의 방향성을 명확하게 제시했나요?" },
];

// Helper: verify Discord review session token
async function getReviewUser(token: string | undefined) {
  if (!token) return null;
  const session = await kv.get(`discord_session:${token}`);
  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    await kv.del(`discord_session:${token}`);
    return null;
  }
  return session;
}

// Helper: verify bot API key
function verifyBotKey(key: string | undefined): boolean {
  const botKey = Deno.env.get("BOT_API_KEY");
  return !!botKey && key === botKey;
}

// ============ Discord OAuth ============

// Exchange Discord OAuth code for session token
app.post("/make-server-d0140d55/discord/auth", async (c) => {
  try {
    const { code } = await c.req.json();
    if (!code) return c.json({ error: "Authorization code required" }, 400);

    const clientSecret = Deno.env.get("DISCORD_CLIENT_SECRET");
    if (!clientSecret) return c.json({ error: "Server configuration error" }, 500);

    // Exchange code for Discord access token
    const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.log(`Discord token exchange failed: ${JSON.stringify(tokenData)}`);
      return c.json({ error: "Discord authentication failed" }, 401);
    }

    // Get user info
    const userRes = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();
    if (!userRes.ok) return c.json({ error: "Failed to get Discord user info" }, 401);

    // Get guild member info (roles)
    const memberRes = await fetch(
      `https://discord.com/api/v10/users/@me/guilds/${DISCORD_GUILD_ID}/member`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const memberData = await memberRes.json();

    // Determine team from roles
    let team = "";
    let teamName = "";
    let isLeader = false;
    if (memberRes.ok && memberData.roles) {
      for (const [key, config] of Object.entries(TEAM_ROLES)) {
        if (memberData.roles.includes(config.role_id)) {
          team = key;
          teamName = config.name;
          break;
        }
      }
      // Check leader from nickname
      const nick = memberData.nick || userData.global_name || userData.username;
      isLeader = nick?.includes("Leader") ?? false;
    }

    const displayName = memberData.nick || userData.global_name || userData.username;

    // Create session token
    const sessionToken = crypto.randomUUID();
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    const sessionData = {
      discord_id: userData.id,
      display_name: displayName,
      avatar: userData.avatar
        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
        : null,
      team,
      team_name: teamName,
      is_leader: isLeader,
      expires_at: expires.toISOString(),
    };

    await kv.set(`discord_session:${sessionToken}`, sessionData);

    return c.json({ token: sessionToken, user: sessionData });
  } catch (error) {
    console.log(`Discord auth error: ${error}`);
    return c.json({ error: "Authentication failed" }, 500);
  }
});

// Get current review user
app.get("/make-server-d0140d55/discord/me", async (c) => {
  const user = await getReviewUser(c.req.header("x-review-token"));
  if (!user) return c.json({ error: "Not authenticated" }, 401);
  return c.json({ user });
});

// Logout
app.post("/make-server-d0140d55/discord/logout", async (c) => {
  const token = c.req.header("x-review-token");
  if (token) await kv.del(`discord_session:${token}`);
  return c.json({ success: true });
});

// ============ Review Sessions ============

// Create review session (admin or bot)
app.post("/make-server-d0140d55/review/sessions", async (c) => {
  try {
    // Allow both admin token and bot key
    const adminToken = c.req.header("x-user-token");
    const botKey = c.req.header("x-bot-key");

    let authorized = false;
    if (adminToken) {
      const { data: { user } } = await supabase.auth.getUser(adminToken);
      if (user) authorized = true;
    }
    if (!authorized && verifyBotKey(botKey)) authorized = true;
    if (!authorized) return c.json({ error: "Unauthorized" }, 401);

    const { title, team, team_name, members } = await c.req.json();
    if (!title || !team || !members) return c.json({ error: "title, team, members required" }, 400);

    const now = new Date();
    const month = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const sessionId = `${team}_${month}`;

    const sessionData = {
      id: sessionId,
      title,
      team,
      team_name: team_name || TEAM_ROLES[team]?.name || team,
      started_at: now.toISOString(),
      active: true,
      members, // [{discord_id, display_name, is_leader}]
      criteria: REVIEW_CRITERIA,
      leader_criteria: LEADER_CRITERIA,
    };

    await kv.set(`review_session:${sessionId}`, sessionData);
    return c.json({ session: sessionData }, 201);
  } catch (error) {
    console.log(`Error creating review session: ${error}`);
    return c.json({ error: "Failed to create session" }, 500);
  }
});

// List review sessions
app.get("/make-server-d0140d55/review/sessions", async (c) => {
  try {
    const sessions = await kv.getByPrefix("review_session:");
    const active = c.req.query("active");
    const filtered = active === "true" ? sessions.filter((s: any) => s.active) : sessions;
    return c.json({ sessions: filtered });
  } catch (error) {
    console.log(`Error listing sessions: ${error}`);
    return c.json({ error: "Failed to list sessions" }, 500);
  }
});

// Get single session
app.get("/make-server-d0140d55/review/sessions/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const session = await kv.get(`review_session:${id}`);
    if (!session) return c.json({ error: "Session not found" }, 404);
    return c.json({ session });
  } catch (error) {
    return c.json({ error: "Failed to get session" }, 500);
  }
});

// Update session (end it, etc.)
app.put("/make-server-d0140d55/review/sessions/:id", async (c) => {
  try {
    const adminToken = c.req.header("x-user-token");
    const botKey = c.req.header("x-bot-key");
    let authorized = false;
    if (adminToken) {
      const { data: { user } } = await supabase.auth.getUser(adminToken);
      if (user) authorized = true;
    }
    if (!authorized && verifyBotKey(botKey)) authorized = true;
    if (!authorized) return c.json({ error: "Unauthorized" }, 401);

    const id = c.req.param("id");
    const existing = await kv.get(`review_session:${id}`);
    if (!existing) return c.json({ error: "Session not found" }, 404);

    const updates = await c.req.json();
    const updated = { ...existing, ...updates, id };
    await kv.set(`review_session:${id}`, updated);
    return c.json({ session: updated });
  } catch (error) {
    return c.json({ error: "Failed to update session" }, 500);
  }
});

// ============ Review Submissions ============

// Submit or update a peer review
app.post("/make-server-d0140d55/review/sessions/:id/reviews", async (c) => {
  try {
    const user = await getReviewUser(c.req.header("x-review-token"));
    if (!user) return c.json({ error: "Not authenticated" }, 401);

    const sessionId = c.req.param("id");
    const session = await kv.get(`review_session:${sessionId}`);
    if (!session || !session.active) return c.json({ error: "No active session" }, 404);

    const { target_discord_id, scores, comment } = await c.req.json();
    if (!target_discord_id || !scores || scores.length !== 3) {
      return c.json({ error: "target_discord_id and 3 scores required" }, 400);
    }
    if (target_discord_id === user.discord_id) {
      return c.json({ error: "Cannot review yourself" }, 400);
    }

    const reviewKey = `review:${sessionId}:${user.discord_id}:${target_discord_id}`;
    const targetMember = session.members.find((m: any) => m.discord_id === target_discord_id);

    await kv.set(reviewKey, {
      reviewer_id: user.discord_id,
      reviewer_name: user.display_name,
      target_id: target_discord_id,
      target_name: targetMember?.display_name || "Unknown",
      scores,
      comment: comment || "",
      submitted_at: new Date().toISOString(),
    });

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error submitting review: ${error}`);
    return c.json({ error: "Failed to submit review" }, 500);
  }
});

// Submit or update a leader review
app.post("/make-server-d0140d55/review/sessions/:id/leader-reviews", async (c) => {
  try {
    const user = await getReviewUser(c.req.header("x-review-token"));
    if (!user) return c.json({ error: "Not authenticated" }, 401);

    const sessionId = c.req.param("id");
    const session = await kv.get(`review_session:${sessionId}`);
    if (!session || !session.active) return c.json({ error: "No active session" }, 404);

    const { target_discord_id, scores, comment } = await c.req.json();
    if (!target_discord_id || !scores || scores.length !== 3) {
      return c.json({ error: "target_discord_id and 3 scores required" }, 400);
    }

    const targetMember = session.members.find((m: any) => m.discord_id === target_discord_id);
    if (!targetMember?.is_leader) {
      return c.json({ error: "Target is not a leader" }, 400);
    }

    const reviewKey = `leader_review:${sessionId}:${user.discord_id}:${target_discord_id}`;

    await kv.set(reviewKey, {
      reviewer_id: user.discord_id,
      reviewer_name: user.display_name,
      target_id: target_discord_id,
      target_name: targetMember.display_name,
      scores,
      comment: comment || "",
      submitted_at: new Date().toISOString(),
    });

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error submitting leader review: ${error}`);
    return c.json({ error: "Failed to submit leader review" }, 500);
  }
});

// Get current user's reviews for a session
app.get("/make-server-d0140d55/review/sessions/:id/my-reviews", async (c) => {
  try {
    const user = await getReviewUser(c.req.header("x-review-token"));
    if (!user) return c.json({ error: "Not authenticated" }, 401);

    const sessionId = c.req.param("id");
    const reviews = await kv.getByPrefixWithKeys(`review:${sessionId}:${user.discord_id}:`);
    const leaderReviews = await kv.getByPrefixWithKeys(`leader_review:${sessionId}:${user.discord_id}:`);

    return c.json({
      reviews: reviews.map((r) => r.value),
      leader_reviews: leaderReviews.map((r) => r.value),
    });
  } catch (error) {
    return c.json({ error: "Failed to get reviews" }, 500);
  }
});

// Get submission status for a session
app.get("/make-server-d0140d55/review/sessions/:id/status", async (c) => {
  try {
    const sessionId = c.req.param("id");
    const session = await kv.get(`review_session:${sessionId}`);
    if (!session) return c.json({ error: "Session not found" }, 404);

    const allReviews = await kv.getByPrefixWithKeys(`review:${sessionId}:`);
    const allLeaderReviews = await kv.getByPrefixWithKeys(`leader_review:${sessionId}:`);

    const members = session.members || [];
    const leaders = members.filter((m: any) => m.is_leader);

    const status = members.map((member: any) => {
      const otherMembers = members.filter((m: any) => m.discord_id !== member.discord_id);
      const otherLeaders = leaders.filter((l: any) => l.discord_id !== member.discord_id);

      const reviewedIds = allReviews
        .filter((r: any) => r.key.startsWith(`review:${sessionId}:${member.discord_id}:`))
        .map((r: any) => r.value.target_id);
      const leaderReviewedIds = allLeaderReviews
        .filter((r: any) => r.key.startsWith(`leader_review:${sessionId}:${member.discord_id}:`))
        .map((r: any) => r.value.target_id);

      return {
        discord_id: member.discord_id,
        display_name: member.display_name,
        is_leader: member.is_leader,
        common_total: otherMembers.length,
        common_done: reviewedIds.length,
        leader_total: otherLeaders.length,
        leader_done: leaderReviewedIds.length,
        complete: reviewedIds.length >= otherMembers.length && leaderReviewedIds.length >= otherLeaders.length,
      };
    });

    return c.json({ session_id: sessionId, title: session.title, status });
  } catch (error) {
    return c.json({ error: "Failed to get status" }, 500);
  }
});

// CSV export (admin only)
app.get("/make-server-d0140d55/review/sessions/:id/export", async (c) => {
  try {
    const adminToken = c.req.header("x-user-token");
    const { data: { user } } = await supabase.auth.getUser(adminToken);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const sessionId = c.req.param("id");
    const session = await kv.get(`review_session:${sessionId}`);
    if (!session) return c.json({ error: "Session not found" }, 404);

    const type = c.req.query("type") || "common"; // "common" or "leader"
    const prefix = type === "leader" ? `leader_review:${sessionId}:` : `review:${sessionId}:`;
    const reviews = await kv.getByPrefixWithKeys(prefix);

    const criteriaNames = type === "leader"
      ? LEADER_CRITERIA.map((c) => c.name)
      : REVIEW_CRITERIA.map((c) => c.name);

    const headers = ["리뷰어ID", "리뷰어", "대상ID", "대상", ...criteriaNames, "코멘트", "제출시간"];
    const rows = reviews.map((r: any) => {
      const v = r.value;
      return [
        v.reviewer_id, v.reviewer_name, v.target_id, v.target_name,
        ...v.scores, v.comment, v.submitted_at,
      ].map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",");
    });

    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${sessionId}_${type}.csv"`,
      },
    });
  } catch (error) {
    return c.json({ error: "Failed to export" }, 500);
  }
});

// ============ Bot API ============

// Get submission status for bot reminders
app.get("/make-server-d0140d55/review/bot/status/:team/:month", async (c) => {
  try {
    if (!verifyBotKey(c.req.header("x-bot-key"))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const team = c.req.param("team");
    const month = c.req.param("month");
    const sessionId = `${team}_${month}`;
    const session = await kv.get(`review_session:${sessionId}`);
    if (!session) return c.json({ error: "Session not found" }, 404);

    const allReviews = await kv.getByPrefixWithKeys(`review:${sessionId}:`);
    const allLeaderReviews = await kv.getByPrefixWithKeys(`leader_review:${sessionId}:`);

    const members = session.members || [];
    const leaders = members.filter((m: any) => m.is_leader);

    const incomplete = members
      .map((member: any) => {
        const otherMembers = members.filter((m: any) => m.discord_id !== member.discord_id);
        const otherLeaders = leaders.filter((l: any) => l.discord_id !== member.discord_id);

        const commonDone = allReviews.filter((r: any) =>
          r.key.startsWith(`review:${sessionId}:${member.discord_id}:`)
        ).length;
        const leaderDone = allLeaderReviews.filter((r: any) =>
          r.key.startsWith(`leader_review:${sessionId}:${member.discord_id}:`)
        ).length;

        const missing: string[] = [];
        if (commonDone < otherMembers.length) missing.push(`공통 피어리뷰 (${commonDone}/${otherMembers.length}명)`);
        if (leaderDone < otherLeaders.length) missing.push(`리더 평가 (${leaderDone}/${otherLeaders.length}명)`);

        return missing.length > 0 ? { discord_id: member.discord_id, display_name: member.display_name, missing } : null;
      })
      .filter(Boolean);

    return c.json({ session_id: sessionId, incomplete });
  } catch (error) {
    return c.json({ error: "Failed to get bot status" }, 500);
  }
});

// ============ Review Config (public) ============

app.get("/make-server-d0140d55/review/config", (c) => {
  return c.json({
    teams: TEAM_ROLES,
    criteria: REVIEW_CRITERIA,
    leader_criteria: LEADER_CRITERIA,
    discord_client_id: DISCORD_CLIENT_ID,
    discord_redirect_uri: DISCORD_REDIRECT_URI,
    discord_guild_id: DISCORD_GUILD_ID,
  });
});

Deno.serve(app.fetch);