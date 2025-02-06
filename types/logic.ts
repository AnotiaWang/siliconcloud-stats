export type LLMType = 'chat' | 'embedding' | 'reranker' | 'text-to-image'

export interface DailyBillByModel {
  /** 模型名称 */
  name: string
  /** 消耗 tokens */
  tokens: number
  /** 单价 */
  unitPrice: string
  /** 价格 */
  price: number
}

export interface DailyBillResultItem {
  /** 模型类型 */
  type: LLMType
  /** 总 tokens */
  totalTokens: number
  /** 模型列表 */
  models: DailyBillByModel[]
}

export type DailyBillResults = Record<string, DailyBillResultItem[]>

export interface MonthlyModelBillResult {
  modelName: string
  subType: LLMType
  unitAmount: string
  tokens: string
  price: number
  chargePrice: number
  freePrice: number
}

export interface MonthlyApikeyBillResult {
  /** API Key 名称 */
  name: string
  /** API Key 是否已禁用 */
  isDisabled: boolean
  /** LLM 类型的 Token 消耗量 */
  llmTokens: number
  /** 图像生成的 Token 消耗量 */
  imageTokens: string
  /** 总金额 */
  price: number
}
