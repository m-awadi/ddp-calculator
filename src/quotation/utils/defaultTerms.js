export const QUOTATION_COLORS = {
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
    textMuted: '#6A7B8C'     // Cool Gray for secondary text
};

export const DEFAULT_COMPANY_INFO = {
    name: 'Arabian Trade Route',
    address: 'Doha, Qatar\nP.O. Box 12345',
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
                ]
            },
            {
                id: 'timeline-section',
                title: 'المدة الزمنية:',
                items: [
                    'مدة التصنيع: 45 يوم تبدأ من تاريخ استلام الدفعة المقدمة.',
                    'مدة التحميل وإجراءات التخليص الجمركي قبل انطلاق المركب في الصين 5-7 أيام.',
                    'مدة الشحن البحري من المصنع الى ميناء حمد المتوقع: 25 يوم.',
                    'مدة التخليص الجمركي في ميناء حمد - الدوحة: يومي عمل من تاريخ تفريغ الحاوية.'
                ]
            },
            {
                id: 'payment-section',
                title: 'الدفع:',
                items: [
                    '50% مقدماً عند تأكيد الطلب و50% قبل الشحن من المصنع.',
                    'التحويل بالدولار الأمريكي للأسعار عالية بالريال القطري إسترشادي حسب سعر الصرف.'
                ]
            },
            {
                id: 'docs-section',
                title: 'المستندات المطلوبة:',
                items: [
                    'يتم الاستيراد باسم شركة العميل ويلتزم العميل بتوفير جميع المستندات والسجلات الرسمية للاستيراد من الصين و اللازمة لعملية الإفراج الجمركي.'
                ]
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
                ]
            }
        ]
    }
];
