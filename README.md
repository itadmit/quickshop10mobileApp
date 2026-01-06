# 📱 QuickShop Mobile App

אפליקציית ניהול חנות QuickShop לאנדרואיד ואייפון.

## 🚀 התחלה מהירה

### דרישות מקדימות

- Node.js 18+
- npm או yarn
- Expo CLI
- iOS Simulator (Mac) או Android Emulator

### התקנה

```bash
# התקנת dependencies
npm install

# העתקת קובץ סביבה
cp env.example .env

# הפעלת האפליקציה
npm start
```

### הפעלה

```bash
# הפעלה רגילה (Expo Go)
npm start

# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 🏗️ מבנה הפרויקט

```
quickshop-mobile/
├── app/                    # מסכי האפליקציה (Expo Router)
│   ├── (auth)/            # מסכי אימות
│   │   ├── login.tsx
│   │   └── store-select.tsx
│   ├── (tabs)/            # מסכי טאבים
│   │   ├── index.tsx      # Dashboard
│   │   ├── orders/        # הזמנות
│   │   ├── products/      # מוצרים
│   │   ├── customers/     # לקוחות
│   │   └── more.tsx       # עוד
│   └── _layout.tsx        # Layout ראשי
│
├── components/
│   └── ui/                # קומפוננטות UI
│
├── lib/
│   ├── api/               # API client
│   └── utils/             # כלי עזר
│
├── hooks/                 # React Hooks
├── stores/                # Zustand stores
└── types/                 # TypeScript types
```

## 🔧 טכנולוגיות

- **Framework**: Expo (React Native)
- **Navigation**: Expo Router
- **State Management**: Zustand + TanStack Query
- **UI**: Custom components עם פונט Assistant
- **Auth**: Secure Store
- **Camera**: expo-camera (barcode scanner)

## 📝 משתני סביבה

```env
EXPO_PUBLIC_API_URL=https://quickshop.co.il/api
EXPO_PUBLIC_APP_NAME=QuickShop
```

## 🎨 תכונות

- ✅ RTL מלא לעברית
- ✅ Dashboard עם אנליטיקס
- ✅ ניהול הזמנות
- ✅ ניהול מוצרים
- ✅ סורק ברקוד
- ✅ ניהול לקוחות
- ✅ תמיכה במספר חנויות

## 📱 API Endpoints

האפליקציה מתחברת ל-API של QuickShop:

- `/api/mobile/auth/*` - אימות
- `/api/mobile/orders/*` - הזמנות
- `/api/mobile/products/*` - מוצרים
- `/api/mobile/customers/*` - לקוחות
- `/api/mobile/analytics/*` - אנליטיקס
- `/api/mobile/notifications/*` - התראות

## 📄 רישיון

© 2026 QuickShop. כל הזכויות שמורות.

