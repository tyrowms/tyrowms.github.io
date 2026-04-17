// ═══════ Gemini AI Chatbot Service ═══════
// Google Gemini free API ile stok verisi sorgulama
// Model: gemini-2.0-flash (ücretsiz, 15 RPM, 1M token/dk)

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Veri context'ini token-efficient metin özetine çevir
export function buildDataContext(D, DW, fmtTon, fmt, fN) {
  if (!D || !D.s) return 'Veri yüklenmemiş.';

  const agBuckets = ['0-30','31-60','61-90','91-120','121-180','181-365','365+'];

  let ctx = `TYRO WMS Stok Yaşlandırma Verileri (güncel snapshot):
Toplam Stok: ${fmtTon(D.s.totalQty)}
Toplam Değer (USD): $${fmt(D.s.totalVal)}
Tesis Sayısı: ${D.s.facilityCount}
Depo Sayısı: ${D.s.whCount}
Aktif Ürün: ${D.s.prodCount}
Ort. Yaşlanma (FIFO): ${D.s.avgAge} gün
Şehir Sayısı: ${D.s.cityCount}

Yaşlandırma Dağılımı (miktar bazlı):
${agBuckets.map(b => `  ${b} gün: ${fmtTon(D.ag[b] || 0)}`).join('\n')}

Top 10 Tesis (stok miktarına göre):
${[...D.f].sort((a,b) => b.q - a.q).slice(0, 10).map((f, i) =>
  `  ${i+1}. ${f.n} (${f.id}): ${fmtTon(f.q)}, $${fmt(f.v)}, ort.yaş ${f.a} gün, ${f.wc} depo, ${f.pc} ürün`
).join('\n')}`;

  if (DW && DW.countries && DW.countries.length > 0) {
    ctx += `\n\nÜlke Bazlı Dağılım:
${DW.countries.sort((a,b) => b.q - a.q).map(c =>
  `  ${c.n}: ${fmtTon(c.q)}, $${fmt(c.v)}, ${c.fc} tesis, ort.yaş ${c.a} gün`
).join('\n')}`;
  }

  // Şehir dağılımı
  if (D.ct && D.ct.length > 0) {
    ctx += `\n\nŞehir Bazlı Dağılım (Türkiye):
${[...D.ct].sort((a,b) => b.q - a.q).slice(0, 10).map(c =>
  `  ${c.n}: ${fmtTon(c.q)}, ${c.fc} tesis, ort.yaş ${c.a} gün`
).join('\n')}`;
  }

  return ctx;
}

// Gemini API'ye soru gönder
export async function askGemini(apiKey, messages, dataContext) {
  if (!apiKey) throw new Error('Gemini API key girilmemiş. Ayarlardan ekleyin.');

  const systemPrompt = `Sen **TYRO AI** — Tiryaki Agro'nun stok yaşlandırma verilerini analiz eden premium yapay zeka asistanısın.
TYRO WMS (Warehouse Management System) platformunda çalışıyorsun.

## Görevin
Kullanıcının stok, yaşlandırma, tesis, ülke ve envanter sorularını aşağıdaki güncel verilere dayanarak Türkçe cevapla.

## Cevap Formatı Kuralları
- **KISA ve ÖZ**: Maksimum 1-5 cümle. Asla 5 cümleyi geçme.
- **Veri odaklı**: Her cevaba 2-3 somut rakam ekle.
- **Birimleri doğru kullan**: Ton/Bin Ton, gün (FIFO), $ USD.
- **Emoji ile vurgula**: 📊 analiz, ⚠️ uyarı, ✅ olumlu, 🏭 tesis
- **Eğer veri yoksa**: "Bu bilgi mevcut verilerde yok" de.
- Uzun paragraflar YAZMA. Liste kullan, kısa tut.

## Uzmanlık Alanların
- Stok yaşlandırma analizi (FIFO bazlı)
- Tesis performans karşılaştırması
- Ülke bazlı envanter dağılımı
- Kritik stok uyarıları ve aksiyon önerileri
- Yaşlandırma trendi analizi
- Stok devir hızı optimizasyonu

GÜNCEL VERİLER:
${dataContext}`;

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Anladım, TYRO WMS stok yaşlandırma verilerine dayanarak sorularınızı cevaplayacağım. Nasıl yardımcı olabilirim?' }] },
    ...messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }))
  ];

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 300,
      }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API hatası: ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini boş yanıt döndü.');
  return text;
}

// API key'i test et (basit bir soru gönder)
export async function testGeminiKey(apiKey) {
  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Merhaba, test.' }] }],
        generationConfig: { maxOutputTokens: 10 }
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.error?.message || `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { ok: !!data.candidates?.[0]?.content?.parts?.[0]?.text };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
