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

    const categoriesService: ProductCategoryService = req.scope.resolve(
        "productCategoryService"
      )
    let category: ProductCategory = await categoriesService.retrieve(id);

      if (!category) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Product category with id: ${id} was not found`
        )
      }

      let updateMetadata = category.metadata;
      let count = parseInt(`${category.metadata.visitsCount}`)
      if(isNaN(count))
        count = 0;
      updateMetadata.visitsCount = count + 1

      category = await categoriesService.update(id, {
        metadata: updateMetadata
      })

      res.json({ product_category: category })
}