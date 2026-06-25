import { useQuery } from "@tanstack/react-query";

import AppTable from "../../components/Common/AppTable";
import { userList } from "../../api/user";

const columns = [
  {
    key: "email",
    label: "Email",
  },
  {
    key: "role",
    label: "Role",
  },
  {
    key: "tenant.name",
    label: "Tenant",
  },
];

export default function User() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["user-list"],
    queryFn: userList,
  });

  // Assuming API returns:
  // {
  //   data: [...],
  //   pagination: {...},
  //   message: "..."
  // }

  const listData = data?.data ?? [];

  return (
    <>
      {/* Header */}
      <div className="p-6 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-bold">Users</h1>
      </div>

      {/* Content */}
      <div className="p-6">
        {isError ? (
          <div className="text-red-500">Failed to load users</div>
        ) : (
          <AppTable
            columns={columns}
            data={Array.isArray(listData) ? listData : []}
            isLoading={isLoading}
          />
        )}
      </div>
    </>
  );
}
