from backend.app.generators.scenarios import generate_attack_scenario
from backend.app.simulation.scenarios import compose_cross_channel, scenario_summary

def test_cross_channel_scenarios_have_campaign_ids():
    df=generate_attack_scenario(1000,777,["S-01","A-01","L-01"],.2,"high")
    out=compose_cross_channel(df,888,["social","account","payment","mule"])
    assert "scenario_id" in out.columns
    assert scenario_summary(out)["campaigns"] >= 1
