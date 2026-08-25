#!/usr/bin/env python3
"""
RAG Metadata Enrichment Script

This script:
1. Maps existing fields to standard schema (content→text, name→title)
2. Fixes the CVE source dict bug
3. Adds missing fields with "unknown" defaults
4. Preserves document order (CRITICAL for FAISS alignment)

Standard Schema:
- source (str): Source identifier
- title (str): Document title
- text (str): Full text content for display
- category (str): Category within source
- technique (str): Attack technique name
- attack_phase (str): Kill chain phase
- confidence (str): low/medium/high
- (original fields preserved)
"""

import json
import os
from typing import Dict, Any, List

RAG_STORAGE = "/home/ubuntu/CyberRakshak/backend/rag_storage"

# Mapping rules per source
SOURCE_CONFIGS = {
    "cve": {
        "source_name": "cve",
        "title_from": "title",
        "text_from": "content",
    },
    "exploitdb": {
        "source_name": "exploitdb",
        "title_from": "title",
        "text_from": "text",
        "category_from": "type",  # dos, webapps, local, etc.
    },
    "gtfobins": {
        "source_name": "gtfobins",
        "title_from": "binary",
        "text_from": "description",
        "technique_from": "technique",
        "attack_phase_from": "phase",
        "category_from": "context",
    },
    "http": {
        "source_name": "http",
        "title_from": "name",
        "text_from": "text",
    },
    "linpeas": {
        "source_name": "linpeas",
        "title_from": "check_file",
        "text_from": "description",
        "category_from": "category",
        "attack_phase_from": "phase",
    },
    "metasploit": {
        "source_name": "metasploit",
        "title_from": "name",
        "text_from": "description",
        "attack_phase_from": "phase",
        "category_from": "type",
    },
    "mitre": {
        "source_name": "mitre",
        "title_from": "name",
        "text_from": "text",
        "technique_from": "technique_id",
    },
    "nmap": {
        "source_name": "nmap",
        "title_from": "script",
        "text_from": "text",
        "category_from": "category",
    },
    "nuclei": {
        "source_name": "nuclei",
        "title_from": "id",
        "text_from": "content",
        "category_from": "type",
        "confidence_from": "severity",  # Map severity→confidence
    },
    "owasp": {
        "source_name": "owasp_cheatsheet",
        "title_from": "name",
        "text_from": "text",
    },
    "pay": {
        "source_name": "payloadsallthethings",
        "title_from": "kind",  # Fallback
        "text_from": "payload",
        "category_from": "category",
        "technique_from": "technique",
        "attack_phase_from": "phase",
    },
}


def get_string(doc: Dict, key: str, default: str = "unknown") -> str:
    """Safely get a string value, handling dicts and None."""
    val = doc.get(key)
    if val is None:
        return default
    if isinstance(val, str):
        return val if val.strip() else default
    if isinstance(val, dict):
        # Try to extract a meaningful string from dict
        return str(val.get("name", val.get("id", default)))
    return str(val) if val else default


def enrich_document(doc: Dict, config: Dict) -> Dict:
    """Enrich a single document with standard schema."""
    enriched = doc.copy()
    
    # Source - always use the configured source name
    enriched["source"] = config["source_name"]
    
    # Title
    if "title_from" in config:
        title = get_string(doc, config["title_from"], "Untitled")
        enriched["title"] = title
    elif "title" not in enriched:
        enriched["title"] = "Untitled"
    
    # Text - the display text
    if "text_from" in config:
        text = get_string(doc, config["text_from"], "")
        enriched["text"] = text
    elif "text" not in enriched:
        enriched["text"] = ""
    
    # Category
    if "category_from" in config:
        enriched["category"] = get_string(doc, config["category_from"], "unknown")
    elif "category" not in enriched:
        enriched["category"] = "unknown"
    
    # Technique
    if "technique_from" in config:
        enriched["technique"] = get_string(doc, config["technique_from"], "unknown")
    elif "technique" not in enriched:
        enriched["technique"] = "unknown"
    
    # Attack Phase
    if "attack_phase_from" in config:
        enriched["attack_phase"] = get_string(doc, config["attack_phase_from"], "unknown")
    elif "attack_phase" not in enriched:
        enriched["attack_phase"] = "unknown"
    
    # Confidence
    if "confidence_from" in config:
        # Map severity to confidence
        severity = get_string(doc, config["confidence_from"], "unknown").lower()
        if severity in ["critical", "high"]:
            enriched["confidence"] = "high"
        elif severity == "medium":
            enriched["confidence"] = "medium"
        elif severity in ["low", "info", "informational"]:
            enriched["confidence"] = "low"
        else:
            enriched["confidence"] = "unknown"
    elif "confidence" not in enriched:
        enriched["confidence"] = "unknown"
    
    return enriched


def process_source(source_key: str, config: Dict) -> Dict:
    """Process a single RAG source metadata file."""
    meta_file = os.path.join(RAG_STORAGE, f"{source_key}_metadata.json")
    
    if not os.path.exists(meta_file):
        return {"source": source_key, "status": "not_found"}
    
    with open(meta_file, "r") as f:
        docs = json.load(f)
    
    original_count = len(docs)
    
    # Enrich each document
    enriched_docs = [enrich_document(doc, config) for doc in docs]
    
    # Write back (SAME ORDER - critical for FAISS)
    with open(meta_file, "w") as f:
        json.dump(enriched_docs, f, indent=None)  # No indent to save space
    
    # Sample check
    sample = enriched_docs[0] if enriched_docs else {}
    
    return {
        "source": source_key,
        "status": "success",
        "doc_count": original_count,
        "sample_keys": list(sample.keys())[:10] if sample else [],
        "sample_title": sample.get("title", "N/A")[:50] if sample else "N/A",
        "sample_source": sample.get("source", "N/A"),
    }


def main():
    print("=" * 60)
    print("RAG METADATA ENRICHMENT")
    print("=" * 60)
    print(f"Storage: {RAG_STORAGE}\n")
    
    results = []
    
    for source_key, config in SOURCE_CONFIGS.items():
        print(f"Processing {source_key}...", end=" ")
        result = process_source(source_key, config)
        results.append(result)
        
        if result["status"] == "success":
            print(f"✅ {result['doc_count']} docs")
            print(f"   Sample: {result['sample_title']}")
        else:
            print(f"❌ {result['status']}")
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    success = sum(1 for r in results if r["status"] == "success")
    print(f"Processed: {success}/{len(results)} sources")
    print("\nRestart backend to load enriched metadata:")
    print("  docker compose restart backend")


if __name__ == "__main__":
    main()
