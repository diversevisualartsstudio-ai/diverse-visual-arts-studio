from __future__ import annotations

import os
from typing import Any, Dict, List


class WatsonXOrchestrator:
    """A lightweight orchestrator example for integrating with IBM watsonx or IBM Bob-style tooling.

    This is intentionally framework-light so it can be used in a static frontend or simple Python service.
    """

    def __init__(self, api_key: str | None = None, endpoint: str | None = None) -> None:
        self.api_key = api_key or os.getenv("WATSONX_API_KEY")
        self.endpoint = endpoint or os.getenv("WATSONX_ENDPOINT", "https://example.ibm.com")

    def build_prompt(self, user_input: str, context: Dict[str, Any] | None = None) -> str:
        context = context or {}
        profile = context.get("profile", "studio_operator")
        risk_level = context.get("risk_level", "low")
        return (
            f"You are the DVAS intelligence assistant. "
            f"Role: {profile}. Security posture: {risk_level}. "
            f"Use this user request to generate a concise action plan: {user_input}"
        )

    def get_recommendations(self, user_input: str, context: Dict[str, Any] | None = None) -> List[str]:
        prompt = self.build_prompt(user_input, context)
        _ = prompt

        lower = user_input.lower()
        suggestions: List[str] = []

        if "revenue" in lower or "growth" in lower:
            suggestions.append("Review revenue pipeline performance and identify underperforming accounts.")
        if "security" in lower or "risk" in lower:
            suggestions.append("Validate MFA, IAM, and audit controls for all active client workstreams.")
        if "design" in lower or "brand" in lower:
            suggestions.append("Align deliverables with the current brand system and approved asset checklist.")
        if "project" in lower or "intake" in lower:
            suggestions.append("Create a flagged project brief that includes scope, budget, timeline, and security constraints.")

        if not suggestions:
            suggestions.append("Confirm scope, security requirements, and delivery timeline before moving the work forward.")

        return suggestions

    def run(self, user_input: str, context: Dict[str, Any] | None = None) -> Dict[str, Any]:
        recommendations = self.get_recommendations(user_input, context)
        return {
            "status": "ok",
            "input": user_input,
            "endpoint": self.endpoint,
            "recommendations": recommendations,
        }


if __name__ == "__main__":
    orchestrator = WatsonXOrchestrator()
    result = orchestrator.run("Create a revenue growth plan for the Q3 studio pipeline.", {"profile": "finance_lead"})
    print(result)
