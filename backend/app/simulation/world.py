from dataclasses import dataclass
import numpy as np

@dataclass
class SyntheticWorld:
    customers: int
    accounts: int
    merchants: int
    devices: int
    beneficiaries: int


def create_world(seed: int, customers: int = 5000) -> SyntheticWorld:
    rng = np.random.default_rng(seed)
    return SyntheticWorld(
        customers=customers,
        accounts=customers,
        merchants=int(rng.integers(customers // 8, customers // 5)),
        devices=int(rng.integers(customers, customers * 2)),
        beneficiaries=int(rng.integers(customers // 2, customers)),
    )
