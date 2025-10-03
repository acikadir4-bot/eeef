# Blog Yazısı Paylaşma - Firebase Kurulumu

## Sorun
Blog yazısı paylaşma özelliği çalışmıyor çünkü Firebase Database Rules'da `blog_posts` için izinler eksik.

## Çözüm - Firebase Console'dan Güncelleme

### Adım 1: Firebase Console'a Giriş
1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. Projenizi seçin: **btc3-d7d9b**

### Adım 2: Realtime Database Rules'u Güncelle
1. Sol menüden **"Realtime Database"** seçin
2. **"Rules"** (Kurallar) sekmesine tıklayın
3. Mevcut kuralların sonuna aşağıdaki kuralları ekleyin:

```json
    "blog_posts": {
      ".read": true,
      ".write": "auth != null",
      ".indexOn": ["createdAt", "category", "author"],
      "$postId": {
        ".read": true,
        ".write": "auth != null && ((!data.exists()) || root.child('users').child(auth.uid).child('role').val() === 'admin')",
        ".validate": "newData.hasChildren(['title', 'content', 'author', 'createdAt', 'category'])"
      }
    },
    "blog_comments": {
      "$postId": {
        ".read": true,
        ".write": "auth != null",
        "$commentId": {
          ".validate": "newData.hasChildren(['userName', 'content', 'createdAt'])"
        }
      }
    },
    "live_support": {
      ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'",
      ".write": "auth != null",
      "$messageId": {
        ".validate": "newData.hasChildren(['userName', 'message', 'timestamp'])"
      }
    }
```

### Adım 3: Yayınla
1. **"Publish"** (Yayınla) butonuna tıklayın
2. Değişiklikler hemen aktif olacak

## İzin Detayları

### Blog Posts (`blog_posts`)
- **Okuma**: Herkese açık (giriş yapmadan okunabilir)
- **Yazma**: Sadece giriş yapmış kullanıcılar
- **Düzenleme/Silme**: Sadece admin kullanıcılar

### Blog Comments (`blog_comments`)
- **Okuma**: Herkese açık
- **Yazma**: Sadece giriş yapmış kullanıcılar

### Live Support (`live_support`)
- **Okuma**: Sadece admin kullanıcılar (privacy için)
- **Yazma**: Giriş yapmış tüm kullanıcılar

## Test
Kuralları yayınladıktan sonra:
1. Siteye giriş yapın
2. Blog sayfasına gidin (`/blog`)
3. **"Blog Yazısı Paylaş"** butonuna tıklayın
4. Formu doldurup yayınlayın

Artık blog yazıları başarıyla kaydedilecek!

## Alternatif: Firebase CLI ile Deploy (Opsiyonel)

Eğer Firebase CLI kuruluysa:
```bash
firebase deploy --only database
```

Not: Bu komut `database.rules.json` dosyasını Firebase'e yükler.
