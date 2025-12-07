# 🚀 Deploy Frontend lên Netlify - Quick Guide

## Bước 1: Chuẩn Bị

Các file đã được tạo sẵn:
- ✅ `netlify.toml` - Netlify configuration
- ✅ `.env.production` - Production environment variables
- ✅ `src/api/constant.ts` - Updated để dùng env variable

## Bước 2: Deploy

### Option 1: Qua Netlify Dashboard (Khuyến Nghị)

1. Đăng nhập [Netlify](https://app.netlify.com/)

2. Click **Add new site** → **Import an existing project**

3. Chọn **GitHub** → Authorize và chọn repo **VieGym**

4. Cấu hình Build:
   ```
   Base directory: viegymfe
   Build command: npm run build
   Publish directory: viegymfe/dist
   ```

5. **Environment Variables** (Site settings → Environment variables):
   ```
   VITE_API_BASE_URL = https://viegym-backend.onrender.com
   ```

6. Click **Deploy site**

### Option 2: Qua Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Từ thư mục root
cd viegymfe

# Initialize
netlify init

# Deploy
npm run build
netlify deploy --prod
```

## Bước 3: Cập Nhật Backend

Sau khi deploy Frontend, lấy URL Netlify (ví dụ: `https://viegym.netlify.app`)

### Update Environment Variable trên Render:

```env
FRONTEND_URL=https://viegym.netlify.app
```

Sau đó **Manual Deploy** lại backend trên Render.

## Bước 4: Update Google OAuth

Vào [Google Cloud Console](https://console.cloud.google.com/):

1. **APIs & Services** → **Credentials**
2. Chọn OAuth 2.0 Client
3. **Authorized JavaScript origins**:
   ```
   https://viegym.netlify.app
   ```
4. **Authorized redirect URIs**:
   ```
   https://viegym-backend.onrender.com/login/oauth2/code/google
   ```

## Bước 5: Test

Mở: `https://your-app.netlify.app`

Kiểm tra:
- ✅ Frontend load
- ✅ API calls work
- ✅ Login/Register
- ✅ Google OAuth
- ✅ WebSocket real-time features

## 🔄 Auto Deploy

Netlify tự động deploy khi:
- Push code lên `main` branch
- Mở Pull Request (tạo preview URL)

## ⚡ Build Command Errors?

Nếu build fail, check:

```bash
# Test build locally
cd viegymfe
npm install
npm run build
```

## 📝 Notes

- **Build time**: ~2-3 phút
- **CDN**: Instant global distribution
- **Free tier**: 100GB bandwidth/month
- **HTTPS**: Tự động SSL certificate
- **Custom domain**: Free

---

**Xong! Frontend đã live trên Netlify! 🎉**
