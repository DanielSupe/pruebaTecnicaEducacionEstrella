export type Identity = {
  userId: string;
};

export type MeService = {
  describe: (userId: string) => Identity;
};

export function createMeService(): MeService {
  return {
    describe: (userId) => ({ userId }),
  };
}
