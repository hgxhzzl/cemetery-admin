import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import isFunction from 'lodash/isFunction';

import type { AxiosRequestConfigRetry, RequestOptions, Result } from '@/types/axios';

import type { CreateAxiosOptions } from './AxiosTransform';

/**
 * Axios 模块
 *
 * 模板自带的四组能力在本项目没有任何调用方，已整体删除（20261019 审查瘦身）：
 * 1) form-urlencoded 与 params 序列化（supportFormData / supportParamsStringify，依赖 qs）：全局
 *    Content-Type 恒为 JSON，无人设过 x-www-form-urlencoded，且 supportParamsStringify 的调用本来就是注释；
 *    qs 会连带把 side-channel / get-intrinsic / function-bind 内省表打进首屏预加载的 chunk
 * 2) 重复请求取消器 AxiosCancel：默认 requestOptions.ignoreCancelToken = true，使 addPending 永不执行，
 *    整个取消器只在空表上 removePending，属空转抽象
 * 3) 接口级节流/防抖（throttle / debounce + pendingResolvers 队列）：无任何请求配置过这两项，且并发多请求时
 *    resolver 与 config 的配对并不可靠
 * 4) put / patch / delete / upload 与 getAxios / setHeader / configAxios：后端只暴露 GET/POST，
 *    全项目实际只调用 request.get（63 处）与 request.post（34 处）
 * 需要恢复时优先用 axios 原生能力（adapter / paramsSerializer / CancelToken），不要再引回 qs
 */
export class VAxios {
  /**
   * Axios实例句柄
   * @private
   */
  private instance: AxiosInstance;

  /**
   * Axios配置
   * @private
   */
  private readonly options: CreateAxiosOptions;

  constructor(options: CreateAxiosOptions) {
    this.options = options;
    this.instance = axios.create(options);
    this.setupInterceptors();
  }

  /**
   * 获取数据处理类
   * @private
   */
  private getTransform() {
    const { transform } = this.options;
    return transform;
  }

  /**
   * 设置拦截器
   * @private
   */
  private setupInterceptors() {
    const transform = this.getTransform();
    if (!transform) return;

    const { requestInterceptors, requestInterceptorsCatch, responseInterceptors, responseInterceptorsCatch } =
      transform;

    // 请求拦截器
    this.instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (requestInterceptors && isFunction(requestInterceptors)) {
        config = requestInterceptors(config, this.options) as InternalAxiosRequestConfig;
      }

      return config;
    }, undefined);

    // 请求错误处理
    if (requestInterceptorsCatch && isFunction(requestInterceptorsCatch)) {
      this.instance.interceptors.request.use(undefined, requestInterceptorsCatch);
    }

    // 响应结果处理
    this.instance.interceptors.response.use((res: AxiosResponse) => {
      if (responseInterceptors && isFunction(responseInterceptors)) {
        res = responseInterceptors(res);
      }
      return res;
    }, undefined);

    // 响应错误处理
    if (responseInterceptorsCatch && isFunction(responseInterceptorsCatch)) {
      this.instance.interceptors.response.use(undefined, (error) => responseInterceptorsCatch(error, this.instance));
    }
  }

  get<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    return this.request({ ...config, method: 'GET' }, options);
  }

  post<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<T> {
    return this.request({ ...config, method: 'POST' }, options);
  }

  /**
   * 请求封装
   * @param config
   * @param options
   */
  request<T = any>(config: AxiosRequestConfigRetry, options?: RequestOptions): Promise<T> {
    return this.synthesisRequest(config, options);
  }

  /**
   * 请求方法
   * @private
   */
  private async synthesisRequest<T = any>(config: AxiosRequestConfigRetry, options?: RequestOptions): Promise<T> {
    // cloneDeep 有意保留：beforeRequestHook 会就地改写 url/params，formatRequestDate 会改写 data，
    // 不克隆会污染调用方传入的表单对象（各页表单均为响应式 ref.value）
    let conf: CreateAxiosOptions = cloneDeep(config);
    const transform = this.getTransform();

    const { requestOptions } = this.options;

    const opt: RequestOptions = { ...requestOptions, ...options };

    const { beforeRequestHook, requestCatchHook, transformRequestHook } = transform || {};
    if (beforeRequestHook && isFunction(beforeRequestHook)) {
      conf = beforeRequestHook(conf, opt);
    }
    conf.requestOptions = opt;

    return new Promise((resolve, reject) => {
      this.instance
        .request<any, AxiosResponse<Result>>(!config.retryCount ? conf : config)
        .then((res: AxiosResponse<Result>) => {
          if (transformRequestHook && isFunction(transformRequestHook)) {
            try {
              const ret = transformRequestHook(res, opt);
              resolve(ret);
            } catch (err) {
              reject(err || new Error('请求错误!'));
            }
            return;
          }
          resolve(res as unknown as Promise<T>);
        })
        .catch((e: Error | AxiosError) => {
          if (requestCatchHook && isFunction(requestCatchHook)) {
            reject(requestCatchHook(e, opt));
            return;
          }
          reject(e);
        });
    });
  }
}
