import { getBackendAttack, listBackendAttacks, adaptBackendAttack } from "@/lib/api/attacks";
import type { Attack, SimulationProfile } from "@/types/attack";

export const attackApi = {
  list: async (): Promise<Attack[]> => (await listBackendAttacks()).map(adaptBackendAttack),
  get: async (id: string): Promise<Attack | undefined> => {
    try { return adaptBackendAttack(await getBackendAttack(id)); } catch { return undefined; }
  },
  getSimulationProfile: async (id: string): Promise<SimulationProfile | undefined> => {
    try {
      const attack = await getBackendAttack(id);
      return { attackId: attack.id, generatorId: attack.generator_id, available: true, generatedFeatures: attack.observable_signals, supportedRails: attack.payment_rails.map(r => (r === "CARD" ? "Cards" : r === "WALLET" ? "Wallets" : r === "IMPS" ? "Bank Transfer" : r)) as SimulationProfile["supportedRails"], defaultVolume: 1000, maxVolume: 1000000, version: "backend-1.0" };
    } catch { return undefined; }
  },
};
