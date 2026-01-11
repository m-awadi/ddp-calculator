export const QUOTATION_COLORS = {
    primary: '#D65A1F',      // Burnt Orange - Primary accent
    secondary: '#EC722D',    // Light Burnt Orange - Secondary accent  
    navy: '#1B2B38',         // Navy Blue - Primary text, headings
    coolGray: '#6A7B8C',     // Cool Gray - Secondary text, outlines
    lightGray: '#F5F5F5',    // Light Gray - Background blocks, cards
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
        sections: [
            {
                id: 'delivery-section',
                title: 'التسليم:',
                items: [
                    'التسليم يشمل جميع الرسوم الجمركية والشحن حتى الباب (DDP)',
                    'Delivery includes all customs duties and shipping to door (DDP)'
                ]
            },
            {
                id: 'timeline-section',
                title: 'المدة الزمنية:',
                items: [
                    'مدة التوريد: 30-45 يوم عمل من تاريخ تأكيد الطلب',
                    'Supply time: 30-45 working days from order confirmation'
                ]
            },
            {
                id: 'payment-section',
                title: 'الدفع:',
                items: [
                    'دفعة مقدمة: 30% عند تأكيد الطلب',
                    'الرصيد: 70% عند الشحن',
                    'Down payment: 30% upon order confirmation',
                    'Balance: 70% upon shipment'
                ]
            }
        ]
    },
    {
        id: 'bank-block',
        title: 'التحويلات:',
        sections: [
            {
                id: 'bank-section',
                title: 'يتم التحويل على الحساب البنكي الخاص بالشركة بالتفاصيل التالية:',
                items: [
                    'Account name: Arabian Trade Route',
                    'Account number/IBAN: QA00XXXX0000000000000000',
                    'Bank name: Qatar National Bank',
                    'Bank SWIFT/BIC: QNBAQAQA',
                    'Bank address: Doha, Qatar',
                    'Bank country: Qatar'
                ]
            }
        ]
    }
];
