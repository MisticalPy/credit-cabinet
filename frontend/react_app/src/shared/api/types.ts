export type User = { id: number; username: string; role: "client" | "manager" };

export type BusinessType = "ip" | "ooo";
export type Industry =
    | "trade" | "food" | "services" | "manufacturing"
    | "construction" | "transport" | "it" | "other";

export type Profile = {
    business_type: BusinessType;
    company_name: string;
    inn: string;
    industry: Industry;
    monthly_revenue: string;
    registration_date: string;
    business_age_months: number;
};

export type Purpose = "working_capital" | "equipment" | "development" | "refinancing";
export type Collateral = "none" | "property" | "guarantee";

export type Product = {
    id: number;
    name: string;
    description: string;
    purpose: Purpose;
    legal_form: "ip" | "ooo" | "any";
    collateral_type: Collateral;
    min_amount: string;
    max_amount: string;
    min_term_months: number;
    max_term_months: number;
    rate: string;
    min_business_age_months: number;
    min_monthly_revenue: string;
};

export type Payment = { monthly_payment: string; total: string; overpayment: string };
export type Match = { product: Product; payment: Payment };

export type ApplicationIn = {
    product_id: number;
    amount: string;
    term_months: number;
    comment?: string;
};

export type ApplicationOut = {
    id: number;
    product_id: number;
    product_name: string;
    amount: string;
    term_months: number;
    rate: string;
    monthly_payment: string;
    comment: string;
    status: string;
    manager_comment: string;
    counter_amount: string | null;
    counter_term_months: number | null;
    created_at: string;
    updated_at: string;
};

export type ApplicationHistory = {
    from_status: string;
    to_status: string;
    comment: string;
    created_at: string;
};

export type ApplicationDetail = ApplicationOut & { history: ApplicationHistory[] };
