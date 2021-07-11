class SsoClient {
  state = {
    // iframe url
    mainOrigin: 'http://192.168.0.100:5000',
    // iframe id (唯一)
    iframeId: 'monitor',
    // need init
    isInit: true,
    // remove id
    removeId: 'remove',
    // base64 密钥
    secretKey: 'U1NPLURBVEE=',
    // 建立iframe状态
    isSuccess: false
  }
  /**
   * @description: 防抖函数
   * @param {*} fn 函数
   * @param {*} delay 毫秒
   */
  _debounce(fn, delay = 200) {
    let timer
    return function () {
      const that = this
      let args = arguments
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(function () {
        timer = null
        fn.apply(that, args)
      }, delay)
    }
  }
  /**
   * @description: 创建公共网页
   * @description: 注意：id有默认值 建议还是传一个值 要不然有各种莫名奇怪的问题
   * @param { id } 唯一id
   * @return Promise
   */
  appendIframe(id = this.state.iframeId) {
    return new Promise(async resolve => {
      const iframe = document.getElementById(id)
      if (!iframe) {
        // await this.destroyIframe()
        const ssoSrc = this.state.mainOrigin + '/sso/'
        const i = document.createElement('iframe')
        i.style.display = 'none'
        i.src = ssoSrc
        i.id = id
        document.body.appendChild(i)
        resolve('')
      }
    })
  }
  /**
   * @description: 销毁iframe，释放iframe所占用的内存。
   * @description: 注意：id有默认值 建议还是传一个值 要不然有各种莫名奇怪的问题
   * @param { id } 唯一id
   * @return Promise
   */
  destroyIframe(id = this.state.iframeId) {
    return new Promise(resolve => {
      const iframe = document.getElementById(id)
      if (iframe) {
        iframe.parentNode.removeChild(iframe)
        resolve('')
      }
    })
  }
  /**
   * @description: 建立 iframe 连接
   * @description: 初始化会自动注册
   */
  initMiddle = async () => {
    await this.appendIframe()
    window.addEventListener('message', this.getMiddleInfo, false)
    // 5秒之内没有获取到data提示用户获取信息失败
    // 场景：断网，程序出错，服务挂了
    setTimeout(() => {
      if (!this.state.isSuccess) {
        window.confirm('获取用户信息失败，请联系管理员或者重新获取。')
        window.location.reload()
      }
    }, 5000);
  }
  /**
   * @description: 全局发送信息
   * @param: {get} 查询
   * @param: {updata -> } 场景1: 退出登录
   */
  postMiddleMessage = (type = 'get', user = { type: 'get' }) => {
    // iframe实例
    const contentWindow = document.getElementById(this.state.iframeId).contentWindow
    // 密钥 (必传)
    user.secretKey = this.state.secretKey
    if (type === 'updata' && JSON.stringify(user) !== '{}') {
      contentWindow.postMessage({
        user
      }, this.state.mainOrigin)
    } else {
      // 默认查询
      contentWindow.postMessage({
        user
      }, this.state.mainOrigin)
    }
  }
  /**
   * @description: 实时处理iframe信息
   * @param {*} event
   */
  getMiddleInfo = (event) => {
    if (this.state.isInit) {
      // 初始化
      this.postMiddleMessage('get')
    }
    if (event.origin === this.state.mainOrigin) {
      // 建立 成功
      this.state.isInit = false
      this.state.isSuccess = true
      const data = event.data
      this.businss(data)
    }
  }
  /**
   * @description: do someing
   * @description: 全局处理iframe信息
   * @param {data} {token, loginname, password, type}
   */
  businss = (data) => {
    // console.log(data , 'success');

    if (data.token || data.password) {
      // 获取信息
      if (data.token === this.state.removeId) {
        this.rmLocal()
        // alert('登录状态以失效,退出登录页面')
        // window.location.reload()
      } else {
        // 初始化获取信息成功
        if (data.token) {
          this.setLocal('user', data)
        } else {
          console.log('password');
        }
      }
      document.getElementById('content').innerHTML = `
    <h3>loginname:${data.loginname}</h3>
    <h3>token:${data.token}</h3>
    <h1>password:${data.password}</h1>
    <h3>info:${data.info}</h3>
    `
    } else {

    }


  }
  getLocal = (key = 'user') => {
    return JSON.parse(sessionStorage.getItem(key))
  }
  setLocal = (key = 'user', data) => {
    return sessionStorage.setItem(key, JSON.stringify(data))
  }
  rmLocal = (key = 'user') => {
    return sessionStorage.removeItem(key)
  }
}

window.onload = function () {
  const initSsoClient = new SsoClient()

  initSsoClient.initMiddle()

  window.initSsoClient = initSsoClient
}