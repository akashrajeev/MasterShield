import { attacks, simulationProfiles } from "@/data/attacks";
import type { Attack, SimulationProfile } from "@/types/attack";

const latency = <T,>(value: T): Promise<T> => new Promise(resolve => setTimeout(() => resolve(value), 120));
export const attackApi = {
  list: (): Promise<Attack[]> => latency(attacks),
  get: (id: string): Promise<Attack | undefined> => latency(attacks.find(attack => attack.id.toLowerCase() === id.toLowerCase())),
  getSimulationProfile: (id: string): Promise<SimulationProfile | undefined> => latency(simulationProfiles.find(profile => profile.attackId === id)),
};
