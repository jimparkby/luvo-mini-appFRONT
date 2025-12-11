import { EmptyStateIcon } from "@/assets/icons/empty-state-icon";

export const EmptyState = ({ title, description, icon }) => {
  return (
    <div className="w-full min-h-[calc(100vh-169px)] flex items-center justify-center">
      <div className="py-16 flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
          {icon || <EmptyStateIcon />}
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>

        <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
          {description}
        </p>
      </div>
    </div>
  );
};
