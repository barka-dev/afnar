import { SIZES, type Cut, type Size, type ProductColor } from "@/lib/products";

/**
 * The original catalogue. Imported into the database the first time the site starts with an empty database;
 * after that, everything is managed in the admin dashboard (/admin).
 */

type SeedProduct = {
  slug: string;
  name: string;
  nameAr: string;
  cut: Cut;
  price: number;
  compareAtPrice?: number;
  shortDescription: string;
  description: string;
  fabric: string;
  details: string[];
  ar: { shortDescription: string; description: string; fabric: string; details: string[] };
  sizes: Size[];
  colors: Omit<ProductColor, "images">[];
  isNew?: boolean;
  featured?: boolean;
};

export const SEED_CATEGORIES: { slug: Cut; name: string; nameAr: string; description: string; descriptionAr: string; color: string }[] = [
  { slug: "classique", name: "Classiques", nameAr: "كلاسيكية", description: "Coupes intemporelles, lignes épurées", descriptionAr: "قصّات خالدة وخطوط بسيطة", color: "#1C2541" },
  { slug: "brodee", name: "Brodées", nameAr: "مطرّزة", description: "Broderies fines aux fils dorés", descriptionAr: "تطريز رقيق بخيوط ذهبية", color: "#5E1A26" },
  { slug: "papillon", name: "Papillon", nameAr: "فراشة", description: "Manches amples, tombé aérien", descriptionAr: "أكمام واسعة وانسدال خفيف", color: "#D4C1A5" },
  { slug: "kimono", name: "Kimonos", nameAr: "كيمونو", description: "Ouvertes, à superposer", descriptionAr: "مفتوحة، تُلبس فوق الملابس", color: "#6B6A4B" },
];

const ALL: Size[] = [...SIZES];

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    slug: "abaya-nour",
    name: "Abaya Nour",
    nameAr: "عباية نور",
    cut: "classique",
    price: 690,
    shortDescription: "La pièce essentielle, en crêpe fluide.",
    description:
      "Nour incarne l'élégance discrète : une coupe droite légèrement évasée, des manches ajustées aux poignets et un tombé impeccable. Une abaya pensée pour toutes les occasions, du quotidien aux rendez-vous importants.",
    fabric: "Crêpe Nida premium",
    details: ["Coupe droite évasée", "Poignets boutonnés", "Tissu opaque, non transparent", "Lavage délicat 30°"],
    sizes: ALL,
    isNew: true,
    featured: true,
    ar: {
      shortDescription: "القطعة الأساسية، من الكريب الانسيابي.",
      description:
        "تجسّد نور الأناقة الهادئة: قصّة مستقيمة متّسعة قليلاً، وأكمام مضبوطة عند المعصم، وانسدال لا تشوبه شائبة. عباية صُمّمت لكل المناسبات، من الحياة اليومية إلى المواعيد المهمة.",
      fabric: "كريب ندى فاخر",
      details: ["قصّة مستقيمة متّسعة", "أساور بأزرار", "قماش معتم غير شفاف", "غسيل لطيف على 30°"],
    },
    colors: [
      { name: "Noir", nameAr: "أسود", hex: "#141414", stock: { "52": 3, "54": 5, "56": 0, "58": 2, "60": 1 } },
      { name: "Bleu nuit", nameAr: "أزرق ليلي", hex: "#1C2541", stock: { "52": 0, "54": 2, "56": 4, "58": 0, "60": 0 } },
      { name: "Taupe", nameAr: "بني رمادي", hex: "#8B7D6B", stock: { "52": 0, "54": 0, "56": 0, "58": 0, "60": 0 } },
    ],
  },
  {
    slug: "abaya-yasmine",
    name: "Abaya Yasmine",
    nameAr: "عباية ياسمين",
    cut: "brodee",
    price: 890,
    shortDescription: "Broderie dorée au col et aux poignets.",
    description:
      "Yasmine sublime la simplicité d'une broderie fine aux fils dorés, posée à la main sur le col, le plastron et les poignets. Une pièce de caractère pour les fêtes et les grandes occasions.",
    fabric: "Crêpe soie de Médine",
    details: ["Broderie fil doré", "Col rond", "Doublure aux épaules", "Nettoyage à sec recommandé"],
    sizes: ALL,
    featured: true,
    ar: {
      shortDescription: "تطريز ذهبي على الياقة والأساور.",
      description:
        "تُبرز ياسمين بساطة تطريز رقيق بخيوط ذهبية، مُطرّز يدوياً على الياقة والصدر والأساور. قطعة ذات طابع مميّز للأعياد والمناسبات الكبرى.",
      fabric: "كريب حرير المدينة",
      details: ["تطريز بخيط ذهبي", "ياقة دائرية", "بطانة عند الكتفين", "يُنصح بالتنظيف الجاف"],
    },
    colors: [
      { name: "Noir", nameAr: "أسود", hex: "#121212", stock: { "52": 1, "54": 2, "56": 3, "58": 1, "60": 0 } },
      { name: "Bordeaux", nameAr: "عنابي", hex: "#5E1A26", stock: { "52": 0, "54": 1, "56": 2, "58": 0, "60": 1 } },
      { name: "Vert émeraude", nameAr: "أخضر زمردي", hex: "#0F4C3A", stock: { "52": 2, "54": 0, "56": 1, "58": 2, "60": 0 } },
    ],
  },
  {
    slug: "abaya-farasha",
    name: "Abaya Farasha",
    nameAr: "عباية فراشة",
    cut: "papillon",
    price: 790,
    shortDescription: "Coupe papillon, mouvement aérien.",
    description:
      "Inspirée de la coupe papillon, Farasha offre une liberté de mouvement incomparable. Ses manches amples se prolongent jusqu'à la taille pour un drapé gracieux à chaque pas.",
    fabric: "Mousseline doublée",
    details: ["Coupe papillon", "Doublure intégrale", "Taille unique ajustable", "Lavage main"],
    sizes: ["54", "56", "58"],
    isNew: true,
    featured: true,
    ar: {
      shortDescription: "قصّة الفراشة، حركة خفيفة كالنسيم.",
      description:
        "مستوحاة من قصّة الفراشة، تمنحك فراشة حرية حركة لا مثيل لها. تمتدّ أكمامها الواسعة حتى الخصر لتمنح انسدالاً رشيقاً مع كل خطوة.",
      fabric: "موسلين مبطّن",
      details: ["قصّة فراشة", "بطانة كاملة", "مقاس واحد قابل للتعديل", "غسيل يدوي"],
    },
    colors: [
      { name: "Beige sable", nameAr: "بيج رملي", hex: "#D4C1A5", stock: { "54": 2, "56": 3, "58": 1 } },
      { name: "Rose poudré", nameAr: "وردي فاتح", hex: "#D8B4AE", stock: { "54": 0, "56": 2, "58": 0 } },
      { name: "Noir", nameAr: "أسود", hex: "#151515", stock: { "54": 4, "56": 0, "58": 2 } },
    ],
  },
  {
    slug: "kimono-lina",
    name: "Kimono Lina",
    nameAr: "كيمونو لينا",
    cut: "kimono",
    price: 750,
    shortDescription: "Ouvert, à porter sur une robe ou un pantalon.",
    description:
      "Lina se porte ouvert, sur une robe ou un ensemble, pour une silhouette moderne et fluide. Ses manches kimono et sa ceinture amovible permettent de multiples façons de le porter.",
    fabric: "Lin & viscose",
    details: ["Devant ouvert", "Ceinture amovible", "Poches latérales", "Lavage 30°"],
    sizes: ALL,
    featured: true,
    ar: {
      shortDescription: "مفتوح، يُلبس فوق فستان أو سروال.",
      description:
        "يُلبس لينا مفتوحاً فوق فستان أو طقم، لإطلالة عصرية وانسيابية. أكمامه على طراز الكيمونو وحزامه القابل للفصل يتيحان طرقاً متعددة لارتدائه.",
      fabric: "كتان وفيسكوز",
      details: ["واجهة مفتوحة", "حزام قابل للفصل", "جيوب جانبية", "غسيل على 30°"],
    },
    colors: [
      { name: "Crème", nameAr: "كريمي", hex: "#EDE3D1", stock: { "52": 2, "54": 3, "56": 2, "58": 1, "60": 1 } },
      { name: "Kaki", nameAr: "كاكي", hex: "#6B6A4B", stock: { "52": 0, "54": 1, "56": 0, "58": 2, "60": 0 } },
      { name: "Noir", nameAr: "أسود", hex: "#161616", stock: { "52": 1, "54": 0, "56": 3, "58": 0, "60": 2 } },
    ],
  },
  {
    slug: "abaya-salma",
    name: "Abaya Salma",
    nameAr: "عباية سلمى",
    cut: "classique",
    price: 590,
    compareAtPrice: 690,
    shortDescription: "Légère et facile, pour le quotidien.",
    description:
      "Salma est l'abaya du quotidien par excellence : légère, infroissable et agréable à porter toute la journée. Sa coupe fluide flatte toutes les silhouettes.",
    fabric: "Crêpe infroissable",
    details: ["Infroissable", "Manches droites", "Séchage rapide", "Lavage machine 30°"],
    sizes: ALL,
    ar: {
      shortDescription: "خفيفة وعملية، للاستعمال اليومي.",
      description:
        "سلمى هي عباية الحياة اليومية بامتياز: خفيفة، لا تتجعّد، ومريحة طوال اليوم. قصّتها الانسيابية تناسب جميع القامات.",
      fabric: "كريب مقاوم للتجعّد",
      details: ["لا يتجعّد", "أكمام مستقيمة", "سريع الجفاف", "غسيل بالآلة على 30°"],
    },
    colors: [
      { name: "Gris perle", nameAr: "رمادي لؤلؤي", hex: "#A7A39C", stock: { "52": 2, "54": 2, "56": 0, "58": 1, "60": 0 } },
      { name: "Noir", nameAr: "أسود", hex: "#131313", stock: { "52": 4, "54": 6, "56": 5, "58": 3, "60": 2 } },
    ],
  },
  {
    slug: "abaya-layla",
    name: "Abaya Layla",
    nameAr: "عباية ليلى",
    cut: "brodee",
    price: 1190,
    shortDescription: "Pièce de soirée, broderie sur toute la longueur.",
    description:
      "Layla est notre pièce de soirée : une broderie dorée court le long du plastron jusqu'à l'ourlet, sublimée par un tissu au tombé satiné. Idéale pour les mariages et les soirées.",
    fabric: "Satin crêpe",
    details: ["Broderie longue au fil doré", "Fini satiné", "Manches évasées", "Nettoyage à sec"],
    sizes: ALL,
    featured: true,
    ar: {
      shortDescription: "قطعة سهرة، بتطريز على كامل الطول.",
      description:
        "ليلى هي قطعتنا للسهرات: تطريز ذهبي يمتدّ على طول الصدر حتى الحاشية، يزيده جمالاً قماش بلمعة الساتان. مثالية للأعراس والسهرات.",
      fabric: "ساتان كريب",
      details: ["تطريز طويل بخيط ذهبي", "لمعة ساتان", "أكمام متّسعة", "تنظيف جاف"],
    },
    colors: [
      { name: "Noir", nameAr: "أسود", hex: "#0F0F0F", stock: { "52": 0, "54": 1, "56": 1, "58": 0, "60": 0 } },
      { name: "Bleu roi", nameAr: "أزرق ملكي", hex: "#1F3A8A", stock: { "52": 0, "54": 0, "56": 2, "58": 1, "60": 0 } },
    ],
  },
  {
    slug: "abaya-amira",
    name: "Abaya Amira",
    nameAr: "عباية أميرة",
    cut: "kimono",
    price: 820,
    shortDescription: "Ouverte, ceinturée, aux tons chauds.",
    description:
      "Amira se distingue par ses tons chauds et sa ceinture à nouer qui marque délicatement la taille. Une abaya ouverte qui s'accorde aussi bien avec une robe qu'avec un ensemble.",
    fabric: "Crêpe texturé",
    details: ["Ceinture à nouer", "Devant ouvert", "Manches larges", "Lavage délicat"],
    sizes: ["52", "54", "56", "58"],
    isNew: true,
    ar: {
      shortDescription: "مفتوحة، بحزام، وبألوان دافئة.",
      description:
        "تتميّز أميرة بألوانها الدافئة وحزامها المعقود الذي يحدّد الخصر برقّة. عباية مفتوحة تتناسق مع الفستان كما مع الطقم.",
      fabric: "كريب بملمس بارز",
      details: ["حزام للعقد", "واجهة مفتوحة", "أكمام واسعة", "غسيل لطيف"],
    },
    colors: [
      { name: "Chocolat", nameAr: "بني شوكولا", hex: "#4A2F23", stock: { "52": 1, "54": 2, "56": 1, "58": 0 } },
      { name: "Camel", nameAr: "كاميل", hex: "#B08458", stock: { "52": 0, "54": 0, "56": 2, "58": 1 } },
    ],
  },
  {
    slug: "abaya-sofia",
    name: "Abaya Sofia",
    nameAr: "عباية صوفيا",
    cut: "papillon",
    price: 650,
    shortDescription: "Papillon en mousseline — bientôt de retour.",
    description:
      "Sofia, notre coupe papillon la plus légère, a rencontré un franc succès. Elle sera bientôt de retour — contactez-nous sur WhatsApp pour être prévenue.",
    fabric: "Mousseline",
    details: ["Coupe papillon", "Très légère", "Doublure intégrale", "Lavage main"],
    sizes: ["54", "56", "58"],
    ar: {
      shortDescription: "فراشة من الموسلين — تعود قريباً.",
      description:
        "لاقت صوفيا، أخفّ قصّات الفراشة لدينا، نجاحاً كبيراً. ستعود قريباً — راسلينا على واتساب ليصلك الخبر.",
      fabric: "موسلين",
      details: ["قصّة فراشة", "خفيفة جداً", "بطانة كاملة", "غسيل يدوي"],
    },
    colors: [
      { name: "Lilas", nameAr: "ليلكي", hex: "#A898B5", stock: { "54": 0, "56": 0, "58": 0 } },
      { name: "Noir", nameAr: "أسود", hex: "#141414", stock: { "54": 0, "56": 0, "58": 0 } },
    ],
  },
  {
    slug: "abaya-hiba",
    name: "Abaya Hiba",
    nameAr: "عباية هبة",
    cut: "classique",
    price: 540,
    shortDescription: "Coupe sobre, trois coloris intemporels.",
    description:
      "Hiba est l'expression de la sobriété : une coupe simple et soignée, un tissu doux et opaque, trois coloris faciles à porter en toute saison.",
    fabric: "Jazz premium",
    details: ["Coupe sobre", "Tissu doux et opaque", "Toutes saisons", "Lavage machine 30°"],
    sizes: ALL,
    ar: {
      shortDescription: "قصّة رصينة، بثلاثة ألوان خالدة.",
      description:
        "هبة عنوان الرصانة: قصّة بسيطة ومتقنة، وقماش ناعم ومعتم، وثلاثة ألوان سهلة الارتداء في كل المواسم.",
      fabric: "جاز فاخر",
      details: ["قصّة رصينة", "قماش ناعم ومعتم", "لكل المواسم", "غسيل بالآلة على 30°"],
    },
    colors: [
      { name: "Noir", nameAr: "أسود", hex: "#151515", stock: { "52": 3, "54": 3, "56": 2, "58": 2, "60": 1 } },
      { name: "Marine", nameAr: "كحلي", hex: "#22304A", stock: { "52": 1, "54": 0, "56": 2, "58": 0, "60": 0 } },
      { name: "Mauve", nameAr: "موف", hex: "#7A5C74", stock: { "52": 0, "54": 1, "56": 1, "58": 0, "60": 0 } },
    ],
  },
  {
    slug: "kimono-zineb",
    name: "Kimono Zineb",
    nameAr: "كيمونو زينب",
    cut: "kimono",
    price: 980,
    shortDescription: "Lin lavé, finitions passepoilées.",
    description:
      "Zineb est taillé dans un lin lavé d'une grande douceur, rehaussé de finitions passepoilées. Un kimono long et structuré qui apporte une touche d'exception aux tenues de jour.",
    fabric: "Lin lavé",
    details: ["Lin lavé", "Finitions passepoilées", "Fentes latérales", "Lavage 30°"],
    sizes: ["54", "56", "58", "60"],
    ar: {
      shortDescription: "كتان مغسول، بحواشٍ متقنة.",
      description:
        "صُمّم زينب من كتان مغسول بالغ النعومة، تزيّنه حواشٍ متقنة. كيمونو طويل ومُهيكل يضفي لمسة استثنائية على إطلالات النهار.",
      fabric: "كتان مغسول",
      details: ["كتان مغسول", "حواشٍ متقنة", "فتحات جانبية", "غسيل على 30°"],
    },
    colors: [
      { name: "Écru", nameAr: "عاجي", hex: "#E5DCCB", stock: { "54": 1, "56": 2, "58": 0, "60": 1 } },
      { name: "Olive", nameAr: "زيتوني", hex: "#5B5E3C", stock: { "54": 0, "56": 0, "58": 0, "60": 0 } },
    ],
  },
];
