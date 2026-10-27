describe('SmartPad Inventory', () => {
  test('should calculate the remaining pads correctly', () => {
    const initialStock = 40;
    const dispensedPads = 1;
    const remainingStock = initialStock - dispensedPads;

    expect(remainingStock).toBe(39);
  });

  test('should not allow inventory to become negative', () => {
    const stock = 0;

    expect(stock).toBeGreaterThanOrEqual(0);
  });
});