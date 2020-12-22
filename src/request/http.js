import axios from 'axios'; // 引入axios
import store from '@/store/index'; // 先导入vuex,因为我们要使用到里面的状态对象
import baseURL from './baseUrl';
import { errorHandle, message, toLogin } from './utils';

const axiosFunc = (baseURL) => {
  const instance = axios.create({
    timeout: 10000,
    baseURL,
    headers: {},
  });

  // 请求拦截
  instance.interceptors.request.use(
    (config) => {
      /*
          每次发送请求之前判断vuex中是否存在token
          如果存在，则统一在http请求的header都加上token，这样后台根据token判断你的登录情况
          即使本地存在token，也有可能token是过期的，所以在响应拦截器中要对返回状态进行判断
      */
      const token = store.state.token;
      token && (config.headers.Authorization = token);
      return config;
    },
    (err) => {
      // 请求错误处理
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      // http状态码为200，说明接口请求成功，可以正常拿到数据。否则的话抛出错误
      if (response.status === 200) {
        const status = response.data.status; // 后端状态码
        return status ? response.data.data : message(response.data.message);
      } else {
        errorHandle(response.status, response.data.message)
      }
    },
    // 服务器状态码不是2开头的的情况
    // 这里可以跟你们的后台开发人员协商好统一的错误状态码。然后根据返回的状态码进行一些操作，例如登录过期提示，错误提示等等。下面列举几个常见的操作，其他需求可自行扩展
    (error) => {
      const { response } = error;
      if (response) {
        // 请求已发出，但是不在2xx的范围
        errorHandle(response.status, response.data.message);
        return Promise.reject(response);
      } else {
        // 处理断网的情况
        // eg:请求超时或断网时，更新state的network状态。network状态在app.vue中控制着一个全局的断网提示组件的显示隐藏。关于断网组件中的刷新重新获取数据，会在断网组件中说明
        if (!window.navigator.onLine) {
          store.commit('changeNetwork', false);
        } else {
          return Promise.reject(error);
        }
      }
    }
  );
  return instance;
};

// 多个baseURL的情况
export const baseAxios = axiosFunc(baseURL);
// export const axios2 = axiosFunc(baseURL2)
