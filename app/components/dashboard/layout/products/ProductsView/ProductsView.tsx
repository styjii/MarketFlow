import React from "react";
import { Package, Globe, FileText } from "lucide-react";
import { DeleteProductModal } from "./DeleteProductModal";
import { InventoryHeader } from "./Inventory/InventoryHeader";
import { InventoryStatCard } from "./Inventory/InventoryStatCard";
import { SearchBar } from "./SearchBar";
import { StatusFilterDropdown } from "./StatusFilterDropdown";
import { ProductsTable } from "./ProductsTable";
import { useProductFilters } from "./hooks/useProductFilters";
import { useDeleteProduct } from "./hooks/useDeleteProduct";
import type { Product } from "~/types/products";

interface MyProductsViewProps {
  products: Product[];
}

export const ProductsView: React.FC<MyProductsViewProps> = React.memo(function MyProductsView({
  products,
}) {
  const { searchQuery, statusFilter, filteredProducts, stats, setSearchQuery, setStatusFilter } =
    useProductFilters(products);

  const { targetProduct, isSubmitting, requestDelete, confirmDelete, cancelDelete } =
    useDeleteProduct();

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-0">
      <InventoryHeader count={stats.total} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InventoryStatCard title="Total" value={stats.total} icon={Package} color="primary" />
        <InventoryStatCard title="En ligne" value={stats.published} icon={Globe} color="success" />
        <InventoryStatCard title="Brouillons" value={stats.drafts} icon={FileText} color="warning" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher par titre ou catégorie..."
        />
        <StatusFilterDropdown value={statusFilter} onChange={setStatusFilter} />
      </div>

      <ProductsTable
        products={filteredProducts}
        searchQuery={searchQuery}
        onDeleteRequest={requestDelete}
      />

      <DeleteProductModal
        product={targetProduct}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
});
