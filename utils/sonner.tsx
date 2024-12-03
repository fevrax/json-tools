import { toast } from "sonner";
import { Icon } from "@iconify/react";
import React from "react";

import { JsonErrorInfo } from "@/utils/json";
import { cn } from "@nextui-org/react";
export const JsonErrorToast = (
  parseJsonError: JsonErrorInfo | undefined,
  onClick: () => void,
) => {
  toast.custom(
    (id) => (
      <div
        className={`
        w-96 
        bg-white dark:bg-zinc-800 
        shadow-lg 
        rounded-lg 
        pointer-events-auto 
        flex 
        ring-1 
        ring-black/5 dark:ring-white/10 
        p-4 
        relative
      `}
      >
        <button
          className="
          absolute
          top-2
          right-2
          text-gray-400
          dark:text-gray-500
          hover:text-gray-500
          dark:hover:text-gray-300
          focus:outline-none
        "
          onClick={() => toast.dismiss(id)}
        >
          <Icon className="h-5 w-5" icon="gg:close" />
        </button>

        <div className="flex flex-col w-full space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <Icon className="h-6 w-6 text-amber-600" icon="carbon:warning" />
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {`第 ${parseJsonError?.line} 行，第 ${parseJsonError?.column} 列，格式错误`}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {parseJsonError?.message}
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-2">
            <button
              className={cn(
                "px-3 py-1 bg-default-400 text-white rounded-md text-sm hover:bg-purple-700 transition-colors",
              )}
              onClick={() => {
                // 确认逻辑
                onClick();
                toast.dismiss(id);
              }}
            >
              查看详情
            </button>
          </div>
        </div>
      </div>
    ),
    {
      duration: 4000, // 显示时间
      position: "top-right", // 弹出位置
    },
  );
};
