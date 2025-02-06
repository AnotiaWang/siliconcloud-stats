import type { LLMType, MonthlyModelBillResult } from '~~/types/logic'
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
    action: 'invoices/month_detail_model',
    month,
  })

  try {
    const resp = await fetch(
      `https://cloud.siliconflow.cn/api/redirect/bill?${query}`,
      {
        headers: {
          cookie,
        },
      },
    ).then((r) => r.json())

    if (!resp.status || !resp.ok || !resp.data?.results) {
      throw createError({
        statusCode: resp.code,
        message: `硅基流动 API 返回报错：${resp.message}`,
      })
    }

    const results = resp.data.results.map(
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
