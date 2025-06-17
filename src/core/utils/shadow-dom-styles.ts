/**
 * Shadow DOM 样式
 * 这个文件包含了编译后的 CSS，避免动态导入的问题
 */

export const getShadowDOMStyles = (): string => {
    // 注意：这是一个临时解决方案
    // 在生产环境中，应该通过构建工具自动生成这个文件
    return `
        /* Tailwind CSS Reset and Base */
        *, ::before, ::after {
            box-sizing: border-box;
            border-width: 0;
            border-style: solid;
            border-color: currentColor;
        }
        
        /* Import the compiled CSS content here */
        /* This will be replaced with actual compiled CSS in production */
        
        /* For now, let's add essential styles */
        .acquire-language-extension {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 16px;
            line-height: 1.5;
            color: #333;
        }
        
        .acquire-language-extension * {
            box-sizing: border-box;
        }
        
        /* We'll need to copy the compiled CSS here */
    `;
};
