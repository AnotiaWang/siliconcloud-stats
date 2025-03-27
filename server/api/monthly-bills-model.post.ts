import type { LLMType, MonthlyModelBillResult } from '~~/types/logic'
import { H3Error } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { cookie, month, modelType } = body

  if (!cookie || !month) {
    throw createError({
      statusCode: 400,
      message: 'Missing parameters',
    })
  }

  const query = new URLSearchParams({
    action: 'invoices/month_detail_model',
    month,
  })

  try {
    const resp = await fetch(`https://cloud.siliconflow.cn/api/redirect/bill?${query}`, {
      headers: {
        cookie,
      },
    })
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

    let results = body.data.results.map(
      (model: any) =>
        ({
          modelName: model.modelName,
          subType: model.subType as LLMType,
          unitAmount: model.unitAmount,
          tokens: model.tokens,
          price: parseFloat(model.amount),
          chargePrice: parseFloat(model.chargeAmount),
          freePrice: parseFloat(model.freeAmount),
        }) as MonthlyModelBillResult,
    )

    // 如果指定了模型类型且不是 'all'，则进行过滤
    if (modelType && modelType !== 'all') {
      results = results.filter((model: MonthlyModelBillResult) => model.subType === modelType)
    }

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
