# Movexa Android App (APK)

Movexa ওয়েবসাইটটাকে [Capacitor](https://capacitorjs.com/) দিয়ে একটা আসল Android
অ্যাপে (APK) মোড়ানো হয়েছে। অ্যাপটা GitHub Actions-এ ক্লাউডে বিল্ড হয় — **আপনার PC-তে
Android Studio বা কিছুই ইনস্টল করতে হবে না।**

সাইটে একটা **"Get App"** বাটন আছে (হেডারে + মোবাইল মেনুতে), যেটা সবসময় সর্বশেষ
APK-তে লিংক করে।

---

## APK কীভাবে বানাবেন (GitHub Actions)

১. এই পরিবর্তনগুলো GitHub-এ push করুন (`main` ব্রাঞ্চে):

   ```bash
   git add .
   git commit -m "Add Android app (Capacitor) + Download APK button"
   git push origin main
   ```

   push করলেই workflow নিজে থেকে চালু হয়ে যাবে। চাইলে ম্যানুয়ালিও চালাতে পারেন:
   **GitHub repo → Actions → "Android APK" → Run workflow।**

২. বিল্ড শেষ হতে আনুমানিক **৫–৯ মিনিট** লাগে। সবুজ ✓ টিক দেখালে হয়ে গেছে।

৩. APK দুই জায়গায় পাওয়া যাবে:
   - **Releases** (সবচেয়ে গুরুত্বপূর্ণ) — repo-র ডান পাশে **Releases → সর্বশেষ রিলিজ →
     `movexa.apk`**। সাইটের "Get App" বাটন ঠিক এখানেই পয়েন্ট করে।
   - **Actions artifact** — ওই রান-এর পেজে নিচে **`movexa-android`** নামে zip।

> সাইটের বাটনের লিংক: `https://github.com/tajnur1010/Movexa/releases/latest/download/movexa.apk`
> — এটা সবসময় **latest** রিলিজের APK দেখায়, তাই নতুন বিল্ড হলে বাটন আপনাআপনি নতুন
> ভার্সন দেবে।

---

## ফোনে ইনস্টল করা

১. ফোনের ব্রাউজারে সাইটে গিয়ে **Get App** বাটনে ট্যাপ করুন (অথবা `movexa.apk` ফাইলটা
   ফোনে পাঠান)।
২. প্রথমবার Android জিজ্ঞেস করবে — **"Install from unknown sources"** / **"Allow from
   this source"** অন করে দিন (আপনার ব্রাউজার বা ফাইল ম্যানেজারের জন্য)।
৩. `.apk` ফাইলে ট্যাপ করে **Install** দিন। ব্যস।

---

## গুরুত্বপূর্ণ কথা

- এটা একটা **debug APK** — সরাসরি ইনস্টল করে চালানোর জন্য ঠিক আছে। কিন্তু **Google Play
  Store-এ আপলোড করতে হলে** আলাদা release keystore দিয়ে সাইন করা `.aab` লাগবে (এখনো সেট
  করা হয়নি — দরকার হলে করে দেওয়া যাবে)।
- অ্যাপটা মেটাডেটা TMDB থেকে আর ভিডিও তৃতীয় পক্ষের সার্ভার থেকে নেয়, তাই **চালাতে
  ইন্টারনেট লাগবে** (ওয়েবসাইটের মতোই)।
- অ্যাপের ভেতরে "Get App" বাটন **দেখাবে না** — কারণ আপনি তো অলরেডি অ্যাপেই আছেন।
- Android-এর **ব্যাক বাটন** অ্যাপের ভেতরে আগের পেজে নিয়ে যায়; হোম স্ক্রিনে থাকলে অ্যাপ
  বন্ধ করে।
- **iOS/iPhone** অ্যাপ বানাতে Mac + Xcode লাগে — Windows থেকে সম্ভব নয়।

---

## অ্যাপের পরিচয়

| বিষয় | মান |
|------|-----|
| App name | **Movexa** |
| Package ID | **com.movexa.app** *(এটা অ্যাপের স্থায়ী পরিচয় — বদলালে নতুন অ্যাপ হিসেবে গণ্য হবে)* |
| Framework | Capacitor 6 (JDK 17 দিয়ে বিল্ড) |
| Icon/Splash | সাইটের ব্র্যান্ড লোগো থেকে অটো-জেনারেট (`scripts/gen-icons.mjs`) |

---

## নিজের PC-তে বিল্ড করতে চাইলে (ঐচ্ছিক)

Android Studio + JDK 17 ইনস্টল থাকলে:

```bash
npm install
npm run build          # dist/ তৈরি করে
npm run app:add        # android/ প্রজেক্ট বানায় (একবারই)
npm run app:icons      # আইকন + স্প্ল্যাশ জেনারেট করে
npm run app:sync       # dist/ + প্লাগইন android-এ কপি করে
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

> নোট: `android/` ফোল্ডারটা `.gitignore`-এ আছে এবং প্রতিবার `cap add` দিয়ে নতুন করে
> তৈরি হয় — তাই native ফাইল হাতে এডিট করবেন না, সব সেটিং `capacitor.config.json`-এ।
