from dataclasses import dataclass

@dataclass(frozen=True)
class Settings:
    seed: int = 829134
    default_events: int = 10_000
    fraud_rate: float = 0.12

settings = Settings()
