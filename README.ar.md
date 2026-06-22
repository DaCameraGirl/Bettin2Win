<p align="center">
  <img src="docs/assets/readme-hero.svg" alt="Bettin2Win — دليل الاحتمالات للمبتدئين" width="100%"/>
</p>

# Bettin2Win

<p align="center" dir="rtl">
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸_English-131a26?style=for-the-badge" alt="English"/></a>
  <a href="README.es.md"><img src="https://img.shields.io/badge/🇪🇸_Español-131a26?style=for-the-badge" alt="Español"/></a>
  <a href="README.fr.md"><img src="https://img.shields.io/badge/🇫🇷_Français-131a26?style=for-the-badge" alt="Français"/></a>
  <a href="README.de.md"><img src="https://img.shields.io/badge/🇩🇪_Deutsch-131a26?style=for-the-badge" alt="Deutsch"/></a>
  <a href="README.pt-BR.md"><img src="https://img.shields.io/badge/🇧🇷_Português-131a26?style=for-the-badge" alt="Português"/></a>
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_中文-131a26?style=for-the-badge" alt="中文"/></a>
  <a href="README.ja.md"><img src="https://img.shields.io/badge/🇯🇵_日本語-131a26?style=for-the-badge" alt="日本語"/></a>
  <a href="README.ko.md"><img src="https://img.shields.io/badge/🇰🇷_한국어-131a26?style=for-the-badge" alt="한국어"/></a>
  <a href="README.it.md"><img src="https://img.shields.io/badge/🇮🇹_Italiano-131a26?style=for-the-badge" alt="Italiano"/></a>
  <a href="README.ar.md"><img src="https://img.shields.io/badge/🇸🇦_العربية-4ade80?style=for-the-badge" alt="العربية"/></a>
</p>

<p align="center">
  <img src="docs/assets/slot-machine.svg" alt="ماكينة سلوت متحركة من Bettin2Win — تعلّم الخط، ليست كازينو" width="420"/>
</p>

<p align="center" dir="rtl">
  <a href="https://dacameragirl.github.io/Bettin2Win/"><img src="https://img.shields.io/badge/🌐_عرض_مباشر-4ade80?style=for-the-badge" alt="عرض مباشر"/></a>
  <a href="https://bettin2win.onrender.com/health"><img src="https://img.shields.io/badge/⚙️_حالة_المحرك-131a26?style=for-the-badge" alt="حالة المحرك"/></a>
</p>

<div dir="rtl">

**دليل الاحتمالات للمبتدئين — ليس موقع مراهنات.** قارن الخطوط المباشرة، وترجم الاحتمالات إلى
لغة بسيطة، واحسب العوائد المحتملة، وتعلّم معنى كل رهان قبل أن تراهن في مكان آخر. يشمل كرة القدم
الأمريكية، البيسبول، كرة السلة، الهوكي، كرة القدم، الغولف، NASCAR، سباق الخيل، وسباق الكلاب السلوقية.

لا نقبل رهانات. للاستخدام المعلوماتي فقط. راهن بمسؤولية.

> **الحالة:** مزودو البيانات المباشرة نشطون. يحاول التطبيق المصادر الحقيقية أولاً ولا يلجأ إلى
> البدائل إلا عندما تكون كل المزودين المُعدّين لذلك الرياضة غير متاحين، أو نفدت الحصة، أو
> تفتقد بيانات الاعتماد. راجع [حالة المزودين](#حالة-المزودين).

## أبرز الميزات

| الميزة | الوظيفة |
|---|---|
| **اشرح هذا الرهان** | زر بنفسجي على كل بطاقة — العوائد، الاحتمال الضمني، وما يلزم للفوز |
| **كيف يعمل Bettin2Win** | مسار من خمس خطوات للزوار الجدد |
| **تأثير الطقس** | شارات للمباريات في الهواء الطلق (رياح، مطر، حر، مسار) — سياق وليس نصيحة مراهنة |
| **بطاقات كرة السلة** | بطاقة واحدة لكل مباراة مع تبويبات Moneyline / Spread / Total / الحركة |
| **فلاتر اللوحة** | للمبتدئين فقط · مباريات بأسعار · مباريات مباشرة · عرض الكل |
| **شريط السوق** | أسعار مباشرة للمؤشرات والأسهم الكبرى من Yahoo Finance |
| **لماذا ليس الجميع أغنياء؟** | شرح المفضّل/الأقل حظاً/هامش البيت في دليل المبتدئين ولوحة الشرح |
| **حالة المزودين** | صحة التغذية بلغة بسيطة — أخضر عند نجاح البدائل |
| **وضع العرض** | لوحة عينة دون اتصال لاستكشاف الواجهة |

## محتوى المستودع

مونوريبو pnpm + Turborepo:

```text
apps/
  web/                لوحة React + Vite
services/
  odds-engine/        يستطلع المزودين، يوحّد الاحتمالات، يكتشف الحركة
  ai-analyst/         يحوّل تحركات الأسعار إلى رؤى بلغة بسيطة
packages/
  types/              أنواع مجال مشتركة
.github/workflows/    CI والإصدار وPages وفحوصات الصحة
```

كل مزود خلف محوّل يُرجع نفس شكل `SportEvent`. الواجهة لا ترى البيانات الخام.

## لقطات الشاشة

التطبيق المباشر: [dacameragirl.github.io/Bettin2Win](https://dacameragirl.github.io/Bettin2Win/)

![لوحة احتمالات كرة السلة](docs/screenshots/dashboard.png)

![لوحة حالة المزودين](docs/screenshots/provider-status.png)

![شريط جانبي لحركة السوق](docs/screenshots/market-movement.png)

![دليل المبتدئين](docs/screenshots/beginner-guide.png)

إعادة التوليد: `pnpm screenshots` (يتطلب Chromium عبر Playwright).

## البدء السريع

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

- الويب: http://localhost:5173
- محرك الاحتمالات: http://localhost:4000
- فحص الصحة: http://localhost:4000/health

## حالة المزودين

| الرياضة | سلسلة المزودين | المصادقة | السلوك الحالي |
|---|---|---|---|
| كرة القدم الأمريكية | The Odds API → Sportsbook API → **ESPN NFL** | `ODDS_API_KEY`, `RAPIDAPI_KEY` | خطوط ESPN المجانية عند فشل حصة The Odds API |
| البيسبول | The Odds API → Tank01 MLB → **ESPN MLB** → MLB Stats | `ODDS_API_KEY`, `RAPIDAPI_KEY` | ESPN + MLB Stats يبقيان اللوحة نشطة |
| كرة السلة | The Odds API → Sportsbook API → **ESPN NBA** | `ODDS_API_KEY`, `RAPIDAPI_KEY` | نتائج WNBA/NBA/جامعي + خطوط DraftKings من ESPN |
| الهوكي | The Odds API → Sportsbook API → **ESPN NHL** → NHL scoreboard | `ODDS_API_KEY`, `RAPIDAPI_KEY` | لوحة NHL الرسمية مع أسعار ESPN |
| كرة القدم | BetMiner → football-prediction-api → **ESPN soccer** | `RAPIDAPI_KEY` | تنبؤات + خطوط ESPN ثلاثية مجانية |
| الغولف | **ESPN golf** | لا شيء | ترتيب وبطولات من ESPN |
| NASCAR | **ESPN NASCAR** → TheRundown | `THERUNDOWN_API_KEY` (اختياري) | ترتيب السباق من ESPN؛ TheRundown عند وجود مفتاح |
| سباق الخيل | Horse Racing (RapidAPI) → The Racing API | `RAPIDAPI_KEY`, `RACING_API_USERNAME`, `RACING_API_PASSWORD` | برامج + نتائج؛ ميزانية للطبقة المجانية |
| الكلاب السلوقية | Greyhound Racing UK → **GBGB RSS** → BetsAPI | `RAPIDAPI_KEY`, `BETSAPI_KEY` | بديل RSS مجاني من GBGB للمملكة المتحدة |

## المفاتيح

ضع المفاتيح في `.env` فقط (مستبعد من git).

- The Odds API: `ODDS_API_KEY`
- RapidAPI: `RAPIDAPI_KEY`
- TheRundown: `THERUNDOWN_API_KEY`
- The Racing API: `RACING_API_USERNAME`, `RACING_API_PASSWORD`
- BetsAPI: `BETSAPI_KEY`

إذا لُصق مفتاح في محادثة أو لقطة شاشة، قم بتدويره.

## الأوامر

| الأمر | الوظيفة |
|---|---|
| `pnpm dev` | تشغيل التطبيقات/الخدمات في وضع المراقبة |
| `pnpm build` | بناء المونوريبو بالكامل |
| `pnpm typecheck` | فحص الأنواع |
| `pnpm test` | اختبارات الوحدة |
| `pnpm screenshots` | التقاط لقطات README |

## المساهمون

- Angela — توجيه المنتج، إعداد المزودين، الاختبار
- Claude — التنفيذ السابق وسير عمل GitHub
- Dex (Codex) — بدائل المزودين، واجهة اللوحة
- Grok — تأثير الطقس، تجميع المباريات، الفلاتر، README والترجمة

## قانوني

تطبيق تحليل/إعلام وليس شركة مراهنات. تختلف شروط المزودين حسب الخطة والاستخدام؛ راجع
قواعد كل مزود قبل إعادة توزيع البيانات أو الاستخدام التجاري.

</div>