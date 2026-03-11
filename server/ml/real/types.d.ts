declare module 'ml-kmeans' {
  export function kmeans(
    data: number[][],
    k: number,
    options?: {
      initialization?: string;
      maxIterations?: number;
    }
  ): {
    clusters: number[];
    centroids: number[][];
    predict: (data: number[][]) => number[];
  };
}
