declare class TransitCalculator {
  getTransitSnapshot(
    date: Date,
    latitude: number,
    longitude: number,
  ): Promise<any>;
}

export { TransitCalculator };
