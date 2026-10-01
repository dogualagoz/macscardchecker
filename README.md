# MACS Kart Numarası Kontrol

Kulüp kartlarına yazılan 3 haneli numaraların dolu mu boş mu olduğunu kontrol eden statik site. GitHub Pages üzerinde çalışır, sunucu ya da veritabanı gerekmez.

## Kullanım

Numarayı yazın. 3 hane girince sonuç hemen çıkar:

- **✕ Bu numara alınmış** (kırmızı)
- **✓ Bu numara boş** (yeşil)

"Sıradaki boş numarayı göster" en küçük boş numarayı getirir. "Tüm numaraları göster" ise 001–999 arasındaki bütün numaraları renkli bir tablo halinde gösterir.

## Numara ekleme / silme

Alınmış numaralar `numbers.txt` dosyasında tutulur. Bu dosya ya sitedeki yönetici girişiyle ya da GitHub'da elle güncellenir.

### Siteden (yönetici girişi)

Site, numaraları GitHub API üzerinden doğrudan `numbers.txt` dosyasına yazar. Bunun için bir kez token oluşturmanız gerekir:

1. GitHub'da **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token** yolunu izleyin ([kısayol](https://github.com/settings/personal-access-tokens/new)).
2. **Repository access**: *Only select repositories* seçip yalnızca bu repoyu ekleyin.
3. **Permissions → Repository permissions → Contents**: *Read and write* seçin.
4. Token'ı oluşturup kopyalayın.
5. Sitenin en altındaki **Yönetici girişi** bağlantısına tıklayıp token'ı yapıştırın.

Giriş yaptıktan sonra:

- Bir numarayı kontrol edince sonucun altında **Alındı olarak işaretle** ya da **Listeden çıkar** butonu çıkar. "Tüm numaraları göster" tablosundaki bir numaraya tıklamak da aynı işi görür.
- **Toplu ekle** alanına birden fazla numarayı virgülle ya da satır satır yazabilirsiniz (ör. `012, 013, 101`).
- Her değişiklik repoya bir commit olarak kaydedilir. Değişikliği siz hemen görürsünüz, diğer herkes 1–2 dakika içinde görür.

Token yalnızca o tarayıcıda saklanır ve sadece GitHub'a gönderilir. Kendi cihazınız dışında giriş yaptıysanız **Çıkış yap**'a basın. Token'ı kimseyle paylaşmayın. Başka biri de numara ekleyecekse kendi token'ını oluşturmalı. Repo sizin hesabınızda değilse fine-grained token o repoya erişemeyebilir; bu durumda `public_repo` izinli bir *classic* token kullanın.

### GitHub'da elle

Her satıra bir numara yazılır:

```
001
002
042
```

GitHub'da dosyayı açıp kalem ikonuyla düzenleyin ve **Commit changes** deyin. Site 1–2 dakika içinde güncellenir. `#` sonrası not olarak yok sayılır.

> Repo herkese açık olduğu için bu dosyaya isim gibi kişisel bilgi yazmayın.

## GitHub Pages'te yayınlama

1. Bu klasörü ayrı bir GitHub reposuna gönderin.
2. Repo'da **Settings → Pages** sayfasına gidin.
3. **Source**: *Deploy from a branch*, **Branch**: `main`, klasör: `/ (root)` seçip kaydedin.
4. Site `https://<kullanıcı-adı>.github.io/<repo-adı>/` adresinde yayına girer.

## Ayarlar

Numara aralığı `app.js` dosyasının başında tanımlıdır:

```js
const MIN = 1;
const MAX = 999;
```

Kartlar 100–999 arasındaysa `MIN` değerini `100` yapın.

Yönetici girişi hangi repoya yazacağını site adresinden (`kullanici-adi.github.io/repo-adi`) kendisi bulur. Özel alan adı (ör. `kart.macsclub.com.tr`) kullanırsanız ya da yerelde denerken `GITHUB_REPO` değerini elle girin:

```js
const GITHUB_REPO = 'kullanici-adi/repo-adi';
```

## Yerelde deneme

`index.html` dosyasını çift tıklayıp açınca liste yüklenmez (tarayıcı `file://` üzerinden dosya okumaya izin vermez). Bunun yerine:

```sh
python3 -m http.server 8000
```

Ardından http://localhost:8000 adresini açın.
