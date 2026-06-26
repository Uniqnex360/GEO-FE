import { useEffect } from "react";
import { useForm } from "react-hook-form";

import AppFormInput from "../../components/Common/AppFormInput";
import { type ProductCU } from "../../api/product";
import { type AppMetaList } from "../../api/brand";

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
  brandOption
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    // control,
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
        brand_id: undefined,
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
        <h3 className="text-cyan-400 font-semibold border-b border-gray-700 pb-1 mb-4 text-sm uppercase tracking-wider">
          Core Information
        </h3>
        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> */}
          <AppFormInput
            label="Product Name"
            name="name"
            placeholder="e.g. Northwave Studio Pro"
            register={register}
            rules={{ required: "Product name is required" }}
            error={errors.name}
            formState={formState}
          />
          {/* <AppFormInput
            label="Brand ID"
            name="brand_id"
            type="number"
            placeholder="e.g. 102"
            register={register}
            rules={{ required: "Brand ID is required", valueAsNumber: true }}
            error={errors.brand_id}
            formState={formState}
          /> */}
        {/* </div> */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <AppFormInput
            label="Brand ID"
            name="brand_id"
            type="select"
            placeholder="Samsung"
            register={register}
            rules={{ required: "Brand ID is required", valueAsNumber: true }}
            error={errors.brand_id}
            formState={formState}
            options={brandOption}
          />
          <AppFormInput
            label="Category"
            name="category"
            placeholder="Headphones"
            register={register}
            error={errors.category}
            formState={formState}
          />
          {/* <AppFormInput
            label="Brand Name (Optional)"
            name="brand_name"
            placeholder="e.g. Northwave Audio"
            register={register}
            error={errors.brand_name}
            formState={formState}
          /> */}
          {/* <AppFormInput
            label="Manufacturer"
            name="manufacturer"
            placeholder="Manufacturer name"
            register={register}
            error={errors.manufacturer}
            formState={formState}
          /> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {/* <AppFormInput
            label="Model Number"
            name="model_number"
            placeholder="MN-900"
            register={register}
            error={errors.model_number}
            formState={formState}
          /> */}
          {/* <AppFormInput
            label="Product Type"
            name="product_type"
            placeholder="Premium Electronics"
            register={register}
            error={errors.product_type}
            formState={formState}
          /> */}
          
        </div>
      </div>

      {/* SECTION 2: IDENTIFIERS */}
      <div>
        <h3 className="text-cyan-400 font-semibold border-b border-gray-700 pb-1 mb-4 text-sm uppercase tracking-wider">
          Product Codes & Identifiers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AppFormInput
            label="SKU"
            name="sku"
            placeholder="NW-SP-01"
            register={register}
            error={errors.sku}
            formState={formState}
          />
          <AppFormInput
            label="MPN"
            name="mpn"
            placeholder="NWSP2025"
            register={register}
            error={errors.mpn}
            formState={formState}
          />
          <AppFormInput
            label="UPC"
            name="upc"
            placeholder="0850001234567"
            register={register}
            error={errors.upc}
            formState={formState}
          />
        </div>
        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <AppFormInput
            label="GTIN"
            name="gtin"
            placeholder="Global Trade Item Number"
            register={register}
            error={errors.gtin}
            formState={formState}
          />
          <AppFormInput
            label="EAN"
            name="ean"
            placeholder="European Article Number"
            register={register}
            error={errors.ean}
            formState={formState}
          />
        </div> */}
      </div>

      {/* SECTION 3: DATA DETAILS & LINKS */}
      {/* <div>
        <h3 className="text-cyan-400 font-semibold border-b border-gray-700 pb-1 mb-4 text-sm uppercase tracking-wider">
          Descriptions & Links
        </h3>
        <AppFormInput
          label="Product URL"
          name="product_url"
          placeholder="https://example.com/product"
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
        <AppFormInput
          label="Taxonomy Hierarchy"
          name="taxonomy"
          placeholder="Electronics > Audio > Headphones"
          register={register}
          error={errors.taxonomy}
          formState={formState}
        />
        <div className="mt-2">
          <AppFormInput
            label="Short Description"
            name="short_description"
            type="textarea"
            placeholder="High level overview text..."
            register={register}
            error={errors.short_description}
            formState={formState}
          />
        </div>
        <div className="mt-2">
          <AppFormInput
            label="Long Description"
            name="long_description"
            type="textarea"
            placeholder="Deep structural breakdowns..."
            register={register}
            error={errors.long_description}
            formState={formState}
          />
        </div>
        <div className="mt-2">
          <AppFormInput
            label="Specifications"
            name="specifications"
            type="textarea"
            placeholder="Technical details markup or raw blocks..."
            register={register}
            error={errors.specifications}
            formState={formState}
          />
        </div>
      </div> */}

      {/* SECTION 4: FINANCIALS & RATINGS */}
      {/* <div>
        <h3 className="text-cyan-400 font-semibold border-b border-gray-700 pb-1 mb-4 text-sm uppercase tracking-wider">
          Pricing & Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AppFormInput
            label="Regular Price"
            name="regular_price"
            type="number"
            placeholder="299.99"
            register={register}
            rules={{ valueAsNumber: true }}
            error={errors.regular_price}
            formState={formState}
          />
          <AppFormInput
            label="Sale Price"
            name="sale_price"
            type="number"
            placeholder="249.99"
            register={register}
            rules={{ valueAsNumber: true }}
            error={errors.sale_price}
            formState={formState}
          />
          <AppFormInput
            label="Currency"
            name="currency"
            type="select"
            placeholder="USD"
            register={register}
            error={errors.currency}
            formState={formState}
            options={[
              { id: "USD", value: "USD" }, // US Dollar
              { id: "EUR", value: "EUR" }, // Euro
              { id: "JPY", value: "JPY" }, // Japanese Yen
              { id: "GBP", value: "GBP" }, // British Pound
              { id: "AUD", value: "AUD" }, // Australian Dollar
              { id: "CAD", value: "CAD" }, // Canadian Dollar
              { id: "CHF", value: "CHF" }, // Swiss Franc
              { id: "CNY", value: "CNY" }, // Chinese Yuan
              { id: "HKD", value: "HKD" }, // Hong Kong Dollar
              { id: "INR", value: "INR" }, // Indian Rupee
            ]}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <AppFormInput
            label="Rating Metric"
            name="rating"
            type="number"
            placeholder="4.5"
            register={register}
            rules={{ valueAsNumber: true }}
            error={errors.rating}
            formState={formState}
          />
          <AppFormInput
            label="Rating Count"
            name="rating_count"
            type="number"
            placeholder="1420"
            register={register}
            rules={{ valueAsNumber: true }}
            error={errors.rating_count}
            formState={formState}
          />
        </div>
      </div> */}

      {/* SECTION 5: SEARCH ENGINE METADATA */}
      {/* <div>
        <h3 className="text-cyan-400 font-semibold border-b border-gray-700 pb-1 mb-4 text-sm uppercase tracking-wider">
          SEO Metadata
        </h3>
        <AppFormInput
          label="Meta Title"
          name="meta_title"
          placeholder="SEO optimized title structure"
          register={register}
          error={errors.meta_title}
          formState={formState}
        />
        <AppFormInput
          label="Meta Keywords"
          name="meta_keywords"
          placeholder="keywords, split, by, commas"
          register={register}
          error={errors.meta_keywords}
          formState={formState}
        />
        <div className="mt-2">
          <AppFormInput
            label="Meta Description"
            name="meta_description"
            type="textarea"
            placeholder="Brief programmatic summary block..."
            register={register}
            error={errors.meta_description}
            formState={formState}
          />
        </div>
      </div> */}

      {/* SECTION 6: DYNAMIC FEATURES LIST */}
      {/* <div>
        <div className="flex justify-between items-center border-b border-gray-700 pb-1 mb-3">
          <h3 className="text-cyan-400 font-semibold text-sm uppercase tracking-wider">
            Product Features
          </h3>
          <button
            type="button"
            onClick={() => appendFeature({ value: "" })}
            className="text-xs bg-gray-800 border border-gray-700 hover:bg-gray-700 text-cyan-400 px-2 py-1 rounded"
          >
            + Add Feature
          </button>
        </div>

        {featureFields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-end gap-2 mb-2 bg-white p-2 rounded border border-gray-800"
          >
            <div className="flex-1">
              <AppFormInput
                label={`Feature #${index + 1}`}
                name={`features.${index}.value`}
                placeholder="Ex: Waterproof IPX7"
                register={register}
                error={errors.features?.[index]?.value}
                formState={formState}
              />
            </div>
            <button
              type="button"
              onClick={() => removeFeature(index)}
              className="text-red-400 hover:text-red-300 mb-3 text-sm px-2 py-1"
            >
              Remove
            </button>
          </div>
        ))}
      </div> */}

      {/* SECTION 7: DYNAMIC FAQS LIST */}
      {/* <div>
        <div className="flex justify-between items-center border-b border-gray-700 pb-1 mb-3">
          <h3 className="text-cyan-400 font-semibold text-sm uppercase tracking-wider">
            Product FAQs
          </h3>
          <button
            type="button"
            onClick={() =>
              appendFaq({ question: "", answer: "", sort_order: 0 })
            }
            className="text-xs bg-gray-800 border border-gray-700 hover:bg-gray-700 text-cyan-400 px-2 py-1 rounded"
          >
            + Add FAQ
          </button>
        </div>

        {faqFields.map((field, index) => (
          <div
            key={field.id}
            className="space-y-2 mb-4 bg-white p-3 rounded border border-gray-800"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 font-medium">
                FAQ Entry #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeFaq(index)}
                className="text-red-400 hover:text-red-300 text-xs"
              >
                Remove FAQ
              </button>
            </div>
            <AppFormInput
              label="Question"
              name={`faqs.${index}.question`}
              placeholder="What is the warranty?"
              register={register}
              error={errors.faqs?.[index]?.question}
              formState={formState}
            />
            <AppFormInput
              label="Answer"
              name={`faqs.${index}.answer`}
              type="textarea"
              placeholder="It features a 2-year full warranty protection."
              register={register}
              error={errors.faqs?.[index]?.answer}
              formState={formState}
            />
            <AppFormInput
              label="Sort Order"
              name={`faqs.${index}.sort_order`}
              type="number"
              placeholder="0"
              register={register}
              rules={{ valueAsNumber: true }}
              error={errors.faqs?.[index]?.sort_order}
              formState={formState}
            />
          </div>
        ))}
      </div> */}

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
