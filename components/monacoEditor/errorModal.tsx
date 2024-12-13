import React, { useMemo } from "react";
import {
  cn,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
} from "@nextui-org/react";
import { Icon } from "@iconify/react";

import { JsonErrorInfo } from "@/utils/json";
import "@/styles/monaco.css";
import Divider from "@/components/Divider/divider";

export interface ErrorModalProps {
  parseJsonError: React.MutableRefObject<JsonErrorInfo | null>;
  isOpen: boolean;
  onOpenChange?: () => void;
  onClose?: () => void;
  onGotoErrorLine?: () => void;
  onAutoFix?: () => void;
  ref?: React.Ref<ErrorModalRef>;
}

export interface ErrorModalRef {}

const ErrorModal: React.FC<ErrorModalProps> = ({
  parseJsonError,
  isOpen,
  onOpenChange,
  onClose,
  onGotoErrorLine,
  onAutoFix,
}) => {
  const contextLines = useMemo(() => {
    if (!parseJsonError.current || !parseJsonError.current?.context) return 0;
    if (!parseJsonError.current.context) return 0;

    return parseJsonError.current.context.split("\n").length;
  }, [parseJsonError.current?.context]);

  const errorStartLine = useMemo(() => {
    if (!parseJsonError.current?.line) return 0;

    return Math.max(
      1,
      parseJsonError.current?.line - Math.floor(contextLines / 2),
    );
  }, [parseJsonError.current?.line, contextLines]);

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeOut",
            },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeIn",
            },
          },
        },
      }}
      size="xl"
      onClose={onClose}
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {parseJsonError.current?.message}
        </ModalHeader>
        <ModalBody className="text-sm">
          <div>
            错误位置：第
            <Chip
              className="mx-1"
              classNames={{
                base: "border px-0.5",
              }}
              color="warning"
              radius="sm"
              size="sm"
              variant="bordered"
            >
              {parseJsonError.current?.line}
            </Chip>
            行， 第
            <Chip
              className="mx-1"
              classNames={{
                base: "border px-0.5",
              }}
              color="warning"
              radius="sm"
              size="sm"
              variant="bordered"
            >
              {parseJsonError.current?.column}
            </Chip>
            列
          </div>
          <p className="mt-2">
            异常信息：
            <span className={"text-red-500"}>
              {parseJsonError.current?.message}
            </span>
          </p>
          <Divider thickness={1} title="错误的上下文" />
          <div className="context-section">
            <div className="context-wrapper">
              <div className="line-numbers">
                {[...Array(contextLines)].map((_, i) => {
                  return (
                    <span
                      key={i}
                      className={cn({
                        "error-line":
                          errorStartLine + i === parseJsonError.current?.line,
                      })}
                    >
                      {errorStartLine + i}
                    </span>
                  );
                })}
              </div>
              <pre className="context-content">
                <code>{parseJsonError.current?.context}</code>
              </pre>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" size="sm" variant="bordered" onPress={onClose}>
            取消
          </Button>
          <Button color="primary" size="sm" onPress={onAutoFix}>
            <Icon
              className="cursor-pointer dark:text-primary-foreground/60 [&>g]:stroke-[1px]"
              icon="fluent:bot-sparkle-20-regular"
              width={20}
            />
            智能修复
          </Button>
          <Button color="danger" size="sm" onPress={onGotoErrorLine}>
            <Icon
              className="cursor-pointer dark:text-primary-foreground/60 [&>g]:stroke-[1px]"
              icon="ic:outline-my-location"
              width={20}
            />
            一键定位
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ErrorModal;
