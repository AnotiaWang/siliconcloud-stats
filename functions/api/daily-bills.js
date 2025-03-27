/**
 * @typedef {Object} DailyBillResult
 * @property {string} type - LLM 类型
 * @property {number} totalTokens - 总 token 数
 * @property {Array<{name: string, tokens: number, unitPrice: string, price: number}>} models - 模型详情
 */

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function onRequestPost(context) {
  const { request } = context
  const body = await request.json()
  const { cookie, date } = body

  if (!cookie || !date) {
    return new Response(
      JSON.stringify({
        message: 'Missing parameters',
      }),
      {
        status: 400,
        headers: {
          'content-type': 'application/json; charset=UTF-8',
        },
      },
    )
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
      eo: {
        cacheTtl: 0,
      },
    })
    const bodyText = await resp.text()
    if (bodyText.includes('登录')) {
      return new Response(
        JSON.stringify({
          message: 'Cookie 失效',
        }),
        {
          status: 401,
          headers: {
            'content-type': 'application/json; charset=UTF-8',
          },
        },
      )
    }
    const body = JSON.parse(bodyText)

    if (!body.status || !body.ok || !body.data?.results) {
      return new Response(
        JSON.stringify({
          message: `硅基流动 API 返回报错：${body.message}`,
        }),
        {
          status: body.code || 500,
          headers: {
            'content-type': 'application/json; charset=UTF-8',
          },
        },
      )
    }

    const bills = body.data.results
    /** @type {DailyBillResult[]} */
    const results = []

    // 按照 type 分组处理数据
    /** @type {Map<string, Map<string, { tokens: number; unitPrice: string; price: number }>>} */
    const typeGroups = new Map()

    // 初始化分组
    bills.forEach((bill) => {
      const type = bill.subType
      if (!typeGroups.has(type)) {
        typeGroups.set(type, new Map())
      }

      const modelGroup = typeGroups.get(type)
      const modelName = bill.modelName

      if (!modelGroup.has(modelName)) {
        modelGroup.set(modelName, {
          tokens: 0,
          unitPrice: bill.unitAmount,
          price: 0,
        })
      }

      // 累加 tokens 和 price
      const modelData = modelGroup.get(modelName)
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

    return new Response(JSON.stringify(results), {
      headers: {
        'content-type': 'application/json; charset=UTF-8',
      },
    })
  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({
        message: 'Failed to fetch bill data',
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json; charset=UTF-8',
        },
      },
    )
  }
}
