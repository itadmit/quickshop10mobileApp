# הגדרת פוש (Push) לאנדרואיד

כדי שההתראות יעבדו ב-APK/AAB באנדרואיד, צריך לחבר Firebase (FCM).

## שלב 1: Firebase Console

1. היכנס ל־[Firebase Console](https://console.firebase.google.com/)
2. בחר פרויקט קיים או צור **Add project**
3. **Add app** → בחר **Android**
4. **Android package name:** `com.quickshop.mobile` (חייב להיות זהה ל־app.json)
5. הורד את **google-services.json** ושמור אותו **בשורש הפרויקט** (ליד `app.json`)

## שלב 2: EAS – FCM V1 (חובה לשליחת פוש)

גוגל סגרה את FCM הישן; Expo משתמשת רק ב־FCM HTTP v1.

1. ב־Firebase: **Project Settings** (גלגל) → **Service accounts**
2. **Generate new private key** → תורד קובץ JSON
3. ב־EAS:  
   - [expo.dev](https://expo.dev) → הפרויקט → **Credentials** → **Android**
   - או בטרמינל: `eas credentials --platform android`
4. בחר **FCM V1** והעלה את קובץ ה־Service Account (ה־JSON שהורדת)

## שלב 3: בילד מחדש

אחרי ש־`google-services.json` בשורש הפרויקט וה־FCM V1 מוגדר ב־EAS:

```bash
eas build --platform android --profile production
```

לאחר ההתקנה, פוש באנדרואיד אמור לעבוד כמו באייפון.

---

## אזהרת Deobfuscation ב־Play Console

אם מופיעה אזהרה: *"There is no deobfuscation file associated with this App Bundle"*:

- **לא חוסם פרסום** – אפשר להמשיך ולפרסם.
- **מה זה:** קובץ מיפוי (mapping) מאפשר ל־Play Console להציג קריסות ו־ANRs בשמות הקריאים (לפני R8/ProGuard).
- **מה נעשה:** ב־`eas.json` הוגדר שהבילד יועלה גם קובץ `mapping.txt` כארטיפקט.
- **בכל בילד אנדרואיד חדש:**  
  - היכנס ל־[expo.dev](https://expo.dev) → הפרויקט → הבילד → **Artifacts**  
  - הורד את `mapping.txt` (אם קיים)  
  - ב־Play Console: **Release** → **App bundle explorer** → בחר את הגרסה → **Downloads** → **Upload** mapping file (או תחת **Android Vitals** → **Deobfuscation files** לפי הממשק).
