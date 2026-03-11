/**
 * REAL ML: Demand Forecasting using LSTM Neural Network
 * Learns temporal patterns from historical sales data
 */

import * as tf from '@tensorflow/tfjs';

interface SalesData {
  date: Date;
  quantity: number;
}

interface Forecast {
  date: Date;
  predicted: number;
  lower: number;
  upper: number;
  confidence: number;
}

export class DemandForecastingML {
  private model: tf.Sequential | null = null;
  private scaler: { min: number; max: number } | null = null;
  private lookbackDays: number = 7; // Use 7 days to predict next day
  private trained: boolean = false;

  /**
   * Train LSTM model on historical sales data
   */
  async train(historicalSales: SalesData[]): Promise<void> {
    if (historicalSales.length < 30) {
      throw new Error('Need at least 30 days of sales data');
    }

    // Sort by date
    const sorted = [...historicalSales].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );

    // Extract quantities
    const quantities = sorted.map(s => s.quantity);

    // Normalize to [0, 1]
    const min = Math.min(...quantities);
    const max = Math.max(...quantities);
    this.scaler = { min, max };
    
    const normalized = quantities.map(q => (q - min) / (max - min || 1));

    // Create sequences (lookback days → next day)
    const { xs, ys } = this.createSequences(normalized, this.lookbackDays);

    // Build LSTM model
    this.model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 50,
          returnSequences: true,
          inputShape: [this.lookbackDays, 1]
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({
          units: 50,
          returnSequences: false
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 25, activation: 'relu' }),
        tf.layers.dense({ units: 1 })
      ]
    });

    // Compile
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    // Train
    console.log('Training LSTM model...');
    await this.model.fit(xs, ys, {
      epochs: 50,
      batchSize: 16,
      validationSplit: 0.2,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}, mae = ${logs?.val_mae?.toFixed(4)}`);
          }
        }
      }
    });

    this.trained = true;
    console.log('✅ LSTM model trained');

    // Cleanup
    xs.dispose();
    ys.dispose();
  }

  /**
   * Forecast future demand
   */
  async forecast(
    recentSales: SalesData[],
    daysAhead: number = 30
  ): Promise<Forecast[]> {
    if (!this.model || !this.scaler) {
      throw new Error('Model not trained. Call train() first.');
    }

    if (recentSales.length < this.lookbackDays) {
      throw new Error(`Need at least ${this.lookbackDays} days of recent sales`);
    }

    // Sort and get last lookback days
    const sorted = [...recentSales].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
    
    const lastDate = sorted[sorted.length - 1].date;
    let sequence = sorted.slice(-this.lookbackDays).map(s => s.quantity);

    // Normalize
    const normalizeValue = (val: number) => 
      (val - this.scaler!.min) / (this.scaler!.max - this.scaler!.min || 1);
    
    const denormalizeValue = (val: number) => 
      val * (this.scaler!.max - this.scaler!.min) + this.scaler!.min;

    const forecasts: Forecast[] = [];

    // Predict iteratively
    for (let i = 1; i <= daysAhead; i++) {
      // Normalize sequence
      const normalizedSeq = sequence.map(normalizeValue);
      
      // Reshape for LSTM [1, lookbackDays, 1]
      const input = tf.tensor3d([normalizedSeq.map(v => [v])]);
      
      // Predict
      const prediction = this.model.predict(input) as tf.Tensor;
      const normalizedPred = (await prediction.data())[0];
      const predicted = denormalizeValue(normalizedPred);

      // Calculate confidence interval (decreases with time)
      const confidence = Math.max(50, 95 - i * 1.5);
      const margin = predicted * (0.1 + i * 0.01); // Uncertainty grows

      // Create forecast date
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);

      forecasts.push({
        date: forecastDate,
        predicted: Math.max(0, Math.round(predicted)),
        lower: Math.max(0, Math.round(predicted - margin)),
        upper: Math.round(predicted + margin),
        confidence: Math.round(confidence)
      });

      // Update sequence for next prediction
      sequence = [...sequence.slice(1), predicted];

      // Cleanup
      input.dispose();
      prediction.dispose();
    }

    return forecasts;
  }

  /**
   * Create training sequences
   */
  private createSequences(
    data: number[],
    lookback: number
  ): { xs: tf.Tensor3D; ys: tf.Tensor2D } {
    const xsData: number[][][] = [];
    const ysData: number[] = [];

    for (let i = lookback; i < data.length; i++) {
      const sequence = data.slice(i - lookback, i).map(v => [v]);
      xsData.push(sequence);
      ysData.push(data[i]);
    }

    const xs = tf.tensor3d(xsData);
    const ys = tf.tensor2d(ysData, [ysData.length, 1]);

    return { xs, ys };
  }

  /**
   * Evaluate model on test data
   */
  async evaluate(testSales: SalesData[]): Promise<{
    mae: number;
    rmse: number;
    mape: number;
  }> {
    if (!this.model || !this.scaler) {
      throw new Error('Model not trained');
    }

    const sorted = [...testSales].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );

    const errors: number[] = [];
    const percentErrors: number[] = [];

    // Predict each day using previous lookback days
    for (let i = this.lookbackDays; i < sorted.length; i++) {
      const recentSales = sorted.slice(i - this.lookbackDays, i);
      const forecasts = await this.forecast(recentSales, 1);
      
      const actual = sorted[i].quantity;
      const predicted = forecasts[0].predicted;
      
      errors.push(Math.abs(actual - predicted));
      if (actual !== 0) {
        percentErrors.push(Math.abs((actual - predicted) / actual) * 100);
      }
    }

    const mae = errors.reduce((a, b) => a + b, 0) / errors.length;
    const rmse = Math.sqrt(
      errors.reduce((sq, e) => sq + e * e, 0) / errors.length
    );
    const mape = percentErrors.reduce((a, b) => a + b, 0) / percentErrors.length;

    return {
      mae: Math.round(mae * 10) / 10,
      rmse: Math.round(rmse * 10) / 10,
      mape: Math.round(mape * 10) / 10
    };
  }

  /**
   * Save model
   */
  async saveModel(path: string): Promise<void> {
    if (!this.model) {
      throw new Error('No model to save');
    }
    await this.model.save(`file://${path}`);
    console.log(`✅ Model saved to ${path}`);
  }

  /**
   * Load model
   */
  async loadModel(path: string, scaler: { min: number; max: number }): Promise<void> {
    this.model = await tf.loadLayersModel(`file://${path}/model.json`) as tf.Sequential;
    this.scaler = scaler;
    this.trained = true;
    console.log(`✅ Model loaded from ${path}`);
  }

  getModelInfo(): { trained: boolean; lookbackDays: number; architecture: string } {
    return {
      trained: this.trained,
      lookbackDays: this.lookbackDays,
      architecture: 'LSTM (50→50→25→1)'
    };
  }
}

export const demandForecastingML = new DemandForecastingML();
