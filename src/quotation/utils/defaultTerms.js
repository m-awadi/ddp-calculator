// Detect dark mode preference
const isDarkMode = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

export const QUOTATION_COLORS = isDarkMode ? {
    // Dark mode colors
    primary: '#E8752F',      // Brighter Burnt Orange for dark mode
    secondary: '#F0883A',    // Lighter Burnt Orange
    navy: '#E8E8E8',         // Light text for dark backgrounds
    coolGray: '#A0AEC0',     // Lighter gray for dark mode
    lightGray: '#2D3748',    // Dark gray for cards
    inputBackground: '#374151', // Dark input background
    desertSand: '#1F2937',   // Dark card background
    background: '#111827',   // Dark page background
    white: '#1F2937',        // Dark card surface
    textDark: '#F3F4F6',     // Light text for dark mode
    textMuted: '#9CA3AF',    // Muted text for dark mode
    inputText: '#F3F4F6',    // Light input text for dark mode
    inputBorder: '#4B5563'   // Visible border in dark mode
} : {
    // Light mode colors (original)
    primary: '#D65A1F',      // Burnt Orange - Primary accent
    secondary: '#EC722D',    // Light Burnt Orange - Secondary accent
    navy: '#1B2B38',         // Navy Blue - Primary text, headings
    coolGray: '#6A7B8C',     // Cool Gray - Secondary text, outlines
    lightGray: '#F5F5F5',    // Light Gray - Background blocks, cards
    inputBackground: '#EFE6D8', // Warm neutral for input backgrounds
    desertSand: '#EADCC2',   // Desert Sand - Soft background tint
    background: '#FFFDF7',   // Background White - Page background
    white: '#FFFFFF',        // Pure white for contrast
    textDark: '#1B2B38',     // Navy Blue for primary text
    textMuted: '#6A7B8C',    // Cool Gray for secondary text
    inputText: '#1B2B38',    // Dark input text for light mode
    inputBorder: '#6A7B8C'   // Border color for light mode
};

export const DEFAULT_COMPANY_INFO = {
    name: 'Arabian Trade Route',
    address: '2/F, TOWER 1, TERN CENTRE, 237 QUEEN\'S ROAD CENTRAL\nSheung Wan\nHONG KONG',
    email: 'info@arabiantraderoute.com'
};

export const DEFAULT_CUSTOM_BLOCKS = [
    {
        id: 'terms-block',
        title: 'معلومات خاصة بالعرض:',
        images: [],
        sections: [
            {
                id: 'delivery-section',
                title: 'التسليم:',
                items: [
                    'يتم التسليم الى مخازن العميل'
                ],
                image: null
            },
            {
                id: 'timeline-section',
                title: 'المدة الزمنية:',
                items: [
                    'مدة التصنيع: 45 يوم تبدأ من تاريخ استلام الدفعة المقدمة.',
                    'مدة التحميل وإجراءات التخليص الجمركي قبل انطلاق المركب في الصين 5-7 أيام.',
                    'مدة الشحن البحري من المصنع الى ميناء حمد المتوقع: 25 يوم.',
                    'مدة التخليص الجمركي في ميناء حمد - الدوحة: يومي عمل من تاريخ تفريغ الحاوية.'
                ],
                image: null
            },
            {
                id: 'payment-section',
                title: 'الدفع:',
                items: [
                    '50% مقدماً عند تأكيد الطلب و50% قبل الشحن من المصنع.',
                    'التحويل بالدولار الأمريكي للأسعار عالية بالريال القطري إسترشادي حسب سعر الصرف.'
                ],
                image: null
            },
            {
                id: 'docs-section',
                title: 'المستندات المطلوبة:',
                items: [
                    'يتم الاستيراد باسم شركة العميل ويلتزم العميل بتوفير جميع المستندات والسجلات الرسمية للاستيراد من الصين و اللازمة لعملية الإفراج الجمركي.'
                ],
                image: null
            }
        ]
    },
    {
        id: 'bank-block',
        title: 'التحويلات:',
        images: [],
        sections: [
            {
                id: 'bank-section',
                title: 'يتم التحويل على الحساب البنكي الخاص بالشركة بالتفاصيل التالية:',
                items: [
                    'Account name: Arabian Trade Route Limited',
                    'Account number/IBAN: 796501610',
                    'Bank name: DBS Bank (Hong Kong) Limited',
                    'Bank SWIFT/BIC: DHBHKHKH',
                    "Bank address: G/F, The Center, 99 Queen's Road Central,Central, Hong Kong",
                    'Bank country: Hong Kong'
                ],
                image: null
            }
        ]
    }
];
