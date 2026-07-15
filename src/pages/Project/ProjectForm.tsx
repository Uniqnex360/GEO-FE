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
    id: "automotive_supplies",
    value: "Automotive Supplies",
  },
  {
    id: "building_supplies",
    value: "Building Supplies",
  },
  {
    id: "cleaning_supplies",
    value: "Cleaning Supplies",
  },
  {
    id: "electrical_supplies",
    value: "Electrical Supplies",
  },
  {
    id: "electronic_supplies",
    value: "Electronic Supplies",
  },
  {
    id: "hardware_supplies",
    value: "Hardware Supplies",
  },
  {
    id: "heating_and_cooling_supplies",
    value: "Heating and Cooling Supplies",
  },
  {
    id: "home_improvement_supplies",
    value: "Home Improvement Supplies",
  },
  {
    id: "industrial_supplies",
    value: "Industrial Supplies",
  },
  {
    id: "lawn_and_garden_supplies",
    value: "Lawn and Garden Supplies",
  },
  {
    id: "machinery_supplies",
    value: "Machinery Supplies",
  },
  {
    id: "material_handling_supplies",
    value: "Material Handling Supplies",
  },
  {
    id: "medical_supplies",
    value: "Medical Supplies",
  },
  {
    id: "office_supplies",
    value: "Office Supplies",
  },
  {
    id: "packaging_supplies",
    value: "Packaging Supplies",
  },
  {
    id: "safety_supplies",
    value: "Safety Supplies",
  },
  {
    id: "tools_and_equipment_supplies",
    value: "Tools and Equipment Supplies",
  },
  {
    id: "pet_supplies",
    value: "Pet Supplies",
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
          register={register}
          //@ts-ignore
          control={control}
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
