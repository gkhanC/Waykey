# 🚀 WayKey Kullanım Rehberi (User Guide)

Tebrikler! WayKey (Linux Otomasyon Motoru) başarıyla kuruldu ve `http://localhost:8080` adresinde arayüzü yayına başladı. Bu rehber, WayKey'i nasıl yöneteceğinizi, kısayolları nasıl yazacağınızı ve otomasyon senaryolarınızı nasıl özelleştireceğinizi açıklamaktadır.

---

## 🏗️ 1. Mimari ve Çalışma Mantığı

WayKey, Legacy AutoHotkey altyapısından farklı olarak Wayland uyumlu çalışır:
- **Klavye Dinleme (Input):** `/dev/input/event*` dosyalarını (evdev) doğrudan okuyarak klavye vuruşlarını dinler.
- **Donanım Simülasyonu (Output):** `/dev/uinput` üzerinden C++ seviyesinde sanal bir klavye ve fare motoru yaratarak işletim sistemine tamamen fiziksel bir aygıtmış gibi sinyal yollar.
- **Pencere Yönetimi (IPC):** Hyprland'in Unix soketlerine bağlanarak aktif pencereleri ve workspace (çalışma alanı) durumlarını anlık olarak izler.
- **Dashboard (GUI):** Yazdığınız tüm kısayolları, aktif pencereyi ve motor günlüklerini (log) gösteren bir arayüzdür.

---

## ⚙️ 2. Servis Yönetimi (Systemd)

WayKey arka planda çalışan bir uygulamanızdır. Başlatmak, durdurmak ve bilgisayar açılışında otomatik çalışmasını sağlamak için terminalinizde şu komutları kullanabilirsiniz:

- **Durumu Kontrol Etmek İçin:** `systemctl --user status waykey`
- **Yeniden Başlatmak İçin (Çökerse veya takılırsa):** `systemctl --user restart waykey`
- **Durdurmak İçin:** `systemctl --user stop waykey`
- **Sistem Loglarını Okumak İçin (Sorun Giderme):** `journalctl --user -u waykey.service -f`

---

## 📜 3. Script Yazımı ve Konfigürasyon

WayKey'in tüm otomasyon mantığı JavaScript kullanılarak kodlanır. Ana konfigürasyon dosyanız şu adreste bulunur:  
📂 **`~/.config/waykey/waykey.config.js`**

Bu dosyayı dilediğiniz bir metin editöründe (VSCode, Neovim, Nano vb.) açıp kaydedebilirsiniz. **Projede Hot Reload (Canlı Yenileme) özelliği mevcuttur; yani dosyayı kaydettiğiniz an arka plan servisi otomatik olarak yeni kodlarınızı algılar ve Kısayol Motorunu günceller.** Dashboard ekranında *Log* bölümünde bu değişimi görebilirsiniz.

### Temel Dosya Yapısı:
```javascript
module.exports = (WayKey) => {
    // Tüm otomasyonlarınızı buraya yazacaksınız!
    WayKey.log("Özel scriptim yüklendi.");
};
```

---

## ⌨️ 4. API Referansı ve Örnek Scriptler

WayKey, nesne yönelimli ve zincirlenebilir (chainable) bir metot yapısı sunar. Aşağıda AHK muadillerinin WayKey'de nasıl yapıldığına dair spesifik senaryolar var:

### 🌟 Senaryo 1: Basit Global Kısayol Atama (Global Hotkeys)
*(Örnek: `Super (Win) + T` tuşlarına basınca terminal açmak)*

```javascript
module.exports = (WayKey) => {
    WayKey.bind('Super+T').execute(() => {
        const { exec } = require('child_process');
        exec('kitty &'); // Kitty yerine alacritty, wezterm vb. yazabilirsiniz
        WayKey.log('Terminal başlatıldı!');
    });
};
```

### 🎯 Senaryo 2: Sadece Belirli Bir Pencerede Çalışan Kısayollar (Context-Aware)
*(Örnek: Sadece `Firefox` aktifken `Ctrl + W` basıldığında log atma)*

```javascript
module.exports = (WayKey) => {
    WayKey.bind('Ctrl+W')
        .whenActive('firefox') // Hyprland class id'si
        .execute(() => {
            WayKey.log('Firefox içinde Ctrl+W kombinasyonu yakalandı.');
        });
};
```

### 📝 Senaryo 3: Metin Genişletme (Hotstrings - Auto-replace)
Legacy AHK'nin en popüler özelliği. Belli bir kelime dizisini yazdığınızda, yazılan kısmı otomatik olarak silip yerine uzun metni gönderir. *(Kaba tabirleriyle "btw" yazınca "by the way" olması)*

```javascript
module.exports = (WayKey) => {
    // 'brb' yazıldığında hepsini silip 'Be right back!' yazar
    WayKey.hotstring('brb', 'Be right back!');
    
    // Kurumsal e-posta imzanız
    WayKey.hotstring('@@', 'gokhan@example.com');
};
```

### 🖱️ Senaryo 4: Fare ve Donanım Simülasyonu
*(Örnek: `Alt + Space` basınca fareyi 500 piksel sağa, 500 piksel aşağı kaydırma)*

```javascript
module.exports = (WayKey) => {
    WayKey.bind('Alt+Space').execute(() => {
        // device API'sine erişim
        WayKey.device.emitMouseMove(500, 500);
        WayKey.log('Fare hareket ettirildi.');
    });
};
```

---

## 🖼️ 5. Dashboard Kullanımı (`http://localhost:8080`)

Web Dashboard, kodladığınız kısayolların ve Hyprland'in o anki durumunun görselleştirilmiş halidir. Arayüzün üç temel birimi vardır:

1. **Focus Info (Aktif Pencere Bilgisi):** Hyprland'den IPC ile alınan o an aktif olan pencerenin `Class` ve `Title` değerini canlı gösterir. `whenActive()` fonksiyonunu kullanırken buradaki `Active Class` ismini referans almalısınız.
2. **Hotkey Registry (Kısayol Yöneticisi):** `waykey.config.js` içine yazdığınız tüm scriptlerin (`bind` ve `hotstring`) listesidir. 
    * Hangi kısayol olduğunu
    * Hangi uygulamada (Context) çalıştığını görebilirsiniz.
    * Sağ taraftaki *Toggle* düğmesine basarak script dosyasını değiştirmeden bir kısayolu **geçici olarak Devre Dışı (Disabled)** bırakabilirsiniz.
3. **Engine Logs:** WayKey motorunun `console.log` olaylarıdır. Scriptiniz çalıştığında veya hata aldığında bu kayan günlük arayüzünden anlık takip edebilirsiniz.

> **💡 İpucu (Fine Touch):** Dashboard'u izole bir uygulama gibi çalıştırmak için Hyprland konfigürasyonunuza (`~/.config/hypr/hyprland.conf`) şu kuralı ekleyebilirsiniz:
> ```ini
> bind = SUPER, K, exec, chromium --app=http://localhost:8080
> windowrule = float, title:^(WayKey Dashboard)
> ```
> Böylece masaüstünde herhangi bir sekmeye bağlı olmayan, saf karanlık temalı bağımsız bir kontrol paneli penceresi elde edersiniz!

---

## 🤖 6. Gelişmiş Komut Çevirileri (AutoHotkey'den WayKey'e)

AutoHotkey'de bulunan karmaşık döngüleri ve zamanlayıcıları (Timer/Sleep) JavaScript'in modern Asenkron mantığı ve zamanlayıcılarıyla (Promises & setInterval) kolayca simüle edebilirsiniz.

### ⚔️ Senaryo 5: Gelişmiş "Toggle" ve Otomatik Döngü Scripti (Oyun Makrosu)
*(AHK karşılığı: Belirli bir oyunda -örn. Path of Exile- `F9` tuşuyla açılıp kapanan, belirli aralıklarla `q, w, e` tuşlarına basan `SetTimer` makrosu)*

**AHK Kodu:**
```ahk
Toggle := 0
F9::
Toggle := !Toggle
if (Toggle) {
    SetTimer, CryBot, 10
} else {
    SetTimer, CryBot, Off
}
return

CryBot:
IfWinActive, Path of Exile
{
    Send, q
    Sleep, 150
    Send, w
    Sleep, 150
    Send, e
    SetTimer, CryBot, 7800
}
return
```

**WayKey JS Karşılığı (`waykey.config.js`):**
```javascript
module.exports = (WayKey) => {
    let cryBotInterval = null;
    let isToggled = false;

    // AHK'deki Sleep fonksiyonunun JS asenkron muadili
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const cryBotLogic = async () => {
        // Pencerin sınıfında veya başlığında 'path of exile' geçiyorsa çalıştır
        if (WayKey.activeWindow && WayKey.activeWindow.title.toLowerCase().includes('path of exile')) {
            // "q" tuşuna bas (Aşağı ve Yukarı sinyalleri)
            WayKey.device.emitKey(WayKey.Keys.KEY_Q, true);
            WayKey.device.emitKey(WayKey.Keys.KEY_Q, false);
            await sleep(150);
            
            // "w" tuşuna bas
            WayKey.device.emitKey(WayKey.Keys.KEY_W, true);
            WayKey.device.emitKey(WayKey.Keys.KEY_W, false);
            await sleep(150);
            
            // "e" tuşuna bas
            WayKey.device.emitKey(WayKey.Keys.KEY_E, true);
            WayKey.device.emitKey(WayKey.Keys.KEY_E, false);
            
            WayKey.log("CryBot Loop Çalıştı.", "success");
        }
    };

    WayKey.bind('F9').execute(() => {
        isToggled = !isToggled; // Toggle state (Aç/Kapa)
        
        if (isToggled) {
            WayKey.log("CryBot Aktif Edildi!", "success");
            
            // Sistemi başlatır başlatmaz ilk kombinasyonu hemen (10ms beklemeden) ateşle
            cryBotLogic();
            
            // Döngüyü saniyede bir çalıştırmak için JS Native setInterval kullanımı (AHK SetTimer)
            cryBotInterval = setInterval(cryBotLogic, 7800);
        } else {
            WayKey.log("CryBot Durduruldu.", "error");
            if (cryBotInterval) {
                // AHK'deki SetTimer, Off işleminin muadili
                clearInterval(cryBotInterval);
                cryBotInterval = null;
            }
        }
    });
};
```

**Bu çevirideki önemli dersler:**
1. AHK'deki `Toggle` ve değişken takibi işlemleri JavaScript `scope` yapısında `let` ile dosya bağlamında çok daha kolay saklanabilir.
2. AHK'deki `Sleep, 150` komutu JavaScript'te `await sleep(150)` kullanılarak Asenkron bir duraklama oluşturur. (Böylece arka plan çalışan motor diğer klavye tuşlarınızı kitlenmeden dinlemeye devam eder).
3. AHK'deki `SetTimer`, Vanilla JS içerisindeki `setInterval` yapısı aracılığıyla kurgulanır, `Off` işlemi ise `clearInterval` metodudur.
4. `IfWinActive` kontrolünü doğrudan çalışacak asenkron fonksiyonun içerisinde WayKey'in anlık `WayKey.activeWindow` referansı ile karşılaştırarak sorguluyoruz.

---

## 🧠 7. Gelişmiş WayKey Komut Setleri ve Profesyonel İş Akışları

JavaScript'in gücüyle WayKey, sıradan bir kısayol tetikleyiciden çok öteye geçerek dinamik mantıkları işleyebilen gerçek bir "Otomasyon Motoruna" dönüşür.

### 🎭 Senaryo 6: Dinamik Metin Tamamlama ve Forma Veri Doldurma (Auto-Fill)
Hotstringler (`WayKey.hotstring`) sadece statik kelimeler yazmak için değil, dinamik içerik üretmek için de kullanılabilir. Örneğin, mevcut tarihi, saati, panodaki kopyalanmış bir veriyi sisteme gönderebilirsiniz. 
*(Örnek: `!tarih` yazdığınızda o anki tarihi saatle birlikte atar, ardından `Tab` tuşuna basıp alttaki forma isminizi yazar)*

```javascript
module.exports = (WayKey) => {
    // !rapor yazdığınızda günün tarihini çekip uzun bir şablon döker
    WayKey.hotstring('!rapor', ''); // Önce sildiriyoruz
    
    WayKey.bind('!rapor').execute(async () => {
        // Javascript'ten canlı veriyi çekiyoruz
        const date = new Date();
        const bugun = date.toLocaleDateString('tr-TR');
        const saat = date.toLocaleTimeString('tr-TR');
        
        const metin = `GÜNLÜK RAPOR - ${bugun} ${saat} \n------------------------\n\n`;
        
        // Metni karakter karakter yazdır (Panodan hızlıca yapıştırmak da Node.js robotjs veya xclip exec() ile mümkün)
        for (const char of metin) {
             const lower = char.toLowerCase();
             // WayKey.Keys içerisinde varsa
             if(WayKey.Keys['KEY_' + lower.toUpperCase()]) {
                 WayKey.device.emitKey(WayKey.Keys['KEY_' + lower.toUpperCase()], true);
                 WayKey.device.emitKey(WayKey.Keys['KEY_' + lower.toUpperCase()], false);
             } else if (char === ' ') {
                 WayKey.device.emitKey(WayKey.Keys.KEY_SPACE, true);
                 WayKey.device.emitKey(WayKey.Keys.KEY_SPACE, false);
             } else if (char === '\\n' || char === '\n') {
                 WayKey.device.emitKey(WayKey.Keys.KEY_ENTER, true);
                 WayKey.device.emitKey(WayKey.Keys.KEY_ENTER, false);
             }
        }
    });
};
```

### 🔀 Senaryo 7: Aynı Anda Çalışan Birden Fazla Senkronize Döngü (Multi-Loop Automation)
Birden fazla bağımsız zamanlayıcı (timer) gerektiren MMORPG veya otomasyon senaryolarında, JavaScript'in non-blocking (bloke olmayan) doğası mükemmel işler. Aynı anda hem 5 saniyede bir Can İksiri (Q) basan, hem de 15 saniyede bir Buff yeteneğini (E) kullanan birbirine karışmayan iki sonsuz döngü:

```javascript
module.exports = (WayKey) => {
    let loopDurumu = false;
    let iksirInterval = null;
    let buffInterval = null;

    WayKey.bind('F10').execute(() => {
        loopDurumu = !loopDurumu;

        if (loopDurumu) {
            WayKey.log("Multi-Loop Aktif!", "success");
            
            // Loop 1: Her 5 saniyede bir Can iksiri bas (Q)
            iksirInterval = setInterval(() => {
                WayKey.device.emitKey(WayKey.Keys.KEY_Q, true);
                WayKey.device.emitKey(WayKey.Keys.KEY_Q, false);
                WayKey.log("Iksir Kullanıldı");
            }, 5000); // 5000 ms

            // Loop 2: Her 15 saniyede bir Buff Yenile (E)
            buffInterval = setInterval(() => {
                WayKey.device.emitKey(WayKey.Keys.KEY_E, true);
                WayKey.device.emitKey(WayKey.Keys.KEY_E, false);
                WayKey.log("Buff Yenilendi");
            }, 15000); // 15000 ms
            
        } else {
            WayKey.log("Multi-Loop Durduruldu.", "error");
            // Kapatıldığında her iki zamanlayıcıyı da senkron şekilde iptal et
            clearInterval(iksirInterval);
            clearInterval(buffInterval);
            iksirInterval = null;
            buffInterval = null;
        }
    });
};
```

### 🛑 Senaryo 8: Karmaşık Koşullara (Conditionals) Bağlı Dinamik Scriptler
Bazen bir makonun çalışmasını sadece aktif pencereye değil, **günün saatine**, o an sistemde **başka bir programın çalışıp çalışmadığına** veya **internetten gelen bir API verisine** bağlamak isteyebilirsiniz. WayKey node.js altyapısında çalıştığından sınır yoktur!

*(Örnek: `F12`'ye basıldığında, yalnızca Path of Exile açıksa VE bilgisayar saati Gece 02:00'den sonraysa yatarak level kasma scriptini başlatan otomasyon)*

```javascript
module.exports = (WayKey) => {
    WayKey.bind('F12').execute(() => {
        const title = WayKey.activeWindow.title.toLowerCase();
        const aktifSaat = new Date().getHours();
        
        // Şart 1: Sadece PoE'da çalışmalı
        if (!title.includes('path of exile')) {
            WayKey.log("Bu script sadece Path of Exile'da çalıştırılabilir.", "error");
            return; 
        }
        
        // Şart 2: Yalnızca gece saat 02:00 ile 06:00 arasında izin ver
        if (aktifSaat >= 2 && aktifSaat <= 6) {
            WayKey.log("Gece Vardiyası Makrosu Devrede!", "success");
            // Döngü Başlangıç kodları buraya...
            WayKey.device.emitKey(WayKey.Keys.KEY_1, true);
            WayKey.device.emitKey(WayKey.Keys.KEY_1, false);
        } else {
            WayKey.log(`Makro engellendi. Şu an saat ${aktifSaat}:00. Sadece gece çalışabilir.`, "error");
        }
    });
};
```
