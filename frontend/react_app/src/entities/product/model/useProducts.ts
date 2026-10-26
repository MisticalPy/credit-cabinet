import { useEffect, useState } from "react";
import { products as productsApi } from "../../../shared/api/endpoints";
import type { Product } from "../../../shared/api/types";

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        productsApi
            .list()
            .then((list) => {
                if (!cancelled) setProducts(list);
            })
            .catch((e: unknown) => {
                if (!cancelled) setError(e instanceof Error ? e.message : "Ошибка загрузки");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return { products, loading, error };
}