import { Plus } from "lucide-react";

interface Props {
  onCreate: () => void;
}

export default function BrandHeader({ onCreate }: Props) {
  return (
    <div className="px-6 py-6 flex justify-between bg-white">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Brands</h1>

        <p className="text-sm text-gray-400">
          Manage tracked brands and competitors
        </p>
      </div>

      <button
        onClick={onCreate}
        className="bg-cyan-400 text-black px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer"
      >
        <Plus size={16} />
        New Brand
      </button>
    </div>
  );
}
