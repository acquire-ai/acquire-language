# Shadow DOM 主题支持修复

## 问题描述

在 Shadow DOM 环境下，`<ThemeProvider>` 组件不生效，无法正确应用主题（如 dark 模式）。这是因为 `next-themes` 库默认操作 `document.documentElement`（即 `<html>` 元素），但在 Shadow DOM 中，这个操作不会影响到 Shadow DOM 内部的元素。

## 解决方案

### 1. 创建专用的 Shadow DOM 主题提供者

在 `src/components/settings/theme-provider.tsx` 中新增了 `ShadowThemeProvider` 组件：

- 使用 React Context 管理 Shadow DOM 内的主题状态
- 直接操作 Shadow DOM 内的 `<html>` 元素，添加/移除主题类名
- 支持 `light`、`dark` 和 `system` 三种主题模式
- 监听系统主题变化（当设置为 `system` 时）
- 与全局主题设置保持同步

### 2. 修改 Content Script 架构

#### UI Manager 更新

- 修改 `src/entrypoints/content/ui-manager.tsx`，支持传递 Shadow DOM 引用
- 在初始化时接收 `shadowRoot` 参数

#### Content Script 更新

- 修改 `src/entrypoints/content/index.tsx`，将 Shadow DOM 引用传递给 UI Manager

#### Overlay Panel 更新

- 修改 `src/entrypoints/content/overlay-panel.tsx`，使用 `ShadowThemeProvider` 替代原来的 `ThemeProvider`

### 3. 创建 Shadow DOM 专用主题切换组件

在 `src/components/settings/theme-toggle.tsx` 中新增了 `ShadowThemeToggle` 组件：

- 使用 `useShadowTheme` hook 而不是 `useTheme`
- 样式与其他按钮保持一致（`h-8 w-8`，`ghost` 变体）
- 支持完整的主题切换功能

### 4. 在 WordDefinitionDrawer 中集成主题切换

- 在 `src/components/word-analysis/WordDefinitionDrawer.tsx` 中添加了 `ShadowThemeToggle`
- 位置：标题栏右侧，在展开/收缩按钮和关闭按钮之间


## 技术细节

### Shadow DOM 主题应用机制

1. **主题状态管理**：

    - 全局主题状态通过 `useGlobalTheme` 获取
    - Shadow DOM 内部通过 `ShadowThemeContext` 管理本地状态

2. **DOM 操作**：

    ```typescript
    // 移除所有主题类
    htmlElement.classList.remove('light', 'dark');

    // 添加当前主题类
    if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        htmlElement.classList.add(isDark ? 'dark' : 'light');
    } else {
        htmlElement.classList.add(theme);
    }
    ```


### 组件通信流程

```
全局设置 → useGlobalTheme → ShadowThemeProvider → ShadowThemeContext → ShadowThemeToggle
    ↓                                    ↓
保存到存储                        应用到 Shadow DOM HTML 元素
```

## 测试验证

1. **构建测试**：✅ 成功通过 `npm run build`
2. **功能测试**：需要在浏览器中验证主题切换是否正常工作

## 使用方法

在 Shadow DOM 环境中使用主题功能：

```tsx
// 包装组件
<ShadowThemeProvider shadowRoot={shadowRoot}>
    <YourComponent />
</ShadowThemeProvider>;

// 在组件内使用主题切换
import { ShadowThemeToggle } from '@/components/settings/theme-toggle';

function YourComponent() {
    return (
        <div>
            <ShadowThemeToggle />
            {/* 其他内容 */}
        </div>
    );
}
```

## 注意事项

1. **Shadow DOM 引用**：确保正确传递 `shadowRoot` 参数
2. **CSS 变量**：所有主题相关的 CSS 变量都需要在 `:host` 选择器中定义
3. **事件监听**：系统主题变化监听器会在组件卸载时自动清理
4. **兼容性**：保持与原有 `ThemeProvider` 的兼容性，不影响其他页面的主题功能

