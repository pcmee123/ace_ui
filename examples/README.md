# 框架接入示例

`minimal.html` 可直接打开。Vue / React 文件是接入已有应用的源组件；本目录不安装框架，不冒充已发布的 npm 包。

1. 在应用入口引入 `dist/ace-ui.css` 或 `css/ace-ui.css`。
2. 在 html 默认写 data-ace-theme="dark"，在 body 或应用根写 class="ace-ui"。
3. 复制本目录组件，调整 icons/ace-icons.json 的相对导入路径。
4. 需要主题恢复时，在宿主 HTML 的 CSS 前引入 js/ace-theme-init.js；ThemeSwitch 读取相同主题属性和存储键。
5. 图标组件通过 JSON 渲染 path，不调用 AceIcons.mount，不让外部脚本修改框架控制的 SVG。

Vue 用法：`<AceButton variant="primary" @click="createProject"><AceIcon name="plus" />创建项目</AceButton>`。

React 用法：`<AceButton variant="primary" onClick={createProject}><AceIcon name="plus" />创建项目</AceButton>`。

原生布局模板中的 data-ace-* 可按同样语义改为框架事件。Dialog 建议保留原生 HTMLDialogElement，通过 ref 调用 showModal()/close()，不要同时加载两套弹窗控制器。React/TypeScript 需开启 resolveJsonModule；所有需要的框架依赖由宿主应用提供。
