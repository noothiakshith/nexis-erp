/**
 * REAL ML: Reorder Optimization using Reinforcement Learning
 * Learns optimal reorder policy through Q-Learning
 */

import * as tf from '@tensorflow/tfjs';

interface ProductState {
  currentStock: number;
  avgDailyDemand: number;
  demandTrend: number; // -1 to 1
  leadTimeDays: number;
  daysUntilStockout: number;
  seasonalFactor: number; // 0.5 to 1.5
}

interface Action {
  orderQuantity: number;
}

interface ReorderRecommendation {
  shouldReorder: boolean;
  orderQuantity: number;
  expectedCost: number;
  expectedReward: number;
  confidence: number;
  reasoning: string[];
}

/**
 * Q-Learning based reorder optimization
 * State: [stock, demand, trend, leadTime, daysToStockout, seasonal]
 * Action: order quantity (discretized)
 * Reward: profit - holding cost - ordering cost - stockout cost
 */
export class ReorderOptimizationML {
  private qNetwork: tf.Sequential | null = null;
  private targetNetwork: tf.Sequential | null = null;
  private scaler: { mean: number[]; std: number[] } | null = null;
  private trained: boolean = false;
  
  // Hyperparameters
  private learningRate: number = 0.001;
  private gamma: number = 0.95; // Discount factor
  private epsilon: number = 0.1; // Exploration rate
  
  // Action space (discretized order quantities)
  private actionSpace: number[] = [0, 50, 100, 200, 500, 1000, 2000];

  /**
   * Build Q-Network
   */
  private buildQNetwork(): tf.Sequential {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [6], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: this.actionSpace.length }) // Q-value for each action
      ]
    });

    model.compile({
      optimizer: tf.train.adam(this.learningRate),
      loss: 'meanSquaredError'
    });

    return model;
  }

  /**
   * Train Q-Learning model using experience replay
   */
  async train(experiences: Experience[]): Promise<void> {
    if (experiences.length < 100) {
      throw new Error('Need at least 100 experiences for training');
    }

    // Build networks
    this.qNetwork = this.buildQNetwork();
    this.targetNetwork = this.buildQNetwork();

    // Extract states for normalization
    const states = experiences.map(e => this.stateToArray(e.state));
    const { mean, std } = this.calculateNormalization(states);
    this.scaler = { mean, std };

    console.log('Training Q-Network...');

    // Training loop
    const batchSize = 32;
    const epochs = 50;

    for (let epoch = 0; epoch < epochs; epoch++) {
      // Shuffle experiences
      const shuffled = [...experiences].sort(() => Math.random() - 0.5);
      
      let totalLoss = 0;
      let batches = 0;

      for (let i = 0; i < shuffled.length - batchSize; i += batchSize) {
        const batch = shuffled.slice(i, i + batchSize);
        const loss = await this.trainBatch(batch);
        totalLoss += loss;
        batches++;
      }

      // Update target network every 10 epochs
      if (epoch % 10 === 0) {
        this.updateTargetNetwork();
        console.log(`Epoch ${epoch}: avg loss = ${(totalLoss / batches).toFixed(4)}`);
      }
    }

    this.trained = true;
    console.log('✅ Q-Network trained');
  }

  /**
   * Train on a batch of experiences
   */
  private async trainBatch(batch: Experience[]): Promise<number> {
    if (!this.qNetwork || !this.targetNetwork || !this.scaler) {
      throw new Error('Networks not initialized');
    }

    // Prepare batch data
    const states = batch.map(e => this.normalizeState(this.stateToArray(e.state)));
    const nextStates = batch.map(e => this.normalizeState(this.stateToArray(e.nextState)));
    const actions = batch.map(e => this.actionSpace.indexOf(e.action.orderQuantity));
    const rewards = batch.map(e => e.reward);
    const dones = batch.map(e => e.done);

    // Current Q-values
    const statesTensor = tf.tensor2d(states);
    const currentQs = this.qNetwork.predict(statesTensor) as tf.Tensor;

    // Next Q-values from target network
    const nextStatesTensor = tf.tensor2d(nextStates);
    const nextQs = this.targetNetwork.predict(nextStatesTensor) as tf.Tensor;
    const maxNextQs = nextQs.max(1);

    // Calculate target Q-values
    const currentQsData = await currentQs.array() as number[][];
    const maxNextQsData = await maxNextQs.array() as number[];

    const targetQs = currentQsData.map((qValues, i) => {
      const target = [...qValues];
      const actionIdx = actions[i];
      
      if (dones[i]) {
        target[actionIdx] = rewards[i];
      } else {
        target[actionIdx] = rewards[i] + this.gamma * maxNextQsData[i];
      }
      
      return target;
    });

    // Train
    const targetQsTensor = tf.tensor2d(targetQs);
    const history = await this.qNetwork.fit(statesTensor, targetQsTensor, {
      epochs: 1,
      verbose: 0
    });

    const loss = history.history.loss[0] as number;

    // Cleanup
    statesTensor.dispose();
    currentQs.dispose();
    nextStatesTensor.dispose();
    nextQs.dispose();
    maxNextQs.dispose();
    targetQsTensor.dispose();

    return loss;
  }

  /**
   * Update target network with Q-network weights
   */
  private updateTargetNetwork(): void {
    if (!this.qNetwork || !this.targetNetwork) return;
    
    const weights = this.qNetwork.getWeights();
    this.targetNetwork.setWeights(weights);
  }

  /**
   * Predict optimal reorder action
   */
  async predict(state: ProductState): Promise<ReorderRecommendation> {
    if (!this.qNetwork || !this.scaler) {
      throw new Error('Model not trained. Call train() first.');
    }

    // Normalize state
    const stateArray = this.stateToArray(state);
    const normalized = this.normalizeState(stateArray);

    // Get Q-values for all actions
    const stateTensor = tf.tensor2d([normalized]);
    const qValues = this.qNetwork.predict(stateTensor) as tf.Tensor;
    const qValuesData = await qValues.data();

    // Select best action (epsilon-greedy)
    let actionIdx: number;
    if (Math.random() < this.epsilon) {
      // Explore
      actionIdx = Math.floor(Math.random() * this.actionSpace.length);
    } else {
      // Exploit
      actionIdx = qValuesData.indexOf(Math.max(...Array.from(qValuesData)));
    }

    const orderQuantity = this.actionSpace[actionIdx];
    const expectedReward = qValuesData[actionIdx];

    // Calculate expected cost
    const holdingCost = orderQuantity * 0.2; // Simplified
    const orderingCost = orderQuantity > 0 ? 100 : 0;
    const expectedCost = holdingCost + orderingCost;

    // Determine if should reorder
    const shouldReorder = orderQuantity > 0 && state.daysUntilStockout < state.leadTimeDays * 1.5;

    // Generate reasoning
    const reasoning = this.generateReasoning(state, orderQuantity, expectedReward);

    // Confidence based on Q-value spread
    const qValuesArray = Array.from(qValuesData);
    const maxQ = Math.max(...qValuesArray);
    const avgQ = qValuesArray.reduce((a, b) => a + b, 0) / qValuesArray.length;
    const confidence = Math.min(1, (maxQ - avgQ) / Math.abs(maxQ || 1));

    // Cleanup
    stateTensor.dispose();
    qValues.dispose();

    return {
      shouldReorder,
      orderQuantity,
      expectedCost: Math.round(expectedCost),
      expectedReward: Math.round(expectedReward),
      confidence: Math.round(confidence * 100) / 100,
      reasoning
    };
  }

  /**
   * Generate reasoning for recommendation
   */
  private generateReasoning(
    state: ProductState,
    orderQuantity: number,
    expectedReward: number
  ): string[] {
    const reasoning: string[] = [];

    if (state.daysUntilStockout < state.leadTimeDays) {
      reasoning.push(`⚠️ Stock will run out in ${state.daysUntilStockout} days (lead time: ${state.leadTimeDays})`);
    }

    if (state.demandTrend > 0.2) {
      reasoning.push('📈 Demand is increasing - order more to avoid stockouts');
    } else if (state.demandTrend < -0.2) {
      reasoning.push('📉 Demand is decreasing - order less to reduce holding costs');
    }

    if (state.seasonalFactor > 1.2) {
      reasoning.push('🌟 High season - increased demand expected');
    } else if (state.seasonalFactor < 0.8) {
      reasoning.push('❄️ Low season - reduced demand expected');
    }

    if (orderQuantity > 0) {
      reasoning.push(`✅ Recommended order: ${orderQuantity} units`);
      reasoning.push(`Expected reward: ${expectedReward.toFixed(0)}`);
    } else {
      reasoning.push('⏸️ No reorder needed at this time');
    }

    return reasoning;
  }

  /**
   * Convert state to array
   */
  private stateToArray(state: ProductState): number[] {
    return [
      state.currentStock,
      state.avgDailyDemand,
      state.demandTrend,
      state.leadTimeDays,
      state.daysUntilStockout,
      state.seasonalFactor
    ];
  }

  /**
   * Normalize state
   */
  private normalizeState(state: number[]): number[] {
    if (!this.scaler) return state;
    return state.map((val, i) => (val - this.scaler!.mean[i]) / this.scaler!.std[i]);
  }

  /**
   * Calculate normalization parameters
   */
  private calculateNormalization(states: number[][]): {
    mean: number[];
    std: number[];
  } {
    const numFeatures = states[0].length;
    const mean: number[] = [];
    const std: number[] = [];

    for (let j = 0; j < numFeatures; j++) {
      const values = states.map(s => s[j]);
      const m = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sq, n) => sq + Math.pow(n - m, 2), 0) / values.length;
      const s = Math.sqrt(variance) || 1;

      mean.push(m);
      std.push(s);
    }

    return { mean, std };
  }

  /**
   * Save model
   */
  async saveModel(path: string): Promise<void> {
    if (!this.qNetwork) {
      throw new Error('No model to save');
    }
    await this.qNetwork.save(`file://${path}`);
    console.log(`✅ Model saved to ${path}`);
  }

  /**
   * Load model
   */
  async loadModel(path: string, scaler: { mean: number[]; std: number[] }): Promise<void> {
    this.qNetwork = await tf.loadLayersModel(`file://${path}/model.json`) as tf.Sequential;
    this.targetNetwork = this.buildQNetwork();
    this.updateTargetNetwork();
    this.scaler = scaler;
    this.trained = true;
    console.log(`✅ Model loaded from ${path}`);
  }

  getModelInfo(): {
    trained: boolean;
    algorithm: string;
    actionSpace: number[];
  } {
    return {
      trained: this.trained,
      algorithm: 'Deep Q-Learning',
      actionSpace: this.actionSpace
    };
  }
}

interface Experience {
  state: ProductState;
  action: Action;
  reward: number;
  nextState: ProductState;
  done: boolean;
}

export const reorderOptimizationML = new ReorderOptimizationML();
