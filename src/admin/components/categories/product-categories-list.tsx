import React, { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { dropRight, flatMap, get } from "lodash";
import Nestable from "react-nestable";

// import "react-nestable/dist/styles/index.css";
import NestableCategoriesStyle from "./utils/nestable-style";

import { AiOutlineDrag } from "react-icons/ai";
import { useToggleState, clx } from "@medusajs/ui";
import { PlaySolid } from "@medusajs/icons";
import { ProductCategory } from "@medusajs/medusa";
import { adminProductCategoryKeys, useAdminUpdateProductCategory, useMedusa } from "medusa-react";

import ProductCategoryListItemDetails from "./product-category-list-item-details";

import { Notify } from "../../types/notify";
import { flattenCategoryTree } from "./utils/categories-utils";

type ProductCategoriesListProps = {
  categories: ProductCategory[];
  notify: Notify;
};

/**
 * Draggable list that renders product categories tree view.
 */
function ProductCategoriesList(props: ProductCategoriesListProps) {
  const { client } = useMedusa();
  const queryClient = useQueryClient();
  const [isUpdating, enableUpdating, disableUpdating] = useToggleState(false);
  const [isError, enableError, disableError] = useToggleState(false);
  const { categories, notify } = props;
  const flattenedCategories = flattenCategoryTree(categories);

  const updateMutations = new Map(
    flattenedCategories.map(category => [
      category.id,
      useAdminUpdateProductCategory(category.id)
    ])
  );

  const onItemDrop = useCallback(
    async (params: {
      dragItem: ProductCategory;
      items: ProductCategory[];
      targetPath: number[];
    }) => {
      enableUpdating();
      let parentId = null;
      const { dragItem, items, targetPath } = params;
      const [rank] = targetPath.slice(-1);

      if (targetPath.length > 1) {
        const path = dropRight(
          flatMap(targetPath.slice(0, -1), (item) => [
            item,
            "category_children",
          ])
        );

        const newParent = get(items, path);
        parentId = newParent.id;
      }

      try {
        disableError();
        
        const mutation = updateMutations.get(dragItem.id);
        if (!mutation) {
          throw new Error("Failed to find mutation for category");
        }
        //@ts-ignore
        await mutation.mutateAsync({
          parent_category_id: parentId,
          rank,
          metadata: {
            ...dragItem.metadata,
            visitsCount: dragItem.metadata?.visitsCount || 0
          },
          name: dragItem.name,
          handle: dragItem.handle,
          ...(dragItem.is_active !== undefined && { is_active: Boolean(dragItem.is_active) === true }),
          ...(dragItem.is_internal !== undefined && { is_internal: Boolean(dragItem.is_internal) === true }),
          description: dragItem.description || "",
          visits: dragItem.metadata?.visitsCount || 0
        });

        notify.success("Успіх", "Успішно оновлено дерево категорій");
        await queryClient.invalidateQueries(adminProductCategoryKeys.lists());
      } catch (e) {
        console.error("Category update error:", e);
        notify.error("Помилка", "Не вдалось оновити дерево категорій");
        enableError();
      } finally {
        disableUpdating();
      }
    },
    [queryClient, notify, enableError, disableError, enableUpdating, disableUpdating, updateMutations]
  );

  const NestableList = (
    <Nestable
      items={categories}
      collapsed={true}
      onChange={onItemDrop}
      childrenProp="category_children"
      // Adding an unreasonably high number here to prevent us from
      // setting a hard limit  on category depth. This should be decided upon
      // by consumers of medusa after considering the pros and cons to the approach
      maxDepth={99}
      renderItem={({ item, depth, handler, collapseIcon }) => (
        <ProductCategoryListItemDetails
          item={item as ProductCategory}
          categories={flattenedCategories}
          depth={depth}
          handler={handler}
          collapseIcon={collapseIcon}
          notify={notify}
        />
      )}
      handler={
        <AiOutlineDrag className="cursor-move" color="#a1a1aa" size={24} />
      }
      renderCollapseIcon={({ isCollapsed }) => (
        <PlaySolid
          color="#a1a1aa"
          className={clx("cursor-pointer", { "rotate-90": !isCollapsed })}
        />
      )}
    />
  );
  return (
    <div className={clx("relative", { "pointer-events-none": isUpdating })}>
      <NestableCategoriesStyle />
      {NestableList}
      {isUpdating && (
        <div className="absolute w-full top-0 bottom-0 cursor-progress" />
      )}
    </div>
  );
}

export default React.memo(ProductCategoriesList); // Memo prevents list flicker on reorder
