# PPC Bildiriş Sistemi — Cloud Function Deploy Təlimatı

## Nə edəcək bu funksiya?
- ✅ Admin yeni tapşırıq yaratdıqda → işçinin telefonuna push bildirişi gəlir
- ✅ İşçi tapşırığı tamamladıqda → adminə push bildirişi gəlir
- ✅ Köhnə/etibarsız tokenlər avtomatik silinir

---

## Addım 1 — Node.js yüklə (yoxdursa)
https://nodejs.org saytından **LTS** versiyasını yüklə və quraşdır.

---

## Addım 2 — Firebase CLI quraşdır
Terminalı (cmd/PowerShell) aç, bu əmri çalışdır:

```
npm install -g firebase-tools
```

---

## Addım 3 — Firebase hesabına giriş et

```
firebase login
```

Brauzer açılacaq, Google hesabınla (Firebase layihənin sahibi) giriş et.

---

## Addım 4 — Faylları hazırla

Kompüterdə istənilən yerdə **ppc-functions** adlı qovluq yarat.
Həmin qovluğun içinə:

```
ppc-functions/
├── firebase.json          ← bu faylı kopyala
└── functions/
    ├── index.js           ← bu faylı kopyala
    └── package.json       ← bu faylı kopyala
```

---

## Addım 5 — Asılılıqları yüklə

Terminaldə `ppc-functions` qovluğuna keç:

```
cd ppc-functions/functions
npm install
cd ..
```

---

## Addım 6 — Layihəni seç

```
firebase use business-iddare-etme-sistemi
```

Əgər bu əmr işləməsə:
```
firebase projects:list
```
Siyahıdan öz layihəni seç.

---

## Addım 7 — Deploy et!

```
firebase deploy --only functions
```

Uğurlu deploy-dan sonra belə bir mesaj görəcəksiniz:
```
✔  Deploy complete!
Function URL (yeniTapshiriqBildiris): ...
Function URL (tapshiriqTamamlandiBildiris): ...
```

---

## Addım 8 — Firebase Console-da yoxla

1. console.firebase.google.com → layihəni aç
2. Sol menyudan **Functions** → iki funksiya görünməlidir:
   - `yeniTapshiriqBildiris`
   - `tapshiriqTamamlandiBildiris`

---

## Test et

1. İşçi portalında giriş et → bildiriş icazəsi ver
2. Admin panelindən yeni tapşırıq yarat
3. İşçinin telefonuna 5-10 saniyə içində push gəlməlidir

---

## Problem olsa

Firebase Console → Functions → **Logs** bölməsinə bax:
- `[FCM] Göndərildi` — hər şey qaydasındadır
- `[FCM] Token tapılmadı` — işçi portala girməyib / bildiriş icazəsi verməyib
- `messaging/registration-token-not-registered` — token köhnəlib, işçi yenidən girsin
