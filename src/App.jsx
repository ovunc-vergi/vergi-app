import { useEffect, useState } from "react";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const STORAGE_KEY = "vergi_app_draft_v1";

const DEFAULT_VALUES = {
  brutto: "55000",
  lohnsteuer: "8200",
  homeofficeDays: "60",
  commuteKm: "15",
  commuteDays: "140",
  workEquipment: "400",
  sonderausgaben: "150",
  vorsorgeaufwand: "200",
  childCount: "1",
  childcareCost: "1800",
};

const DEFAULT_OPTIONAL = {
  extraEmployerIncome: "0",
  lohnersatz: "0",
  movingCost: "0",
  householdHandwerker: "0",
};

const TRANSLATIONS = {
  tr: {
    title: "Almanya Vergi İadesi Asistanı",
    subtitle: "Adım adım yanıtla, canlı iade tahminini ve ELSTER doldurma listesini gör.",
    draftSaved: "Taslak otomatik kaydedildi",
    resetDraft: "Taslağı Sıfırla",
    refundLabel: "Tahmini Vergi İadesi",
    deductionShort: "Kesinti",
    paidTaxShort: "Ödenen Lohnsteuer",
    docTitle: "Lohnsteuerbescheinigung (Yıllık Maaş & Vergi Belgesi)",
    docDesc: "PDF veya görsel (JPG/PNG) seç; Gemini Vision (veya yedek OCR) ile 3. ve 4. satır tutarları okunup onayına sunulur.",
    selectFile: "Belge Seç (PDF / Görsel)",
    fillSample: "Örnek Belgeyi Doldur",
    pdfRendering: "PDF sayfası görsele dönüştürülüyor...",
    aiScanning: "Gemini Vision belgedeki satırları okuyor...",
    ocrRunning: (pct) => `Yerel OCR taranıyor... %${pct}`,
    ocrDoneAi: "Gemini Vision ile tarama tamamlandı. Bulunan tutarları onaylayıp formlara aktarabilirsin.",
    ocrDoneLocal: "Yerel OCR taraması tamamlandı. Bulunan tutarları onaylayıp formlara aktarabilirsin.",
    ocrError: "Belgeden tutar otomatik okunamadı; tutarları aşağıdan manuel girebilirsin.",
    ocrConfirmPrompt: (brutto, tax) =>
      `Belgeden Brüt Maaş (3. satır): ${brutto} ve Kesilen Lohnsteuer (4. satır): ${tax} bulundu. Formlara aktarayım mı?`,
    ocrApplyBtn: "Evet, Formlara Aktar",
    ocrDismissBtn: "Hayır, Kapat",
    sampleFileName: "Ornek_Lohnsteuerbescheinigung_2025.pdf",
    sampleStatus: "Örnek belge verileri Brüt 58.400 € ve Lohnsteuer 9.450 € olarak aktarıldı.",
    stepCounter: (cur, total) => `Adım ${cur} / ${total}`,
    progressLabel: (pct) => `%${pct} Tamamlandı`,
    showAll: "Tüm Soruları Tek Ekranda Göster",
    singleStep: "Tek Soru Moduna Dön",
    elsterMatch: "ELSTER Karşılığı",
    back: "← Geri",
    next: "İleri →",
    optTitle: "Opsiyonel / Nadir Durumlar (İsteğe Bağlı)",
    optDesc: "İş değişikliği/ek işveren, Kurzarbeit/Elterngeld, taşınma gideri veya usta/ev hizmetleri varsa açabilirsin.",
    openOpt: "Opsiyonel Alanları Aç",
    closeOpt: "Opsiyonel Alanları Gizle",
    optExtraEmployer: "Ek İşveren / İş Değişikliği Brüt Maaşı (€)",
    optExtraEmployerHint: "Yıl içinde ikinci bir işverenden veya farklı Lohnsteuerbescheinigung ile gelir varsa",
    optLohnersatz: "Kurzarbeitergeld / Elterngeld / Krankengeld (€)",
    optLohnersatzHint: "Vergisiz ödenek varsa (Progressionsvorbehalt)",
    optMoving: "İş Amaçlı Taşınma Giderleri / Umzugskosten (€)",
    optHandwerker: "Ev Hizmetleri & Usta İşçiliği / § 35a EStG (€)",
    optHandwerkerHint: "Faturalı ve banka ödemeli işçilik tutarı",
    aiTitle: "AI Vergi Asistanı",
    aiWelcome: "Merhaba! Ana adımları, opsiyonel nadir durumları (taşınma, usta/ev hizmetleri, Kurzarbeit/Elterngeld, ek işveren) sorabilir veya tutar söyleyerek alanları güncelleyebilirsin.",
    aiPlaceholder: "Örn: Taşınma gideri 1200 euro veya Kreş gideri 2400 euro",
    askBtn: "Sor",
    elsterSummaryTitle: "ELSTER Kopya Kağıdı (Satır Satır Doldurma Özeti)",
    copyBtn: "Listeyi Kopyala",
    copiedBtn: "Kopyalandı ✓",
    colArea: "ELSTER Alanı",
    colDesc: "Açıklama",
    colVal: "Yazılacak Değer",
    disclaimerTitle: "Yasal Bilgilendirme (Rehberlik Amacıyladır)",
    disclaimerText: "Bu uygulama yalnızca bilgilendirme, tahmini hesaplama ve ELSTER form satır eşleştirmesi amacıyla hazırlanmıştır; resmi mali müşavirlik (Steuerberatung) veya hukuki/vergi danışmanlığı yerine geçmez. Resmi beyan öncesinde güncel vergi kurallarını ve belgelerini kontrol et.",
    steps: [
      {
        key: "brutto",
        title: "1. Yıllık Brüt Maaşın",
        question: "Lohnsteuerbescheinigung belgendeki yıllık brüt maaşın (Bruttoarbeitslohn, genelde 3. satır) kaç €?",
        hint: "Vergi matrahı ve iade hesabının temelini oluşturur.",
        elsterRef: "Anlage N — Sayfa 1, Satır 6 (Bruttoarbeitslohn)",
      },
      {
        key: "lohnsteuer",
        title: "2. Yıl İçinde Kesilen Gelir Vergisi (Lohnsteuer)",
        question: "Lohnsteuerbescheinigung belgendeki kesilen Lohnsteuer (genelde 4. satır) toplamı kaç €?",
        hint: "İade alabilmenin temel şartı yıl içinde peşin vergi ödenmiş olmasıdır; tahmini iade bu tutarı aşamaz.",
        elsterRef: "Anlage N — Sayfa 1, Satır 7 (Einbehaltene Lohnsteuer)",
      },
      {
        key: "homeofficeDays",
        title: "3. Homeoffice Gün Sayısı",
        question: "Geçen yıl evden kaç gün çalıştın?",
        hint: "Günlük 6 € sabit gider kesintisi hesaplanır (yıllık 1.260 € üst sınır).",
        elsterRef: "Anlage N — Sayfa 2, Satır 45 (Tagespauschale / Homeoffice)",
      },
      {
        key: "commuteKm",
        title: "4. İşe Tek Yön Mesafe",
        question: "Evin ile iş yerin arasındaki tek yön mesafe kaç km?",
        hint: "En kısa veya uygun tek yön güzergah üzerinden hesaplanır.",
        elsterRef: "Anlage N — Sayfa 2, Satır 35 (Entfernungspauschale - km)",
      },
      {
        key: "commuteDays",
        title: "5. İşe Gittiğin Gün Sayısı",
        question: "Geçen yıl fiilen işe kaç gün gittin?",
        hint: "Mesafe × gün sayısı × 0,30 € (veya ilgili km kademesi) olarak gider yazılır.",
        elsterRef: "Anlage N — Sayfa 2, Satır 35 (Entfernungspauschale - gün)",
      },
      {
        key: "workEquipment",
        title: "6. Mesleki Giderler / Ekipman",
        question: "İşin için bilgisayar, monitör, masa veya mesleki ekipman/kurs harcaması yaptın mı? Toplam kaç €?",
        hint: "Werbungskosten kapsamında giderlere eklenir.",
        elsterRef: "Anlage N — Sayfa 2, Satır 47-52 (Arbeitsmittel / Fortbildung)",
      },
      {
        key: "sonderausgaben",
        title: "7. Özel Giderler (Sonderausgaben)",
        question: "Yıl içinde bağış veya özel gider kapsamında düşülebilecek (örneğin Spenden / özel gider) tutar kaç €?",
        hint: "Sonderausgaben kapsamında vergi matrahını azaltmaya yardımcı olur.",
        elsterRef: "Mantelbogen / Sonderausgaben — Spenden & Sonstige",
      },
      {
        key: "vorsorgeaufwand",
        title: "8. Ek Sigorta / Vorsorgeaufwand",
        question: "Maaş bordrosu dışında ek sigorta veya emeklilik/sağlık katkısı (Vorsorgeaufwand) ödedin mi? Toplam kaç €?",
        hint: "Sigorta ve emeklilik/sağlık katkıları Vorsorgeaufwand bölümünde değerlendirilir.",
        elsterRef: "Anlage Vorsorgeaufwand — Ek Sigorta / Katkılar",
      },
      {
        key: "childCount",
        title: "9a. Çocuk Sayısı (Anlage Kind)",
        question: "Bakmakla yükümlü olduğun çocuk sayısı kaç?",
        hint: "Her çocuk için ayrı Anlage Kind formu açılır ve Kindergeld / Kinderfreibetrag kontrolü yapılır.",
        elsterRef: "Anlage Kind — Çocuk Bilgileri (Çocuk başına ayrı form)",
      },
      {
        key: "childcareCost",
        title: "9b. Çocuk Bakım / Kreş Giderleri",
        question: "Çocuk bakım / kreş (Kinderbetreuungskosten) için yıl içinde ödediğin toplam tutar kaç €?",
        hint: "Çocuk bakım giderlerinin belirli bir oranı (örneğin %80'i) gider olarak dikkate alınabilir.",
        elsterRef: "Anlage Kind — Kinderbetreuungskosten (Çocuk Bakım Giderleri)",
      },
    ],
  },
  en: {
    title: "Germany Tax Refund Assistant",
    subtitle: "Answer step by step, see your live refund estimate and ELSTER cheat sheet.",
    draftSaved: "Draft auto-saved",
    resetDraft: "Reset Draft",
    refundLabel: "Estimated Tax Refund",
    deductionShort: "Deductions",
    paidTaxShort: "Paid Lohnsteuer",
    docTitle: "Lohnsteuerbescheinigung (Annual Wage & Tax Statement)",
    docDesc: "Select a PDF or image (JPG/PNG); Gemini Vision (or fallback OCR) extracts lines 3 and 4 for confirmation.",
    selectFile: "Select File (PDF / Image)",
    fillSample: "Load Sample Slip",
    pdfRendering: "Rendering PDF page to image...",
    aiScanning: "Gemini Vision is reading document lines...",
    ocrRunning: (pct) => `Running local OCR... ${pct}%`,
    ocrDoneAi: "Gemini Vision scan complete. Confirm detected amounts to fill the form.",
    ocrDoneLocal: "Local OCR scan complete. Confirm detected amounts to fill the form.",
    ocrError: "Could not reliably extract figures; enter values manually below.",
    ocrConfirmPrompt: (brutto, tax) =>
      `Found Gross Salary (Line 3): ${brutto} and Withheld Lohnsteuer (Line 4): ${tax}. Apply them to the form?`,
    ocrApplyBtn: "Yes, Apply to Form",
    ocrDismissBtn: "No, Dismiss",
    sampleFileName: "Sample_Lohnsteuerbescheinigung_2025.pdf",
    sampleStatus: "Sample slip values loaded: Gross 58,400 € and Lohnsteuer 9,450 €.",
    stepCounter: (cur, total) => `Step ${cur} / ${total}`,
    progressLabel: (pct) => `${pct}% Completed`,
    showAll: "Show All Questions on One Screen",
    singleStep: "Back to Step-by-Step Mode",
    elsterMatch: "ELSTER Mapping",
    back: "← Back",
    next: "Next →",
    optTitle: "Optional / Special Cases",
    optDesc: "Open if you had a job change/extra employer, Kurzarbeit/Elterngeld, moving costs, or household/craft services.",
    openOpt: "Show Optional Fields",
    closeOpt: "Hide Optional Fields",
    optExtraEmployer: "Extra Employer / Job Change Gross Salary (€)",
    optExtraEmployerHint: "If you had income from a second employer or separate Lohnsteuerbescheinigung",
    optLohnersatz: "Kurzarbeitergeld / Elterngeld / Krankengeld (€)",
    optLohnersatzHint: "Tax-exempt benefits subject to Progressionsvorbehalt",
    optMoving: "Work-Related Moving Costs / Umzugskosten (€)",
    optHandwerker: "Household & Craft Services / § 35a EStG (€)",
    optHandwerkerHint: "Invoiced labor paid via bank transfer",
    aiTitle: "AI Tax Assistant",
    aiWelcome: "Hi! Ask about main steps or special cases (moving, household/crafts, Kurzarbeit/Elterngeld, extra employer) or enter an amount to update fields.",
    aiPlaceholder: "e.g., Moving cost 1200 euro or Childcare 2400 euro",
    askBtn: "Ask",
    elsterSummaryTitle: "ELSTER Cheat Sheet (Line-by-Line Summary)",
    copyBtn: "Copy List",
    copiedBtn: "Copied ✓",
    colArea: "ELSTER Field",
    colDesc: "Description",
    colVal: "Value to Enter",
    disclaimerTitle: "Legal Notice (Guidance Only)",
    disclaimerText: "This tool is provided for informational guidance, refund estimation, and ELSTER line mapping only; it does not constitute formal tax advice (Steuerberatung) or legal representation.",
    steps: [
      {
        key: "brutto",
        title: "1. Annual Gross Salary",
        question: "What is your annual gross salary (Bruttoarbeitslohn, usually line 3) on your Lohnsteuerbescheinigung in €?",
        hint: "Forms the basis for taxable income and refund estimation.",
        elsterRef: "Anlage N — Page 1, Line 6 (Bruttoarbeitslohn)",
      },
      {
        key: "lohnsteuer",
        title: "2. Withheld Income Tax (Lohnsteuer)",
        question: "What is your withheld Lohnsteuer (usually line 4) on your Lohnsteuerbescheinigung in €?",
        hint: "A refund requires tax paid during the year; estimated refund cannot exceed this amount.",
        elsterRef: "Anlage N — Page 1, Line 7 (Einbehaltene Lohnsteuer)",
      },
      {
        key: "homeofficeDays",
        title: "3. Homeoffice Days",
        question: "How many days did you work from home last year?",
        hint: "Calculated at 6 € per day (up to 1,260 € annual cap).",
        elsterRef: "Anlage N — Page 2, Line 45 (Tagespauschale / Homeoffice)",
      },
      {
        key: "commuteKm",
        title: "4. One-Way Commute Distance",
        question: "How many kilometers is your one-way commute between home and work?",
        hint: "Calculated based on the shortest or appropriate one-way route.",
        elsterRef: "Anlage N — Page 2, Line 35 (Entfernungspauschale - km)",
      },
      {
        key: "commuteDays",
        title: "5. Commute Days",
        question: "How many days did you physically commute to work last year?",
        hint: "Calculated as distance × days × 0.30 € (or applicable distance rate).",
        elsterRef: "Anlage N — Page 2, Line 35 (Entfernungspauschale - days)",
      },
      {
        key: "workEquipment",
        title: "6. Work Equipment / Expenses",
        question: "Did you buy work equipment, laptop, monitor, desk, or pay for work courses/books? Total in €?",
        hint: "Included under Werbungskosten (employee expenses).",
        elsterRef: "Anlage N — Page 2, Lines 47-52 (Arbeitsmittel / Fortbildung)",
      },
      {
        key: "sonderausgaben",
        title: "7. Special Expenses (Sonderausgaben)",
        question: "How much did you pay in donations or eligible special expenses (Sonderausgaben) in €?",
        hint: "Helps reduce taxable income under Sonderausgaben.",
        elsterRef: "Mantelbogen / Sonderausgaben — Spenden & Sonstige",
      },
      {
        key: "vorsorgeaufwand",
        title: "8. Additional Insurance / Vorsorgeaufwand",
        question: "Did you pay additional insurance or pension/health contributions outside payroll in €?",
        hint: "Evaluated under Anlage Vorsorgeaufwand.",
        elsterRef: "Anlage Vorsorgeaufwand — Additional Insurance / Contributions",
      },
      {
        key: "childCount",
        title: "9a. Number of Children (Anlage Kind)",
        question: "How many children do you have eligible for child tax consideration?",
        hint: "A separate Anlage Kind is used per child for Kindergeld / Kinderfreibetrag checks.",
        elsterRef: "Anlage Kind — Child Details (Separate form per child)",
      },
      {
        key: "childcareCost",
        title: "9b. Childcare / Kita Costs",
        question: "How much did you spend on childcare / Kita (Kinderbetreuungskosten) last year in €?",
        hint: "An eligible share (e.g., 80%) of childcare costs can be considered.",
        elsterRef: "Anlage Kind — Kinderbetreuungskosten (Childcare Expenses)",
      },
    ],
  },
  de: {
    title: "Steuererstattungs-Assistent Deutschland",
    subtitle: "Schritt für Schritt ausfüllen, voraussichtliche Erstattung und ELSTER-Spickzettel sehen.",
    draftSaved: "Entwurf automatisch gespeichert",
    resetDraft: "Entwurf zurücksetzen",
    refundLabel: "Geschätzte Steuererstattung",
    deductionShort: "Abzüge",
    paidTaxShort: "Gezahlte Lohnsteuer",
    docTitle: "Lohnsteuerbescheinigung (Elektronische Lohnsteuerbescheinigung)",
    docDesc: "PDF oder Bild (JPG/PNG) wählen; Gemini Vision (oder Fallback-OCR) erkennt Zeile 3 und 4 zur Bestätigung.",
    selectFile: "Beleg wählen (PDF / Bild)",
    fillSample: "Beispielbeleg laden",
    pdfRendering: "PDF-Seite wird in ein Bild gerendert...",
    aiScanning: "Gemini Vision liest die Belegzeilen...",
    ocrRunning: (pct) => `Lokale OCR läuft... ${pct}%`,
    ocrDoneAi: "Gemini-Vision-Scan abgeschlossen. Erkannte Beträge bestätigen und übernehmen.",
    ocrDoneLocal: "Lokaler OCR-Scan abgeschlossen. Erkannte Beträge bestätigen und übernehmen.",
    ocrError: "Keine klaren Beträge erkannt; Werte unten manuell eintragen.",
    ocrConfirmPrompt: (brutto, tax) =>
      `Bruttoarbeitslohn (Zeile 3): ${brutto} und Einbehaltene Lohnsteuer (Zeile 4): ${tax} gefunden. Soll ich diese übernehmen?`,
    ocrApplyBtn: "Ja, übernehmen",
    ocrDismissBtn: "Nein, schließen",
    sampleFileName: "Beispiel_Lohnsteuerbescheinigung_2025.pdf",
    sampleStatus: "Beispieldaten geladen: Brutto 58.400 € und Lohnsteuer 9.450 €.",
    stepCounter: (cur, total) => `Schritt ${cur} / ${total}`,
    progressLabel: (pct) => `${pct}% Abgeschlossen`,
    showAll: "Alle Fragen auf einer Seite anzeigen",
    singleStep: "Zur Schritt-für-Schritt-Ansicht",
    elsterMatch: "ELSTER-Zuordnung",
    back: "← Zurück",
    next: "Weiter →",
    optTitle: "Optional / Besondere Fälle",
    optDesc: "Öffnen bei Arbeitgeberwechsel/Zweitjob, Kurzarbeit/Elterngeld, Umzugskosten oder Haushalts-/Handwerkerleistungen.",
    openOpt: "Optionale Felder öffnen",
    closeOpt: "Optionale Felder ausblenden",
    optExtraEmployer: "Zusätzlicher Arbeitgeber / Wechsel Bruttolohn (€)",
    optExtraEmployerHint: "Bei Einkommen aus einem weiteren Arbeitsverhältnis oder weiterer Lohnsteuerbescheinigung",
    optLohnersatz: "Kurzarbeitergeld / Elterngeld / Krankengeld (€)",
    optLohnersatzHint: "Steuerfreie Lohnersatzleistungen (Progressionsvorbehalt)",
    optMoving: "Beruflich veranlasste Umzugskosten (€)",
    optHandwerker: "Haushaltsnahe Dienstleistungen & Handwerker / § 35a EStG (€)",
    optHandwerkerHint: "Rechnung und unbare Zahlung für Arbeitskosten",
    aiTitle: "KI-Steuerassistent",
    aiWelcome: "Hallo! Stelle Fragen zu Hauptschritten oder Sonderfällen (Umzug, Handwerker/Haushalt, Kurzarbeit/Elterngeld, Zweitjob) oder nenne Beträge zum Aktualisieren.",
    aiPlaceholder: "z. B. Umzugskosten 1200 Euro oder Kita 2400 Euro",
    askBtn: "Fragen",
    elsterSummaryTitle: "ELSTER-Spickzettel (Zeilenübersicht)",
    copyBtn: "Liste kopieren",
    copiedBtn: "Kopiert ✓",
    colArea: "ELSTER-Bereich",
    colDesc: "Beschreibung",
    colVal: "Einzutragender Wert",
    disclaimerTitle: "Rechtlicher Hinweis (Nur Orientierungshilfe)",
    disclaimerText: "Diese Anwendung dient ausschließlich zur Orientierung, Schätzung und ELSTER-Zeilenzuordnung und ersetzt keine Steuerberatung (§ 2 StBerG) oder Rechtsberatung.",
    steps: [
      {
        key: "brutto",
        title: "1. Jährlicher Bruttoarbeitslohn",
        question: "Wie hoch ist dein Bruttoarbeitslohn (meist Zeile 3) auf der Lohnsteuerbescheinigung in €?",
        hint: "Grundlage für Einkommensteuerberechnung und Erstattungsschätzung.",
        elsterRef: "Anlage N — Seite 1, Zeile 6 (Bruttoarbeitslohn)",
      },
      {
        key: "lohnsteuer",
        title: "2. Einbehaltene Lohnsteuer",
        question: "Wie hoch ist die einbehaltene Lohnsteuer (meist Zeile 4) auf der Lohnsteuerbescheinigung in €?",
        hint: "Eine Erstattung setzt gezahlte Steuer voraus und ist durch diesen Betrag begrenzt.",
        elsterRef: "Anlage N — Seite 1, Zeile 7 (Einbehaltene Lohnsteuer)",
      },
      {
        key: "homeofficeDays",
        title: "3. Homeoffice-Tage",
        question: "An wie vielen Tagen hast du im letzten Jahr im Homeoffice gearbeitet?",
        hint: "6 € Tagespauschale pro Tag (bis maximal 1.260 € pro Jahr).",
        elsterRef: "Anlage N — Seite 2, Zeile 45 (Tagespauschale / Homeoffice)",
      },
      {
        key: "commuteKm",
        title: "4. Einfache Entfernung (km)",
        question: "Wie viele Kilometer beträgt die einfache Strecke zwischen Wohnung und Arbeitsstätte?",
        hint: "Maßgeblich ist die kürzeste oder verkehrsgünstigste Straßenverbindung.",
        elsterRef: "Anlage N — Seite 2, Zeile 35 (Entfernungspauschale - km)",
      },
      {
        key: "commuteDays",
        title: "5. Arbeitstage (Fahrten zur Arbeit)",
        question: "An wie vielen Tagen bist du im letzten Jahr tatsächlich zur Arbeitsstätte gefahren?",
        hint: "Berechnet aus Entfernung × Tagen × 0,30 € (bzw. entsprechender Pauschale).",
        elsterRef: "Anlage N — Seite 2, Zeile 35 (Entfernungspauschale - Tage)",
      },
      {
        key: "workEquipment",
        title: "6. Arbeitsmittel / Werbungskosten",
        question: "Hast du Arbeitsmittel (Laptop, Monitor, Schreibtisch) oder Fortbildungen bezahlt? Gesamtbetrag in €?",
        hint: "Wird als Werbungskosten berücksichtigt.",
        elsterRef: "Anlage N — Seite 2, Zeilen 47-52 (Arbeitsmittel / Fortbildung)",
      },
      {
        key: "sonderausgaben",
        title: "7. Sonderausgaben",
        question: "Wie hoch sind Spenden oder sonstige Sonderausgaben im Jahr in €?",
        hint: "Kann das zu versteuernde Einkommen mindern.",
        elsterRef: "Mantelbogen / Sonderausgaben — Spenden & Sonstige",
      },
      {
        key: "vorsorgeaufwand",
        title: "8. Vorsorgeaufwand / Zusatzversicherungen",
        question: "Welche zusätzlichen Versicherungs- oder Vorsorgeaufwendungen außerhalb des Lohns sind in € angefallen?",
        hint: "Wird in der Anlage Vorsorgeaufwand erfasst.",
        elsterRef: "Anlage Vorsorgeaufwand — Versicherungen / Vorsorge",
      },
      {
        key: "childCount",
        title: "9a. Anzahl Kinder (Anlage Kind)",
        question: "Für wie viele Kinder besteht Anspruch auf steuerliche Berücksichtigung?",
        hint: "Für jedes Kind wird eine eigene Anlage Kind ausgefüllt (Kindergeld / Kinderfreibetrag).",
        elsterRef: "Anlage Kind — Kinderangaben (Je Kind eine Anlage)",
      },
      {
        key: "childcareCost",
        title: "9b. Kinderbetreuungskosten / Kita",
        question: "Wie hoch waren deine Kinderbetreuungskosten (z. B. Kita/Betreuung) im Jahr in €?",
        hint: "Ein anrechenbarer Anteil (z. B. 80 %) kann als Sonderausgabe berücksichtigt werden.",
        elsterRef: "Anlage Kind — Kinderbetreuungskosten",
      },
    ],
  },
};

const headingStyle = {
  color: "#0f172a",
};

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 20,
  backgroundColor: "#ffffff",
  color: "#111827",
  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.05)",
};

const lightInputStyle = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  backgroundColor: "#ffffff",
  color: "#111827",
  colorScheme: "light",
};

function loadInitialDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function toNum(val) {
  const n = Number(String(val ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function sanitizeDigitsInput(raw) {
  return String(raw ?? "").replace(/[^\d]/g, "");
}

function parseGermanDecimalAmount(raw) {
  if (!raw) return null;
  const cleaned = raw
    .replace(/€/g, "")
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = Number(cleaned);
  return Number.isFinite(num) && num > 0 ? Math.round(num) : null;
}

async function renderPdfFirstPageToBlob(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function extractWithGeminiVision(imageBlob) {
  const base64Data = await blobToBase64(imageBlob);
  const mimeType = imageBlob.type || "image/png";

  const response = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mimeType,
      base64Data,
    }),
  });

  if (!response.ok) {
    throw new Error(`Proxy HTTP ${response.status}`);
  }

  const parsed = await response.json();

  const brutto =
    typeof parsed?.brutto === "number" && Number.isFinite(parsed.brutto) && parsed.brutto >= 500
      ? Math.round(parsed.brutto)
      : null;
  const lohnsteuer =
    typeof parsed?.lohnsteuer === "number" && Number.isFinite(parsed.lohnsteuer) && parsed.lohnsteuer >= 0
      ? Math.round(parsed.lohnsteuer)
      : null;

  return { brutto, lohnsteuer };
}

function extractSlipFiguresFromText(ocrText) {
  const lines = ocrText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let brutto = null;
  let lohnsteuer = null;
  const allCurrencyAmounts = [];

  for (const line of lines) {
    const decimalMatches = line.match(/\d{1,3}(?:[.\s]\d{3})*,\d{2}\b/g) || [];
    const amounts = decimalMatches
      .map(parseGermanDecimalAmount)
      .filter((n) => n !== null && n >= 100);

    for (const amt of amounts) {
      allCurrencyAmounts.push(amt);
    }

    const lower = line.toLowerCase();

    if (
      brutto === null &&
      (lower.includes("bruttoarbeitslohn") || lower.includes("brutto")) &&
      amounts.length > 0
    ) {
      brutto = Math.max(...amounts);
    }

    if (
      lohnsteuer === null &&
      (lower.includes("einbehaltene lohnsteuer") || lower.includes("lohnsteuer")) &&
      !lower.includes("bescheinigung") &&
      amounts.length > 0
    ) {
      lohnsteuer = amounts[amounts.length - 1];
    }
  }

  if (brutto === null && allCurrencyAmounts.length > 0) {
    brutto = Math.max(...allCurrencyAmounts);
  }

  if (lohnsteuer === null && brutto !== null) {
    const smaller = allCurrencyAmounts.filter((a) => a < brutto && a >= 500);
    if (smaller.length > 0) {
      lohnsteuer = Math.max(...smaller);
    }
  }

  return { brutto, lohnsteuer };
}

function extractNumber(text) {
  const match = text.replace(/\./g, "").match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  return Number(match[1].replace(",", "."));
}

function buildAssistantReply(promptText, currentStep, numValues, numOptional, estimatedRefund, lang, onApplyValue, onApplyOptional) {
  const q = promptText.toLowerCase();
  const num = extractNumber(promptText);

  if (lang === "en") {
    if (q.includes("elterngeld") || q.includes("kurzarbeit") || q.includes("benefit")) {
      if (num !== null && num >= 0) {
        onApplyOptional("lohnersatz", String(Math.round(num)));
        return `Updated tax-exempt benefit amount to ${num.toLocaleString("en-US")} € (subject to Progressionsvorbehalt).`;
      }
      return "Benefits like Elterngeld or Kurzarbeitergeld are tax-exempt themselves, but can affect your tax rate on remaining income (Progressionsvorbehalt) and may trigger filing obligations.";
    }
    if (q.includes("moving") || q.includes("umzug")) {
      if (num !== null && num >= 0) {
        onApplyOptional("movingCost", String(Math.round(num)));
        return `Updated moving costs (Umzugskosten) to ${num.toLocaleString("en-US")} €.`;
      }
      return "Work-related moving costs or moves shortening commute times significantly can often be claimed under Werbungskosten.";
    }
    return `You are currently on "${currentStep.title}". ${currentStep.hint} ELSTER mapping: ${currentStep.elsterRef}. Current estimated refund: +${estimatedRefund.toLocaleString("en-US")} €.`;
  }

  if (lang === "de") {
    if (q.includes("elterngeld") || q.includes("kurzarbeit") || q.includes("leistung")) {
      if (num !== null && num >= 0) {
        onApplyOptional("lohnersatz", String(Math.round(num)));
        return `Lohnersatzleistungen auf ${num.toLocaleString("de-DE")} € aktualisiert (Progressionsvorbehalt).`;
      }
      return "Elterngeld, Kurzarbeitergeld oder Krankengeld sind zwar steuerfrei, unterliegen aber dem Progressionsvorbehalt und können eine Abgabepflicht auslösen.";
    }
    if (q.includes("umzug")) {
      if (num !== null && num >= 0) {
        onApplyOptional("movingCost", String(Math.round(num)));
        return `Umzugskosten auf ${num.toLocaleString("de-DE")} € aktualisiert.`;
      }
      return "Beruflich veranlasste Umzüge oder deutliche Verkürzungen des Arbeitswegs können als Werbungskosten berücksichtigt werden.";
    }
    return `Du befindest dich bei "${currentStep.title}". ${currentStep.hint} ELSTER-Zuordnung: ${currentStep.elsterRef}. Geschätzte Erstattung: +${estimatedRefund.toLocaleString("de-DE")} €.`;
  }

  if (q.includes("kurzarbeit") || q.includes("elterngeld") || q.includes("progressionsvorbehalt") || q.includes("ödenek")) {
    if (num !== null && num >= 0) {
      onApplyOptional("lohnersatz", String(Math.round(num)));
      return `Vergisiz ödenek / Lohnersatz tutarını ${num.toLocaleString("de-DE")} € olarak güncelledim. Bu tutar doğrudan vergi kesmez ama artan oranlı dilim etkisinde (Progressionsvorbehalt) dikkate alınır.`;
    }
    return "Kurzarbeitergeld, Elterngeld veya Krankengeld gibi ödemeler vergiden muaf olsa da kalan gelirin vergi dilimini etkileyebilir (Progressionsvorbehalt) ve bazı durumlarda beyanname verme zorunluluğu doğurabilir.";
  }

  if (q.includes("taşınma") || q.includes("umzug")) {
    if (num !== null && num >= 0) {
      onApplyOptional("movingCost", String(Math.round(num)));
      return `Taşınma giderini (Umzugskosten) ${num.toLocaleString("de-DE")} € olarak güncelledim (ELSTER: Anlage N — Werbungskosten).`;
    }
    return "İş nedeniyle veya işe gidiş süresini ciddi ölçüde kısaltmak için yapılan taşınmalarda nakliye ve taşınma masrafları (Umzugskosten) çalışan gideri olarak dikkate alınabilir.";
  }

  if (q.includes("usta") || q.includes("handwerker") || q.includes("ev hizmet") || q.includes("temizlik")) {
    if (num !== null && num >= 0) {
      onApplyOptional("householdHandwerker", String(Math.round(num)));
      return `Ev hizmetleri / usta işçiliği tutarını ${num.toLocaleString("de-DE")} € olarak güncelledim (ELSTER: § 35a EStG).`;
    }
    return "Evde yapılan temizlik/bakım veya usta/tadilat işlerinde faturalı ve banka ödemeli işçilik tutarlarının belirli bir kısmı (§ 35a EStG) doğrudan vergiden düşülebilir.";
  }

  if (q.includes("iş değişik") || q.includes("ikinci iş") || q.includes("ek işveren")) {
    if (num !== null && num >= 0) {
      onApplyOptional("extraEmployerIncome", String(Math.round(num)));
      return `Ek işveren / ikinci maaş brüt tutarını ${num.toLocaleString("de-DE")} € olarak güncelledim (ELSTER: ek Anlage N).`;
    }
    return "Aynı yıl içinde birden fazla işverenden maaş aldıysan veya Steuerklasse 6 uygulandıysa her Lohnsteuerbescheinigung için ayrı Anlage N kaydı girilmesi gerekir.";
  }

  if (q.includes("çocuk") || q.includes("kreş") || q.includes("kind") || q.includes("bakım")) {
    if (num !== null && (q.includes("kreş") || q.includes("bakım") || q.includes("euro") || q.includes("€"))) {
      onApplyValue("childcareCost", String(Math.round(num)));
      return `Çocuk bakım / kreş giderini ${num.toLocaleString("de-DE")} € olarak güncelledim (ELSTER: Anlage Kind — Kinderbetreuungskosten).`;
    }
    if (num !== null && num >= 0 && num <= 15 && q.includes("çocuk")) {
      onApplyValue("childCount", String(Math.round(num)));
      return `Çocuk sayısını ${num} olarak güncelledim (ELSTER: her çocuk için ayrı Anlage Kind).`;
    }
    return "Çocuk bilgileri ve kreş/bakım giderleri ELSTER'de Anlage Kind üzerinden girilir. Çocuk bakım giderlerinde (Kinderbetreuungskosten) uygun koşullarda harcamanın %80'i gider olarak dikkate alınabilir.";
  }

  if (q.includes("sonderausgaben") || q.includes("bağış") || q.includes("özel gider")) {
    if (num !== null && num >= 0) {
      onApplyValue("sonderausgaben", String(Math.round(num)));
      return `Özel gider (Sonderausgaben) tutarını ${num.toLocaleString("de-DE")} € olarak güncelledim.`;
    }
    return "Sonderausgaben (özel giderler), bağışlar (Spenden) ve belirli kişisel giderleri kapsar. Vergi matrahını düşürerek iadeye katkı sağlar.";
  }

  if (q.includes("vorsorge") || q.includes("sigorta")) {
    if (num !== null && num >= 0) {
      onApplyValue("vorsorgeaufwand", String(Math.round(num)));
      return `Ek sigorta / Vorsorgeaufwand tutarını ${num.toLocaleString("de-DE")} € olarak güncelledim (ELSTER: Anlage Vorsorgeaufwand).`;
    }
    return "Vorsorgeaufwand, yaşlılık, sağlık ve bakım sigortalarına ilişkin katkıların yer aldığı ELSTER bölümüdür.";
  }

  if (q.includes("eş") || q.includes("birlikte") || q.includes("ortak") || q.includes("zusammen")) {
    return "Evli çiftler Almanya'da beyannameyi ayrı ayrı (Einzelveranlagung) veya birlikte/ortak (Zusammenveranlagung) verebilir. Gelir farkı varsa çoğu zaman ortak beyanname (Ehegattensplitting) avantajlı olabilir. ELSTER'de ana formda (Mantelbogen) ortak değerlendirme seçeneği işaretlenir ve her iki eşin gelir/gider formları eklenir.";
  }

  if (q.includes("lohnsteuer") || q.includes("kesilen vergi") || q.includes("peşin vergi")) {
    if (num !== null && num >= 0) {
      onApplyValue("lohnsteuer", String(Math.round(num)));
      return `Kesilen Lohnsteuer tutarını ${num.toLocaleString("de-DE")} € olarak güncelledim (ELSTER: Anlage N Sayfa 1, Satır 7).`;
    }
    return `Lohnsteuerbescheinigung belgesinde genellikle 4. satırda yer alan Lohnsteuer, yıl içinde maaşından kesilen gelir vergisidir. Gider kesintileri üzerinden hesaplanan vergi avantajı en fazla ödediğin ${numValues.lohnsteuer.toLocaleString("de-DE")} € tutarında iade üretir; şu anki tahmini iade +${estimatedRefund.toLocaleString("de-DE")} € görünüyor.`;
  }

  if (q.includes("homeoffice") || q.includes("evden")) {
    if (num !== null && num >= 0 && num <= 366) {
      onApplyValue("homeofficeDays", String(Math.round(num)));
      const deduction = Math.min(num * 6, 1260);
      return `Evden çalışma gün sayını ${num} gün olarak güncelledim! Bu değerle ${deduction} € homeoffice gideri hesaplandı (ELSTER: Anlage N Sayfa 2, Satır 45).`;
    }
    const currentDeduction = Math.min(numValues.homeofficeDays * 6, 1260);
    return `Homeoffice (Tagespauschale) için evden çalıştığın her gün 6 € gider yazılır (yıllık üst sınır 1.260 €). Şu anki ${numValues.homeofficeDays} günün için ${currentDeduction} € kesinti hesaplandı. ELSTER'de Anlage N Sayfa 2, Satır 45 alanına girilir.`;
  }

  if (q.includes("yol") || q.includes("km") || q.includes("entfernung") || q.includes("işe gidiş")) {
    if (num !== null && num > 0 && num < 500 && q.includes("km")) {
      onApplyValue("commuteKm", String(Math.round(num)));
      return `İşe tek yön mesafeyi ${num} km olarak güncelledim (ELSTER: Anlage N Sayfa 2, Satır 35).`;
    }
    const currentCommute = Math.round(numValues.commuteKm * 0.3 * numValues.commuteDays);
    return `İşe gidiş geliş gideri (Entfernungspauschale) tek yön mesafe × işe gidiş günü × 0,30 € mantığıyla hesaplanır. Mevcut değerlerinle (${numValues.commuteKm} km × ${numValues.commuteDays} gün) yaklaşık ${currentCommute} € gider oluşuyor. ELSTER'de Anlage N Sayfa 2, Satır 35 alanında yer alır.`;
  }

  if (q.includes("bilgisayar") || q.includes("ekipman") || q.includes("monitör") || q.includes("werbungskosten")) {
    if (num !== null && num >= 0) {
      onApplyValue("workEquipment", String(Math.round(num)));
      return `Mesleki ekipman giderini ${num} € olarak güncelledim (ELSTER: Anlage N Sayfa 2, Satır 47-52).`;
    }
    return "İşin için aldığın bilgisayar, monitör, çalışma masası veya mesleki kurs/kitap harcamaları Werbungskosten (çalışan giderleri) kapsamında düşülebilir. ELSTER'de Anlage N Sayfa 2, Satır 47-52 (Arbeitsmittel) bölümüne yazılır.";
  }

  if (q.includes("lohnsteuerbescheinigung") || q.includes("brüt") || q.includes("maaş")) {
    if (num !== null && num >= 1000) {
      onApplyValue("brutto", String(Math.round(num)));
      return `Yıllık brüt maaşını ${num.toLocaleString("de-DE")} € olarak güncelledim (ELSTER: Anlage N Sayfa 1, Satır 6).`;
    }
    return "Yıl sonunda işvereninden aldığın Lohnsteuerbescheinigung belgesindeki Bruttoarbeitslohn (genellikle 3. satır) yıllık brüt maaşındır. ELSTER'de Anlage N Sayfa 1, Satır 6 ile eşleşir.";
  }

  return `Şu an "${currentStep.title}" adımındasın. ${currentStep.hint} ELSTER karşılığı: ${currentStep.elsterRef}. Nadir durumlar için "Taşınma gideri 1200 euro", "Usta gideri 800 euro" veya "Kurzarbeit 1500 euro" da yazabilirsin (opsiyonel ek gelir: ${numOptional.extraEmployerIncome.toLocaleString("de-DE")} €).`;
}

export default function App() {
  const initialDraft = loadInitialDraft();

  const [lang, setLang] = useState(initialDraft?.lang || "tr");
  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;

  const [stepIndex, setStepIndex] = useState(
    typeof initialDraft?.stepIndex === "number" ? initialDraft.stepIndex : 0
  );
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [showOptionalSection, setShowOptionalSection] = useState(
    Boolean(initialDraft?.showOptionalSection)
  );
  const [aiQuestion, setAiQuestion] = useState("");
  const [copied, setCopied] = useState(false);

  const [ocrState, setOcrState] = useState({
    loading: false,
    stage: "",
    progress: 0,
    fileName: "",
    statusMsg: "",
    isError: false,
    detectedBrutto: null,
    detectedLohnsteuer: null,
  });

  const [aiMessages, setAiMessages] = useState([
    {
      role: "assistant",
      text: (TRANSLATIONS[initialDraft?.lang] || TRANSLATIONS.tr).aiWelcome,
    },
  ]);

  const [values, setValues] = useState({
    ...DEFAULT_VALUES,
    ...(initialDraft?.values || {}),
  });

  const [optionalValues, setOptionalValues] = useState({
    ...DEFAULT_OPTIONAL,
    ...(initialDraft?.optionalValues || {}),
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lang,
          stepIndex,
          showOptionalSection,
          values,
          optionalValues,
        })
      );
    } catch {
      // Storage kotaları veya özel modda sessizce geç
    }
  }, [lang, stepIndex, showOptionalSection, values, optionalValues]);

  const handleResetDraft = () => {
    setStepIndex(0);
    setShowOptionalSection(false);
    setValues({ ...DEFAULT_VALUES });
    setOptionalValues({ ...DEFAULT_OPTIONAL });
    setOcrState({
      loading: false,
      stage: "",
      progress: 0,
      fileName: "",
      statusMsg: "",
      isError: false,
      detectedBrutto: null,
      detectedLohnsteuer: null,
    });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Sessizce geç
    }
  };

  const handleLangChange = (nextLang) => {
    setLang(nextLang);
    setAiMessages((prev) =>
      prev.length === 1 && prev[0].role === "assistant"
        ? [{ role: "assistant", text: TRANSLATIONS[nextLang].aiWelcome }]
        : prev
    );
  };

  const updateValue = (key, rawVal) => {
    const cleaned = sanitizeDigitsInput(rawVal);
    setValues((prev) => ({ ...prev, [key]: cleaned }));
  };

  const updateOptionalValue = (key, rawVal) => {
    const cleaned = sanitizeDigitsInput(rawVal);
    setOptionalValues((prev) => ({ ...prev, [key]: cleaned }));
  };

  const numValues = {
    brutto: toNum(values.brutto),
    lohnsteuer: toNum(values.lohnsteuer),
    homeofficeDays: toNum(values.homeofficeDays),
    commuteKm: toNum(values.commuteKm),
    commuteDays: toNum(values.commuteDays),
    workEquipment: toNum(values.workEquipment),
    sonderausgaben: toNum(values.sonderausgaben),
    vorsorgeaufwand: toNum(values.vorsorgeaufwand),
    childCount: toNum(values.childCount),
    childcareCost: toNum(values.childcareCost),
  };

  const numOptional = {
    extraEmployerIncome: toNum(optionalValues.extraEmployerIncome),
    lohnersatz: toNum(optionalValues.lohnersatz),
    movingCost: toNum(optionalValues.movingCost),
    householdHandwerker: toNum(optionalValues.householdHandwerker),
  };

  const applySampleSlip = () => {
    setValues((prev) => ({
      ...prev,
      brutto: "58400",
      lohnsteuer: "9450",
    }));
    setOcrState({
      loading: false,
      stage: "",
      progress: 100,
      fileName: t.sampleFileName,
      statusMsg: t.sampleStatus,
      isError: false,
      detectedBrutto: null,
      detectedLohnsteuer: null,
    });
  };

  const handleFileScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    setOcrState({
      loading: true,
      stage: isPdf ? "pdf" : GEMINI_API_KEY ? "ai" : "ocr",
      progress: 0,
      fileName: file.name,
      statusMsg: "",
      isError: false,
      detectedBrutto: null,
      detectedLohnsteuer: null,
    });

    try {
      const targetImage = isPdf ? await renderPdfFirstPageToBlob(file) : file;

      let extracted = null;
      let usedAi = false;

      setOcrState((prev) => ({ ...prev, stage: "ai" }));
      try {
        extracted = await extractWithGeminiVision(targetImage);
        usedAi = Boolean(extracted && (extracted.brutto !== null || extracted.lohnsteuer !== null));
      } catch {
        extracted = null;
      }

      if (!usedAi) {
        setOcrState((prev) => ({ ...prev, stage: "ocr", progress: 0 }));
        const result = await Tesseract.recognize(targetImage, "deu+eng", {
          logger: (m) => {
            if (m.status === "recognizing text" && typeof m.progress === "number") {
              setOcrState((prev) => ({
                ...prev,
                progress: Math.round(m.progress * 100),
              }));
            }
          },
        });
        extracted = extractSlipFiguresFromText(result.data.text || "");
      }

      const brutto = extracted?.brutto ?? null;
      const lohnsteuer = extracted?.lohnsteuer ?? null;
      const foundAny = brutto !== null || lohnsteuer !== null;

      setOcrState({
        loading: false,
        stage: "",
        progress: 100,
        fileName: file.name,
        statusMsg: foundAny ? (usedAi ? t.ocrDoneAi : t.ocrDoneLocal) : t.ocrError,
        isError: !foundAny,
        detectedBrutto: brutto,
        detectedLohnsteuer: lohnsteuer,
      });
    } catch {
      setOcrState({
        loading: false,
        stage: "",
        progress: 0,
        fileName: file.name,
        statusMsg: t.ocrError,
        isError: true,
        detectedBrutto: null,
        detectedLohnsteuer: null,
      });
    } finally {
      e.target.value = "";
    }
  };

  const applyDetectedOcrValues = () => {
    setValues((prev) => ({
      ...prev,
      brutto: ocrState.detectedBrutto !== null ? String(ocrState.detectedBrutto) : prev.brutto,
      lohnsteuer: ocrState.detectedLohnsteuer !== null ? String(ocrState.detectedLohnsteuer) : prev.lohnsteuer,
    }));
    setOcrState((prev) => ({
      ...prev,
      detectedBrutto: null,
      detectedLohnsteuer: null,
    }));
  };

  const dismissOcrBox = () => {
    setOcrState((prev) => ({
      ...prev,
      detectedBrutto: null,
      detectedLohnsteuer: null,
    }));
  };

  const homeofficeDeduction = Math.min(numValues.homeofficeDays * 6, 1260);
  const commuteDeduction = numValues.commuteKm * 0.3 * numValues.commuteDays;
  const childcareDeduction = Math.round(numValues.childcareCost * 0.8);
  const handwerkerCredit = Math.round(numOptional.householdHandwerker * 0.2);

  const totalDeduction =
    homeofficeDeduction +
    commuteDeduction +
    numValues.workEquipment +
    numValues.sonderausgaben +
    numValues.vorsorgeaufwand +
    childcareDeduction +
    numOptional.movingCost;

  const rawTaxSaving = Math.round(totalDeduction * 0.3) + handwerkerCredit;
  const estimatedRefund = Math.max(0, Math.min(rawTaxSaving, numValues.lohnsteuer));

  const currentStep = t.steps[stepIndex] || t.steps[0];
  const progressPct = Math.round(((stepIndex + 1) / t.steps.length) * 100);

  const handleAskAi = (e) => {
    e.preventDefault();
    const trimmed = aiQuestion.trim();
    if (!trimmed) return;

    const reply = buildAssistantReply(
      trimmed,
      currentStep,
      numValues,
      numOptional,
      estimatedRefund,
      lang,
      updateValue,
      updateOptionalValue
    );
    setAiMessages((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      { role: "assistant", text: reply },
    ]);
    setAiQuestion("");
  };

  const elsterRows = [
    {
      form: "Anlage N (Seite 1, Zeile 6)",
      label: "Bruttoarbeitslohn",
      value: `${numValues.brutto.toLocaleString("de-DE")} €`,
    },
    {
      form: "Anlage N (Seite 1, Zeile 7)",
      label: "Einbehaltene Lohnsteuer",
      value: `${numValues.lohnsteuer.toLocaleString("de-DE")} €`,
    },
    {
      form: "Anlage N (Seite 2, Zeile 35)",
      label: `Entfernungspauschale (${numValues.commuteDays} × ${numValues.commuteKm} km)`,
      value: `${Math.round(commuteDeduction).toLocaleString("de-DE")} €`,
    },
    {
      form: "Anlage N (Seite 2, Zeile 45)",
      label: `Tagespauschale / Homeoffice (${numValues.homeofficeDays})`,
      value: `${Math.round(homeofficeDeduction).toLocaleString("de-DE")} €`,
    },
    {
      form: "Anlage N (Seite 2, Zeilen 47-52)",
      label: "Arbeitsmittel / Equipment",
      value: `${numValues.workEquipment.toLocaleString("de-DE")} €`,
    },
    {
      form: "Mantelbogen / Sonderausgaben",
      label: "Sonderausgaben / Spenden",
      value: `${numValues.sonderausgaben.toLocaleString("de-DE")} €`,
    },
    {
      form: "Anlage Vorsorgeaufwand",
      label: "Vorsorgeaufwand",
      value: `${numValues.vorsorgeaufwand.toLocaleString("de-DE")} €`,
    },
    {
      form: "Anlage Kind",
      label: `${numValues.childCount} | Kita (${childcareDeduction.toLocaleString("de-DE")} €)`,
      value: `${numValues.childcareCost.toLocaleString("de-DE")} €`,
    },
  ];

  if (numOptional.extraEmployerIncome > 0) {
    elsterRows.push({
      form: "Weitere Anlage N",
      label: "Zusätzlicher Arbeitgeber / Wechsel",
      value: `${numOptional.extraEmployerIncome.toLocaleString("de-DE")} €`,
    });
  }

  if (numOptional.lohnersatz > 0) {
    elsterRows.push({
      form: "Mantelbogen (Progressionsvorbehalt)",
      label: "Lohnersatzleistungen",
      value: `${numOptional.lohnersatz.toLocaleString("de-DE")} €`,
    });
  }

  if (numOptional.movingCost > 0) {
    elsterRows.push({
      form: "Anlage N — Werbungskosten",
      label: "Umzugskosten",
      value: `${numOptional.movingCost.toLocaleString("de-DE")} €`,
    });
  }

  if (numOptional.householdHandwerker > 0) {
    elsterRows.push({
      form: "Mantelbogen — § 35a EStG",
      label: `Haushalt / Handwerker (${handwerkerCredit.toLocaleString("de-DE")} €)`,
      value: `${numOptional.householdHandwerker.toLocaleString("de-DE")} €`,
    });
  }

  const handleCopySummary = async () => {
    const text = [
      `${t.refundLabel}: +${estimatedRefund.toLocaleString("de-DE")} € (${t.deductionShort}: ${Math.round(totalDeduction).toLocaleString("de-DE")} €)`,
      ...elsterRows.map((r) => `- ${r.form} | ${r.label}: ${r.value}`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const hasDetectedBox =
    ocrState.detectedBrutto !== null || ocrState.detectedLohnsteuer !== null;

  const bruttoDisplay =
    ocrState.detectedBrutto !== null ? `${ocrState.detectedBrutto.toLocaleString("de-DE")} €` : "—";
  const taxDisplay =
    ocrState.detectedLohnsteuer !== null ? `${ocrState.detectedLohnsteuer.toLocaleString("de-DE")} €` : "—";

  const loadingMessage =
    ocrState.stage === "pdf"
      ? t.pdfRendering
      : ocrState.stage === "ai"
        ? t.aiScanning
        : t.ocrRunning(ocrState.progress);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
        padding: "28px 16px",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        color: "#0f172a",
      }}
    >
      <div style={{ maxWidth: 780, margin: "0 auto", display: "grid", gap: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "inline-flex", border: "1px solid #cbd5e1", borderRadius: 12, overflow: "hidden", backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)" }}>
            {[
              { code: "tr", label: "Türkçe (TR)" },
              { code: "en", label: "English (EN)" },
              { code: "de", label: "Deutsch (DE)" },
            ].map((item) => {
              const active = lang === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleLangChange(item.code)}
                  style={{
                    padding: "8px 14px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    backgroundColor: active ? "#1d4ed8" : "#ffffff",
                    color: active ? "#ffffff" : "#111827",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{t.draftSaved}</span>

            <button
              type="button"
              onClick={handleResetDraft}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderRadius: 10,
                border: "1px solid #fecaca",
                backgroundColor: "#fff5f5",
                color: "#b91c1c",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {t.resetDraft}
            </button>

            <button
              type="button"
              onClick={() => setShowAllQuestions((prev) => !prev)}
              style={{
                padding: "8px 14px",
                cursor: "pointer",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#111827",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
              }}
            >
              {showAllQuestions ? t.singleStep : t.showAll}
            </button>
          </div>
        </div>

        <div
          style={{
            ...cardStyle,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 460 }}>
            <h1 style={{ ...headingStyle, margin: 0, fontSize: 26, letterSpacing: "-0.02em" }}>{t.title}</h1>
            <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 14, lineHeight: 1.5 }}>{t.subtitle}</p>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #ecfdf5 0%, #dcfce7 100%)",
              border: "1px solid #86efac",
              borderRadius: 14,
              padding: "14px 20px",
              minWidth: 220,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: "#166534" }}>{t.refundLabel}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#15803d", marginTop: 2 }}>
              +{estimatedRefund.toLocaleString("de-DE")} €
            </div>
            <div style={{ fontSize: 12, color: "#334155", marginTop: 4 }}>
              {t.deductionShort}: <strong>{Math.round(totalDeduction).toLocaleString("de-DE")} €</strong> · {t.paidTaxShort}:{" "}
              <strong>{numValues.lohnsteuer.toLocaleString("de-DE")} €</strong>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <strong style={{ ...headingStyle, fontSize: 15 }}>{t.docTitle}</strong>
              <div style={{ fontSize: 13, color: "#475569", marginTop: 3 }}>{t.docDesc}</div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <label
                style={{
                  padding: "9px 13px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#f8fafc",
                  color: "#111827",
                  cursor: ocrState.loading ? "wait" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {t.selectFile}
                <input
                  type="file"
                  accept="image/*,application/pdf,.pdf"
                  disabled={ocrState.loading}
                  onChange={handleFileScan}
                  style={{ display: "none" }}
                />
              </label>

              <button
                type="button"
                disabled={ocrState.loading}
                onClick={applySampleSlip}
                style={{
                  padding: "9px 14px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: "#0f766e",
                  color: "#ffffff",
                  cursor: ocrState.loading ? "wait" : "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {t.fillSample}
              </button>
            </div>
          </div>

          {ocrState.loading && (
            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: "#1d4ed8", backgroundColor: "#eff6ff", padding: "9px 12px", borderRadius: 10 }}>
              {loadingMessage} ({ocrState.fileName})
            </div>
          )}

          {!ocrState.loading && ocrState.statusMsg && (
            <div
              style={{
                marginTop: 12,
                fontSize: 12,
                color: ocrState.isError ? "#92400e" : "#065f46",
                backgroundColor: ocrState.isError ? "#fffbeb" : "#ecfdf5",
                border: `1px solid ${ocrState.isError ? "#fde68a" : "#a7f3d0"}`,
                padding: "9px 12px",
                borderRadius: 10,
              }}
            >
              <strong>{ocrState.fileName}:</strong> {ocrState.statusMsg}
            </div>
          )}

          {hasDetectedBox && (
            <div
              style={{
                marginTop: 12,
                padding: 14,
                borderRadius: 12,
                backgroundColor: "#f0f9ff",
                border: "1px solid #bae6fd",
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 13, color: "#0f172a", lineHeight: 1.45 }}>
                {t.ocrConfirmPrompt(bruttoDisplay, taxDisplay)}
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={applyDetectedOcrValues}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: "#0284c7",
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {t.ocrApplyBtn}
                </button>
                <button
                  type="button"
                  onClick={dismissOcrBox}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "#111827",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t.ocrDismissBtn}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
              {t.stepCounter(stepIndex + 1, t.steps.length)}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>
              {t.progressLabel(progressPct)}
            </span>
          </div>

          <div
            style={{
              width: "100%",
              height: 10,
              backgroundColor: "#e2e8f0",
              borderRadius: 999,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: "linear-gradient(90deg, #2563eb 0%, #16a34a 100%)",
                borderRadius: 999,
                transition: "width 0.25s ease",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {t.steps.map((s, idx) => {
              const isCurrent = idx === stepIndex && !showAllQuestions;
              const isDone = idx < stepIndex;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    setShowAllQuestions(false);
                    setStepIndex(idx);
                  }}
                  title={s.title}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: isCurrent ? "1px solid #1d4ed8" : "1px solid #e2e8f0",
                    backgroundColor: isCurrent ? "#1d4ed8" : isDone ? "#dcfce7" : "#f8fafc",
                    color: isCurrent ? "#ffffff" : isDone ? "#166534" : "#475569",
                    fontSize: 12,
                    fontWeight: isCurrent || isDone ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {!showAllQuestions ? (
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ fontSize: 13, color: "#2563eb", fontWeight: 700 }}>{currentStep.title}</div>
            <h2 style={{ ...headingStyle, margin: "8px 0", fontSize: 20, lineHeight: 1.35 }}>{currentStep.question}</h2>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "#475569", lineHeight: 1.5 }}>{currentStep.hint}</p>

            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={values[currentStep.key]}
              onChange={(e) => updateValue(currentStep.key, e.target.value)}
              style={{ ...lightInputStyle, width: "100%", padding: 12, fontSize: 18, fontWeight: 600, boxSizing: "border-box" }}
            />

            <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
              {t.elsterMatch}: <strong>{currentStep.elsterRef}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
              <button
                type="button"
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  fontWeight: 600,
                  cursor: stepIndex === 0 ? "not-allowed" : "pointer",
                  opacity: stepIndex === 0 ? 0.5 : 1,
                }}
              >
                {t.back}
              </button>

              <button
                type="button"
                disabled={stepIndex === t.steps.length - 1}
                onClick={() => setStepIndex((i) => Math.min(t.steps.length - 1, i + 1))}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: stepIndex === t.steps.length - 1 ? "#94a3b8" : "#16a34a",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: stepIndex === t.steps.length - 1 ? "not-allowed" : "pointer",
                }}
              >
                {t.next}
              </button>
            </div>
          </div>
        ) : (
          <div style={cardStyle}>
            {t.steps.map((s) => (
              <label key={s.key} style={{ display: "block", marginBottom: 14, fontSize: 14 }}>
                <strong>{s.title}</strong> — {s.question}
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={values[s.key]}
                  onChange={(e) => updateValue(s.key, e.target.value)}
                  style={{ ...lightInputStyle, display: "block", width: "100%", marginTop: 6, boxSizing: "border-box" }}
                />
              </label>
            ))}
          </div>
        )}

        <div style={{ ...cardStyle, backgroundColor: "#fffbeb", borderColor: "#fde68a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <strong style={{ ...headingStyle, fontSize: 15 }}>{t.optTitle}</strong>
              <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>{t.optDesc}</div>
            </div>

            <button
              type="button"
              onClick={() => setShowOptionalSection((prev) => !prev)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid #d97706",
                backgroundColor: "#ffffff",
                color: "#92400e",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {showOptionalSection ? t.closeOpt : t.openOpt}
            </button>
          </div>

          {showOptionalSection && (
            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              <label style={{ display: "block", fontSize: 14 }}>
                <strong>{t.optExtraEmployer}</strong> — {t.optExtraEmployerHint}
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={optionalValues.extraEmployerIncome}
                  onChange={(e) => updateOptionalValue("extraEmployerIncome", e.target.value)}
                  style={{ ...lightInputStyle, display: "block", width: "100%", marginTop: 6, boxSizing: "border-box" }}
                />
              </label>

              <label style={{ display: "block", fontSize: 14 }}>
                <strong>{t.optLohnersatz}</strong> — {t.optLohnersatzHint}
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={optionalValues.lohnersatz}
                  onChange={(e) => updateOptionalValue("lohnersatz", e.target.value)}
                  style={{ ...lightInputStyle, display: "block", width: "100%", marginTop: 6, boxSizing: "border-box" }}
                />
              </label>

              <label style={{ display: "block", fontSize: 14 }}>
                <strong>{t.optMoving}</strong>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={optionalValues.movingCost}
                  onChange={(e) => updateOptionalValue("movingCost", e.target.value)}
                  style={{ ...lightInputStyle, display: "block", width: "100%", marginTop: 6, boxSizing: "border-box" }}
                />
              </label>

              <label style={{ display: "block", fontSize: 14 }}>
                <strong>{t.optHandwerker}</strong> — {t.optHandwerkerHint}
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={optionalValues.householdHandwerker}
                  onChange={(e) => updateOptionalValue("householdHandwerker", e.target.value)}
                  style={{ ...lightInputStyle, display: "block", width: "100%", marginTop: 6, boxSizing: "border-box" }}
                />
              </label>
            </div>
          )}
        </div>

        <div style={{ ...cardStyle, backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }}>
          <h3 style={{ ...headingStyle, marginTop: 0, color: "#1e3a8a", fontSize: 17 }}>{t.aiTitle}</h3>
          <div style={{ maxHeight: 230, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {aiMessages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  backgroundColor: m.role === "user" ? "#1d4ed8" : "#ffffff",
                  color: m.role === "user" ? "#ffffff" : "#111827",
                  padding: "10px 14px",
                  borderRadius: 12,
                  maxWidth: "85%",
                  fontSize: 14,
                  lineHeight: 1.45,
                  border: m.role === "assistant" ? "1px solid #dbeafe" : "none",
                  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                }}
              >
                {m.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleAskAi} style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder={t.aiPlaceholder}
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              style={{ ...lightInputStyle, flex: 1 }}
            />
            <button
              type="submit"
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t.askBtn}
            </button>
          </form>
        </div>

        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <h3 style={{ ...headingStyle, margin: 0, fontSize: 17 }}>{t.elsterSummaryTitle}</h3>
            <button
              type="button"
              onClick={handleCopySummary}
              style={{
                padding: "7px 13px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                color: "#111827",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {copied ? t.copiedBtn : t.copyBtn}
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#334155" }}>
                <th style={{ padding: "9px 6px" }}>{t.colArea}</th>
                <th style={{ padding: "9px 6px" }}>{t.colDesc}</th>
                <th style={{ padding: "9px 6px", textAlign: "right" }}>{t.colVal}</th>
              </tr>
            </thead>
            <tbody>
              {elsterRows.map((row) => (
                <tr key={row.form} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "11px 6px", fontWeight: 700, color: "#0f172a" }}>{row.form}</td>
                  <td style={{ padding: "11px 6px", color: "#475569" }}>{row.label}</td>
                  <td style={{ padding: "11px 6px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: "14px 18px",
            backgroundColor: "#f8fafc",
            color: "#475569",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "#0f172a" }}>{t.disclaimerTitle}:</strong> {t.disclaimerText}
        </div>
      </div>
    </div>
  );
}