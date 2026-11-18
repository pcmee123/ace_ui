# ACE UI 双端 APP 模板

两种应用场景各提供 Windows 窗口版与手机版。在浏览器打开模板即可体验，也可以把页面和资源引入桌面或手机 WebView 项目。

| 模板 | 结构 | 可体验的操作 |
| --- | --- | --- |
| [Windows AI 助手](../templates/windows-assistant.html) | Windows 标题栏、会话侧栏、对话与上下文分栏 | 新建对话、查看历史、选择模型、使用提示模板、Ctrl + Enter 发送 |
| [Windows 管理工作台](../templates/windows-workbench.html) | Windows 标题栏、工作区侧栏、指标卡、任务表格和右侧抽屉 | 筛选与新建任务、更新任务状态、查看团队动态 |
| [手机 AI 助手](../templates/mobile-assistant.html) | 底部导航、独立滚动对话区、固定输入栏和模型面板 | 触控发送、切换历史、套用提示模板、选择模型 |
| [手机管理工作台](../templates/mobile-workbench.html) | 双列指标、任务卡片、底部导航和详情底部面板 | 搜索筛选、创建任务、处理状态、查看团队动态 |

## 复制到新项目

1. 复制所需 HTML、`css/`、`js/`、`assets/ace-mark.svg`、`showcase/app-shell.js` 和对应的 `app-assistant.js` 或 `app-workbench.js`。保留路径关系，或调整 HTML 中的引用。
2. 核心样式可用 `css/ace-ui.css` 或 `dist/ace-ui.css`。随后引入 `css/ace-app.css`，获取窗口外框、应用导航、输入区和移动面板。四种主题共享同一份组件与布局样式。
3. Windows 模板以 `.ace-app-titlebar` 预览窗口外观。按钮可在浏览器中收起、展开和关闭预览。嵌入桌面宿主时，把这些按钮绑定到宿主窗口 API，并按宿主要求设置标题栏拖动区域。
4. 手机模板以 `100dvh` 布局，底部导航和弹窗使用安全区内边距。AI 输入区与消息区分别布局，有滚动的消息区和始终可操作的输入栏。嵌入手机 WebView 后应复测键盘打开、横竖屏和安全区。
5. 将演示回复替换为真实模型接口，将本地任务数据替换为业务 API。相同 HTTP 来源内的双端同类模板共用本地存储。直接打开文件时，文件间的存储隔离由浏览器决定。

## 案例截图

- [Windows AI 助手](screenshots/windows-assistant.png)
- [Windows 管理工作台](screenshots/windows-workbench.png)
- [手机 AI 助手](screenshots/mobile-assistant.png)
- [手机管理工作台](screenshots/mobile-workbench.png)

## 验证

`node qa/apps.cjs` 会在本机 Playwright 和 Chromium 中检查四种皮肤、窗口控件、对话历史和任务流程。环境配置见 README。设置 `ACE_APP_SCREENSHOTS=1` 可重新生成案例截图。
