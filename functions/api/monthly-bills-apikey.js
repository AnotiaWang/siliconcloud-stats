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
  const { cookie, month, subjectId } = body

  if (!cookie || !month || !subjectId) {
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
    month,
  })

  try {
    // 获取账单数据
    const resp = await fetch(`https://cloud.siliconflow.cn/biz-server/api/v1/invoices/month_detail_apikey?${query}`, {
      headers: {
        cookie,
        'X-Subject-id': subjectId,
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
    const respBody = JSON.parse(bodyText)

    if (!respBody.status || !respBody.data?.results) {
      return new Response(
        JSON.stringify({
          message: `硅基流动 API 返回报错：${respBody.message}`,
        }),
        {
          status: respBody.code || 500,
          headers: {
            'content-type': 'application/json; charset=UTF-8',
          },
        },
      )
    }

    // 组合数据
    /** @type {MonthlyApikeyBillResult[]} */
    const results = respBody.data.results.map((bill) => ({
      name: bill.apiKey === 'playground' ? '在线体验' : bill.apiKeyDescription || `未命名(sk-***${bill.apiKey.slice(-4)})`,
      isDisabled: bill.status === 'disabled',
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
