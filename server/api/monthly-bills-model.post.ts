import type { LLMType, MonthlyModelBillResult } from '~~/types/logic'
import { H3Error } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { cookie, month, modelType, subjectId } = body

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
    const resp = await fetch(`https://cloud.siliconflow.cn/biz-server/api/v1/invoices/month_detail_model?${query}`, {
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

    let results = respBody.data.results.map(
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
