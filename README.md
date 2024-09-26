# Product categories with thumbnails and sorting by visits (top visited categories)

Medusa admin UI modul with category thumbnail support and top by visits of category, using metadata for store the information about thumbnail and visits count. For now only available language of UI is Ukrainian, but I'm working on a translations.

[Medusa Website](https://medusajs.com/) | [Medusa Repository](https://github.com/medusajs/medusa)

## Features

- Product category thumbnail
- Category visits count
- REST API Endpoints for top categories
- Easy UI management of all product categories (**WARNING:** only available language - **Ukrainian**, for now)

---

## Prerequisites

- [Medusa backend](https://docs.medusajs.com/development/backend/install)

---

## How to Install

1\. Run the following command in the directory of the Medusa backend:

```bash
yarn add medusa-plugin-top-categories
```

2\. In `medusa-config.js` add the following configuration at the end of the `plugins` array:

```js
const plugins = [
  // ...
  {
    resolve: `medusa-plugin-top-categories`,
    options: {
      enableUI: true,
    },
  },
];
```

---

## Screenshots

![image](https://github.com/user-attachments/assets/498f655d-a7eb-4862-bfda-45bfd8db8a66)

![image](https://github.com/user-attachments/assets/4a1092b2-a597-4f71-9c86-7f2165f0cf5c)

---

## Test the Plugin

Run the following command in the directory of the Medusa backend to run the backend:

```bash
yarn dev
```

In StoreFront project you can use the thumbnail by

```js
category.metadata?.thumbnailImageUrl
```

Example:

```jsx
import { getCategoriesList } from "@lib/data"

const { product_categories } = await getCategoriesList()

const thumbnails = productCategories.map((category) => (
    <img
      src={decodeURI((category.metadata?.thumbnailImageUrl as string) || "")}
      alt={category.name}
    />
  ))
```

In StoreFront project you can use the visits count (if for any reason you would need too) by

```js
category.metadata?.visitsCount
```

Example:

```jsx
import { getCategoriesList } from "@lib/data"

const { product_categories } = await getCategoriesList()

const categoriesVisits = productCategories.map((category) => (
    <p>
      {`${((category.metadata?.visitsCount as number) || 0)}`}
    </p>
  ))
```

---

## REST API Endpoints

#### Store Endpoints:

1. `/store/product-categories/visit/[id]`:
  1.1. GET with mandatory query parameter of **ID** of category
  1.2. Increments the visitsCounts of selected category and returns updated category
2. `/store/product-categories/top`:
  2.1. GET with optional query parameters of **limit**, **offset** and **expand**
  2.2 Returns sorted by visitsCount categories, top of categories, can be expanded like regular categories endpoint. Returned categories further enriched by two new properties: **thumbnail** and **visits**
3. `/store/product-categories/top/[id]`:
  3.1. GET with optional query parameters of **limit**, **offset** and **expand**, and mandatory query parameter of **ID** of category
  3.2. Increments the visitsCounts of selected category and returns updated category. Returned category further enriched by two new properties: **thumbnail** and **visits**
4. `/store/product-categories/top/handle/[handle]`:
  4.1. GET with optional query parameters of **limit**, **offset** and **expand**, and mandatory query parameter of **handle** of category
  4.2. Increments the visitsCounts of selected category and returns updated category. Returned category further enriched by two new properties: **thumbnail** and **visits**

---

## Homepage

- [Product categories with thumbnail and visits count](https://github.com/KreischerPanoptic/medusa-plugin-top-categories)

---

## Acknowlegments

##### Homepage of original (forked from, many thanks to the author of original ❤️, if you like that fork give the author of original a star too ⭐)

- [Product categories with thumbnail](https://github.com/Petr-Hl/medusa-plugin-categories)