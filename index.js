import { useState, useEffect } from 'react'
import cloudbase from '@cloudbase/js-sdk'

class CloudbaseHooks {
  constructor({
    env,
    persistence,
    loginType,
    fetchTicket,
    appid,
    scope
  }) {
    this.env = env
    this.app = cloudbase.init({ env })
    this.auth = this.app.auth({ persistence })
    this.db = this.app.database()
    this.loginType = loginType
    this.fetchTicket = fetchTicket
    this.appid = appid
    this.scope = scope
    this._loginPromise = null
  }

  async _checkLoginState() {
    const loginState = await this.auth.getLoginState()

    if (!loginState) {
      if (!this._loginPromise) {
        // 没有登录，且没有正在登录，那么执行登录
        this._loginPromise = this._login()
      }
      const result = await this._loginPromise
      this._loginPromise = null
      return result
    }
    return loginState
  }

  async _login() {
    switch (this.loginType) {
      case 'wechat': {
        return this.auth.weixinAuthProvider({
          appid: this.appid,
          scope: this.scope
        }).signIn()
      }
      case 'custom': {
        const ticket = await this.fetchTicket()
        return this.auth.customAuthProvider().signIn(ticket)
      }
      // 未登录
      default:
        return Promise.resolve(null)
    }
  }

  useLoginState() {
    const [loginState, setLoginState] = useState(false)
    const [credential, setCredential] = useState(null)
    const init = async () => {
      const { credential } = await this._checkLoginState()
      setCredential(credential)
      setLoginState(true)
    }

    useEffect(() => {
      init()
    }, [])

    return {
      loginState,
      credential
    }
  }

  useDatabase() {
    const [database, setDatabase] = useState(null)
    const init = async () => {
      await this._checkLoginState()
      setDatabase(this.db)
    }
    useEffect(() => {
      init()
    }, [])
    return database
  }

  useCloudbase() {
    const [cloudbase, setCloudbase] = useState(null)
    const init = async () => {
      await this._checkLoginState()
      setCloudbase(this.app)
    }
    useEffect(() => {
      init()
    }, [])
    return cloudbase
  }

  useUpload() {
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [progressEvent, setProgressEvent] = useState(null)
    const upload = async (cloudPath, file) => {
      try {
        await this._checkLoginState()
        setUploading(true)
        const res = await this.app.uploadFile({
          cloudPath,
          filePath: file,
          onUploadProgress(progressEvent) {
            setProgressEvent(progressEvent)
          }
        })
        setUploading(false)
        setProgressEvent(null)
        setResult(res)
        return res
      } catch (e) {
        setError(e)
      }
    }

    return {
      progressEvent,
      result,
      uploading,
      error,
      upload
    }
  }

  useCloudFile(cloudPath) {
    const [url, setUrl] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const fetchFileUrl = async (cloudPath) => {
      try {
        await this._checkLoginState()
        setLoading(true)
        const result = await this.app.getTempFileURL({
          fileList: [cloudPath]
        })
        setLoading(false)
        setUrl(result.fileList[0].tempFileURL)
      } catch (e) {
        setError(e)
      }
    }

    useEffect(() => {
      fetchFileUrl(cloudPath)
    }, [cloudPath])

    return {
      url,
      error,
      loading
    }
  }

  useDatabaseWatch(collection, query = useState({})[0]) {
    const [snapshot, setSnapShot] = useState(null)
    const [error, setError] = useState(null)
    const [connecting, setConnecting] = useState(true)

    useEffect(() => {
      let watcher
      const init = async () => {
        try {
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
        } catch (e) {
          setError(e)
        }
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

export function createCloudbaseHooks(options) {
  const hooks = new CloudbaseHooks(options)
  return {
    useLoginState: hooks.useLoginState.bind(hooks),
    useDatabase: hooks.useDatabase.bind(hooks),
    useCloudbase: hooks.useCloudbase.bind(hooks),
    useUpload: hooks.useUpload.bind(hooks),
    useCloudFile: hooks.useCloudFile.bind(hooks),
    useDatabaseWatch: hooks.useDatabaseWatch.bind(hooks)
  }
}
