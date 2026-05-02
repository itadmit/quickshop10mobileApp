---
name: eas-ota-store-release
description: >-
  EAS Update OTA, eas build, eas submit for App Store and Google Play, Expo versioning.
  Use for store releases, OTA publishes, production builds, submit failures, Play Android
  Developer API, Apple provisioning, or expo-updates runtime channels.
---

# EAS: OTA ושליחה לחנויות (QuickShop Mobile)

פרויקט: `quick10mobileApp`, Expo ~54, `expo-updates`, פרופיל production ב־`eas.json` עם `channel: production`.

## עקרונות

- **בינארי חדש (חנות)** נדרש כשמשנים נייטיב, תלויות עם קוד native, `plugins` ב־`app.json`, או גרסת Expo/RN שלא תואמת OTA.
- **OTA (`eas update`)** מעדכן רק **JavaScript ונכסים** בתוך אותו **runtime** — בפרויקט מוגדר `runtimeVersion.policy: appVersion`, כלומר ה־`version` ב־`app.json` קובע את ה־runtime. משתמשים עם אפליקציה מהחנות ב־`1.1.2` מקבלים עדכוני OTA רק ל־runtime `1.1.2`.
- אחרי שינוי `version` ב־`app.json` — צריך **בילד חנות חדש**; OTA יפורסם לגרסת ה־runtime החדשה.

## ניהול גרסאות לפני בילד חנות

ב־`app.json`:

- `expo.version` — גרסה למשתמש (ומשפיעה על `runtimeVersion` עם `appVersion`).
- `ios.buildNumber` — חייב לעלות בכל העלאה חדשה ל־App Store (אם הקודם כבר הוגש).
- `android.versionCode` — אותו עיקרון ל־Play.

סנכרן לפי הצורך את `package.json` → `version` עם `expo.version`.

## פקודות — בילד

מתיקיית הפרויקט:

```bash
cd /Users/tadmitinteractive/Desktop/quick10mobileApp
eas build --profile production --platform ios
eas build --profile production --platform android
eas build --profile production --platform all
```

## פקודות — שליחה לחנויות

```bash
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

- iOS: בדרך כלל **Select a build from EAS** → הבילד האחרון (production, finished).
- Android: אותו דבר; לבחור בילד **Android** (AAB), לא iOS.

בפרויקט: מפתח Google Service Account ל־submit נשמר ב־EAS; החשבון חייב להיות מקושר ב־Play Console תחת **Setup → API access**.

### מסלול Android (track)

אם בלוג מופיע `Release track: INTERNAL` — השליחה היא ל־**Internal testing**. לשינוי מסלול (למשל `production`), להגדיר ב־`eas.json` תחת `submit.production.android` או לפי תיעוד EAS העדכני (`releaseStatus`, `track`).

## פקודות — OTA

```bash
npm run eas:update:production
# או עם הודעה:
eas update --channel production --message "תיאור קצר"
```

הבינארי מהחנות חייב להיבנות עם **אותו `channel`** (בפרויקט: `production` בפרופיל `build.production`).

## iOS — אחרי submit מוצלח

1. המתן לעיבוד ב־App Store Connect (לרוב דקות).
2. **TestFlight** לבדיקה.
3. **App Store** — לשייך בילד לגרסה, למלא מטא־דאטה, **Submit for Review**.

## Android — בעיות נפוצות

- **`Google Play Android Developer API` disabled / PERMISSION_DENIED**: להפעיל את ה־API ב־**Google Cloud של אותו פרויקט** שממנו נוצר ה־Service Account (למשל Firebase `quickshop-8b854`), לא בפרויקט GCP אחר. קישור מהלוג בדרך כלל כולל `project=...`.
- **אין הרשאה לפרויקט GCP**: בעל הפרויקט צריך להוסיף IAM או להפעיל API; חלופה — Service Account חדש מפרויקט שבשליטת המשתמש + קישור ב־Play Console + העלאת JSON ל־EAS.

## Apple — בעיות נפוצות

- **Provisioning Profile expired**: לא לשחזר פרופיל פגום — ליצור חדש (`n` → generate new).
- **שיתוף Distribution Certificate** בין אפליקציות באותו Team — מותר (`Y`).

## `eas.json`

בגרסאות ישנות של `eas-cli` המפתח `"update"` ברמת השורש עלול להיחשב לא חוקי — הושארו רק **`channel`** בתוך פרופילי `build`. פרסום עדכון נעשה עם `eas update --channel production`.

## קבצים רלוונטיים בפרויקט

- `app.json` — `version`, `runtimeVersion`, `updates.url`, `ios.buildNumber`, `android.versionCode`
- `eas.json` — `build.production.channel`, `submit.production`
- `app/_layout.tsx` — בדיקת OTA (`expo-updates`) בבילד לא־dev
- `package.json` — סקריפטים `eas:update:production`, `eas:update:preview`

## צ׳קליסט קצר

**שחרור חנות (שינוי נייטיב / גרסה):**

- [ ] העלאת `version` / `buildNumber` / `versionCode` לפי הצורך
- [ ] `eas build --profile production --platform all`
- [ ] `eas submit` ל־iOS ולֿAndroid
- [ ] השלמת תהליך ב־App Store Connect ו־Play Console

**שחרור OTA בלבד:**

- [ ] אין שינוי שדורש בינארי חדש
- [ ] `eas update --channel production --message "..."`
- [ ] לוודא ש־`runtimeVersion` תואם למה שבחנות
