import { useEffect } from "react";
import { useForm } from "react-hook-form";

import AppFormInput from "../../components/Common/AppFormInput";
import { type ProductCU } from "../../api/product";
import { type AppMetaList } from "../../api/brand";
import { metaService } from "../../api/meta";

interface Props {
  initialData?: ProductCU | null;
  isUpdate: boolean;
  loading: boolean;
  onSubmit: (data: ProductCU) => void;
  brandOption: AppMetaList[];
}

export default function ProductForm({
  initialData,
  isUpdate,
  loading,
  onSubmit,
  brandOption,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState,
    formState: { errors },
  } = useForm<ProductCU>({
    defaultValues: {
      name: "",
      brand_id: undefined,
      // brand_name: "",
      manufacturer: "",
      model_number: "",
      product_type: "",
      category: "",
      sku: "",
      mpn: "",
      upc: "",
      gtin: "",
      ean: "",
      product_url: "",
      taxonomy: "",
      short_description: "",
      long_description: "",
      specifications: "",
      regular_price: undefined,
      sale_price: undefined,
      currency: "USD",
      rating: undefined,
      rating_count: undefined,
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
      features: [],
      faqs: [],
    },
  });

  // Dynamic Array Handlers for Features and FAQs
  // const {
  //   fields: featureFields,
  //   append: appendFeature,
  //   remove: removeFeature,
  // } = useFieldArray({
  //   control,
  //   name: "features",
  // });

  // const {
  //   fields: faqFields,
  //   append: appendFaq,
  //   remove: removeFaq,
  // } = useFieldArray({
  //   control,
  //   name: "faqs",
  // });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        name: "",
        brand_id: "",
        brand_name: "",
        manufacturer: "",
        model_number: "",
        product_type: "",
        category: "",
        sku: "",
        mpn: "",
        upc: "",
        gtin: "",
        ean: "",
        product_url: "",
        taxonomy: "",
        short_description: "",
        long_description: "",
        specifications: "",
        regular_price: undefined,
        sale_price: undefined,
        currency: "USD",
        rating: undefined,
        rating_count: undefined,
        meta_title: "",
        meta_description: "",
        meta_keywords: "",
        features: [],
        faqs: [],
      });
    }
  }, [initialData, reset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 max-h-[85vh] overflow-y-auto px-2 pb-6"
    >
      {/* SECTION 1: CORE RELATION & INFO */}
      <div>
        <AppFormInput
          label="Product Title"
          name="name"
          register={register}
          rules={{ required: "Product name is required" }}
          error={errors.name}
          formState={formState}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AppFormInput
          label="SKU"
          name="sku"
          rules={{ required: "Product SKU is required" }}
          register={register}
          error={errors.sku}
          formState={formState}
        />
        <AppFormInput
          label="MPN"
          name="mpn"
          rules={{ required: "MPN is required" }}
          register={register}
          error={errors.mpn}
          formState={formState}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <AppFormInput
          label="Brand"
          name="brand_id"
          type="select"
          placeholder="Select a Brand..."
          register={register}
          //@ts-ignore
          control={control} // 💡 Add this prop here!
          rules={{ required: "Selecting a brand is required" }}
          error={errors.brand_id}
          formState={formState}
          // 💡 Transform data structure inline here if brandOption uses different keys like identity:
          options={brandOption}
        />
        <AppFormInput
          label="Product Category"
          name="category"
          type="select"
          placeholder="Search categories..."
          register={register}
          control={control}
          fetchFn={metaService.get_category}
          queryKey={["remote-categories"]}
          limit={20}
        />

      </div>

      <AppFormInput
        label="Product URL"
        name="product_url"
        register={register}
        error={errors.product_url}
        formState={formState}
        rules={{
          validate: (value) => {
            // optional field → empty is valid
            //@ts-ignore
            if (!value?.trim()) return true;

            try {
              //@ts-ignore
              const url = new URL(value);

              // allow only http/https
              return (
                ["http:", "https:"].includes(url.protocol) ||
                "Please enter a valid URL"
              );
            } catch {
              return "Please enter a valid URL";
            }
          },
        }}
      />

      {/* CONTROL ACTIONS BAR */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cyan-400 text-black py-2.5 rounded font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading
          ? isUpdate
            ? "Updating..."
            : "Creating..."
          : isUpdate
            ? "Update Product"
            : "Create Product"}
      </button>
    </form>
  );
}
