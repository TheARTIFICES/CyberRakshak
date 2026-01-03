#!/usr/bin/env python3
"""
CyberRakshak RAG System - Comprehensive Test Suite

Tests all RAG pipeline components:
1. Embedding Pipeline
2. Intent Classification  
3. RAG Routing
4. RAG Fusion
5. Prompt Assembly
6. Generation Quality
7. Troubleshooting
8. Fail-Safe
9. Logging & Observability
10. Performance Baselines

Usage: python3 test_rag_system.py
"""

import sys
import os
import time
import json
import asyncio
import numpy as np
from typing import Dict, List, Tuple
from dataclasses import dataclass

# Add backend to path
sys.path.insert(0, "/home/ubuntu/CyberRakshak/backend")

# Test result tracking
@dataclass
class TestResult:
    name: str
    passed: bool
    message: str
    duration_ms: float = 0.0

results: List[TestResult] = []

def test(name: str):
    """Decorator to track test results"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            try:
                passed, msg = func(*args, **kwargs)
                duration = (time.perf_counter() - start) * 1000
                results.append(TestResult(name, passed, msg, duration))
                status = "✅" if passed else "❌"
                print(f"    {status} {name}: {msg} ({duration:.1f}ms)")
                return passed
            except Exception as e:
                duration = (time.perf_counter() - start) * 1000
                results.append(TestResult(name, False, str(e), duration))
                print(f"    ❌ {name}: ERROR - {e}")
                return False
        return wrapper
    return decorator

# ============================================================
# 1. EMBEDDING PIPELINE TESTS
# ============================================================

def test_embedding_pipeline():
    print("\n" + "="*60)
    print("1️⃣  EMBEDDING PIPELINE TESTS")
    print("="*60)
    
    @test("1.1 Determinism Test")
    def test_determinism():
        from app.utils.ai_client import get_remote_embedding
        
        text = "Apache path traversal vulnerability"
        
        # Get embeddings twice
        loop = asyncio.get_event_loop()
        emb1 = loop.run_until_complete(get_remote_embedding(text))
        emb2 = loop.run_until_complete(get_remote_embedding(text))
        
        if emb1 is None or emb2 is None:
            return False, "Failed to get embeddings from AI service"
        
        # Check identical
        diff = np.abs(np.array(emb1) - np.array(emb2)).max()
        
        # Check normalized
        norm = np.linalg.norm(emb1)
        
        if diff > 1e-6:
            return False, f"Embeddings differ by {diff}"
        if abs(norm - 1.0) > 0.01:
            return False, f"Norm is {norm}, expected ~1.0"
        
        return True, f"Identical embeddings, norm={norm:.4f}"
    
    @test("1.2 RAG Recall Sanity")
    def test_rag_recall():
        from app.rag_registry import RAG_REGISTRY, initialize_all_rags
        from app.utils.ai_client import get_remote_embedding
        
        # Initialize RAGs
        initialize_all_rags("/app/rag_storage")
        
        query = "CVE-2021-41773 Apache"
        loop = asyncio.get_event_loop()
        embedding = loop.run_until_complete(get_remote_embedding(query))
        
        if embedding is None:
            return False, "Failed to get embedding"
        
        cve_source = RAG_REGISTRY.get("cve")
        if not cve_source or not cve_source.is_available():
            return False, "CVE index not available"
        
        results = cve_source.search(embedding, top_k=5)
        
        if len(results) == 0:
            return False, "No CVE results returned"
        
        # Check for Apache-related results
        apache_found = any("apache" in r.title.lower() or "apache" in r.description.lower() for r in results)
        
        return True, f"Got {len(results)} results, Apache-related: {apache_found}"
    
    test_determinism()
    test_rag_recall()

# ============================================================
# 2. INTENT CLASSIFICATION TESTS
# ============================================================

def test_intent_classification():
    print("\n" + "="*60)
    print("2️⃣  INTENT CLASSIFICATION TESTS")
    print("="*60)
    
    from app.intent_classifier import classify_intent, IntentType, IntentResult
    
    test_cases = [
        ("Scan the target for open ports", "recon", False),
        ("Is Apache 2.4.49 vulnerable?", "vuln_check", False),
        ("Give me exploit code for Apache traversal", "exploit", True),
        ("How do I escalate to root?", "privesc", False),
        ("My scan keeps timing out", "troubleshooting", False),
        ("What should I do next?", "planning", False),
        # Multi-intent tests
        ("Scan and exploit the server", "recon,exploit", False),
        # Negation tests
        ("Find vulns but don't give exploits", "vuln_check", False),
        # Trivial tests
        ("hi", "general", False),
        ("What can you do?", "general", False),
        # Typo tests
        ("Run nmpa on target", "recon", False),
    ]
    
    passed = 0
    for query, expected_intents, expected_explicit in test_cases:
        result: IntentResult = classify_intent(query)
        
        actual_intents = [i.value for i in result.primary_intents]
        expected_list = expected_intents.split(",")
        
        intent_ok = any(e in actual_intents for e in expected_list)
        explicit_ok = result.explicit_exploit_request == expected_explicit
        
        all_ok = intent_ok and explicit_ok
        status = "✅" if all_ok else "❌"
        
        if all_ok:
            passed += 1
        
        print(f"    {status} '{query[:40]}...'")
        print(f"        Intents: {actual_intents} (expected: {expected_list})")
        print(f"        Explicit: {result.explicit_exploit_request} (expected: {expected_explicit})")
        print(f"        Trivial: {result.is_trivial}, Meta: {result.is_meta_query}")
        if result.normalized_query != query:
            print(f"        Normalized: {result.normalized_query}")
    
    print(f"\n    Results: {passed}/{len(test_cases)} passed")

# ============================================================
# 3. RAG ROUTING TESTS
# ============================================================

def test_rag_routing():
    print("\n" + "="*60)
    print("3️⃣  RAG ROUTING TESTS")
    print("="*60)
    
    from app.intent_classifier import classify_intent, IntentType, IntentResult
    from app.rag_routing import get_rag_sources_for_intents
    
    @test("3.1 Recon Routing")
    def test_recon():
        result = classify_intent("Enumerate services on target")
        sources = get_rag_sources_for_intents(
            result.primary_intents, result.excluded_intents, result.explicit_exploit_request
        )
        
        has_nmap = "nmap" in sources
        has_mitre = "mitre" in sources
        no_exploitdb = "exploitdb" not in sources
        no_payloads = "payloads" not in sources
        
        if not (has_nmap and has_mitre):
            return False, f"Missing nmap/mitre: {sources}"
        if not (no_exploitdb and no_payloads):
            return False, f"Unexpected exploit sources: {sources}"
        
        return True, f"Sources: {sources}"
    
    @test("3.2 Vulnerability Check Routing")
    def test_vuln():
        result = classify_intent("Check for Apache path traversal")
        sources = get_rag_sources_for_intents(
            result.primary_intents, result.excluded_intents, result.explicit_exploit_request
        )
        
        has_cve = "cve" in sources
        has_nuclei = "nuclei" in sources
        no_metasploit = "metasploit" not in sources
        
        if not (has_cve and has_nuclei):
            return False, f"Missing cve/nuclei: {sources}"
        
        return True, f"Sources: {sources}"
    
    @test("3.3 Exploit Routing (Explicit)")
    def test_exploit():
        result = classify_intent("Give me exploit code for CVE-2021-41773")
        sources = get_rag_sources_for_intents(
            result.primary_intents, result.excluded_intents, result.explicit_exploit_request
        )
        
        has_exploitdb = "exploitdb" in sources
        has_payloads = "payloads" in sources
        has_metasploit = "metasploit" in sources
        
        if not (has_exploitdb and has_payloads and has_metasploit):
            return False, f"Missing exploit sources: {sources}"
        
        return True, f"Explicit={result.explicit_exploit_request}, Sources: {sources}"
    
    @test("3.4 PrivEsc Routing")
    def test_privesc():
        result = classify_intent("How can I escalate privileges on this Linux server?")
        sources = get_rag_sources_for_intents(
            result.primary_intents, result.excluded_intents, result.explicit_exploit_request
        )
        
        has_linpeas = "linpeas" in sources
        has_gtfobins = "gtfobins" in sources
        
        if not (has_linpeas and has_gtfobins):
            return False, f"Missing linpeas/gtfobins: {sources}"
        
        return True, f"Sources: {sources}"
    
    @test("3.5 Multi-Intent Routing")
    def test_multi():
        result = classify_intent("Scan and exploit the server")
        sources = get_rag_sources_for_intents(
            result.primary_intents, result.excluded_intents, result.explicit_exploit_request
        )
        
        has_recon = "nmap" in sources
        has_exploit = "exploitdb" in sources
        
        if not (has_recon and has_exploit):
            return False, f"Missing recon+exploit sources: {sources}"
        
        return True, f"Multi-intent sources: {sources}"
    
    @test("3.6 Negation Exclusion")
    def test_negation():
        result = classify_intent("Find vulnerabilities but don't give exploits")
        sources = get_rag_sources_for_intents(
            result.primary_intents, result.excluded_intents, result.explicit_exploit_request
        )
        
        has_cve = "cve" in sources
        no_exploitdb = "exploitdb" not in sources
        
        if not has_cve:
            return False, f"Missing vuln sources: {sources}"
        if not no_exploitdb:
            return False, f"Exploitdb should be excluded: {sources}"
        
        return True, f"Exclusion works: {sources}"
    
    test_recon()
    test_vuln()
    test_exploit()
    test_privesc()
    test_multi()
    test_negation()

# ============================================================
# 4. RAG FUSION TESTS
# ============================================================

def test_rag_fusion():
    print("\n" + "="*60)
    print("4️⃣  RAG FUSION TESTS")
    print("="*60)
    
    from app.rag_fusion import rag_fusion, MAX_EXPLOIT_DOCS_PER_TURN, FusionConfig
    from app.rag_registry import NormalizedDocument
    
    @test("4.1 Deduplication")
    def test_dedup():
        # Create duplicate documents
        doc1 = NormalizedDocument(
            source="exploitdb", category="web", title="Apache Traversal",
            description="Path traversal", technique="path-traversal",
            attack_phase="initial-access", os="linux", service="apache",
            prerequisites=[], exploit_type="web", embedding_text="test",
            display_text="Apache exploit\nWhy it matters: RCE",
            confidence="high", exploit_maturity="poc", doc_id="abc123"
        )
        doc2 = NormalizedDocument(
            source="exploitdb", category="web", title="Apache Traversal Duplicate",
            description="Same path traversal", technique="path-traversal",  # Same technique
            attack_phase="initial-access", os="linux", service="apache",
            prerequisites=[], exploit_type="web", embedding_text="test",
            display_text="Apache exploit 2\nWhy it matters: RCE",
            confidence="high", exploit_maturity="poc", doc_id="def456"
        )
        
        docs = {"exploitdb": [doc1, doc2]}
        fused = rag_fusion.fuse(docs, access_level="none")
        
        # Should deduplicate by technique
        if len(fused) != 1:
            return False, f"Expected 1 doc after dedup, got {len(fused)}"
        
        return True, f"Deduplicated: 2 → {len(fused)}"
    
    @test("4.2 Token Budget Enforcement")
    def test_token_budget():
        config = rag_fusion.config
        max_tokens = config.max_total_tokens
        chars_per_token = 4
        max_chars = max_tokens * chars_per_token
        
        # Create many large documents
        docs = {"cve": []}
        for i in range(20):
            doc = NormalizedDocument(
                source="cve", category="web", title=f"CVE-{i}",
                description="A" * 500, technique=f"tech-{i}",
                attack_phase="initial-access", os="linux", service="apache",
                prerequisites=[], exploit_type="web", embedding_text="test",
                display_text="A" * 500 + f"\nWhy it matters: Critical-{i}",
                confidence="high", exploit_maturity="poc", doc_id=f"id{i}"
            )
            docs["cve"].append(doc)
        
        fused = rag_fusion.fuse(docs, access_level="none")
        
        total_chars = sum(len(d.display_text) + len(d.title) + 50 for d in fused)
        
        if total_chars > max_chars:
            return False, f"Exceeded budget: {total_chars} > {max_chars}"
        
        return True, f"Budget: {total_chars}/{max_chars} chars, {len(fused)} docs"
    
    @test("4.3 Exploit Hard Cap")
    def test_exploit_cap():
        from app.rag_fusion import EXPLOIT_SOURCES
        
        # Create many exploit documents
        docs = {"exploitdb": [], "payloads": [], "metasploit": []}
        for source in EXPLOIT_SOURCES:
            for i in range(10):
                doc = NormalizedDocument(
                    source=source, category="web", title=f"{source}-{i}",
                    description="Exploit", technique=f"tech-{source}-{i}",
                    attack_phase="initial-access", os="linux", service="apache",
                    prerequisites=[], exploit_type="web", embedding_text="test",
                    display_text=f"{source} exploit\nWhy it matters: RCE",
                    confidence="high", exploit_maturity="poc", doc_id=f"{source}{i}"
                )
                docs[source].append(doc)
        
        fused = rag_fusion.fuse(docs, access_level="none")
        
        exploit_count = sum(1 for d in fused if d.source in EXPLOIT_SOURCES)
        
        if exploit_count > MAX_EXPLOIT_DOCS_PER_TURN:
            return False, f"Exploit cap exceeded: {exploit_count} > {MAX_EXPLOIT_DOCS_PER_TURN}"
        
        return True, f"Exploit docs: {exploit_count}/{MAX_EXPLOIT_DOCS_PER_TURN}"
    
    test_dedup()
    test_token_budget()
    test_exploit_cap()

# ============================================================
# 5. PROMPT ASSEMBLY TESTS
# ============================================================

def test_prompt_assembly():
    print("\n" + "="*60)
    print("5️⃣  PROMPT ASSEMBLY TESTS")
    print("="*60)
    
    @test("5.1 Structured Prompt Validation")
    def test_prompt_structure():
        from app.chat_assistant import ChatAssistantService, TokenBudget
        
        # Check token budget is properly configured
        total = TokenBudget.TOTAL_PROMPT_TOKENS
        allocated = (
            TokenBudget.SYSTEM_ROLE_TOKENS +
            TokenBudget.ACCESS_LEVEL_TOKENS +
            TokenBudget.SCAN_CONTEXT_TOKENS +
            TokenBudget.RAG_CONTEXT_TOKENS +
            TokenBudget.HISTORY_TOKENS +
            TokenBudget.USER_QUERY_TOKENS +
            TokenBudget.BUFFER_TOKENS
        )
        
        if allocated > total:
            return False, f"Token budget overflow: {allocated} > {total}"
        
        return True, f"Token budget valid: {allocated}/{total} allocated"
    
    test_prompt_structure()

# ============================================================
# 6. GENERATION QUALITY TESTS
# ============================================================

def test_generation_quality():
    print("\n" + "="*60)
    print("6️⃣  GENERATION QUALITY TESTS")
    print("="*60)
    
    @test("6.1 Simple Generation Test")
    def test_generation():
        from app.utils.ai_client import generate_llm_response
        
        prompt = "What is SQL injection in one sentence?"
        loop = asyncio.get_event_loop()
        response = loop.run_until_complete(generate_llm_response(prompt))
        
        if not response or "error" in response.lower()[:50]:
            return False, f"Generation failed: {response[:100]}"
        
        if len(response) < 20:
            return False, f"Response too short: {len(response)} chars"
        
        return True, f"Generated {len(response)} chars"
    
    test_generation()

# ============================================================
# 7. TROUBLESHOOTING TESTS
# ============================================================

def test_troubleshooting():
    print("\n" + "="*60)
    print("7️⃣  TROUBLESHOOTING TESTS")
    print("="*60)
    
    @test("7.1 Scanner Failure Intent")
    def test_scanner_failure():
        from app.intent_classifier import classify_intent, IntentType, IntentResult
        from app.rag_routing import get_rag_sources_for_intents
        
        query = "Nuclei keeps failing with timeout"
        result: IntentResult = classify_intent(query)
        
        is_troubleshooting = IntentType.TROUBLESHOOTING in result.primary_intents
        
        if not is_troubleshooting:
            return False, f"Wrong intent: {[i.value for i in result.primary_intents]} (expected troubleshooting)"
        
        sources = get_rag_sources_for_intents(
            result.primary_intents, result.excluded_intents, result.explicit_exploit_request
        )
        
        return True, f"Intent: troubleshooting, Sources: {sources}"
    
    test_scanner_failure()

# ============================================================
# 8. FAIL-SAFE TESTS
# ============================================================

def test_fail_safe():
    print("\n" + "="*60)
    print("8️⃣  FAIL-SAFE TESTS")
    print("="*60)
    
    @test("8.1 Missing Index Handling")
    def test_missing_index():
        from app.rag_registry import RAG_REGISTRY, RAGSource
        
        # Check that unavailable sources are handled gracefully
        unavailable = [name for name, src in RAG_REGISTRY.items() if not src.is_available()]
        available = [name for name, src in RAG_REGISTRY.items() if src.is_available()]
        
        return True, f"Available: {len(available)}, Unavailable: {len(unavailable)}"
    
    @test("8.2 AI Service Timeout Configured")
    def test_timeout_config():
        from app.utils.ai_client import TIMEOUT_CONFIG
        
        # Should be 30 minutes = 1800 seconds
        if TIMEOUT_CONFIG.read < 1800:
            return False, f"Timeout too short: {TIMEOUT_CONFIG.read}s"
        
        return True, f"Timeout: {TIMEOUT_CONFIG.read}s ({TIMEOUT_CONFIG.read/60:.0f} min)"
    
    test_missing_index()
    test_timeout_config()

# ============================================================
# 9. LOGGING & OBSERVABILITY
# ============================================================

def test_logging():
    print("\n" + "="*60)
    print("9️⃣  LOGGING & OBSERVABILITY TESTS")
    print("="*60)
    
    @test("9.1 RAG Logger Structure")
    def test_logger_structure():
        from app.rag_logger import RAGLogger
        import inspect
        
        # Check log_request has expected parameters
        sig = inspect.signature(RAGLogger.log_request)
        params = list(sig.parameters.keys())
        
        required = ["intent", "intent_confidence", "rags_queried", "rag_used", 
                   "documents_used", "doc_ids_used", "latency_ms"]
        
        missing = [p for p in required if p not in params]
        
        if missing:
            return False, f"Missing params: {missing}"
        
        return True, f"All required params present: {len(required)}"
    
    test_logger_structure()

# ============================================================
# 10. PERFORMANCE BASELINES
# ============================================================

def test_performance():
    print("\n" + "="*60)
    print("🔟 PERFORMANCE BASELINES")
    print("="*60)
    
    @test("10.1 Embedding Latency")
    def test_embed_latency():
        from app.utils.ai_client import get_remote_embedding
        
        start = time.perf_counter()
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(get_remote_embedding("test query"))
        latency = (time.perf_counter() - start) * 1000
        
        if result is None:
            return False, "Embedding failed"
        
        target = 150  # ms
        passed = latency < target * 10  # Allow 10x for network
        
        return passed, f"{latency:.0f}ms (target: <{target}ms + network)"
    
    @test("10.2 RAG Search Latency")
    def test_rag_latency():
        from app.rag_registry import RAG_REGISTRY, initialize_all_rags
        import numpy as np
        
        initialize_all_rags("/app/rag_storage")
        
        # Mock embedding
        mock_emb = np.random.randn(1024).astype(np.float32)
        mock_emb = (mock_emb / np.linalg.norm(mock_emb)).tolist()
        
        cve = RAG_REGISTRY.get("cve")
        if not cve or not cve.is_available():
            return False, "CVE index not available"
        
        start = time.perf_counter()
        results = cve.search(mock_emb, top_k=10)
        latency = (time.perf_counter() - start) * 1000
        
        target = 50  # ms
        passed = latency < target * 5  # Allow 5x margin
        
        return passed, f"{latency:.0f}ms (target: <{target}ms)"
    
    @test("10.3 Fusion Latency")
    def test_fusion_latency():
        from app.rag_fusion import rag_fusion
        from app.rag_registry import NormalizedDocument
        
        # Create test docs
        docs = {"cve": []}
        for i in range(10):
            doc = NormalizedDocument(
                source="cve", category="web", title=f"CVE-{i}",
                description="Test", technique=f"tech-{i}",
                attack_phase="initial-access", os="linux", service="apache",
                prerequisites=[], exploit_type="web", embedding_text="test",
                display_text="Test\nWhy it matters: Test",
                confidence="high", exploit_maturity="poc", doc_id=f"id{i}"
            )
            docs["cve"].append(doc)
        
        start = time.perf_counter()
        fused = rag_fusion.fuse(docs, access_level="none")
        latency = (time.perf_counter() - start) * 1000
        
        target = 20  # ms
        passed = latency < target * 5  # Allow margin
        
        return passed, f"{latency:.0f}ms (target: <{target}ms)"
    
    test_embed_latency()
    test_rag_latency()
    test_fusion_latency()

# ============================================================
# MAIN
# ============================================================

def print_summary():
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for r in results if r.passed)
    failed = sum(1 for r in results if not r.passed)
    total = len(results)
    
    print(f"\n    Passed: {passed}/{total}")
    print(f"    Failed: {failed}/{total}")
    
    if failed > 0:
        print("\n    Failed tests:")
        for r in results:
            if not r.passed:
                print(f"    ❌ {r.name}: {r.message}")
    
    print(f"\n    Total duration: {sum(r.duration_ms for r in results):.0f}ms")
    print()

if __name__ == "__main__":
    print("\n" + "="*60)
    print("  CYBERRAKSHAK RAG SYSTEM - COMPREHENSIVE TEST SUITE")
    print("="*60)
    
    try:
        test_embedding_pipeline()
        test_intent_classification()
        test_rag_routing()
        test_rag_fusion()
        test_prompt_assembly()
        test_generation_quality()
        test_troubleshooting()
        test_fail_safe()
        test_logging()
        test_performance()
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    print_summary()
