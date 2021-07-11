'use strict'
class Sso {
  state = {
    // 密钥
    secretKey: 'SSO-DATA',
    // remove id
    removeId: 'remove',
  }
  init = () => {
    document.getElementById('sso').innerText = 'SSO data sharing center'
    window.addEventListener('message', (e) => this.receiveMsg(e), false)
    // 初始化
    window.parent.postMessage(
      { init: 'init' },
      '*'
    )
  }
  // 监听事件
  receiveMsg = (e) => {
    const data = e.data
    if (data) {
      // 退出标识符
      const removeId = this.state.removeId
      const user = data.user
      if (user) {
        const { secretKey } = user
        if (!secretKey) {
          throw '密钥不能为空!'
        } else if (window.atob(secretKey) !== this.state.secretKey) {
          throw '密钥错误!'
        }
        if (user.type && user.type === 'updata') {
          // 更新user
          const { loginname, token, password } = user
          localStorage.setItem(
            'user',
            JSON.stringify({
              loginname,
              token,
              password,
            })
          )
          this.setCookie('loginname', loginname, 1)
          this.setCookie('token', token, 1)
          window.parent.postMessage({ loginname, token, password }, '*')
        } else {
          // 查找本地 user
          const localUser = localStorage.getItem('user')
          // 查找本地 cookies
          const userCookie = this.getCookie('token')

          if (localUser) {
            const { loginname, token, password } = JSON.parse(localUser)
            if (
              (token && token !== removeId) ||
              (password && password !== removeId)
            ) {
              if (userCookie && userCookie === removeId) {
                // 本地有token
                window.parent.postMessage(
                  { token: removeId },
                  '*'
                )
              } else if (userCookie && userCookie !== removeId && userCookie !== 'undefined' && userCookie !== 'null' && userCookie !== token) {
                // cookies 和 local的token不一致
                const newUser = {
                  loginname: this.getCookie('loginname'),
                  token: userCookie,
                }
                localStorage.setItem('user', JSON.stringify(newUser))
                window.parent.postMessage(newUser, '*')
              } else {
                // 正常放行
                window.parent.postMessage({ loginname, token, password }, '*')
              }
            } else if (userCookie && userCookie !== removeId) {
              // 如果cookies有token
              if (token === removeId) {
                // local的token为 remove
                window.parent.postMessage(
                  {
                    token: removeId
                  },
                  '*'
                )
              } else {
                const userObj = {
                  loginname: this.getCookie('user'),
                  token: userCookie
                }
                window.parent.postMessage(userObj, '*')
              }
            } else {
              window.parent.postMessage(
                { loginname, token, password },
                '*'
              )
            }
          } else {
            window.parent.postMessage(
              { token: removeId },
              '*'
            )
          }
        }
      } else {
        window.parent.postMessage(
          { data },
          '*'
        )
      }
    }
  }
  // 存储二级域名
  setCookie = (cname, cvalue, exdays) => {
    const d = new Date()
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000)
    const expires = 'expires=' + d.toGMTString()
    let hostArr = window.location.hostname.split('.')
    // 注意 cookies 只有 '同级' 域名 才能共享 （这里只取最后两位）
    let cdomain = hostArr.slice(-2).join('.')
    const domain = 'domain=' + cdomain
    document.cookie = `${cname}=${cvalue};${expires};${domain};path=/`
  }
  getCookie = (cname) => {
    const name = cname + '='
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      const c = ca[i].trim()
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length)
      }
    }
    return ''
  }
  checkCookie = (cname, cvalue, exdays) => {
    this.setCookie(cname, cvalue, exdays)
  }
}
window.onload = function () {
  new Sso().init()
}
