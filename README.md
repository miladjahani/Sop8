# ⚡ MiSub & CF-Optimizer — Ultra Edition v3.5

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20PWA-blue?style=for-the-badge&logo=github)](https://github.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20v6.0-f38020?style=for-the-badge&logo=cloudflare)](https://workers.cloudflare.com/)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883?style=for-the-badge&logo=vue.js)](https://vuejs.org/)
[![Pinia](https://img.shields.io/badge/Pinia-State-ffd859?style=for-the-badge)](https://pinia.vuejs.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

> سامانه جامع بهینه‌ساز اتصالات کلودفلر با الهام از **[MiSub](https://github.com/imzyb/MiSub)** — ترکیب قابلیت‌های پیشرفته بک‌اند با رابط کاربری شیشه‌ای (Glassmorphism) تلگرامی

---

## ✨ ویژگی‌های کلیدی

### 🔧 بهینه‌ساز اتصال (CF-Optimizer Core)
- **پروب TCP واقعی** با `cloudflare:sockets` — نه شبیه‌سازی
- **تایید Colo/دیتاسنتر** با `resolveOverride` واقعی
- **اسکنر موازی PBP** — صدها آی‌پی هم‌زمان در Edge
- **یابنده پورت** — تست تمام پورت‌های کلودفلر با هندشیک TCP
- **تست سرعت واقعی** — دانلود بایت واقعی از آی‌پی کاندید

### 📋 مدیریت سابسکریپشن
- **پارس پروتکل‌ها:** VLESS, VMess, Trojan, SS, Hysteria2, TUIC, SOCKS
- **تشخیص منطقه** با ایموجی پرچم (۴۰+ کشور)
- **زنجیره عملگرها:** فیلتر، مرتب‌سازی، حذف تکرار، تغییر نام
- **تولید لینک ساب واقعی** از طریق Worker `/sub`
- **اتصال EDT-Pages/Proxy-List** با داده غنی (کشور، شهر، ASN)

### 🎨 رابط کاربری
- **تم شیشه‌ای (Glassmorphism)** — مشابه وب‌اپ تلگرام
- **Vue Router** با lazy-loading و transition
- **Pinia** برای مدیریت state با persist
- **کامپوننت‌های قابل استفاده مجدد:** BaseButton, BaseSwitch
- **طراحی RTL** فارسی با پشتیبانی موبایل

### ☁️ بک‌اند Cloudflare Worker v6.0
- **۱۴+ اندپوینت** REST API
- **Rate Limiting** هوشمند per-IP
- **پشتیبانی چند پروتکل:** TCP probe, GeoIP, DoH, Speedtest
- **خروجی‌ها:** Base64, Clash Meta, Sing-box JSON

---

## 🏗️ ساختار پروژه

```text
┌─────────────────────────────────────────────────────┐
│                   Frontend (Vue 3)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ بهینه‌ساز │ │  اسکنر   │ │  ساب     │ │ ابزارها│ │
│  │  ⚡       │ │   🧪     │ │   📋     │ │  🌐    │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ │
│       │             │            │            │      │
│  ┌────┴─────────────┴────────────┴────────────┴────┐ │
│  │          Pinia Store + Vue Router                │ │
│  └─────────────────────┬───────────────────────────┘ │
└────────────────────────┼────────────────────────────┘
                         │ API Calls
┌────────────────────────┼────────────────────────────┐
│              Cloudflare Worker v6.0                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │TCP Probe │ │Geo Parser│ │Node Parse│ │  /sub  │ │
│  │  🔌      │ │  🌍      │ │  📋      │ │  🔗   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │Batch Scan│ │Speedtest │ │  DoH     │ │ GeoIP  │ │
│  │  📡      │ │  📊      │ │  🌐      │ │  🗺️   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 استقرار

### GitHub Pages (Frontend)
1. مخزن را روی شاخه `main` پوش کنید
2. **Settings → Pages → Source → GitHub Actions**
3. اکشن خودکار build و deploy می‌کند
4. آدرس: `https://username.github.io/Sop8/`

### Cloudflare Worker (Backend)
```bash
cd worker
# روش ۱: از طریق Dashboard
# کد worker.js را در Cloudflare Dashboard کپی کنید

# روش ۲: از طریق Wrangler
npx wrangler deploy
```

---

## 📡 اندپوینت‌های Worker v6.0

| مسیر | متد | کاربرد |
|---|---|---|
| `/api/probe?ip=&port=&colo=1` | GET | پروب TCP واقعی + تایید Colo |
| `/api/probe/ports?ip=&ports=` | GET | تست موازی چند پورت |
| `/api/scan/batch` | POST | اسکنر موازی PBP (حداکثر ۵۰۰ IP) |
| `/api/speedtest-proxy?ip=&bytes=` | GET | تست سرعت دانلود واقعی |
| `/api/doh?name=&provider=` | GET | DNS over HTTPS |
| `/api/geoip?ip=` | GET | استعلام GeoIP تکی |
| `/api/geoip/batch` | POST | استعلام GeoIP دسته‌ای |
| `/api/ip/ranges` | GET | لیست CIDR رسمی کلودفلر |
| `/api/ip/verify?ip=` | GET | تایید آی‌پی کلودفلر |
| `/api/proxy-fetch?url=` | GET | دریافت ساب بدون CORS |
| `/sub?url=&ip=&port=&sni=&fp=` | GET | تولید لینک ساب بهینه‌شده |
| `/api/nodes/parse` | POST | پارس متن ساب به نودهای ساختاریافته |
| `/api/nodes/optimize` | POST | اعمال عملگرها + IP تمیز |
| `/api/nodes/regions?url=` | GET | استخراج منطقه‌های ساب |
| `/api/ping` | GET | سلامت سرور |

---

## 🛠️ توسعه محلی

```bash
# نصب وابستگی‌ها
bun install

# اجرای dev server
bun run dev

# بیلد برای production
bun run build

# پیش‌نمایش build
bun run preview
```

### وابستگی‌ها

| پکیج | نسخه | کاربرد |
|---|---|---|
| `vue` | ^3.5 | فریمورک UI |
| `pinia` | ^4.0 | مدیریت state |
| `vue-router` | ^5.3 | مسیریابی |
| `pinia-plugin-persistedstate` | ^4.7 | ذخیره state |
| `vite` | ^5.4 | بیلدر |

---

## 📄 لایسنس

MIT License
