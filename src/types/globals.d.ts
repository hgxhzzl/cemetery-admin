// 通用声明

// 构建期由 vite define 注入的应用版本号（取自 git describe）20261005 新增
declare const __APP_VERSION__: string;

// Vue
declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<object, object, any>;
  export default component;
}

declare type ClassName = { [className: string]: any } | ClassName[] | string;

declare module '*.svg' {
  const CONTENT: string;
  export default CONTENT;
}

declare type Recordable<T = any> = Record<string, T>;
