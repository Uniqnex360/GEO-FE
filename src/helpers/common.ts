// This function is used to change hardware__supplies -> Hardware Supplies
export const formatSnakeToTitleCase = (str?: string | null): string => {
  if (!str) return "";

  return str
    .split("_")
    .filter(Boolean) // Ignores extra underscores (e.g., 'hardware__supplies')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
