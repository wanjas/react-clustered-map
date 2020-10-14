declare module 'react-async-script' {
  import { ComponentClass, ComponentType as Component } from 'react';

  interface ComponentEnhancer<TInner, TOutter> {
    (component: Component<TInner>): ComponentClass<TOutter>;
  }

  export interface AsyncScriptLoaderOptions {
    attributes?: Record<string, any>;
    callbackName?: string;
    globalName?: string;
    removeOnUnmount?: boolean;
    scriptId?: string;
  }

  type HocFunction = ComponentEnhancer;

  export default function makeAsyncScriptLoader(
    getScriptUrl: string,
    options?: AsyncScriptLoaderOptions,
  ): HocFunction;
}
