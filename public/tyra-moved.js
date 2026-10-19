/*
 * Taşındı bildirimi — tyro → tyra.
 *
 * Bu eski uygulama yeni adına taşındı ve bu adres YEDEK olarak açık
 * kalıyor. Sayfa açılınca ortada bir kart çıkar: ne olduğunu iki cümleyle
 * söyler ve tek düğme yeni adrese götürür. Kapatma seçeneği bilinçli
 * olarak yok: eski sürümde devam edilmez.
 *
 * Ayarlar index.html'deki <script> etiketinin data-* özniteliklerinden okunur:
 *   data-new-url   yeni adres (ör. https://tyrasign.ttech.business)
 *   data-new-name  yeni ürün adı, rozet (ör. tyraSign)
 *   data-product   başlıktaki tam ad (ör. Kurumsal Dijital İmza & Kart Stüdyosu)
 *   data-product-en aynı adın İngilizcesi
 *   data-accent / data-accent-2  sitenin kendi renkleri (düğme / vurgu)
 *
 * Bilinçli kararlar:
 *  - Ayrı dosya, satır içi değil: bazı uygulamaların CSP'si satır içi betiğe
 *    kapalı (script-src 'self').
 *  - Shadow DOM: uygulamanın kendi CSS'i (Tailwind sıfırlamaları) kartı
 *    bozmasın, kartın CSS'i de uygulamaya sızmasın.
 *  - Yol ve sorgu korunur: yer imli bir derin bağlantı yeni adreste aynı
 *    sayfaya düşer. Giriş dönüşünün #code=… parçası TAŞINMAZ — o kod eski
 *    adrese verilmiştir, yenide geçersizdir.
 *  - Çerçeve içinde (ör. MSAL'ın gizli yenileme çerçevesi) hiç çizilmez.
 */
(function () {
  "use strict";
  if (window.top !== window.self) return;
  var tag = document.currentScript;
  if (!tag) return;
  var NEW_URL = (tag.getAttribute("data-new-url") || "").replace(/\/+$/, "");
  var NEW = tag.getAttribute("data-new-name") || "";
  var PRODUCT = tag.getAttribute("data-product") || NEW;
  var PRODUCT_EN = tag.getAttribute("data-product-en") || PRODUCT;
  // Arkada görünen sahte giriş ekranı: yeni sitenin giriş sayfasının
  // görüntüsü. Eski uygulama hiç başlatılmadığı için arkada gerçek bir
  // ekran yok; bu görüntü onun yerini tutar.
  var BG = tag.getAttribute("data-bg") || "";
  // Sitenin kendi renkleri: düğme (accent) ve vurgu (accent-2).
  var ACCENT = tag.getAttribute("data-accent") || "#1d4ed8";
  var ACCENT_2 = tag.getAttribute("data-accent-2") || ACCENT;
  if (!NEW_URL) return;


  var lang = (document.documentElement.lang || navigator.language || "tr").toLowerCase();
  var tr = lang.indexOf("tr") === 0;
  var T = tr
    ? {
        title: PRODUCT + " artık yeni adresimizde",
        body: "Yer imlerini yeni adresle güncellemeyi unutma.",
        cta: "Yeni adrese git",
      }
    : {
        title: PRODUCT_EN + " has moved to a new address",
        body: "Remember to update your bookmarks.",
        cta: "Go to the new address",
      };

  function target() {
    var hash = location.hash || "";
    if (/(^|[#&])(code|state|error|id_token|access_token)=/.test(hash)) hash = "";
    return NEW_URL + location.pathname + location.search + hash;
  }

  function mount() {
    // Eski uygulama bilerek başlatılmıyor (index.html'de giriş betiği kapalı).
    // Açılış bekçisi olan uygulamalarda (tyro) bekçi bunu arıza sanıp sayfayı
    // onarmaya çalışmasın diye "açılış tamam" bildirilir.
    if (typeof window.__tyroBootOk === "function") window.__tyroBootOk();
    if (document.getElementById("tyra-moved-host")) return;
    var host = document.createElement("div");
    host.id = "tyra-moved-host";
    host.style.cssText = "position:fixed;inset:0;z-index:2147483647;";
    var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
    var shortUrl = NEW_URL.replace(/^https?:\/\//, "");

    host.style.setProperty("--a", ACCENT);
    host.style.setProperty("--a2", ACCENT_2);
    root.innerHTML =
      "<style>" + ":host{all:initial}.bg{position:fixed;inset:-24px -24px -12% -24px;background-position:center top;background-size:cover;background-repeat:no-repeat;filter:blur(3px)}.scrim{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;background:radial-gradient(120% 120% at 50% 0%,color-mix(in srgb,var(--a) 22%,transparent),rgba(10,14,25,.42));-webkit-backdrop-filter:blur(14px) saturate(120%);backdrop-filter:blur(14px) saturate(120%);font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI Variable','Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;animation:fade .35s ease-out both}.card:focus{outline:none}.card{position:relative;box-sizing:border-box;width:100%;max-width:420px;padding:36px 30px 30px;text-align:center;color:#0b1220;border-radius:28px;background:linear-gradient(180deg,rgba(255,255,255,.78),rgba(255,255,255,.58));-webkit-backdrop-filter:blur(40px) saturate(180%);backdrop-filter:blur(40px) saturate(180%);border:1px solid rgba(255,255,255,.65);box-shadow:0 1px 0 rgba(255,255,255,.9) inset,0 0 0 .5px rgba(15,23,42,.08),0 30px 80px -20px rgba(15,23,42,.45),0 12px 30px -12px color-mix(in srgb,var(--a) 40%,transparent);animation:rise .5s cubic-bezier(.2,.8,.2,1) both}.icon{width:64px;height:64px;margin:0 auto 18px;border-radius:18px;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,var(--a2),var(--a));box-shadow:0 1px 0 rgba(255,255,255,.45) inset,0 10px 24px -8px color-mix(in srgb,var(--a) 70%,transparent)}.icon svg{width:30px;height:30px}.badge{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;letter-spacing:.01em;color:var(--a);background:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.8);box-shadow:0 0 0 .5px rgba(15,23,42,.08);border-radius:999px;padding:5px 12px;margin:0 0 14px}.dot{width:6px;height:6px;border-radius:50%;background:var(--a2)}h2{margin:0 0 18px;font-size:23px;line-height:1.25;font-weight:700;letter-spacing:-.02em;color:#0b1220}p{margin:0 0 22px;font-size:14px;line-height:1.5;color:rgba(11,18,32,.6)}.url{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 0 14px;padding:11px 14px;border-radius:14px;background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.85);box-shadow:0 0 0 .5px rgba(15,23,42,.07);font-size:14.5px;font-weight:600;color:#0b1220;word-break:break-all}.url svg{flex:none;width:14px;height:14px;opacity:.55}a.cta{display:flex;align-items:center;justify-content:center;gap:8px;box-sizing:border-box;width:100%;min-height:50px;padding:13px 18px;border-radius:15px;color:#fff;font-size:15.5px;font-weight:600;letter-spacing:-.01em;text-decoration:none;background:linear-gradient(180deg,color-mix(in srgb,var(--a) 82%,#fff),var(--a));box-shadow:0 1px 0 rgba(255,255,255,.3) inset,0 8px 20px -6px color-mix(in srgb,var(--a) 65%,transparent);transition:transform .15s ease,filter .15s ease}a.cta:hover{filter:brightness(1.08)}a.cta:active{transform:scale(.985)}a.cta:focus-visible{outline:3px solid color-mix(in srgb,var(--a2) 70%,#fff);outline-offset:3px}@keyframes fade{from{opacity:0}to{opacity:1}}@keyframes rise{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.scrim,.card{animation:none}}@media (prefers-color-scheme:dark){.card{color:#f5f7fa;background:linear-gradient(180deg,rgba(40,44,52,.72),rgba(24,27,33,.62));border-color:rgba(255,255,255,.12);box-shadow:0 1px 0 rgba(255,255,255,.08) inset,0 30px 80px -20px rgba(0,0,0,.7)}h2{color:#f5f7fa}p{color:rgba(245,247,250,.62)}.badge,.url{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.12);color:#f5f7fa}.badge{color:color-mix(in srgb,var(--a2) 70%,#fff)}}" + "</style>" +
      '<div class="bg" aria-hidden="true"></div>' +
      '<div class="scrim">' +
      '<div class="card" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="t" aria-describedby="b">' +
      '<div class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg></div>' +
      '<span class="badge"><span class="dot"></span><span class="bt"></span></span>' +
      '<h2 id="t"></h2>' +
      '<div class="url"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><span class="ut"></span></div><p id="b"></p>' +
      '<a class="cta"></a>' +
      "</div></div>";

    var bg = root.querySelector(".bg");
    if (BG) bg.style.backgroundImage = "url(\"" + BG + "\")"; else bg.remove();
    root.querySelector(".bt").textContent = NEW;
    root.querySelector("h2").textContent = T.title;
    root.querySelector("#b").textContent = T.body;
    root.querySelector(".ut").textContent = shortUrl;
    var cta = root.querySelector("a.cta");
    cta.textContent = T.cta + " →";
    cta.href = target();
    cta.addEventListener("click", function () { cta.href = target(); });

    // <html>'e eklenir: bazı uygulamalarda <body> transform taşıyor ve
    // position:fixed onu temel alıp üstte boşluk bırakıyordu.
    document.documentElement.appendChild(host);
    // Odak karta verilir, düğmeye değil: düğmeye verilince tarayıcı açılışta
    // odak halkasını çiziyordu. Tab ile düğmeye geçilir.
    var card = root.querySelector(".card");
    try { card.focus({ preventScroll: true }); } catch { card.focus(); }
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
