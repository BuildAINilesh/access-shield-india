"""Marketing-site accessibility assistant."""

import json
import logging

from pydantic import BaseModel, Field

from config import settings
from utils.dlp import scrub, truncate
from utils.model_router import get_client, normalize_provider, resolve_model

logger = logging.getLogger(__name__)

ALLOWED_PATHS = {
    "/",
    "/scan",
    "/services",
    "/widget",
    "/document-scanner",
    "/contact",
    "/blog",
    "/signup",
    "/login",
    "/wcag-2-2-aa",
    "/gigw",
    "/rpwd-act",
    "/is-17802",
    "/sebi-accessibility",
    "/about",
    "/docs",
    "/accessibility-statement",
    "/privacy",
    "/terms",
}

SYSTEM_PROMPT = """You are AccessibleNow’s marketing assistant on accessiblenow.in / accessshield.in.

Answer ONLY:
- Digital accessibility (disability, screen readers, keyboard, contrast, captions, forms, PDFs, mobile)
- Standards: WCAG 2.2 AA (W3C), GIGW 3.0 (Indian government websites), RPwD Act 2016 (India, especially ss. 40–46), IS 17802 (BIS ICT accessibility), SEBI accessibility circular 2024 (listed companies)
- What AccessibleNow offers, prices below, and how to start

AccessibleNow offerings (INR, excl. 18% GST; illustrative):
- Free website scan: /scan
- Access Widget: ₹4,999 one-time overlay. NOT WCAG conformance by itself.
- Automated Site Scan: ₹9,999 one-time findings report
- Scan & Remediation: ₹19,999 one-time (most chosen)
- Certified Assurance: ₹24,999/month, 5 website scans + auditor-led manual testing
- Document scans: 50 free, then ₹500/file (PDF, Word, decks) — /document-scanner
- Developer SaaS: ₹1,499/month, 1 site, 10 scans
- Professional SaaS: ₹7,999/month, 10 assets, widget, reports
- Enterprise: custom / contact sales
A widget or automated scan alone does not certify WCAG conformance.

Allowed navigate paths (use exactly one when the user wants to go somewhere):
/ /scan /services /widget /document-scanner /contact /blog /signup /login /wcag-2-2-aa /gigw /rpwd-act /is-17802 /sebi-accessibility /about /docs /accessibility-statement /privacy /terms
Optional query: /contact?service=access-widget|automated-site-scan|scan-remediation|certified-assurance|audit-web
/signup?plan=developer|professional

Rules:
- Reply in the user's language (English or Hindi). Hindi must be Unicode Devanagari, never ASCII transliteration.
- Max 110 words. Plain language. No legalese as formal counsel — say organisations should get legal advice for liability.
- Never invent prices or pages. Never claim a competitor’s pricing.
- Never ask for Aadhaar, PAN, passwords, or card numbers.
- If asked something unrelated (cooking, sports, exploits), briefly refuse and steer back to accessibility.
- If they want to go to a page, set navigate to an allowed path.

Respond with JSON only:
{"reply":"string","navigate":"optional path or null","suggestions":["short follow-up","short follow-up","short follow-up"]}
"""


class ChatTurn(BaseModel):
    role: str
    content: str


class MarketingChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=800)
    locale: str = "en"
    history: list[ChatTurn] = Field(default_factory=list)


class MarketingChatResponse(BaseModel):
    reply: str
    navigate: str | None = None
    suggestions: list[str] = Field(default_factory=list)
    cached: bool = False


def _sanitize_navigate(path: str | None) -> str | None:
    if not path:
        return None
    trimmed = path.strip()
    if not trimmed.startswith("/") or trimmed.startswith("//"):
        return None
    pathname = trimmed.split("?", 1)[0]
    if pathname in ALLOWED_PATHS:
        return trimmed
    return None


async def marketing_chat(
    request: MarketingChatRequest,
    provider: str | None = None,
    model: str | None = None,
) -> MarketingChatResponse:
    """Answer a marketing-site accessibility question."""
    resolved_provider = normalize_provider(provider)
    resolved_model = resolve_model(resolved_provider, model)

    clean_message = scrub(truncate(request.message, 800))
    history_lines: list[str] = []
    for turn in request.history[-8:]:
        role = "User" if turn.role == "user" else "Assistant"
        history_lines.append(f"{role}: {scrub(truncate(turn.content, 400))}")

    history_block = "\n".join(history_lines)
    locale_line = "Reply in Hindi (Devanagari)." if request.locale == "hi" else "Reply in English."
    user_payload = (
        f"{locale_line}\n\nConversation so far:\n{history_block or '(none)'}\n\n"
        f"Latest user message:\n{clean_message}"
    )

    client = get_client(resolved_provider, resolved_model)
    response_text = await client.complete(
        system=SYSTEM_PROMPT,
        user=user_payload,
        max_tokens=settings.max_tokens_advice,
        temperature=0.3,
        expect_json=True,
    )

    data = json.loads(response_text)
    suggestions_raw = data.get("suggestions") or []
    suggestions = [str(item)[:80] for item in suggestions_raw if str(item).strip()][:4]

    return MarketingChatResponse(
        reply=str(data.get("reply") or "").strip(),
        navigate=_sanitize_navigate(data.get("navigate")),
        suggestions=suggestions,
        cached=False,
    )
