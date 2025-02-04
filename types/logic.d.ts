export type LLMType = 'chat' | 'reranker' | 'embedding' | 'text-to-image'

export interface DailyBillResult {
  /** 模型类型 */
  type: LLMType
  /** 总 tokens */
  totalTokens: number
  /** 模型列表 */
  models: Array<{
    /** 模型名称 */
    name: string
    /** 消耗 tokens */
    tokens: number
    /** 单价 */
    unitPrice: string
    /** 价格 */
    price: number
  }>
}

export type DailyCostData = Record<string, DailyBillResult[]>
