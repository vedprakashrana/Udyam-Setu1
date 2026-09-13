import sys
from pathlib import Path

# Ensure apps/api is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.ai.orchestrator import AIOrchestrator

def test_conversational_turn_1_greeting():
    res = AIOrchestrator.answer_query("Hello", conversation_id="test_conv_1", language="en")
    assert any(w in res["reply"] for w in ["Hello", "Namaste", "UDYAM-SETU", "GramBiz"])
    # Ensure it's not giving ₹1 lakh loan response on Hello
    assert "₹10,00,000" not in res["reply"]

def test_conversational_turn_2_margin_financials():
    res = AIOrchestrator.answer_query("Mere paas 1 lakh hai aur dairy business karna hai", conversation_id="test_conv_1", language="hi")
    assert "₹10,00,000" in res["reply"]
    assert "₹9,00,000" in res["reply"]
    assert "डेयरी" in res["reply"] or "Dairy" in res["reply"]

def test_conversational_turn_3_contextual_risk():
    # Follow up asking about risk in the active conversation
    res = AIOrchestrator.answer_query("Isme risk kya hai?", conversation_id="test_conv_1", language="hi")
    assert "जोखिम" in res["reply"] or "Risk" in res["reply"]
    assert "चारे" in res["reply"] or "दूध" in res["reply"] or "Dairy" in res["reply"]
    # Verify it does NOT repeat the loan calculation on a risk question
    assert "पुनर्भुगतान विवरण" not in res["reply"]

def test_conversational_turn_4_comparison():
    res = AIOrchestrator.answer_query("Compare with tailoring", conversation_id="test_conv_1", language="en")
    assert "Tailoring" in res["reply"]
    assert "Dairy" in res["reply"]

def test_conversational_turn_5_competition():
    res = AIOrchestrator.answer_query("Mere area me competition kitna hai?", conversation_id="test_conv_1", language="hi")
    assert "प्रतियोगिता" in res["reply"] or "OpenStreetMap" in res["reply"] or "इकाइयां" in res["reply"]
