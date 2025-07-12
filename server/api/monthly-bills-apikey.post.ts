import type { MonthlyApikeyBillResult } from '~~/types/logic'
import { H3Error } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { cookie, month, subjectId } = body

  if (!cookie || !month || !subjectId) {
    throw createError({
      statusCode: 400,
      message: 'Missing parameters',
    })
  }

  const query = new URLSearchParams({
    month,
  })

  try {
    // 获取账单数据
    const resp = await fetch(`https://cloud.siliconflow.cn/biz-server/api/v1/invoices/month_detail_apikey?${query}`, {
      headers: {
        cookie,
        'X-Subject-id': subjectId,
      },
    })
    const bodyText = await resp.text()
    if (bodyText.includes('登录')) {
      throw createError({
        statusCode: 401,
        message: 'Cookie 失效',
      })
    }
    const respBody = JSON.parse(bodyText)

    if (!respBody.status || !respBody.data?.results) {
      throw createError({
        statusCode: respBody.code,
        message: `硅基流动 API 返回报错：${respBody.message}`,
      })
    }

    // 组合数据
    const results = respBody.data.results.map(
      (bill: any) =>
        ({
          name: bill.apiKey === 'playground' ? '在线体验' : bill.apiKeyDescription || `未命名(sk-***${bill.apiKey.slice(-4)})`,
          isDisabled: bill.status === 'disabled',
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
