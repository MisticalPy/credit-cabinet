import type { Product, Purpose } from "../../../shared/api/types";

export const PURPOSE_ORDER: Purpose[] = [
    "working_capital",
    "equipment",
    "development",
    "refinancing",
];

export const PURPOSE_TITLES: Record<Purpose, string> = {
    working_capital: "Оборотные средства",
    equipment: "Оборудование",
    development: "Развитие бизнеса",
    refinancing: "Рефинансирование",
};

export type ProductGroup = { id: Purpose; title: string; products: Product[] };

/** Tabs for the catalog: only purposes that have at least one product. */
export function groupByPurpose(list: Product[]): ProductGroup[] {
    return PURPOSE_ORDER.map((id) => ({
        id,
        title: PURPOSE_TITLES[id],
        products: list.filter((p) => p.purpose === id),
    })).filter((g) => g.products.length > 0);
}