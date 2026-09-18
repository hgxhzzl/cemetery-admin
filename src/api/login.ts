// store/actions.ts
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';

import type { UserPermission } from '@/types/interface';

// 与 utils/request/index.ts 的 host 逻辑保持一致：mock 或未启用直连代理时使用相对路径，由 Vite/Nginx 反代到后端
const host =
  import.meta.env.MODE === 'mock' || import.meta.env.VITE_IS_REQUEST_PROXY !== 'true'
    ? ''
    : import.meta.env.VITE_API_URL;
const loginApiUrl = `${host}${import.meta.env.VITE_API_URL_PREFIX || '/api'}/login`;

// 登录接口响应：code 0 且 message 为登录成功时 resolve，其余数据透传 20260917 优化
export interface LoginResult {
  code: number;
  message: string;
  data: {
    token?: string;
    userPhone?: string;
    userName?: string;
    userId?: number;
    dataBaseName?: string;
    userInfo?: {
      roles?: UserPermission[];
    };
  };
}

export const login = (username: string, password: string): Promise<LoginResult> => {
  return new Promise((resolve, reject) => {
    const requestConfig: AxiosRequestConfig = {
      url: loginApiUrl,
      method: 'post',
      data: {
        username,
        password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    };

    axios(requestConfig)
      .then((response: AxiosResponse) => {
        const result = response.data;
        if (result.code === 0 && result.message === '登录成功') {
          resolve(result);
        } else {
          reject(new Error(result.message));
        }
      })
      .catch((error) => {
        // 20260827 修复：优先提取后端返回的真实错误信息（如 401 的 Invalid username or password），
        // 避免前端弹出 axios 默认的 "Request failed with status code 401" 导致误判为服务故障，
        const status = error.response?.status;
        const backendMsg = error.response?.data?.message;
        let msg = backendMsg || error.message;
        if (status === 401) {
          msg = '账号或密码错误，请重新输入';
        } else if (!backendMsg && error.message?.includes('Network Error')) {
          msg = '无法连接登录服务，请确认后端服务（端口 3000）已启动';
        }
        reject(new Error(msg));
      });
  });
};
