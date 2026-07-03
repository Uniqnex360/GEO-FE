import { useEffect } from "react";
import { useForm } from "react-hook-form";

import AppFormInput from "../../components/Common/AppFormInput";

export type ProjectCU = {
  id?: string;
  name?: string;
  industry?: string;
  website_url?: string;
  description?: string;
  countries?: string[];
};

interface Props {
  initialData?: ProjectCU | null;
  isUpdate: boolean;
  loading: boolean;
  onSubmit: (data: ProjectCU) => void;
}

interface SelectOption {
  id: string | number | boolean;
  value: string;
}

const IndustryMeta: SelectOption[] = [
  {
    id: "technology",
    value: "Technology",
  },
  {
    id: "healthcare",
    value: "Healthcare",
  },
  {
    id: "finance",
    value: "Finance",
  },
  {
    id: "education",
    value: "Education",
  },
  {
    id: "retail",
    value: "Retail",
  },
];

const CountryMeta: SelectOption[] = [
  { id: "USA", value: "USA" },
  { id: "UK", value: "UK" },
  { id: "Canada", value: "Canada" },
  { id: "Australia", value: "Australia" },
  { id: "Germany", value: "Germany" },
  { id: "France", value: "France" },
  { id: "India", value: "India" },
  { id: "Singapore", value: "Singapore" },
];

const ProjectForm = ({ initialData, isUpdate, loading, onSubmit }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState,
    formState: { errors },
  } = useForm<ProjectCU>();

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AppFormInput
          label="Project Name"
          name="name"
          placeholder="CH Marine"
          register={register}
          rules={{
            required: "Project name is required",
          }}
          error={errors.name}
          formState={formState}
        />

        <AppFormInput
          label="Website"
          name="website_url"
          placeholder="Website"
          register={register}
          error={errors.website_url}
          formState={formState}
        />

        <AppFormInput
          label="Industry"
          name="industry"
          type="select"
          placeholder="Marine"
          register={register}
          //@ts-ignore
          control={control} // <-- ADD THIS LINE HERE
          rules={{ required: "Industry is required" }}
          error={errors.industry}
          formState={formState}
          options={IndustryMeta}
        />

        <AppFormInput
          label="Country"
          name="countries"
          type="multiselect"
          register={register}
          //@ts-ignore
          control={control}
          formState={formState}
          //@ts-ignore
          error={errors.countries}
          options={CountryMeta}
          searchable={true}
          rules={{ required: "Please select at least one country" }}
        />

        <AppFormInput
          label="Description"
          name="description"
          type="textarea"
          placeholder=""
          register={register}
          error={errors.description}
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
              ? "Update Project"
              : "Create Project"}
        </button>
      </form>
    </>
  );
};

export default ProjectForm;
