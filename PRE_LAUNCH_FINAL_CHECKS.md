# 🚀 Pre-Launch Final Checks (MVP)

Use this checklist before sharing the link with your first 500 users.

## 1. 🔗 URLs & Links
- [ ] **Referral Link**: Update `https://cutmysugar.app` in `src/components/dashboard/SettingsModal.tsx` (Line ~20 & ~108) to your **actual deployed URL** (e.g., Vercel or Netlify link).
- [ ] **WhatsApp Number**: Verify the support number in `SettingsModal.tsx` works correctly when clicked. Current: `917728086673`.

## 2. 🎨 Branding & Assets
- [ ] **App Icon**: Replace `./assets/icon.png` (1024x1024) with your official logo. This is what users see on their Home Screen.
- [ ] **Favicon**: Replace `./assets/favicon.png` (48x48) for the browser tab icon.
- [ ] **Splash Screen**: Replace `./assets/splash-icon.png` to match your brand.
- [ ] **Manifest Name**: Verify `"name"` and `"shortName"` in `app.json` (under `web` config) are exactly what you want users to see (e.g., "CutMySugar").

## 3. 🔐 Security & APIs
- [ ] **Google OAuth**: Add your **Production Domain** (e.g., `your-app.vercel.app`) to the "Authorized Javascript Origins" and "Redirect URIs" in Google Cloud Console.
- [ ] **Supabase Auth**: Add your Production Redirect URL to Supabase Authentication -> URL Configuration.
- [ ] **Gemini API Key**: Ensure your API key has sufficient quota (tier) for 500 users scanning meals. If using the "Free of Charge" tier, watch out for rate limits.
- [ ] **Privacy Policy**: Review the auto-generated text in `SettingsModal.tsx`. Ensure it complies with local laws if you are collecting health data.

## 4. 🧪 Functional Smoke Test
- [ ] **Login**: Test login flow on the **production URL** (not localhost).
- [ ] **PWA Install**: Test "Add to Home Screen" on an actual iPhone and Android device.
- [ ] **Offline Mode**: Verify the app doesn't crash if opened without internet (it should show cached data or a network error).

## 5. 📧 Support
- [ ] **Test Support Link**: Click "Chat on WhatsApp" and ensure it opens the correct chat.

---
**Ready?** Once all boxes are checked, you are Go for Launch! 🟢
