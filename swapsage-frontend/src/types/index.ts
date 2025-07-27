// Core type definitions for SwapSage

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
  price?: number;
  balance?: string;
}

export interface SwapRoute {
  id: string;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  protocols: Protocol[];
  gas: string;
  gasPrice: string;
  estimatedGas: string;
  tx: SwapTransaction;
  priceImpact: number;
  slippage: number;
  route: RouteStep[];
}

export interface Protocol {
  name: string;
  part: number;
  fromTokenAddress: string;
  toTokenAddress: string;
}

export interface RouteStep {
  protocol: string;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  part: number;
}

export interface SwapTransaction {
  from: string;
  to: string;
  data: string;
  value: string;
  gasPrice: string;
  gas: string;
}

export interface AIExplanation {
  summary: string;           // "You're swapping 1 ETH for ~3,200 USDC"
  routeExplanation: string;  // How the swap works
  riskAnalysis: RiskFactor[];
  recommendations: string[];
  gasExplanation: string;
  timeEstimate: string;
  confidence: number;        // 0-100
}

export interface RiskFactor {
  type: 'slippage' | 'liquidity' | 'gas' | 'market' | 'smart_contract';
  level: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact?: string;
  mitigation?: string;
}

export interface CrossChainOption {
  type: 'direct' | 'bridge_then_swap' | 'fusion_plus';
  route: SwapRoute | BridgeRoute;
  explanation: string;
  estimatedTime: number;     // minutes
  totalCost: string;         // USD
  recommended: boolean;
  pros: string[];
  cons: string[];
}

export interface BridgeRoute {
  id: string;
  fromChain: number;
  toChain: number;
  fromToken: Token;
  toToken: Token;
  amount: string;
  bridge: string;
  estimatedTime: number;
  fees: BridgeFees;
}

export interface BridgeFees {
  gas: string;
  bridge: string;
  total: string;
  totalUSD: string;
}

export interface UserProfile {
  address: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredExplanationStyle: 'simple' | 'detailed' | 'technical';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  previousSwaps: number;
  portfolioValue: string;
  preferredChains: number[];
}

export interface MarketContext {
  volatility: number;
  gasConditions: 'low' | 'normal' | 'high';
  marketTrend: 'bullish' | 'bearish' | 'sideways';
  liquidityDepth: number;
  recommendedAction: 'swap_now' | 'wait' | 'consider_alternatives';
}

export interface SwapAnalysis {
  route: SwapRoute;
  aiExplanation: AIExplanation;
  crossChainOptions?: CrossChainOption[];
  marketContext: MarketContext;
  alternatives: SwapRoute[];
  historicalPerformance?: HistoricalData;
}

export interface HistoricalData {
  priceHistory: PricePoint[];
  volumeHistory: VolumePoint[];
  avgSlippage: number;
  bestTimeToSwap: string;
}

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface VolumePoint {
  timestamp: number;
  volume: number;
}

// 1inch API Response Types
export interface OneInchSwapResponse {
  fromToken: Token;
  toToken: Token;
  toAmount: string;
  fromAmount: string;
  protocols: Protocol[];
  tx: SwapTransaction;
  gas: string;
  gasPrice: string;
}

export interface OneInchTokensResponse {
  tokens: Record<string, Token>;
}

export interface OneInchQuoteResponse {
  fromToken: Token;
  toToken: Token;
  toAmount: string;
  fromAmount: string;
  protocols: Protocol[];
  estimatedGas: string;
}

// Fusion+ Types
export interface FusionPlusOrder {
  orderHash: string;
  signature: string;
  deadline: number;
  auctionStartTime: number;
  auctionEndTime: number;
  maker: string;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  sourceChain: number;
  destinationChain: number;
}

// API Error Types
export interface APIError {
  statusCode: number;
  error: string;
  description: string;
  meta?: any;
}

// Component Props Types
export interface SwapInterfaceProps {
  userProfile?: UserProfile;
  onSwapAnalysis: (analysis: SwapAnalysis) => void;
}

export interface AIExplainerProps {
  analysis: SwapAnalysis;
  userProfile?: UserProfile;
  isLoading?: boolean;
}

export interface RouteVisualizerProps {
  route: SwapRoute;
  alternatives?: SwapRoute[];
  crossChainOptions?: CrossChainOption[];
}

export interface RiskAnalyzerProps {
  riskFactors: RiskFactor[];
  marketContext: MarketContext;
  severity?: 'low' | 'medium' | 'high';
}