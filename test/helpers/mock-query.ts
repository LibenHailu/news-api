export function mockQuery<T>(result: T) {
  const chain = {
    populate: jest.fn(),
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    select: jest.fn(),
    exec: jest.fn().mockResolvedValue(result),
  };
  chain.populate.mockReturnValue(chain);
  chain.sort.mockReturnValue(chain);
  chain.skip.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  return chain;
}

export function mockCountQuery(total: number) {
  return { exec: jest.fn().mockResolvedValue(total) };
}
