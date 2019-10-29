import { useState, useEffect } from 'react'
import * as cloudbase from 'tcb-js-sdk'

export class CloudbaseHooks {
  constructor({ env, loginType, ticketCallback, persistence }) {
    this.env = env
    this.app = cloudbase.init({ env })
    this.auth = this.app.auth({ persistence })
    this.db = this.app.database()
    this.loginType = loginType
    this.ticketCallback = ticketCallback
  }

  async _checkLoginState() {
    const loginState = await this.auth.getLoginState()
    if (!loginState) {
      return await this._login()
    }
    return loginState
  }

  async _login() {
    switch (this.loginType) {
      case 'custom': {
        const ticket = await this.ticketCallback()
        return this.auth.signInWithTicket(ticket)
      }
      default:
        throw new Error(`未知的登录类型：${this.loginType}`)
    }
  }

  useLoginState() {
    const [loginState, setLoginState] = useState(false)
    const [credential, setCredential] = useState(null)
    const init = async () => {
      const { credential } = await this._checkLoginState()
      setLoginState(true)
      setCredential(credential)
    }

    useEffect(() => {
      init()
    }, [])

    return {
      loginState,
      credential
    }
  }

  useDatabaseWatch(collection, query = useState({})[0]) {
    const [snapshot, setSnapShot] = useState(null)
    const [error, setError] = useState(null)
    const [connecting, setConnecting] = useState(true)

    useEffect(() => {
      let watcher
      const init = async () => {
        await this._checkLoginState()
        await this.db.collection(collection).where(query).watch({
          onChange(snapshot) {
            setConnecting(false)
            setSnapShot(snapshot)
          },
          onError(err) {
            setError(err)
          }
        })
      }
      init()
      return () => {
        if (watcher) {
          watcher.close()
        }
      }
    }, [collection, query])

    return {
      snapshot,
      connecting,
      error
    }
  }
}