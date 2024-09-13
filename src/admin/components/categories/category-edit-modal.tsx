import { Drawer, Button, Text, Label, Input, Select } from "@medusajs/ui";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { Notify } from "../../types/notify";
import { nestedForm } from "../../utils/nested-form";
import {
  useAdminUpdateProductCategory,
  useAdminCreateProductCategory,
  useAdminUploadFile,
  adminProductCategoryKeys,
} from "medusa-react";
import {
  AdminPostProductCategoriesCategoryReq,
  AdminPostProductCategoriesReq,
  ProductCategory,
} from "@medusajs/medusa";
import { Trash } from "@medusajs/icons";
import ImagesMediaForm, { MediaFormType } from "../shared/images-media-form";
import MetadataForm, {
  getMetadataFormValues,
  getSubmittableMetadata,
  MetadataFormType,
} from "../shared/meatadata-form";
import TreeCrumbs from "./utils/tree-crumbs";
import { useQueryClient } from "@tanstack/react-query";
const translit = require('ua-en-translit');
// import type { ConfigModule } from "@medusajs/medusa";
// import { getConfigFile } from "medusa-core-utils";

export type CategoryDetailsFormValues = {
  parent_category_id?: string | null;
  name: string;
  handle: string;
  description: string;
  thumbnail: string;
  visits: number;
  media?: MediaFormType;
  is_active: "active" | "inactive";
  is_internal: "public" | "private";
  type: "thumbnail" | "media";
  metadata: MetadataFormType;
};

const statuses = [
  {
    label: "Активна",
    value: "active",
  },
  {
    label: "Неактивна",
    value: "inactive",
  },
];

const published = [
  {
    label: "Публічна",
    value: "public",
  },
  {
    label: "Приватна",
    value: "private",
  },
];

// TODO - add prefix into the plugin configuration file
// const { configModule, error } = getConfigFile<ConfigModule>(
//   path.resolve(process.cwd()),
//   "medusa-config.js"
// )

// const fileNamePrefix = "---"
const fileNamePrefix = "";

const getDefaultValues = (
  category: ProductCategory | null,
  createNew: boolean
): CategoryDetailsFormValues => {
  // Adding new child category
  if (createNew) {
    return {
      parent_category_id: category && category?.id ? category.id : null,
      name: "",
      handle: "",
      description: "",
      thumbnail: "",
      visits: 0,
      is_active: "active",
      is_internal: "public",
      media: {
        images: [],
      },
      type: "thumbnail",
      metadata: getMetadataFormValues({}),
    };
  }

  return {
    name: category?.name,
    handle: category?.handle,
    description: category?.description,
    thumbnail: (category?.metadata?.thumbnailImageUrl as string) || "",
    visits: (category?.metadata?.visitsCount as number) || 0,
    is_active: category?.is_active ? "active" : "inactive",
    is_internal: category?.is_internal ? "private" : "public",
    media: {
      images: [],
    },
    type: "thumbnail",
    metadata: getMetadataFormValues(category?.metadata, ["thumbnailImageUrl"]),
  };
};

const CategoryEditModal = ({
  category,
  categories,
  isOpen,
  onClose,
  createNew,
  notify,
}: {
  category: ProductCategory;
  categories: ProductCategory[];
  isOpen: boolean;
  onClose: () => void;
  createNew: boolean;
  notify: Notify;
}) => {
  const form = useForm<CategoryDetailsFormValues>({
    defaultValues: getDefaultValues(category, createNew),
  });

  // for update after change
  const queryClient = useQueryClient();
  // const { client } = useMedusa();
  const uploadFile = useAdminUploadFile();

  const { mutateAsync, isLoading } = useAdminUpdateProductCategory(
    category?.id
  );

  const { mutate } = useAdminCreateProductCategory();

  const [handlePreview, setHandlePreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (category) {
      form.reset(getDefaultValues(category, createNew));
      handlerSanitize(category.handle);
    }
  }, [category]);

  // useEffect(() => {
  //   if (form.watch("handle")) {
  //     setHandlePreview(
  //       encodeURI(form.watch("handle").replace(/ /g, "-").toLowerCase())
  //     );
  //   }
  // }, [form.watch("handle")]);

  const handlerSanitize = (value: string) => {
    const transliterated = translit(value)
    setHandlePreview(
      transliterated
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .replace(/ /g, "-")
        .toLowerCase()
    );
  };

  const handlerSanitizeReturn = (value: string): string => {
    const transliterated = translit(value)
    return transliterated
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .replace(/ /g, "-")
        .toLowerCase()
  };

  const onReset = () => {
    form.reset(getDefaultValues(category, createNew));
    onClose();
  };

  const handlerRemoveThumbnail = () => {
    form.setValue("thumbnail", "");
    // form.setValue("media", { images: [] });
  };

  const onSubmit = form.handleSubmit(async (data) => {
    setIsSaving(true);

    const nativeFiles = data.media.images.map(
      (i) =>
        new File([i.nativeFile], `${fileNamePrefix}${i.nativeFile.name}`, {
          type: i.nativeFile.type,
        })
    );
    const { uploads: uploadedImages } = await uploadFile.mutateAsync(
      nativeFiles
    );

    const metadataWithThumbnail = {
      ...getSubmittableMetadata(data.metadata),
      thumbnailImageUrl: uploadedImages[0]?.url || data.thumbnail || "",
      visitsCount: parseInt(`${data.visits}`) || 0
    };

    const payload: AdminPostProductCategoriesCategoryReq & {
      thumbnail?: string;
      visits: number;
    } = {
      name: data.name,
      description: data.description,
      thumbnail:
        uploadedImages[0]?.url ||
        data.media.images[0]?.url ||
        data.thumbnail ||
        "",
      visits: parseInt(`${data.visits}`) || 0,
      handle: handlePreview,
      is_active: data.is_active === "active",
      is_internal: data.is_internal === "private",
      metadata: metadataWithThumbnail,
    };
    // add new one category
    if (createNew) {
      const payloadNew: AdminPostProductCategoriesReq = {
        name: data.name,
        description: data.description,
        handle: handlePreview,
        is_active: data.is_active === "active",
        is_internal: data.is_internal === "private",
        metadata: metadataWithThumbnail,
        parent_category_id: data?.parent_category_id || null,
      };

      mutate(payloadNew, {
        onSuccess: async () => {
          notify.success("Успіх", `Категорію ${payloadNew.name} створено`);
          onReset();
          await queryClient.invalidateQueries(adminProductCategoryKeys.lists());
        },
        onError: () => {
          notify.error(
            "Помилка",
            `Під час створення категорії ${payloadNew.name} виникла помилка`
          );
        },
      });
      setIsSaving(false);
      return;
    }

    // update existing category
    mutateAsync(payload, {
      onSuccess: async () => {
        notify.success("Успіх", `Категорію ${payload.name} оновлено`);
        onReset();
        await queryClient.invalidateQueries(adminProductCategoryKeys.lists());
      },
      onError: () => {
        notify.error(
          "Помилка",
          `Під час оновлення категорії ${payload.name} виникла помилка`
        );
      },
    });
    setIsSaving(false);
  });

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <Drawer.Content className="w-auto right-2 overflow-y-scroll">
        <form onSubmit={onSubmit}>
          <Drawer.Header>
            <Drawer.Title>
              {createNew ? (
                <>Додати категорію{category ? ` до "${category.name}"` : ""}</>
              ) : (
                <>Оновити категорію</>
              )}
              <div className="my-6">
                <TreeCrumbs
                  nodes={categories}
                  currentNode={category}
                  showPlaceholder={createNew}
                  placeholderText={form.watch("name") || "Нова"}
                />
              </div>
            </Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <div className="flex flex-col gap-y-4">
              {!createNew && (
                <div className="flex flex-col gap-y-2">
                  <Label htmlFor="thumbnail" className="text-ui-fg-subtle">
                    Зображення
                  </Label>
                  {!form.watch("thumbnail") && (
                    <ImagesMediaForm
                      form={nestedForm(form, "media")}
                      type="thumbnail"
                    />
                  )}
                  {form.watch("thumbnail") && (
                    <div className="max-w-[400px] h-auto">
                      <img
                        src={form.watch("thumbnail")}
                        alt={`Зображення для ${form.watch("name")}`}
                        className="rounded-rounded"
                      />
                    </div>
                  )}
                  {form.watch("thumbnail") && (
                    <Button
                      onClick={handlerRemoveThumbnail}
                      variant="secondary"
                      disabled={isLoading}
                      className="ml-auto"
                    >
                      <Trash /> Видалити зображення
                    </Button>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="name" className="text-ui-fg-subtle">
                  Назва
                </Label>
                <Input
                  id="name"
                  placeholder="Солодощі"
                  {...form.register("name")}
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="handle" className="text-ui-fg-subtle">
                  Посилання
                  <span className="italic">{` (.../category/${handlePreview})`}</span>
                </Label>
                <Input
                  id="handle"
                  onChangeCapture={(event) =>
                    handlerSanitize(event.currentTarget.value)
                  }
                  onFocus={(event) => {
                    if (event.currentTarget.value === "") {
                      event.currentTarget.value = handlerSanitizeReturn(form.getValues().name);
                      handlerSanitize(form.getValues().name);
                    }
                  }}
                  placeholder="solodoshi"
                  {...form.register("handle")}
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="description" className="text-ui-fg-subtle">
                  Опис
                </Label>
                <Input
                  id="description"
                  type="textarea"
                  placeholder="Корисні та смачні солодощі"
                  {...form.register("description")}
                />
              </div>
              <div className="flex flex-row flex-wrap gap-x-4">
                <div className="flex flex-col flex-1 gap-y-2">
                  <Label htmlFor="is_internal" className="text-ui-fg-subtle">
                    Статус Публікації
                  </Label>
                  <Controller
                    name="is_internal"
                    control={form.control}
                    rules={{ required: true }}
                    render={({ field: { onChange, ...other } }) => (
                      <Select {...other} onValueChange={onChange}>
                        <Select.Trigger>
                          <Select.Value placeholder="Оберіть статус публікації" />
                        </Select.Trigger>
                        <Select.Content>
                          {published.map((item) => (
                            <Select.Item key={item.label} value={item.value}>
                              {item.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex flex-col flex-1 gap-y-2">
                  <Label htmlFor="is_active" className="text-ui-fg-subtle">
                    Статус Активності
                  </Label>
                  <Controller
                    name="is_active"
                    control={form.control}
                    rules={{ required: true }}
                    render={({ field: { onChange, ...other } }) => (
                      <Select {...other} onValueChange={onChange}>
                        <Select.Trigger>
                          <Select.Value placeholder="Оберіть статус активності" />
                        </Select.Trigger>
                        <Select.Content>
                          {statuses.map((item) => (
                            <Select.Item key={item.value} value={item.value}>
                              {item.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="visits" className="text-ui-fg-subtle">
                  Перегляди
                </Label>
                <Input
                  id="visits"
                  type="number"
                  placeholder="0"
                  {...form.register("visits")}
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="metadata" className="text-ui-fg-subtle">
                  Метадані
                </Label>
                <MetadataForm
                  form={nestedForm(form, "metadata")}
                  hiddenKeys={["thumbnailImageUrl", "visitsCount"]}
                />
              </div>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button variant="secondary" disabled={isLoading}>
                Скасувати
              </Button>
            </Drawer.Close>
            <Button isLoading={isLoading || isSaving}>Зберегти</Button>
          </Drawer.Footer>
        </form>
      </Drawer.Content>
    </Drawer>
  );
};

export default CategoryEditModal;
