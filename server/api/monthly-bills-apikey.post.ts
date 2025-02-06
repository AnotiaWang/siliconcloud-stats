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
    const billResp = await fetch(
      `https://cloud.siliconflow.cn/api/redirect/bill?${query}`,
      {
        headers: {
          cookie,
        },
      },
    ).then((r) => r.json())

    if (!billResp.status || !billResp.ok || !billResp.data?.results) {
      throw createError({
        statusCode: billResp.code,
        message: `硅基流动 API 返回报错：${billResp.message}`,
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
    ).then((r) => r.json())

    if (!apikeyResp.status || !apikeyResp.data?.records) {
      throw createError({
        statusCode: apikeyResp.code,
        message: `硅基流动 API 返回报错：${apikeyResp.message}`,
      })
    }

    // 创建 API Key 状态映射
    const apikeyStatusMap = new Map<
      string,
      { isDisabled: boolean; name: string }
    >(
      apikeyResp.data.records.map((key: any) => [
        key.secretKey,
        {
          isDisabled: key.status === 'disabled',
          name: key.description || `未命名(sk-***${key.secretKey.slice(-4)})`,
        },
      ]),
    )

    // 组合数据
    const results = billResp.data.results.map(
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
