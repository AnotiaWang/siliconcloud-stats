/**
 * @typedef {Object} MonthlyApikeyBillResult
 * @property {string} name - API Key 名称
 * @property {boolean} isDisabled - 是否已禁用
 * @property {number} llmTokens - LLM token 数量
 * @property {number} imageTokens - 图像 token 数量
 * @property {number} price - 总价格
 */

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export async function onRequestPost(context) {
  const { request } = context
  const body = await request.json()
  const { cookie, month } = body

  if (!cookie || !month) {
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
        eo: {
          cacheTtl: 0,
        },
      },
    )
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
    const billResp = JSON.parse(bodyText)

    if (!billResp.status || !billResp.ok || !billResp.data?.results) {
      return new Response(
        JSON.stringify({
          message: `硅基流动 API 返回报错：${billResp.message}`,
        }),
        {
          status: billResp.code || 500,
          headers: {
            'content-type': 'application/json; charset=UTF-8',
          },
        },
      )
    }

    // 获取 API Key 详情数据
    const apikeyResp = await fetch(
      'https://cloud.siliconflow.cn/api/v1/apikey/all',
      {
        method: 'POST',
        headers: {
          cookie,
        },
        eo: {
          cacheTtl: 0,
        },
      },
    )
    const apikeyBodyText = await apikeyResp.text()
    if (apikeyBodyText.includes('登录')) {
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
    const apikeyData = JSON.parse(apikeyBodyText)

    if (!apikeyData.status || !apikeyData.data?.records) {
      return new Response(
        JSON.stringify({
          message: `硅基流动 API 返回报错：${apikeyData.message}`,
        }),
        {
          status: apikeyData.code || 500,
          headers: {
            'content-type': 'application/json; charset=UTF-8',
          },
        },
      )
    }

    // 创建 API Key 状态映射
    const apikeyStatusMap = new Map(
      apikeyData.data.records.map((key) => [
        key.secretKey,
        {
          isDisabled: key.status === 'disabled',
          name: key.description || `未命名(sk-***${key.secretKey.slice(-4)})`,
        },
      ]),
    )

    // 组合数据
    /** @type {MonthlyApikeyBillResult[]} */
    const results = billResp.data.results.map((bill) => ({
      name:
        bill.apiKey === 'playground'
          ? '在线体验'
          : apikeyStatusMap.get(bill.apiKey)?.name || 'Unknown',
      isDisabled: apikeyStatusMap.get(bill.apiKey)?.isDisabled ?? false,
      llmTokens: bill.llmTokens,
      imageTokens: bill.imageTokens,
      price: parseFloat(bill.amount),
    }))

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
