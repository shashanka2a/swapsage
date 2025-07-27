// AI-powered swap analysis and explanations

import OpenAI from 'openai';
import type {
  SwapRoute,
  AIExplanation,
  RiskFactor,
  UserProfile,
  MarketContext,
  CrossChainOption,
  Token
} from '@/types';

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate comprehensive swap analysis and explanation
   */
  async analyzeSwap(
    route: SwapRoute,
    alternatives: SwapRoute[],
    userProfile?: UserProfile,
    marketContext?: MarketContext
  ): Promise<AIExplanation> {
    try {
      const prompt = this.buildAnalysisPrompt(route, alternatives, userProfile, marketContext);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(userProfile?.experienceLevel || 'intermediate')
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No AI response received');

      return JSON.parse(response) as AIExplanation;
    } catch (error) {
      console.error('Error in AI analysis:', error);
      return this.getFallbackExplanation(route);
    }
  }

  /**
   * Analyze risks for a swap route
   */
  async analyzeRisks(
    route: SwapRoute,
    marketContext: MarketContext
  ): Promise<RiskFactor[]> {
    const risks: RiskFactor[] = [];

    // Slippage risk analysis
    if (route.slippage > 2) {
      risks.push({
        type: 'slippage',
        level: 'high',
        title: 'High Slippage Risk',
        description: `Slippage tolerance is set to ${route.slippage}%, which could result in significant price impact.`,
        impact: `You might receive up to ${route.slippage}% less tokens than expected.`,
        mitigation: 'Consider reducing trade size or waiting for better market conditions.'
      });
    }

    // Gas price risk
    if (marketContext.gasConditions === 'high') {
      risks.push({
        type: 'gas',
        level: 'medium',
        title: 'High Gas Costs',
        description: 'Network congestion is causing elevated gas prices.',
        impact: 'Transaction costs will be higher than normal.',
        mitigation: 'Consider waiting for lower gas prices or using a different time.'
      });
    }

    // Price impact risk
    if (route.priceImpact > 1) {
      risks.push({
        type: 'market',
        level: route.priceImpact > 3 ? 'high' : 'medium',
        title: 'Price Impact Warning',
        description: `This trade will impact the token price by ${route.priceImpact.toFixed(2)}%.`,
        impact: 'Large trades can move market prices unfavorably.',
        mitigation: 'Consider splitting the trade into smaller amounts.'
      });
    }

    // Smart contract risk for complex routes
    if (route.protocols.length > 3) {
      risks.push({
        type: 'smart_contract',
        level: 'low',
        title: 'Complex Route',
        description: 'This swap uses multiple protocols, increasing smart contract interaction risk.',
        impact: 'More protocol interactions mean slightly higher failure risk.',
        mitigation: 'All protocols are audited, but consider simpler routes for large amounts.'
      });
    }

    return risks;
  }

  /**
   * Generate cross-chain recommendations
   */
  async analyzeCrossChain(
    fromToken: Token,
    toToken: Token,
    amount: string,
    directRoute?: SwapRoute
  ): Promise<CrossChainOption[]> {
    const options: CrossChainOption[] = [];

    // This would integrate with bridge APIs and Fusion+ in production
    if (fromToken.chainId !== toToken.chainId) {
      const prompt = `
        Analyze cross-chain swap options:
        - From: ${fromToken.symbol} on chain ${fromToken.chainId}
        - To: ${toToken.symbol} on chain ${toToken.chainId}