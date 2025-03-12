import React, { useEffect, useRef, useState } from "react";
import { Button, cn, Select, SelectItem, Slider } from "@heroui/react";
import { Icon } from "@iconify/react";

// 定义菜单位置类型
interface MenuPosition {
  x: number;
  y: number;
}

// 定义支持的语言列表
export const SUPPORTED_LANGUAGES = [
  { id: "json", name: "JSON" },
  { id: "json5", name: "JSON5" },
  { id: "go", name: "Go" },
  { id: "javascript", name: "JavaScript" },
  { id: "typescript", name: "TypeScript" },
  { id: "html", name: "HTML" },
  { id: "css", name: "CSS" },
  { id: "python", name: "Python" },
  { id: "java", name: "Java" },
  { id: "csharp", name: "C#" },
  { id: "cpp", name: "C++" },
  { id: "markdown", name: "Markdown" },
  { id: "yaml", name: "YAML" },
  { id: "xml", name: "XML" },
  { id: "sql", name: "SQL" },
  { id: "shell", name: "Shell" },
];

interface DraggableMenuProps {
  containerRef: React.RefObject<HTMLDivElement>;
  onLanguageChange: (language: string) => void;
  onFontSizeChange: (fontSize: number) => void;
  onReset: () => void;
  currentLanguage: string;
  currentFontSize: number;
}

const DraggableMenu: React.FC<DraggableMenuProps> = ({
  containerRef,
  onLanguageChange,
  onFontSizeChange,
  onReset,
  currentLanguage,
  currentFontSize,
}) => {
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    x: 20,
    y: 20,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 调整菜单位置，确保不超出容器边界
  const adjustMenuPosition = () => {
    if (containerRef.current && menuRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();

      setMenuPosition({
        x:
          containerRect.width -
          (isHovered ? menuRect.width : menuRect.width / 2),
        y: containerRect.height - menuRect.height - 20,
      });
    }
  };

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        adjustMenuPosition();
      }, 100);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // 移动中
  useEffect(() => {
    // adjustMenuPosition();
  }, [isHovered]);

  // 启动拖动操作
  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: clientX - menuPosition.x,
      y: clientY - menuPosition.y,
    };
  };

  // 处理拖动过程
  const handleDrag = (clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current?.getBoundingClientRect();

    if (!menuRect) return;

    // 计算新位置，确保不超出容器边界
    const newX = Math.max(
      0,
      Math.min(
        clientX - dragStartRef.current.x,
        containerRect.width - menuRect.width,
      ),
    );
    const newY = Math.max(
      0,
      Math.min(
        clientY - dragStartRef.current.y,
        containerRect.height - menuRect.height,
      ),
    );

    setMenuPosition({ x: newX, y: newY });
  };

  // 完成拖动操作
  const finishDrag = () => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // 监听全局鼠标事件
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDrag(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      finishDrag();
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }

    return undefined;
  }, [isDragging, menuPosition]);

  // 点击菜单外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        isMenuOpen
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div
      ref={menuRef}
      className={cn(
        "absolute z-50 transition-all duration-300",
        isDragging ? "cursor-grabbing" : "cursor-grab",
      )}
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsMenuOpen(false);
      }}
    >
      {/* 拖动手柄区域 */}
      <div
        aria-label="拖动设置菜单"
        className="absolute -top-3 -left-3 -right-3 -bottom-3 cursor-grab"
        role="button"
        style={{
          touchAction: "none",
          zIndex: -1,
        }}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
          }
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          startDrag(e.clientX, e.clientY);
        }}
      />

      {/* 菜单按钮 */}
      <div
        ref={buttonRef}
        aria-expanded={isMenuOpen}
        aria-label="打开设置菜单"
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-full shadow-lg cursor-pointer",
          "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
          "transform transition-all duration-300 hover:scale-110",
          "ring-2 ring-white/50 hover:ring-white/80 dark:ring-blue-400/50 dark:hover:ring-blue-400/80",
          "dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800",
          isMenuOpen ? "rotate-180" : "",
        )}
        role="button"
        tabIndex={0}
        onClick={toggleMenu}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleMenu();
          }
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          startDrag(e.clientX, e.clientY);
        }}
      >
        <Icon
          aria-hidden="true"
          className="text-white w-5 h-5"
          icon="heroicons:cog-6-tooth"
          style={{
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
          }}
        />
      </div>

      {/* 菜单面板 */}
      <div
        aria-label="编辑器设置菜单"
        className={cn(
          "absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-64 transition-all duration-300",
          isMenuOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none",
        )}
        role="dialog"
        style={{
          bottom: "calc(100% + 8px)",
          right: 0,
          transformOrigin: "bottom right",
        }}
      >
        <div className="flex flex-col space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              htmlFor="language-select"
            >
              编程语言
            </label>
            <Select
              aria-label="选择编程语言"
              id="language-select"
              selectedKeys={[currentLanguage]}
              size="sm"
              onChange={(e) => onLanguageChange(e.target.value)}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.id} aria-label={lang.name}>
                  {lang.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              htmlFor="font-size-slider"
            >
              字体大小: {currentFontSize}px
            </label>
            <Slider
              aria-label="调整字体大小"
              className="w-full"
              id="font-size-slider"
              maxValue={24}
              minValue={12}
              size="sm"
              step={1}
              value={currentFontSize}
              onChange={(value) => onFontSizeChange(value as number)}
            />
          </div>

          <Button
            aria-label="重置设置"
            color="primary"
            size="sm"
            startContent={
              <Icon aria-hidden="true" icon="heroicons:arrow-path" width={16} />
            }
            onPress={onReset}
          >
            重置设置
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DraggableMenu;
