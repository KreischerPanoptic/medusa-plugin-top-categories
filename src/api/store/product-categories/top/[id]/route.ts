import type { 
    MedusaRequest, 
    MedusaResponse,
    ProductCategoryService,
    ProductService,
    ProductCategory
} from "@medusajs/medusa"
import { MedusaError } from "@medusajs/utils"

  
export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const {id} = req.params;
    const {expand} = req.query;
    console.log(req)
    console.log(expand)

    const categoriesService: ProductCategoryService = req.scope.resolve(
        "productCategoryService"
      )
    let result: [ProductCategory[],number] = expand ? await categoriesService.listAndCount({id: id}, {take: 1, skip: 0, relations: [ `${expand}`]}) : await categoriesService.listAndCount({id: id}, {take: 1, skip: 0});

      if (result[1]<=0) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Product category with id: ${id} was not found`
        )
      }
      let category = result[0][0]
      let updateMetadata = category.metadata;
      let count = parseInt(`${category.metadata.visitsCount}`)
      if(isNaN(count))
        count = 0;
      updateMetadata.visitsCount = count + 1

      category = await categoriesService.update(id, {
        metadata: updateMetadata
      })

      result = expand ? await categoriesService.listAndCount({id: id}, {take: 1, skip: 0, relations: [ `${expand}` || '']}) :
      await categoriesService.listAndCount({id: id}, {take: 1, skip: 0});
      category = result[0][0]
      
      let categoryResponse = {
        id: category.id,
        created_at: category.created_at,
        updated_at: category.updated_at,
        parent_category_id: category.parent_category_id,
        rank: category.rank,
        parent_category: category.parent_category,
        category_children: category.category_children,
        products: category.products,
        name: category?.name || '',
        description: category?.description || '',
        thumbnail: category?.metadata?.thumbnailImageUrl || '',
        visits: category?.metadata?.visitsCount || 0,
        handle: category?.handle || '',
        is_active: category?.is_active || false,
        is_internal: category?.is_internal || false,
        metadata: category.metadata,
    }

      res.json({ product_category: categoryResponse })
}