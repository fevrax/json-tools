import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
} from "@heroui/react";

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
  isProcessing?: boolean;
  title?: string;
  placeholder?: string;
  submitButtonText?: string;
}

const AIPromptModal: React.FC<AIPromptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isProcessing = false,
  title = "AI 类型转换",
  placeholder = "请输入提示词，例如：'将这个 JSON 转换为 TypeScript 接口，并添加详细的注释'",
  submitButtonText = "提交",
}: AIPromptModalProps) => {
  const [prompt, setPrompt] = useState<string>("");

  const handleSubmit = () => {
    if (prompt.trim()) {
      onSubmit(prompt);
      onClose();
    }
  };

  return (
    <Modal
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
      size="3xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
        <ModalBody>
          <div className="flex w-full items-start gap-2">
            <Textarea
              aria-label="Prompt"
              className="min-h-[40px]"
              classNames={{
                innerWrapper: "relative w-full",
                input: "pt-1 pb-6 text-medium",
              }}
              endContent={
                <div className="absolute bottom-1 right-2">
                  <p className="text-tiny text-default-400">
                    {prompt.length}/200
                  </p>
                </div>
              }
              isDisabled={isProcessing}
              maxLength={2000}
              minRows={3}
              placeholder={placeholder}
              radius="lg"
              value={prompt}
              variant="bordered"
              onValueChange={setPrompt}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            取消
          </Button>
          <Button
            color="primary"
            isDisabled={!prompt || isProcessing}
            isLoading={isProcessing}
            onPress={handleSubmit}
          >
            {submitButtonText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AIPromptModal;
