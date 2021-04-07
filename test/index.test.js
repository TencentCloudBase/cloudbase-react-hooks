import { renderHook, act } from '@testing-library/react-hooks'
import * as fs from 'fs'
import * as pt from 'path'
import fetch from 'node-fetch'

import { createCloudbaseHooks } from '../'

// 注意添加安全域名
console.log('url:', location.href)

let cloudbaseHooks

beforeAll(async () => {
  cloudbaseHooks = createCloudbaseHooks({
    env: process.env._ENV_ID,
    loginType: 'custom',
    fetchTicket: async () => {
      let res = await fetch(process.env._TICKET_URL).then(r => r.json())
      // console.log(res)
      return res.ticket
    }
  })

  const { result: loginRes, waitForNextUpdate } = renderHook(() => cloudbaseHooks.useLoginState())

  await waitForNextUpdate({
    timeout: 5000
  })
  const { loginState, credential } = loginRes.current

  expect(loginState).toEqual(true)
  expect(credential).toBeTruthy()
})

// TODO 为自动配置好权限，需要先手动设置好云开发环境权限允许该用例访问相应资源

test('database', async () => {
  const { useDatabase } = cloudbaseHooks
  const { result, waitForNextUpdate } = renderHook(() =>  useDatabase())

  await waitForNextUpdate()

  const db = result.current
  const col = db.collection(process.env._COLLECTION)
  const id = Math.random() + ''
  const addRes = await col.add({
    a: 1,
    _id: id
  })

  console.debug(addRes)

  expect(addRes).toBeTruthy()

  const delRes = await col.doc(id).remove()

  console.debug(delRes)

  expect(delRes).toBeTruthy()
  expect(delRes.deleted).toEqual(1)
})

test('upload', async () => {
  const { useUpload } = cloudbaseHooks
  const { result } = renderHook(() => useUpload())

  const { result: uploadRes, uploading, progressEvent, upload, error } = result.current

  await act(async () => upload('./lowcode.png', fs.readFileSync(pt.resolve(__dirname, './lowcode.png'))))

  console.log({ uploading, progressEvent, error })
})
