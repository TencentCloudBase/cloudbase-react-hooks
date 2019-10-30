# cloudbase-react-hooks

# 安装

```text
npm install --save @cloudbase/react-hooks
```

# 使用

### 初始化
```js
const { createCloudbaseHooks } = require('@cloudbase/react-hooks')

// 初始化 Hook
const {
  useCloudbase,
  useLoginState,
  useUpload,
  useCloudFile,
  useDatabaseWatch
} = createCloudbaseHooks({
  env: 'cloudbase-env-id',
  loginType: 'custom',
  fetchTicket: async function() {
    // 拉取自定义登录ticket...
  }
})
```

### useCloudbase()

返回 Cloudbase 实例，如果尚未初始化完毕，那么返回 `null`。

```js
function App() {
  const cloudbase = useCloudbase()
  return (
    cloudbase ?
      <div>Hello, Cloudbase!</div> :
      <div>Cloudbase正在初始化...</div>
  )
}
```

### useLoginState()

返回当前登录状态 `loginState` 和登录凭据 `credential`

```js
function App() {
  const { loginState, credential } = useLoginState()
  return (
    loginState ?
      <div>登录成功，refreshToken：{credential.refreshToken}</div> :
      <div>还没有登录哦</div>
  )
}
```

### useUpload()

文件上传

```js
function App() {
  const { upload, progressEvent, uploading, result, error } = useUpload()

  async function onFileChange(e) {
    const file = e.target.files[0]
    await upload('file-cloud-path', file)
  }

  if (uploading) {
    const percent = progressEvent ?
      (progressEvent.loaded / progressEvent.total * 100).toFixed(2) :
      0
    return (
      <div>正在上传中，上传进度：{percent}%</div>
    )
  } else if (result) {
    return <div>上传成功，fileID：{result.fileID}</div>
  } else if (error) {
    return <div>上传失败：{error.message}</div>
  } else {
    return <input type="file" onChange={onFileChange} />
  }
}
```

### useCloudFile()

获取云存储中的文件URL

```js
function App() {
  const { url, loading, error } = useCloudFile('cloud://starkwang-e850e3.7374-starkwang-e850e3-1257776809/file-cloud-path')
  console.log(url, loading, error)
  if (loading) {
    return <div>加载图片路径中...</div>
  } else if (url) {
    return <img src={url}/>
  } else if (error) {
    return <div>加载图片失败：{error.message}</div>
  } else {
    return <div>Hello</div>
  }
}
```

### useDatabaseWatch()

实时监听数据库

```js
function App() {
  const { snapshot, connecting } = useDatabaseWatch('messages', { roomId: '123' })

  if (connecting) {
    return <div>连接中...</div>
  } else if (snapshot) {
    return (<div>
      {
        snapshot.docs.map(doc => <p key={doc._id}>{doc.text}</p>)
      }
    </div>)
  } else {
    return <div></div>
  }
}
```

# TODO

- [ ] 获取数据（useQuery），处理loading、error、retry
- [ ] 更新数据（useUpdate）
- [ ] 云函数（useFunction）
- [ ] SSR
