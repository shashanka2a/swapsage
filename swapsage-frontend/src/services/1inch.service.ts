// services/1inch.service.ts - Complete 1inch API integration

import axios, { AxiosInstance } from 'axios';
import type {
  Token,
  SwapRoute,
  OneInchSwapResponse,
  OneInchTokensResponse,
  OneInchQuoteResponse,
  BridgeRoute,
  FusionPlusOrder
} from '@/types';

export class OneInchService {
  private api: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_1INCH_BASE_URL || 'https://api.1inch.dev';
    this.apiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY || '';
    
    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'accept': 'application/json',
        'content-type': 'application/json'
      }
    });
  }

  /**
   * Get supported tokens for a chain
   */
  async getTokens(chainId: number): Promise<Record<string, Token>> {
    try {
      const response = await this.api.get<OneInchTokensResponse>(`/swap/v6.0/${chainId}/tokens`);
      return response.data.tokens;
    } catch (error) {
      console.error('Error fetching tokens:', error);
      throw new Error('Failed to fetch tokens');
    }
  }

  /**
   * Get quote for a swap (no transaction data)
   */
  async getQuote(
    chainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string
  ): Promise<OneInchQuoteResponse> {
    try {
      const params = new URLSearchParams({
        src: fromTokenAddress,
        dst: toTokenAddress,
        amount: amount,
      });

      const response = await this.api.get<OneInchQuoteResponse>(
        `/swap/v6.0/${chainId}/quote?${params}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting quote:', error);
      throw new Error('Failed to get swap quote');
    }
  }

  /**
   * Get full swap data with transaction
   */
  async getSwap(
    chainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    fromAddress: string,
    slippage: number = 1
  ): Promise<OneInchSwapResponse> {
    try {
      const params = new URLSearchParams({
        src: fromTokenAddress,
        dst: toTokenAddress,
        amount: amount,
        from: fromAddress,
        slippage: slippage.toString(),
        disableEstimate: 'false',
        allowPartialFill: 'true'
      });

      const response = await this.api.get<OneInchSwapResponse>(
        `/swap/v6.0/${chainId}/swap?${params}`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting swap:', error);
      throw new Error('Failed to get swap data');
    }
  }

  /**
   * Get multiple route options for comparison
   */
  async getSwapRoutes(
    chainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    fromAddress: string
  ): Promise<SwapRoute[]> {
    try {
      // Get multiple quotes with different slippage tolerances
      const slippages = [0.5, 1, 2, 3];
      const routePromises = slippages.map(slippage =>
        this.getSwap(chainId, fromTokenAddress, toTokenAddress, amount, fromAddress, slippage)
      );

      const responses = await Promise.allSettled(routePromises);
      
      return responses
        .filter((result): result is PromiseFulfilledResult<OneInchSwapResponse> => 
          result.status === 'fulfilled'
        )
        .map((result, index) => this.transformToSwapRoute(result.value, slippages[index]));
    } catch (error) {
      console.error('Error getting swap routes:', error);
      throw new Error('Failed to get swap routes');
    }
  }

  /**
   * Get token prices
   */
  async getTokenPrices(chainId: number, tokenAddresses: string[]): Promise<Record<string, number>> {
    try {
      const addresses = tokenAddresses.join(',');
      const response = await this.api.get(`/price/v1.1/${chainId}/${addresses}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching token prices:', error);
      throw new Error('Failed to fetch token prices');
    }
  }

  /**
   * Get wallet token balances
   */
  async getWalletBalances(chainId: number, walletAddress: string): Promise<Record<string, string>> {
    try {
      const response = await this.api.get(`/balance/v1.2/${chainId}/balances/${walletAddress}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
      throw new Error('Failed to fetch wallet balances');
    }
  }

  /**
   * Get gas price estimation
   */
  async getGasPrice(chainId: number): Promise<{
    standard: string;
    fast: string;
    instant: string;
  }> {
    try {
      const response = await this.api.get(`/gas-price/v1.4/${chainId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching gas price:', error);
      throw new Error('Failed to fetch gas price');
    }
  }

  /**
   * Fusion+ Cross-chain quote
   */
  async getFusionPlusQuote(
    fromChainId: number,
    toChainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string
  ): Promise<any> {
    try {
      const params = new URLSearchParams({
        fromChainId: fromChainId.toString(),
        toChainId: toChainId.toString(),
        fromTokenAddress,
        toTokenAddress,
        amount
      });

      const response = await this.api.get(`/fusion-plus/v1.0/quote?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error getting Fusion+ quote:', error);
      throw new Error('Failed to get cross-chain quote');
    }
  }

  /**
   * Create Fusion+ order
   */
  async createFusionPlusOrder(orderData: {
    fromChainId: number;
    toChainId: number;
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    maker: string;
    deadline: number;
  }): Promise<FusionPlusOrder> {
    try {
      const response = await this.api.post('/fusion-plus/v1.0/order', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating Fusion+ order:', error);
      throw new Error('Failed to create cross-chain order');
    }
  }

  /**
   * Get supported protocols for a chain
   */
  async getProtocols(chainId: number): Promise<string[]> {
    try {
      const response = await this.api.get(`/swap/v6.0/${chainId}/protocols`);
      return response.data.protocols;
    } catch (error) {
      console.error('Error fetching protocols:', error);
      throw new Error('Failed to fetch protocols');
    }
  }

  /**
   * Get historical swap data
   */
  async getSwapHistory(
    chainId: number,
    walletAddress: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      const response = await this.api.get(
        `/history/v2.0/${chainId}/history/${walletAddress}?${params}`
      );
      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching swap history:', error);
      throw new Error('Failed to fetch swap history');
    }
  }

  /**
   * Health check for 1inch API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get('/healthcheck');
      return response.status === 200;
    } catch (error) {
      console.error('1inch API health check failed:', error);
      return false;
    }
  }

  /**
   * Transform 1inch response to our SwapRoute interface
   */
  private transformToSwapRoute(response: OneInchSwapResponse, slippage: number): SwapRoute {
    return {
      id: `route-${Date.now()}-${Math.random()}`,
      fromToken: response.fromToken,
      toToken: response.toToken,
      fromAmount: response.fromAmount,
      toAmount: response.toAmount,
      protocols: response.protocols,
      gas: response.gas,
      gasPrice: response.gasPrice,
      estimatedGas: response.gas,
      tx: response.tx,
      priceImpact: this.calculatePriceImpact(response),
      slippage,
      route: this.transformProtocolsToSteps(response.protocols, response.fromToken, response.toToken)
    };
  }

  /**
   * Calculate price impact from swap data
   */
  private calculatePriceImpact(response: OneInchSwapResponse): number {
    // Simplified price impact calculation
    // In production, this would use more sophisticated methods
    const fromAmount = parseFloat(response.fromAmount);
    const toAmount = parseFloat(response.toAmount);
    
    if (fromAmount === 0) return 0;
    
    // This is a placeholder - real implementation would need market prices
    return Math.min(Math.abs((toAmount / fromAmount - 1) * 100), 5);
  }

  /**
   * Transform protocols to route steps
   */
  private transformProtocolsToSteps(
    protocols: any[],
    fromToken: Token,
    toToken: Token
  ): any[] {
    return protocols.map(protocol => ({
      protocol: protocol.name,
      fromToken,
      toToken,
      fromAmount: '0', // Would need more detailed protocol data
      toAmount: '0',
      part: protocol.part
    }));
  }
}

// Export singleton instance
export const oneInchService = new OneInchService();