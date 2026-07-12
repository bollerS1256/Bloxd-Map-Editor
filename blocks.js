/* إعدادات الخطوط والتصفير الأساسي لسرعة التحميل */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: sans-serif;
}

body {
    background-color: #f0f0f0;
    color: #333;
    overflow: hidden; /* يمنع نزول الصفحة بالكامل ليبقى المحرر ثابتاً */
    height: 100vh;
}

/* الحاوية الرئيسية للموقع */
#app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
}

/* الشريط العلوي */
header {
    background-color: #222;
    color: #fff;
    padding: 10px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #444;
}

header h1 {
    font-size: 1.2rem;
}

/* الأزرار الأساسية */
.primary-btn {
    background-color: #28a745;
    color: white;
    border: none;
    padding: 8px 16px;
    font-size: 0.9rem;
    font-weight: bold;
    cursor: pointer;
    border-radius: 3px;
}

.primary-btn:hover {
    background-color: #218838;
}

/* تقسيم الشاشة الرئيسي */
.main-layout {
    display: flex;
    flex: 1;
    overflow: hidden;
}

/* الشريط الجانبي للبلوكات */
.sidebar {
    width: 220px;
    background-color: #e5e5e5;
    border-left: 2px solid #ccc;
    padding: 10px;
    display: flex;
    flex-direction: column;
}

.sidebar h3 {
    font-size: 1rem;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid #bbb;
}

/* شبكة اختيار البلوكات */
.block-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    overflow-y: auto; /* يسمح بالتمرير داخل شريط البلوكات فقط */
    flex: 1;
}

/* أزرار البلوكات الفردية */
.block-item {
    background-color: #fff;
    border: 1px solid #aaa;
    padding: 8px;
    text-align: center;
    cursor: pointer;
    font-size: 0.8rem;
    border-radius: 3px;
}

.block-item:hover {
    background-color: #ddd;
}

.block-item.selected {
    border: 2px solid #0056b3;
    background-color: #cce5ff;
    font-weight: bold;
}

/* مساحة الرسم الرئيسية */
.editor-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 15px;
    background-color: #fafafa;
}

.controls-row {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 0.9rem;
}

.controls-row select {
    padding: 4px 8px;
}

/* حاوية شبكة الرسم (المربعات) */
#grid-container {
    display: grid;
    /* سيتم تحديد عدد الأعمدة تلقائياً عبر الجافاسكريبت حسب الحجم 32x32 */
    gap: 1px;
    background-color: #ddd; /* لون الحدود بين المربعات */
    padding: 1px;
    border: 1px solid #aaa;
    width: fit-content;
    margin: auto;
    max-width: 100%;
    max-height: 80vh;
}

/* المربع الفردي داخل شبكة الرسم */
.grid-cell {
    width: 18px;
    height: 18px;
    background-color: #fff; /* هواء افتراضياً */
    cursor: crosshair;
}

/* ألوان افتراضية مسطحة للبلوكات لتخفيف العبء عن المعالج */
.cell-air { background-color: #ffffff; }
.cell-grass { background-color: #55b655; }
.cell-stone { background-color: #888888; }
.cell-dirt { background-color: #8b5a2b; }
.cell-wood { background-color: #a0522d; }
