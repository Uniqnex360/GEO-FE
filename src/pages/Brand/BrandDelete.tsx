interface Props {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export default function BrandDelete({
  open,
  loading,
  onClose,
  onDelete,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-[400px]">
        <h2 className="text-lg font-bold">Delete Brand</h2>

        <p className="mt-4 text-gray-400">Are you sure?</p>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border p-2 rounded">
            Cancel
          </button>

          <button onClick={onDelete} className="flex-1 bg-red-600 p-2 rounded">
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
