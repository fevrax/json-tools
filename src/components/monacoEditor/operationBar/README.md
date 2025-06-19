# 操作栏工具库

这个工具库提供了用于构建Monaco编辑器操作栏的通用组件和工具函数。

## 文件结构

- `OperationBarBase.tsx`: 包含所有通用的类型定义、工具函数和渲染函数

## 主要功能

### 类型定义

- `BaseButtonConfig`: 基础按钮配置
- `StatusButtonConfig`: 状态按钮配置（带有成功/错误状态）
- `DropdownButtonConfig`: 下拉菜单按钮配置
- `ButtonConfig`: 所有按钮类型的联合类型
- `ButtonGroup`: 按钮组定义
- `IconStatus`: 图标状态枚举（默认、成功、错误）

### 常量

- `MORE_BUTTON_WIDTH`: 更多按钮的宽度
- `SEPARATOR_WIDTH`: 分隔线宽度
- `MIN_PADDING`: 最小左右间距
- `DEFAULT_DROPDOWN_TIMEOUT`: 默认下拉菜单关闭延迟时间

### Hook 函数

- `useDropdownTimeout`: 管理下拉菜单超时的自定义Hook
- `useAdaptiveButtons`: 自适应计算可见按钮和隐藏按钮的Hook

### 渲染函数

- `renderStandardButton`: 渲染标准按钮
- `renderDropdownButton`: 渲染带下拉菜单的按钮
- `renderMoreMenu`: 渲染更多菜单

## 使用方法

### 1. 导入所需的组件和函数

```tsx
import {
  BaseButtonConfig,
  ButtonConfig,
  ButtonGroup,
  IconStatus,
  renderDropdownButton,
  renderMoreMenu,
  renderStandardButton,
  useAdaptiveButtons,
  useDropdownTimeout,
} from "./utils/operationBarUtils";
```

### 2. 设置状态和引用

```tsx
const containerRef = useRef<HTMLDivElement>(null);
const [isDropdownOpen, setDropdownOpen] = useState(false);
const { createTimeout } = useDropdownTimeout();
```

### 3. 创建下拉菜单处理函数

```tsx
const showDropdown = () => {
  setDropdownOpen(true);
};

const unShowDropdown = () => {
  createTimeout('dropdown', () => setDropdownOpen(false), DEFAULT_DROPDOWN_TIMEOUT);
};
```

### 4. 定义按钮组配置

```tsx
const actionGroups: ButtonGroup[] = [
  {
    key: "group1",
    buttons: [
      {
        key: "button1",
        icon: "some-icon",
        text: "按钮文本",
        tooltip: "按钮提示",
        onClick: () => { /* 处理点击事件 */ },
        priority: 10, // 优先级
        width: 100, // 估计宽度
      },
      // 更多按钮...
    ]
  }
];
```

### 5. 使用自适应按钮Hook

```tsx
const { visibleButtons, hiddenButtons } = useAdaptiveButtons(containerRef, actionGroups);
```

### 6. 渲染按钮

```tsx
const renderButton = (button: ButtonConfig) => {
  if (!visibleButtons.includes(button.key)) return null;
  
  if ("isStatusButton" in button && button.isStatusButton) {
    return <StatusButton {...button} />;
  }
  
  if ("hasDropdown" in button && button.hasDropdown) {
    return renderDropdownButton(
      button,
      isDropdownOpen,
      setDropdownOpen,
      showDropdown,
      unShowDropdown
    );
  }
  
  return renderStandardButton(button);
};
```

### 7. 在组件中使用

```tsx
return (
  <div ref={containerRef} className="operation-bar">
    <div className="button-group">
      {actionGroups[0].buttons.map(renderButton)}
    </div>
    
    {/* 渲染更多菜单 */}
    {renderMoreMenu(
      hiddenButtons,
      isMoreDropdownOpen,
      setMoreDropdownOpen,
      showMoreDropdown,
      unShowMoreDropdown
    )}
  </div>
);
```

## 注意事项

- 每个按钮需要有唯一的 `key`
- 按钮的 `priority` 越小，优先级越高
- `width` 属性用于估计按钮宽度，以便自适应计算
- 对于状态按钮，需使用 `StatusButton` 组件 