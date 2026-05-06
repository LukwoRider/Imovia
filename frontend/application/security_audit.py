#!/usr/bin/env python3
"""
Imovia Security Audit Script — Manual Pentest Toolkit
Scans the codebase for OWASP Top 10, IDOR, auth issues, and misconfigurations.
No external dependencies required (stdlib only).
"""

import os
import re
import json
import sys
import hashlib
import base64
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from collections import defaultdict

class Severity(Enum):
    CRITIQUE = "CRITIQUE"
    HAUTE = "HAUTE"
    MOYENNE = "MOYENNE"
    BASSE = "BASSE"
    INFO = "INFO"

@dataclass
class Finding:
    id: str
    title: str
    severity: Severity
    category: str
    file: str
    line: Optional[int]
    description: str
    exploit: str
    fix: str

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "severity": self.severity.value,
            "category": self.category,
            "file": self.file,
            "line": self.line,
            "description": self.description,
            "exploit": self.exploit,
            "fix": self.fix,
        }

class SecurityAuditor:
    def __init__(self, root_path: str):
        self.root = Path(root_path)
        self.findings: list[Finding] = []
        self.finding_counter = 0
        self.files_scanned = 0
        self.stats = defaultdict(int)

    def next_id(self) -> str:
        self.finding_counter += 1
        return f"VULN-{self.finding_counter:03d}"

    def add_finding(self, **kwargs):
        kwargs["id"] = self.next_id()
        kwargs["severity"] = Severity[kwargs["severity"]]
        self.findings.append(Finding(**kwargs))
        self.stats[kwargs["severity"].value] += 1

    def scan_file(self, filepath: Path, content: str, lines: list[str]):
        rel = str(filepath.relative_to(self.root))
        self.files_scanned += 1

        self._check_hardcoded_secrets(rel, content, lines)
        self._check_sql_injection(rel, content, lines)
        self._check_xss(rel, content, lines)
        self._check_idor(rel, content, lines)
        self._check_auth_issues(rel, content, lines)
        self._check_insecure_config(rel, content, lines)
        self._check_upload_issues(rel, content, lines)
        self._check_rls_issues(rel, content, lines)
        self._check_csrf_ssrf(rel, content, lines)
        self._check_error_handling(rel, content, lines)
        self._check_rate_limiting(rel, content, lines)
        self._check_crypto_issues(rel, content, lines)

    def _check_hardcoded_secrets(self, filepath: str, content: str, lines: list[str]):
        secret_patterns = [
            (r'(?:password|passwd|pwd|secret|token|api_key|apikey|api-key)\s*[:=]\s*["\'][^"\']{4,}["\']',
             "Hardcoded secret/password detected"),
            (r'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}',
             "JWT token in source code"),
            (r'(?:sk_live|pk_live|sk_test)_[A-Za-z0-9]{10,}',
             "Stripe API key detected"),
            (r'AKIA[0-9A-Z]{16}',
             "AWS Access Key detected"),
            (r'(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}',
             "GitHub token detected"),
        ]

        if '.example' in filepath or 'node_modules' in filepath:
            return

        for pattern, desc in secret_patterns:
            for i, line in enumerate(lines, 1):
                if re.search(pattern, line, re.IGNORECASE):
                    if any(skip in line.lower() for skip in ['placeholder', 'example', 'your-', '<', 'xxx', 'todo']):
                        continue
                    self.add_finding(
                        title=desc,
                        severity="CRITIQUE",
                        category="A02:2021 Sensitive Data Exposure",
                        file=filepath, line=i,
                        description=f"Potential secret found in source code: {line.strip()[:80]}...",
                        exploit="An attacker with repo access can extract credentials and gain unauthorized access.",
                        fix="Move secrets to environment variables. Use a secrets manager (Vault, 1Password)."
                    )

    def _check_sql_injection(self, filepath: str, content: str, lines: list[str]):
        if not filepath.endswith('.sql'):
            return

        sqli_patterns = [
            (r'EXECUTE\s+format\s*\([^)]*%s', "Dynamic SQL with string interpolation"),
            (r'EXECUTE\s+[^;]*\|\|', "Dynamic SQL with concatenation"),
            (r"EXECUTE\s+'[^']*'\s*\|\|\s*\w+", "SQL injection via string concatenation"),
        ]

        for pattern, desc in sqli_patterns:
            for i, line in enumerate(lines, 1):
                if re.search(pattern, line, re.IGNORECASE):
                    self.add_finding(
                        title=f"Potential SQL Injection: {desc}",
                        severity="CRITIQUE",
                        category="A03:2021 Injection",
                        file=filepath, line=i,
                        description=f"Dynamic SQL construction found: {line.strip()[:100]}",
                        exploit="Attacker can manipulate SQL queries via crafted input parameters.",
                        fix="Use parameterized queries ($1, $2) instead of string concatenation."
                    )

        for i, line in enumerate(lines, 1):
            if re.search(r'security\s+definer', line, re.IGNORECASE):
                func_body = '\n'.join(lines[max(0,i-1):min(len(lines),i+30)])
                if 'search_path' not in func_body.lower():
                    self.add_finding(
                        title="SECURITY DEFINER without search_path",
                        severity="HAUTE",
                        category="A01:2021 Broken Access Control",
                        file=filepath, line=i,
                        description="A SECURITY DEFINER function without explicit search_path is vulnerable to search_path hijacking.",
                        exploit="An attacker can create malicious objects in a schema that precedes 'public' in the search_path.",
                        fix="Add 'SET search_path = public, pg_catalog' to the function definition."
                    )

    def _check_xss(self, filepath: str, content: str, lines: list[str]):
        if not any(filepath.endswith(ext) for ext in ['.tsx', '.jsx', '.ts', '.js']):
            return

        for i, line in enumerate(lines, 1):
            if 'dangerouslySetInnerHTML' in line:
                self.add_finding(
                    title="dangerouslySetInnerHTML usage (XSS risk)",
                    severity="HAUTE",
                    category="A03:2021 Injection (XSS)",
                    file=filepath, line=i,
                    description="Direct HTML injection via dangerouslySetInnerHTML.",
                    exploit="If user input reaches this prop, an attacker can inject arbitrary JavaScript.",
                    fix="Sanitize with DOMPurify before rendering, or use React's built-in escaping."
                )

            if re.search(r'href\s*=\s*\{.*(?:user|data|props|params|input)', line, re.IGNORECASE):
                if 'javascript:' not in line and 'mailto:' not in line:
                    self.add_finding(
                        title="Dynamic href with user data (potential XSS)",
                        severity="MOYENNE",
                        category="A03:2021 Injection (XSS)",
                        file=filepath, line=i,
                        description=f"Dynamic href attribute with user-controlled data: {line.strip()[:80]}",
                        exploit="An attacker could inject javascript: protocol URLs.",
                        fix="Validate that href starts with '/' or 'https://' before rendering."
                    )

    def _check_idor(self, filepath: str, content: str, lines: list[str]):
        if not any(filepath.endswith(ext) for ext in ['.tsx', '.ts', '.jsx', '.js']):
            return

        for i, line in enumerate(lines, 1):
            if re.search(r'\.(delete|update)\s*\(\s*\)', line) or \
               re.search(r"\.(delete|update)\s*\(\s*\{", line):
                context = '\n'.join(lines[max(0,i-5):min(len(lines),i+5)])
                if 'user_id' not in context and 'owner_id' not in context and 'auth.uid' not in context:
                    if '.eq(' in context and ('id' in context.lower()):
                        self.add_finding(
                            title="Potential IDOR: delete/update without ownership check",
                            severity="HAUTE",
                            category="A01:2021 Broken Access Control",
                            file=filepath, line=i,
                            description="Database operation filtered only by resource ID without user ownership verification.",
                            exploit="An attacker can modify the ID parameter to access/modify other users' resources.",
                            fix="Add .eq('owner_id', user.id) or .eq('user_id', user.id) to the query."
                        )

        if re.search(r'\[id\]|\[.*Id\]', filepath):
            has_ownership_check = 'owner_id' in content or 'user_id' in content or 'auth.uid' in content
            if not has_ownership_check:
                self.add_finding(
                    title=f"Dynamic route without ownership verification: {filepath}",
                    severity="HAUTE",
                    category="A01:2021 Broken Access Control",
                    file=filepath, line=1,
                    description="Dynamic route parameter [id] is used without verifying resource ownership.",
                    exploit="An attacker can enumerate IDs to access other users' resources.",
                    fix="Verify that the authenticated user owns the resource before rendering/returning data."
                )

    def _check_auth_issues(self, filepath: str, content: str, lines: list[str]):
        if 'action' not in filepath.lower() and 'auth' not in filepath.lower():
            return

        if not any(filepath.endswith(ext) for ext in ['.ts', '.tsx']):
            return

        if 'formData.get' in content and 'role' in content:
            if not re.search(r'(?:ALLOWED_ROLES|validRoles|roleWhitelist|\.includes\(role)', content):
                for i, line in enumerate(lines, 1):
                    if "formData.get('role')" in line or 'formData.get("role")' in line:
                        self.add_finding(
                            title="Role from user input without server-side whitelist",
                            severity="CRITIQUE",
                            category="A07:2021 Authentication Failures",
                            file=filepath, line=i,
                            description="User-provided role is accepted without validation against an allowed list.",
                            exploit="An attacker can set role=admin via curl to escalate privileges.",
                            fix="Validate role against a whitelist: ['tenant', 'owner', 'agency']."
                        )

        if 'signInWithPassword' in content or 'signUp' in content:
            has_rate_limit = any(kw in content for kw in ['ratelimit', 'rate_limit', 'throttle', 'captcha'])
            if not has_rate_limit:
                self.add_finding(
                    title="Auth endpoint without rate limiting",
                    severity="HAUTE",
                    category="A07:2021 Authentication Failures",
                    file=filepath, line=1,
                    description="Authentication endpoints lack rate limiting, enabling brute-force attacks.",
                    exploit="Attacker can try thousands of passwords per minute.",
                    fix="Implement rate limiting with @upstash/ratelimit or similar."
                )

    def _check_insecure_config(self, filepath: str, content: str, lines: list[str]):
        if 'next.config' in filepath:
            if 'Content-Security-Policy' not in content:
                self.add_finding(
                    title="Missing Content-Security-Policy header",
                    severity="CRITIQUE",
                    category="A05:2021 Security Misconfiguration",
                    file=filepath, line=1,
                    description="No CSP header configured in Next.js config.",
                    exploit="Enables XSS attacks, data exfiltration, and clickjacking.",
                    fix="Add CSP header via next.config headers() function."
                )
            if 'poweredByHeader' not in content or 'false' not in content:
                self.add_finding(
                    title="X-Powered-By header not disabled",
                    severity="MOYENNE",
                    category="A05:2021 Security Misconfiguration",
                    file=filepath, line=1,
                    description="Next.js exposes 'X-Powered-By: Next.js' header by default.",
                    exploit="Reveals technology stack, enabling targeted attacks.",
                    fix="Set poweredByHeader: false in next.config."
                )

        if filepath.endswith('.yml') or filepath.endswith('.yaml'):
            for i, line in enumerate(lines, 1):
                if re.search(r'uses:\s+\S+@v\d+', line) and not re.search(r'@[a-f0-9]{40}', line):
                    self.add_finding(
                        title="GitHub Action not pinned by SHA",
                        severity="HAUTE",
                        category="A08:2021 Software Integrity Failures",
                        file=filepath, line=i,
                        description=f"Action uses mutable tag instead of SHA: {line.strip()}",
                        exploit="Compromised upstream action could inject malicious code into CI pipeline.",
                        fix="Pin action to a specific commit SHA: uses: actions/checkout@<sha>"
                    )

    def _check_upload_issues(self, filepath: str, content: str, lines: list[str]):
        if not any(filepath.endswith(ext) for ext in ['.ts', '.tsx']):
            return

        if '.upload(' in content:
            has_mime_check = any(kw in content for kw in ['file.type', 'mime', 'contentType', 'allowedTypes'])
            has_size_check = any(kw in content for kw in ['file.size', 'maxSize', 'sizeLimit', 'MAX_FILE_SIZE'])
            for i, line in enumerate(lines, 1):
                if '.upload(' in line:
                    if not has_mime_check:
                        self.add_finding(
                            title="File upload without MIME type validation",
                            severity="HAUTE",
                            category="A04:2021 Insecure Design",
                            file=filepath, line=i,
                            description="File upload does not validate MIME type server-side.",
                            exploit="Attacker can upload HTML/SVG/JS files for stored XSS.",
                            fix="Validate file.type against an allowlist of safe MIME types."
                        )
                    if not has_size_check:
                        self.add_finding(
                            title="File upload without size limit",
                            severity="MOYENNE",
                            category="A04:2021 Insecure Design",
                            file=filepath, line=i,
                            description="No file size validation before upload.",
                            exploit="Attacker can upload very large files causing storage exhaustion.",
                            fix="Check file.size < MAX_FILE_SIZE before uploading."
                        )

        for i, line in enumerate(lines, 1):
            if 'Math.random()' in line and ('file' in line.lower() or 'path' in line.lower()):
                self.add_finding(
                    title="Predictable file name using Math.random()",
                    severity="MOYENNE",
                    category="A02:2021 Cryptographic Failures",
                    file=filepath, line=i,
                    description="File names generated with Math.random() are predictable.",
                    exploit="Attacker can guess file paths and access uploaded content.",
                    fix="Use crypto.randomUUID() for unpredictable file names."
                )

    def _check_rls_issues(self, filepath: str, content: str, lines: list[str]):
        if not filepath.endswith('.sql'):
            return

        for i, line in enumerate(lines, 1):
            if re.search(r'with\s+check\s*\(\s*true\s*\)', line, re.IGNORECASE):
                self.add_finding(
                    title="RLS policy with CHECK (true) — unrestricted write",
                    severity="CRITIQUE",
                    category="A01:2021 Broken Access Control",
                    file=filepath, line=i,
                    description="RLS policy allows any authenticated user to write without restriction.",
                    exploit="Any user can insert/update records for any other user.",
                    fix="Replace WITH CHECK (true) with proper user-scoped check: WITH CHECK (auth.uid() = user_id)."
                )

            if re.search(r'using\s*\(\s*true\s*\)', line, re.IGNORECASE):
                self.add_finding(
                    title="RLS policy USING (true) — unrestricted read",
                    severity="HAUTE",
                    category="A01:2021 Broken Access Control",
                    file=filepath, line=i,
                    description="RLS policy allows any user to read all records.",
                    exploit="Data leak: any authenticated user can read all rows.",
                    fix="Add proper filtering: USING (auth.uid() = user_id)."
                )

            if re.search(r'grant\s+(all|insert|update|delete).*\bto\s+(anon|public)\b', line, re.IGNORECASE):
                if not line.strip().startswith('--'):
                    self.add_finding(
                        title="Excessive grant to anon/public role",
                        severity="HAUTE",
                        category="A01:2021 Broken Access Control",
                        file=filepath, line=i,
                        description=f"Dangerous grant to unauthenticated role: {line.strip()[:80]}",
                        exploit="Unauthenticated users may be able to modify data if RLS is misconfigured.",
                        fix="Restrict grants to 'authenticated' role. Use 'anon' only for SELECT on public data."
                    )

        if 'security definer' in content.lower():
            func_blocks = re.finditer(
                r'create\s+(?:or\s+replace\s+)?function\s+(\S+).*?security\s+definer.*?\$\$\s*;',
                content, re.IGNORECASE | re.DOTALL
            )
            for match in func_blocks:
                func_name = match.group(1)
                func_body = match.group(0)
                if 'auth.uid()' not in func_body and 'current_user_id()' not in func_body:
                    line_num = content[:match.start()].count('\n') + 1
                    self.add_finding(
                        title=f"SECURITY DEFINER function without auth.uid() check: {func_name}",
                        severity="HAUTE",
                        category="A01:2021 Broken Access Control",
                        file=filepath, line=line_num,
                        description=f"Function {func_name} runs with elevated privileges but doesn't verify the caller's identity.",
                        exploit="Any authenticated user can invoke this function regardless of their role/relationship.",
                        fix="Add auth.uid() verification at the start of the function body."
                    )

    def _check_csrf_ssrf(self, filepath: str, content: str, lines: list[str]):
        if not any(filepath.endswith(ext) for ext in ['.ts', '.tsx']):
            return

        for i, line in enumerate(lines, 1):
            if 'searchParams.get("next")' in line or "searchParams.get('next')" in line:
                context = '\n'.join(lines[max(0,i-3):min(len(lines),i+10)])
                if 'startsWith' not in context and 'isValid' not in context and 'allowedPaths' not in context:
                    self.add_finding(
                        title="Open redirect via unvalidated 'next' parameter",
                        severity="HAUTE",
                        category="A01:2021 Broken Access Control",
                        file=filepath, line=i,
                        description="Redirect target read from query parameter without validation.",
                        exploit="Attacker crafts URL: /callback?next=//evil.com for phishing.",
                        fix="Validate that 'next' starts with '/' and not '//'."
                    )

            if re.search(r'headers\(\).*get\s*\(\s*["\']origin["\']\s*\)', line):
                self.add_finding(
                    title="Origin header used from client request (spoofable)",
                    severity="MOYENNE",
                    category="A05:2021 Security Misconfiguration",
                    file=filepath, line=i,
                    description="The Origin header is controlled by the client and should not be trusted for redirects.",
                    exploit="Attacker manipulates Origin header to redirect email confirmation links.",
                    fix="Use a server-side environment variable (NEXT_PUBLIC_SITE_URL) instead."
                )

    def _check_error_handling(self, filepath: str, content: str, lines: list[str]):
        if not any(filepath.endswith(ext) for ext in ['.ts', '.tsx']):
            return

        for i, line in enumerate(lines, 1):
            if re.search(r'error\.message', line) and ('toast' in line or 'throw' in line):
                self.add_finding(
                    title="Raw error message exposed to user",
                    severity="BASSE",
                    category="A04:2021 Insecure Design",
                    file=filepath, line=i,
                    description="Database/API error messages are displayed directly to the user.",
                    exploit="Error messages may reveal table names, column names, or constraints.",
                    fix="Use generic error messages for the UI, log details server-side."
                )

            if re.search(r'}\s*catch\s*(?:\([^)]*\))?\s*\{\s*\}', line) or \
               (re.search(r'catch\s*\{', line) and i < len(lines) and lines[i].strip() == '}'):
                self.add_finding(
                    title="Empty catch block (silent error swallowing)",
                    severity="BASSE",
                    category="A09:2021 Security Logging Failures",
                    file=filepath, line=i,
                    description="Errors are silently swallowed without logging.",
                    exploit="Security events and attack attempts go undetected.",
                    fix="Log errors to a monitoring service (Sentry, console.error at minimum)."
                )

    def _check_rate_limiting(self, filepath: str, content: str, lines: list[str]):
        pass  # Handled in auth_issues

    def _check_crypto_issues(self, filepath: str, content: str, lines: list[str]):
        if not any(filepath.endswith(ext) for ext in ['.ts', '.tsx', '.sql']):
            return

        for i, line in enumerate(lines, 1):
            if re.search(r"crypt\s*\(\s*'[^']{1,6}'", line):
                self.add_finding(
                    title="Weak password in bcrypt hash",
                    severity="MOYENNE",
                    category="A02:2021 Cryptographic Failures",
                    file=filepath, line=i,
                    description=f"Short/weak password being hashed: {line.strip()[:60]}",
                    exploit="Weak passwords are trivially crackable even with bcrypt.",
                    fix="Use strong passwords (12+ chars) or generate random passwords for seed data."
                )

    def _decode_jwt(self, token: str) -> Optional[dict]:
        try:
            parts = token.split('.')
            if len(parts) != 3:
                return None
            payload = parts[1]
            padding = 4 - len(payload) % 4
            if padding != 4:
                payload += '=' * padding
            decoded = base64.urlsafe_b64decode(payload)
            return json.loads(decoded)
        except Exception:
            return None

    def scan_env_files(self):
        env_patterns = ['**/.env', '**/.env.*']
        for pattern in env_patterns:
            for env_file in self.root.glob(pattern):
                if 'node_modules' in str(env_file) or '.example' in str(env_file):
                    continue
                rel = str(env_file.relative_to(self.root))
                try:
                    content = env_file.read_text(errors='ignore')
                except Exception:
                    continue

                self.add_finding(
                    title=f".env file present: {rel}",
                    severity="HAUTE",
                    category="A02:2021 Sensitive Data Exposure",
                    file=rel, line=1,
                    description="Environment file with potential secrets found in the repository.",
                    exploit="Secrets in .env files committed to git are permanently in the history.",
                    fix="Ensure .env is in .gitignore. Rotate any exposed secrets."
                )

                for i, line in enumerate(content.splitlines(), 1):
                    jwt_match = re.search(r'(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)', line)
                    if jwt_match:
                        claims = self._decode_jwt(jwt_match.group(1))
                        if claims:
                            role = claims.get('role', 'unknown')
                            if role == 'service_role':
                                self.add_finding(
                                    title="SERVICE_ROLE key exposed in .env file!",
                                    severity="CRITIQUE",
                                    category="A02:2021 Sensitive Data Exposure",
                                    file=rel, line=i,
                                    description=f"Supabase service_role key found. Role: {role}. This key bypasses ALL RLS.",
                                    exploit="Full database access without any restrictions. Complete compromise.",
                                    fix="IMMEDIATELY rotate the key in Supabase Dashboard. Remove from git history."
                                )
                            else:
                                self.add_finding(
                                    title=f"JWT token in env file (role: {role})",
                                    severity="MOYENNE",
                                    category="A02:2021 Sensitive Data Exposure",
                                    file=rel, line=i,
                                    description=f"JWT claims: iss={claims.get('iss','?')}, role={role}, exp={claims.get('exp','?')}",
                                    exploit="Anon keys are public by design but should not be committed to git.",
                                    fix="Use environment variables at deploy time, not committed .env files."
                                )

    def scan_gitignore(self):
        gitignore = self.root / '.gitignore'
        if not gitignore.exists():
            self.add_finding(
                title="Missing .gitignore file",
                severity="HAUTE",
                category="A05:2021 Security Misconfiguration",
                file=".gitignore", line=0,
                description="No .gitignore file found at repository root.",
                exploit="Secrets, build artifacts, and dependencies may be committed accidentally.",
                fix="Create a comprehensive .gitignore file."
            )
            return

        content = gitignore.read_text()
        critical_patterns = {
            '.env': "Environment files",
            '*.pem': "Certificate/key files",
            '*.key': "Private key files",
        }
        for pattern, desc in critical_patterns.items():
            if pattern not in content and f'**/{pattern}' not in content:
                self.add_finding(
                    title=f".gitignore missing pattern: {pattern} ({desc})",
                    severity="MOYENNE",
                    category="A05:2021 Security Misconfiguration",
                    file=".gitignore", line=1,
                    description=f"The .gitignore file does not exclude {desc} ({pattern}).",
                    exploit=f"Files matching {pattern} could be committed accidentally.",
                    fix=f"Add '{pattern}' to .gitignore."
                )

    def run(self):
        print("=" * 70)
        print("  IMOVIA SECURITY AUDIT — Manual Pentest Toolkit")
        print("=" * 70)
        print(f"\nScanning: {self.root}")
        print("-" * 70)

        self.scan_env_files()
        self.scan_gitignore()

        extensions = {'.ts', '.tsx', '.js', '.jsx', '.sql', '.yml', '.yaml', '.json', '.toml', '.md'}
        skip_dirs = {'node_modules', '.git', '.next', 'dist', 'build', '.expo'}

        for filepath in self.root.rglob('*'):
            if any(skip in filepath.parts for skip in skip_dirs):
                continue
            if filepath.suffix not in extensions:
                continue
            if not filepath.is_file():
                continue

            try:
                content = filepath.read_text(errors='ignore')
                lines = content.splitlines()
                self.scan_file(filepath, content, lines)
            except Exception as e:
                print(f"  [WARN] Could not scan {filepath}: {e}")

        self._print_report()
        self._export_json()
        self._export_markdown()

    def _print_report(self):
        print(f"\n{'=' * 70}")
        print(f"  RESULTS — {len(self.findings)} vulnerabilities found")
        print(f"  Files scanned: {self.files_scanned}")
        print(f"{'=' * 70}\n")

        severity_colors = {
            "CRITIQUE": "\033[91m",  # Red
            "HAUTE": "\033[93m",     # Yellow
            "MOYENNE": "\033[94m",   # Blue
            "BASSE": "\033[90m",     # Gray
            "INFO": "\033[37m",      # White
        }
        reset = "\033[0m"

        print("  SUMMARY:")
        for sev in ["CRITIQUE", "HAUTE", "MOYENNE", "BASSE", "INFO"]:
            count = self.stats.get(sev, 0)
            color = severity_colors.get(sev, "")
            bar = "█" * count
            print(f"    {color}{sev:10s}{reset} {count:3d}  {color}{bar}{reset}")
        print()

        for sev in ["CRITIQUE", "HAUTE", "MOYENNE", "BASSE"]:
            findings = [f for f in self.findings if f.severity.value == sev]
            if not findings:
                continue
            color = severity_colors.get(sev, "")
            print(f"\n  {color}{'─' * 60}")
            print(f"  [{sev}] — {len(findings)} findings")
            print(f"  {'─' * 60}{reset}\n")

            for f in findings:
                print(f"  {color}[{f.id}]{reset} {f.title}")
                print(f"    File: {f.file}:{f.line or '?'}")
                print(f"    Category: {f.category}")
                print(f"    → {f.description[:120]}")
                print()

    def _export_json(self):
        output_path = self.root / "audit_results.json"
        data = {
            "audit_date": "2026-05-06",
            "root_path": str(self.root),
            "files_scanned": self.files_scanned,
            "total_findings": len(self.findings),
            "summary": dict(self.stats),
            "findings": [f.to_dict() for f in self.findings],
        }
        output_path.write_text(json.dumps(data, indent=2, ensure_ascii=False))
        print(f"\n  JSON report: {output_path}")

    def _export_markdown(self):
        output_path = self.root / "audit_results.md"
        lines = [
            "# Security Audit Results — Imovia\n",
            f"**Date:** 2026-05-06  ",
            f"**Files scanned:** {self.files_scanned}  ",
            f"**Total findings:** {len(self.findings)}\n",
            "## Summary\n",
            "| Severity | Count |",
            "|----------|-------|",
        ]
        for sev in ["CRITIQUE", "HAUTE", "MOYENNE", "BASSE", "INFO"]:
            lines.append(f"| {sev} | {self.stats.get(sev, 0)} |")

        lines.append("\n## Detailed Findings\n")

        for sev in ["CRITIQUE", "HAUTE", "MOYENNE", "BASSE"]:
            findings = [f for f in self.findings if f.severity.value == sev]
            if not findings:
                continue
            lines.append(f"\n### {sev}\n")
            for f in findings:
                lines.append(f"#### {f.id} — {f.title}\n")
                lines.append(f"- **File:** `{f.file}:{f.line or '?'}`")
                lines.append(f"- **Category:** {f.category}")
                lines.append(f"- **Description:** {f.description}")
                lines.append(f"- **Exploit:** {f.exploit}")
                lines.append(f"- **Fix:** {f.fix}\n")

        output_path.write_text('\n'.join(lines))
        print(f"  Markdown report: {output_path}")


if __name__ == "__main__":
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    root_path = Path(root).resolve()

    if not root_path.exists():
        print(f"Error: Path {root_path} does not exist.")
        sys.exit(1)

    auditor = SecurityAuditor(str(root_path))
    auditor.run()

    critique_count = auditor.stats.get("CRITIQUE", 0)
    if critique_count > 0:
        print(f"\n  ⚠ {critique_count} CRITICAL vulnerabilities found. Immediate action required.")
        sys.exit(2)
    else:
        print("\n  ✓ No critical vulnerabilities found.")
        sys.exit(0)
