from __future__ import annotations
import argparse, json
from pathlib import Path
from sklearn.model_selection import train_test_split
from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.identify.catalog import load_attacks
from backend.app.features.pipeline import build_features
from backend.app.detection.model import Detector
from backend.app.adversarial.search_v2 import find_hard_variants

p=argparse.ArgumentParser(); p.add_argument('--attack',action='append'); p.add_argument('--events',type=int,default=10000); p.add_argument('--rounds',type=int,default=3); p.add_argument('--seed',type=int,default=829134); p.add_argument('--out',default='ml/results/closed_loop.json'); a=p.parse_args()
ids=a.attack or [x.id for x in load_attacks()]
base=generate_attack_scenario(a.events,a.seed,ids,.12,'high'); X=build_features(base)
Xtr,Xte,ytr,yte=train_test_split(X,base.ground_truth,test_size=.25,random_state=a.seed,stratify=base.ground_truth)
model=Detector().fit(Xtr,ytr); baseline=model.evaluate(Xte,yte)
variants=find_hard_variants(base,model,a.seed+17,rounds=a.rounds)
result={'seed':a.seed,'attack_ids':ids,'events':len(base),'baseline':baseline,'hard_variants':variants,'rounds':a.rounds}
Path(a.out).parent.mkdir(parents=True,exist_ok=True); Path(a.out).write_text(json.dumps(result,indent=2),encoding='utf-8'); print(json.dumps(result,indent=2))
