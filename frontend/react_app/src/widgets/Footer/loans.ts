export type Range = [min: number, max: number];

export interface LoanOption {
    id: 'open' | 'develop' | 'current';
    title: string;
    amount: Range; // RUB
    payment: Range; // RUB
    term: Range; // months
}

export interface Sphere {
    id: string;
    title: string;
    options: LoanOption[];
}

const titles = {
    open: 'Открытие бизнеса',
    develop: 'Развитие бизнеса',
    current: 'Текущие траты',
} as const;

const make = (
    id: string,
    title: string,
    open: [Range, Range, Range],
    develop: [Range, Range, Range],
    current: [Range, Range, Range],
): Sphere => ({
    id,
    title,
    options: [
        { id: 'open', title: titles.open, amount: open[0], payment: open[1], term: open[2] },
        { id: 'develop', title: titles.develop, amount: develop[0], payment: develop[1], term: develop[2] },
        { id: 'current', title: titles.current, amount: current[0], payment: current[1], term: current[2] },
    ],
});

export const SPHERES: Sphere[] = [
    make(
        'retail',
        'Розничная торговля',
        [[500_000, 5_000_000], [12_700, 458_400], [12, 60]],
        [[300_000, 2_000_000], [10_900, 351_100], [6, 36]],
        [[50_000, 500_000], [17_200, 507_600], [1, 3]],
    ),
    make(
        'services',
        'Сфера услуг и Гостинично-Ресторанный Бизнес',
        [[700_000, 7_000_000], [17_800, 641_800], [12, 60]],
        [[200_000, 1_500_000], [10_000, 263_300], [6, 24]],
        [[30_000, 300_000], [15_400, 304_600], [1, 2]],
    ),
    make(
        'production',
        'Производство и Переработка',
        [[1_500_000, 15_000_000], [31_600, 748_900], [24, 84]],
        [[400_000, 4_000_000], [11_800, 366_800], [12, 48]],
        [[100_000, 1_500_000], [34_400, 1_522_600], [1, 3]],
    ),
    make(
        'wholesale',
        'Оптовая торговля и логистика',
        [[1_000_000, 10_000_000], [25_400, 916_800], [12, 60]],
        [[300_000, 3_000_000], [10_900, 526_600], [6, 36]],
        [[200_000, 2_000_000], [102_300, 2_030_100], [1, 2]],
    ),
    make(
        'construction',
        'Строительство и Ремонт',
        [[800_000, 8_000_000], [20_400, 733_500], [12, 60]],
        [[350_000, 3_500_000], [12_700, 614_400], [6, 36]],
        [[100_000, 1_000_000], [34_400, 1_015_100], [1, 3]],
    ),
    make(
        'it',
        'IT, Маркетинг и Интеллектуальный бизнес',
        [[300_000, 3_000_000], [10_900, 275_100], [12, 36]],
        [[150_000, 1_500_000], [7_500, 263_300], [6, 24]],
        [[50_000, 400_000], [50_800, 406_100], [1, 1]],
    ),
    make(
        'other',
        'Другое',
        [[300_000, 3_000_000], [10_900, 275_100], [12, 36]],
        [[100_000, 1_000_000], [5_000, 175_600], [6, 24]],
        [[20_000, 200_000], [10_300, 203_100], [1, 2]],
    ),
];