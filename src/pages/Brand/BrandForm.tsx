import { useEffect } from "react";
import { useForm } from "react-hook-form";

import AppFormInput from "../../components/Common/AppFormInput";

export type BrandCU = {
  id?: string;
  name: string;
  domain: string;
  industry: string;
  country: string;
  competitor: string;
  tenant_id?: string
};

interface Props {
  initialData?: BrandCU | null;
  isUpdate: boolean;
  loading: boolean;
  onSubmit: (data: BrandCU) => void;
}

export default function BrandForm({
  initialData,
  isUpdate,
  loading,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState,
    formState: { errors },
  } = useForm<BrandCU>();

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <AppFormInput
        label="Brand Name"
        name="name"
        register={register}
        rules={{
          required: "Brand name is required",
        }}
        error={errors.name}
        formState={formState}
      />

      <AppFormInput
        label="Website"
        name="domain"
        register={register}
        error={errors.domain}
        formState={formState}
      />

      <AppFormInput
        label="Industry"
        name="industry"
        register={register}
        error={errors.industry}
        formState={formState}
      />

      <AppFormInput
        label="Competitors (comma separated)"
        name="competitor"
        register={register}
        error={errors.competitor}
        formState={formState}
      />

      <AppFormInput
        label="Country"
        name="country"
        register={register}
        error={errors.country}
        formState={formState}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cyan-400 text-black py-2 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? isUpdate
            ? "Updating..."
            : "Creating..."
          : isUpdate
            ? "Update Brand"
            : "Create Brand"}
      </button>
    </form>
  );
}
