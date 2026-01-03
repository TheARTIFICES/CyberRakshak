#!/usr/bin/env python3
"""
RAG Verification Script - Multi-Index RAG System

Verifies that all RAG sources are properly loaded and functioning.
Supports both the new multi-index system and legacy fallback mode.
"""

import sys
import os
import logging

# Add backend to path so we can import app modules
sys.path.append("/home/ubuntu/CyberRakshak/backend")

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

print("=" * 60)
print("       RAG VERIFICATION - Multi-Index System")
print("=" * 60)

# 1. Check Environment Variable
print("\n[1] Checking AI_SERVICE_URL configuration...")
url = os.getenv("AI_SERVICE_URL")
if url:
    print(f"    ✅ AI_SERVICE_URL is set to: {url}")
else:
    print("    ⚠️  AI_SERVICE_URL is NOT set. Remote embedding/generation will fail.")

# 2. Check Fallback Mode
print("\n[2] Checking RAG mode...")
fallback_mode = os.getenv("RAG_FALLBACK_MODE", "false").lower() == "true"
if fallback_mode:
    print("    ⚠️  FALLBACK MODE ENABLED - Using legacy single-index RAG")
else:
    print("    ✅ Using Multi-Index RAG System")

# 3. Verify Multi-Index RAG Sources
print("\n[3] Verifying Multi-Index RAG Sources...")
try:
    from app.rag_registry import RAG_REGISTRY, initialize_all_rags, get_rag_stats
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    rag_storage = os.path.join(BASE_DIR, "rag_storage")
    
    if not os.path.exists(rag_storage):
        print(f"    ❌ ERROR: rag_storage directory not found at {rag_storage}")
    else:
        print(f"    📁 Storage path: {rag_storage}")
        
        # List available index files
        print("\n    Available index files:")
        index_files = [f for f in os.listdir(rag_storage) if f.endswith('_faiss.index')]
        for f in sorted(index_files):
            size_mb = os.path.getsize(os.path.join(rag_storage, f)) / (1024 * 1024)
            print(f"       - {f} ({size_mb:.2f} MB)")
        
        # Initialize all RAG sources
        print("\n    Loading RAG sources...")
        results = initialize_all_rags(rag_storage)
        
        # Print results table
        print("\n    " + "-" * 50)
        print(f"    {'Source':<15} {'Status':<10} {'Vectors':<12} {'Metadata':<10}")
        print("    " + "-" * 50)
        
        stats = get_rag_stats()
        total_vectors = 0
        loaded_count = 0
        
        for stat in stats:
            source = stat['source']
            available = stat['available']
            vectors = stat['vectors']
            metadata = stat['metadata_entries']
            status = "✅ Loaded" if available else "❌ Missing"
            
            if available:
                total_vectors += vectors
                loaded_count += 1
            
            print(f"    {source:<15} {status:<10} {vectors:<12} {metadata:<10}")
        
        print("    " + "-" * 50)
        print(f"    TOTAL: {loaded_count}/{len(stats)} sources, {total_vectors:,} vectors")

except ImportError as e:
    print(f"    ❌ CRITICAL: Failed to import rag_registry. Error: {e}")
except Exception as e:
    print(f"    ❌ CRITICAL: Unexpected error: {e}")
    import traceback
    traceback.print_exc()

# 4. Verify Legacy RAG (for fallback)
print("\n[4] Verifying Legacy RAG (fallback mode)...")
try:
    from app.rag import rag
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    index_path = os.path.join(BASE_DIR, "rag_storage", "faiss.index")
    metadata_path = os.path.join(BASE_DIR, "rag_storage", "metadata.json")

    if os.path.exists(index_path) and os.path.exists(metadata_path):
        rag.load_resources(index_path=index_path, metadata_path=metadata_path)
        
        if rag.index and rag.index.ntotal > 0:
            print(f"    ✅ Legacy RAG loaded: {rag.index.ntotal} vectors, {len(rag.metadata)} metadata")
            if rag.index.ntotal == len(rag.metadata):
                print("    ✅ Alignment: Perfect (vectors == metadata)")
            else:
                print(f"    ⚠️  Mismatch: {rag.index.ntotal} vectors != {len(rag.metadata)} metadata")
        else:
            print("    ⚠️  Legacy RAG index is empty or failed to load")
    else:
        print("    ⚠️  Legacy faiss.index/metadata.json not found (this is OK if using multi-index)")

except ImportError as e:
    print(f"    ❌ Failed to import app.rag: {e}")
except Exception as e:
    print(f"    ⚠️  Legacy RAG error: {e}")

# 5. Test Intent Classification
print("\n[5] Testing Intent Classifier...")
try:
    from app.intent_classifier import classify_intent, IntentType
    
    test_cases = [
        # RECON tests
        ("Scan the target for open ports", "recon"),
        ("What services are running on the server?", "recon"),
        ("Enumerate the network", "recon"),
        ("nmap the target", "recon"),
        
        # VULN_CHECK tests
        ("Check for CVE-2024-1234", "vuln_check"),
        ("Is this server vulnerable?", "vuln_check"),
        ("Run nuclei scan", "vuln_check"),
        ("Find vulnerabilities on the target", "vuln_check"),
        ("Security audit the application", "vuln_check"),
        
        # EXPLOIT tests
        ("Show me the exploit code", "exploit"),
        ("Give me a reverse shell payload", "exploit"),
        ("How do I exploit this RCE?", "exploit"),
        ("Metasploit module for this", "exploit"),
        
        # PRIVESC tests
        ("How do I get root?", "privesc"),
        ("Escalate privileges", "privesc"),
        ("Check for SUID binaries", "privesc"),
        ("Run linpeas", "privesc"),
        ("GTFOBins for sudo", "privesc"),
        
        # TROUBLESHOOTING tests
        ("Why is my scan failing?", "troubleshooting"),
        ("Connection refused error", "troubleshooting"),
        ("How to fix this issue?", "troubleshooting"),
        
        # PLANNING tests
        ("What should I do next?", "planning"),
        ("Recommend next steps", "planning"),
        ("What's the best approach?", "planning"),
        
        # GENERAL (low confidence / no match)
        ("Hello, how are you?", "general"),
        ("Tell me about yourself", "general"),
    ]
    
    passed = 0
    failed = 0
    for query, expected in test_cases:
        intent, explicit, conf = classify_intent(query)
        if intent.value == expected:
            status = "✅"
            passed += 1
        else:
            status = "❌"
            failed += 1
        print(f"    {status} '{query[:35]:<35}' → {intent.value:<15} (conf: {conf:.2f})")
    
    print(f"\n    Results: {passed}/{len(test_cases)} passed, {failed} failed")

except ImportError as e:
    print(f"    ❌ Failed to import intent_classifier: {e}")
except Exception as e:
    print(f"    ❌ Intent classifier error: {e}")

# 6. Test RAG Routing
print("\n[6] Testing RAG Routing...")
try:
    from app.rag_routing import get_rag_sources_for_intent, RAG_PRIORITY
    from app.intent_classifier import IntentType
    
    print("    Primary sources by intent:")
    for intent in IntentType:
        sources = get_rag_sources_for_intent(intent, explicit_exploit_request=False)
        print(f"    {intent.value:<15}: {sources}")
    
    print("\n    Secondary source gating tests:")
    # Test TROUBLESHOOTING with and without explicit exploit
    sources_no_explicit = get_rag_sources_for_intent(IntentType.TROUBLESHOOTING, explicit_exploit_request=False)
    sources_explicit = get_rag_sources_for_intent(IntentType.TROUBLESHOOTING, explicit_exploit_request=True)
    
    gating_works = len(sources_explicit) > len(sources_no_explicit)
    status = "✅" if gating_works else "❌"
    print(f"    {status} TROUBLESHOOTING secondary gating: {len(sources_no_explicit)} → {len(sources_explicit)} sources")
    
    print(f"\n    RAG Priority order: {RAG_PRIORITY[:5]}... (exploitdb first)")

except ImportError as e:
    print(f"    ❌ Failed to import rag_routing: {e}")
except Exception as e:
    print(f"    ❌ Routing error: {e}")

# 7. Test Explicit Exploit Detection
print("\n[7] Testing Explicit Exploit Detection...")
try:
    from app.intent_classifier import classify_intent
    
    explicit_tests = [
        ("Give me exploit code for this", True),
        ("Show me the POC", True),
        ("Generate a payload", True),
        ("What is this vulnerability?", False),
        ("Scan the target", False),
    ]
    
    passed = 0
    for query, expected_explicit in explicit_tests:
        _, explicit, _ = classify_intent(query)
        status = "✅" if explicit == expected_explicit else "❌"
        if explicit == expected_explicit:
            passed += 1
        print(f"    {status} '{query[:35]:<35}' → explicit={explicit}")
    
    print(f"\n    Results: {passed}/{len(explicit_tests)} passed")

except Exception as e:
    print(f"    ❌ Explicit detection error: {e}")

# 8. Test Document Normalization
print("\n[8] Testing Document Normalization...")
try:
    from app.rag_registry import RAG_REGISTRY, NormalizedDocument
    
    # Test that a source can normalize a raw document
    cve_source = RAG_REGISTRY.get("cve")
    if cve_source and cve_source.is_available():
        raw_doc = {
            "text": "Test vulnerability in Apache HTTP Server allows RCE",
            "title": "CVE-2024-TEST",
            "category": "web",
        }
        normalized = cve_source._normalize_document(raw_doc)
        
        # Check required fields are populated
        checks = [
            ("source", normalized.source != ""),
            ("title", normalized.title != ""),
            ("doc_id", len(normalized.doc_id) == 16),
            ("exploit_maturity", normalized.exploit_maturity == "poc"),  # Default changed
            ("display_text has impact", "Why it matters:" in normalized.display_text),
        ]
        
        for field, passed in checks:
            status = "✅" if passed else "❌"
            print(f"    {status} {field}: {passed}")
    else:
        print("    ⚠️  CVE source not available for normalization test")

except Exception as e:
    print(f"    ❌ Normalization error: {e}")
    import traceback
    traceback.print_exc()

# 9. Test RAG Fusion Pipeline
print("\n[9] Testing RAG Fusion...")
try:
    from app.rag_fusion import rag_fusion, MAX_EXPLOIT_DOCS_PER_TURN, EXPLOIT_SOURCES
    from app.rag_registry import NormalizedDocument
    
    print(f"    MAX_EXPLOIT_DOCS_PER_TURN: {MAX_EXPLOIT_DOCS_PER_TURN}")
    print(f"    EXPLOIT_SOURCES: {EXPLOIT_SOURCES}")
    
    # Create mock documents to test fusion
    mock_docs = {
        "exploitdb": [
            NormalizedDocument(
                source="exploitdb", category="web", title="Exploit 1", description="Test",
                technique="RCE", attack_phase="initial-access", os="linux", service="apache",
                prerequisites=[], exploit_type="command-exec", embedding_text="test",
                display_text="Test exploit\nWhy it matters: RCE", confidence="high",
                exploit_maturity="poc", doc_id="test1"
            ),
        ],
        "cve": [
            NormalizedDocument(
                source="cve", category="web", title="CVE-2024-1234", description="Test vuln",
                technique="RCE", attack_phase="initial-access", os="linux", service="apache",
                prerequisites=[], exploit_type="command-exec", embedding_text="test",
                display_text="Test CVE\nWhy it matters: Critical", confidence="high",
                exploit_maturity="theoretical", doc_id="test2"
            ),
        ],
    }
    
    # Test fusion
    fused = rag_fusion.fuse(mock_docs, access_level="none", explicit_exploit_request=False)
    print(f"    ✅ Fusion produced {len(fused)} documents from {sum(len(v) for v in mock_docs.values())} inputs")
    
    # Test dedup
    mock_docs_dup = {
        "exploitdb": [mock_docs["exploitdb"][0], mock_docs["exploitdb"][0]],  # Same doc twice
    }
    fused_dedup = rag_fusion.fuse(mock_docs_dup, access_level="none")
    dedup_works = len(fused_dedup) == 1
    status = "✅" if dedup_works else "❌"
    print(f"    {status} Deduplication: 2 identical → {len(fused_dedup)} after dedup")

except Exception as e:
    print(f"    ❌ Fusion error: {e}")
    import traceback
    traceback.print_exc()

# 10. Test RAG Search (if sources loaded)
print("\n[10] Testing RAG Search (mock embedding)...")
try:
    from app.rag_registry import RAG_REGISTRY
    import numpy as np
    
    # Create a mock embedding (normalized random vector)
    mock_embedding = np.random.randn(1024).astype(np.float32)
    mock_embedding = mock_embedding / np.linalg.norm(mock_embedding)
    
    # Test search on each available source
    for source_name, source in RAG_REGISTRY.items():
        if source.is_available():
            results = source.search(mock_embedding.tolist(), top_k=3)
            if len(results) > 0:
                print(f"    ✅ {source_name}: {len(results)} results, first: '{results[0].title[:40]}...'")
            else:
                print(f"    ⚠️  {source_name}: 0 results")
        else:
            print(f"    ⚠️  {source_name}: not available")

except Exception as e:
    print(f"    ❌ Search error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("       VERIFICATION COMPLETE")
print("=" * 60 + "\n")

