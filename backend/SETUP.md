# Backend quickstart

1. `pip install -r backend/requirements.txt`
2. `python -m pytest backend/tests`
3. `python scripts/generate_data.py --events 10000 --seed 829134`
4. `python scripts/train_model_v2.py`
5. `python scripts/evaluate_generalization.py`
6. `python scripts/run_closed_loop_v2.py --events 10000 --rounds 3`
7. `uvicorn backend.app.main_v2:app --reload`

Everything is synthetic and defensive. No live payment systems are touched.
