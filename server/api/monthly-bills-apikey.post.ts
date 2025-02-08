import type { MonthlyApikeyBillResult } from '~~/types/logic'
import { H3Error } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { cookie, month } = body

  if (!cookie || !month) {
    throw createError({
      statusCode: 400,
      message: 'Missing parameters',
    })
  }

  const query = new URLSearchParams({
    action: 'invoices/month_detail_apikey',
    month,
  })

  try {
    // 获取账单数据
    const resp = await fetch(
      `https://cloud.siliconflow.cn/api/redirect/bill?${query}`,
      {
        headers: {
          cookie,
        },
      },
    )
    const bodyText = await resp.text()
    if (bodyText.includes('登录')) {
      throw createError({
        statusCode: 401,
        message: 'Cookie 失效',
      })
    }
    const body = JSON.parse(bodyText)

    if (!body.status || !body.ok || !body.data?.results) {
      throw createError({
        statusCode: body.code,
        message: `硅基流动 API 返回报错：${body.message}`,
      })
    }

    // 获取 API Key 详情数据
    const apikeyResp = await fetch(
      'https://cloud.siliconflow.cn/api/v1/apikey/all',
      {
        method: 'POST',
        headers: {
          cookie,
        },
      },
    )
    const apikeyBodyText = await apikeyResp.text()
    if (apikeyBodyText.includes('登录')) {
      throw createError({
        statusCode: 401,
        message: 'Cookie 失效',
      })
    }
    const apikeyData = JSON.parse(apikeyBodyText)

    if (!apikeyData.status || !apikeyData.data?.records) {
      throw createError({
        statusCode: apikeyData.code,
        message: `硅基流动 API 返回报错：${apikeyData.message}`,
      })
    }

    // 创建 API Key 状态映射
    const apikeyStatusMap = new Map<
      string,
      { isDisabled: boolean; name: string }
    >(
      apikeyData.data.records.map((key: any) => [
        key.secretKey,
        {
          isDisabled: key.status === 'disabled',
          name: key.description || `未命名(sk-***${key.secretKey.slice(-4)})`,
        },
      ]),
    )

    // 组合数据
    const results = body.data.results.map(
      (bill: any) =>
        ({
          name:
            bill.apiKey === 'playground'
              ? '在线体验'
              : apikeyStatusMap.get(bill.apiKey)?.name || 'Unknown',
          isDisabled: apikeyStatusMap.get(bill.apiKey)?.isDisabled ?? false,
          llmTokens: bill.llmTokens,
          imageTokens: bill.imageTokens,
          price: parseFloat(bill.amount),
        }) as MonthlyApikeyBillResult,
    )

    return results
  } catch (error) {
    if (error instanceof H3Error) throw error

    console.error(error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch bill data',
    })
  }
})
