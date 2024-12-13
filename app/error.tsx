"use client";

import React, { useEffect } from "react";
import { Button } from "@nextui-org/react";
import { Icon } from "@iconify/react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-background to-default-100">
      <div className="w-full max-w-md p-8 mx-auto text-center space-y-8">
        {/* Error Icon */}
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div className="animate-ping absolute h-full w-full rounded-full bg-danger-200 opacity-20" />
          <div className="relative">
            <Icon
              className="w-24 h-24 text-danger"
              icon="solar:danger-triangle-bold"
              width={96}
            />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-danger">出错了！</h1>
          <p className="text-xl text-default-600">看起来发生了一些意外情况</p>
          <p className="text-sm text-default-400">
            错误信息: {error.message || "未知错误"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 mt-8">
          <Button
            className="w-full"
            color="primary"
            size="lg"
            startContent={
              <Icon icon="solar:refresh-circle-broken" width={24} />
            }
            variant="shadow"
            onPress={() => reset()}
          >
            重试
          </Button>
          <Button
            className="w-full"
            color="default"
            size="lg"
            startContent={<Icon icon="solar:home-2-broken" width={24} />}
            variant="light"
            onPress={() => (window.location.href = "/")}
          >
            返回首页
          </Button>
        </div>
      </div>
    </div>
  );
}
