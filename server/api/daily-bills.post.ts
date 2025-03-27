import type { DailyBillResultItem, LLMType } from '~~/types/logic'
import { H3Error } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { cookie, date } = body

  if (!cookie || !date) {
    throw createError({
      statusCode: 400,
      message: 'Missing parameters',
    })
  }

  const query = new URLSearchParams({
    date,
    action: 'invoices/day_cost',
    apiKeyId: '-1',
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
    const bills = body.data.results
    const results: DailyBillResultItem[] = []

    // 按照 type 分组处理数据
    const typeGroups = new Map<LLMType, Map<string, { tokens: number; unitPrice: string; price: number }>>()

    // 初始化分组
    bills.forEach((bill: any) => {
      const type = bill.subType as LLMType
      if (!typeGroups.has(type)) {
        typeGroups.set(type, new Map())
      }

      const modelGroup = typeGroups.get(type)!
      const modelName = bill.modelName

      if (!modelGroup.has(modelName)) {
        modelGroup.set(modelName, {
          tokens: 0,
          unitPrice: bill.unitAmount,
          price: 0,
        })
      }

      // 累加 tokens 和 price
      const modelData = modelGroup.get(modelName)!
      modelData.tokens += parseInt(bill.tokens.split(' ')[0])
      modelData.price += parseFloat(bill.amount)
    })

    // 转换为最终结果格式
    typeGroups.forEach((modelGroup, type) => {
      const models = Array.from(modelGroup.entries()).map(([name, data]) => ({
        name,
        tokens: data.tokens,
        unitPrice: data.unitPrice,
        price: data.price,
      }))

      results.push({
        type,
        totalTokens: models.reduce((sum, model) => sum + model.tokens, 0),
        models,
      })
    })

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
