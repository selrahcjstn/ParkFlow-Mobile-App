# SECURITY MEASURES DOCUMENTATION FOR PARKFLOW MOBILE APP USING THE SECURE SOFTWARE DEVELOPMENT LIFE CYCLE

**Capstone Project:** ParkFlow Mobile App  
**Course:** [Course Name]  
**College / Department:** [Department Name]  
**Group Members:** [Names]  
**Instructor:** [Instructor Name]  
**Section:** [Section]  
**Date of Submission:** [Date]

---

## 1. Executive Summary

ParkFlow Mobile App is an Expo and React Native application for parking-related services. Based on the repository, the system includes user authentication, profiles, vehicle management, document or image uploads, parking reservations and sessions, and real-time notification updates. The app connects to a separate API through Axios and uses SignalR for real-time updates.

The system handles user account information, registration documents, parking activity, and possibly financial or violation-related data. These data types require strong protection against disclosure, tampering, unauthorized access, and service disruption. The app’s most urgent repository-level concern is that the API endpoint is configured with HTTP and the app explicitly allows cleartext traffic for iOS and Android. This creates a significant risk for network interception or unauthorized data modification.

The main recommended measures are to enforce HTTPS/WSS for all production traffic, review web token storage, remove or redact sensitive logs, verify backend authorization controls, and validate upload and data-handling protections. These measures should be integrated throughout the Secure SDLC, not added only at the end of development.

---

## 2. System Overview

### 2.1 System Description

The ParkFlow Mobile App is a client-side application using Expo, React Native, TypeScript, and JavaScript. It is designed to support a parking service ecosystem that likely includes user accounts, profile data, registration details, scheduling, vehicle information, and real-time status updates. The repository includes workflows for document uploads and SignalR notifications, indicating a connected client that depends on a backend API and notification hub.

### 2.2 Target Users

| User Type | Function | Security Consideration |
|---|---|---|
| Student / Registered Driver | Manage account, vehicles, reservations, and parking actions | Must access only own record and permitted functions |
| Visitor | Use public or visitor-related features, if applicable | Restricted access to non-sensitive features |
| Staff / Personnel | Perform parking operations or support tasks | Least privilege and task-specific access only |
| Administrator | Manage users, approvals, configurations, and logs | High-risk role; requires MFA and strong monitoring |

### 2.3 System Components

| Component | Role | Notes |
|---|---|---|
| Mobile Application | Frontend UI and user workflows | Expo + React Native with TypeScript |
| REST API | Provides application data and business logic | Backend not in the reviewed repository |
| SignalR Hub | Real-time notifications and live status updates | See `services/signalr.ts` |
| Authentication Service | Identity verification and token management | Microsoft auth identifiers are configured on client side |
| Device Storage | Session and token persistence | Uses secure storage on native; web fallback reviewed |
| CI/CD and EAS | Build, typecheck, test, and publish OTA updates | Workflow in `.github/workflows/production.yml` |
| Database and File Storage | Stores user, vehicle, reservation, and uploaded data | External to repo; must be separately reviewed |

### 2.4 Data Flow

User → Mobile app → API/notification hub → Database/file storage.

Sensitive data and tokens cross the device-to-API boundary and should be secured with HTTPS/WSS, server-side validation, and protected storage.

---

## 3. Security Objectives

- Confidentiality: Only authorized users and staff should access personal, vehicle, registration, and reservation data.
- Integrity: Data must not be modified, deleted, or manipulated by unauthorized users.
- Availability: The system should remain available when needed for legitimate users.
- Authentication: The system must verify user identity and protect session state.
- Authorization: Users should have only the permissions appropriate to their roles.
- Accountability: Security-relevant actions must be logged and traceable.
- Privacy: Personal and sensitive information must be limited, protected, and retained appropriately.

---

## 4. Asset Identification

| Asset | Description | Importance | Security Requirement |
|---|---|---:|---|
| User accounts and sessions | Authentication state and tokens | High | Protected storage, expiry, revocation, access control |
| Personal information | Profile and account details | High | Restricted access, encryption, privacy controls |
| Vehicle records | Vehicle details and registration status | High | Access control and integrity checks |
| Uploaded documents/images | Registration-related files | High | Validation, access control, and secure storage |
| Parking activity records | Reservations, schedules, occupancy, and log history | High | Integrity and privacy controls |
| API and SignalR traffic | Authentication, data, and real-time events | High | HTTPS/WSS, token validation, and safe logging |
| Source code and dependencies | Application code and package configuration | High | Version control control, review, and dependency scanning |
| CI/CD secrets | Expo tokens and release credentials | High | Least privilege and protected storage |
| Logs and monitoring data | Operational diagnostics and events | Medium–High | Redaction and restricted access |

---

## 5. Data Classification

| Classification | Examples | Reason |
|---|---|---|
| Public | App information, service announcements | Not sensitive; intended for broader visibility |
| Internal | Operational configuration or non-public but not highly sensitive settings | Intended only for internal use |
| Confidential | Profile data, parking activity, reservation records | Contains personal or operational information |
| Highly Confidential / Sensitive | Tokens, registration documents, payment-related information, account credentials | Exposure could cause account compromise, privacy harm, or fraud |

A value with an `EXPO_PUBLIC_` prefix must be treated as public once bundled into a client application. It must not be used for passwords, private API keys, signing keys, or other secrets.

---

## 6. Security Requirements

| ID | Requirement | Type | Priority |
|---|---|---|---|
| SEC-001 | Users must authenticate before accessing protected resources. | Functional | High |
| SEC-002 | The backend must enforce authorization for every protected action and resource. | Functional | Critical |
| SEC-003 | Production systems must use HTTPS/WSS and reject HTTP or cleartext traffic. | Functional / Non-functional | Critical |
| SEC-004 | Tokens must be stored in secure native storage and reviewed for web safety. | Non-functional | High |
| SEC-005 | Sessions must expire and support secure logout and revocation. | Functional | High |
| SEC-006 | Uploaded files must be validated and restricted to authorized users. | Functional | High |
| SEC-007 | User input must be validated, and server queries must use parameterized or equivalent safe patterns. | Functional | High |
| SEC-008 | Logs must not contain tokens, document content, or other sensitive data. | Non-functional | High |
| SEC-009 | Security-relevant actions must produce audit records. | Functional | High |
| SEC-010 | Secrets must be stored in approved secret management and not embedded in mobile builds. | Non-functional | Critical |
| SEC-011 | Dependencies must be scanned and updated according to risk. | Non-functional | High |
| SEC-012 | Release and OTA publishing permissions must be restricted to authorized maintainers and protected by review and CI controls. | Non-functional | High |

---

## 7. Threat Modeling

### STRIDE Threat Table

| Threat | Affected Component | Possible Impact | Recommended Mitigation |
|---|---|---|---|
| Spoofing | Authentication, API, SignalR | Unauthorized access to account or data | Secure session handling, token validation, and stronger auth for privileged roles |
| Tampering | API, database, network | Altered reservations, vehicle, or user data | HTTPS/WSS, authorization, and integrity checks |
| Repudiation | API and audit systems | Untraceable admin or user actions | Audit logging and restricted log access |
| Information Disclosure | Logs, storage, API, file upload | Privacy breach or account compromise | Redacted logs, data minimization, encryption, and restricted access |
| Denial of Service | API, uploads, network, SignalR | Service interruption | Rate limits, monitoring, and recovery planning |
| Elevation of Privilege | Backend authorization | Unauthorized admin or privileged access | Server-side RBAC and negative authorization tests |

---

## 8. Risk Assessment

Risk Score = Likelihood × Impact.

| Risk | Likelihood | Impact | Score | Level | Treatment |
|---|---:|---:|---:|---|---|
| HTTP API and cleartext traffic in production | 4 | 5 | 20 | Critical | Mitigate |
| Token exposure via web localStorage | 3 | 5 | 15 | High | Mitigate |
| Sensitive data in logs | 3 | 4 | 12 | High | Mitigate |
| Broken authorization in backend APIs | 3 | 5 | 15 | High | Mitigate |
| Malicious or unauthorized file upload | 3 | 4 | 12 | High | Mitigate |

**Treatment guidance:** “Mitigate” means reduce likelihood or impact through controls. High and critical risks should not be accepted without documented approval and compensating safeguards.

---

## 9. Secure System Design

The secure system design should include HTTPS/WSS, API-level authentication, role-based authorization, protected storage, monitored logs, and verified backups. Client-side controls are useful but not sufficient; server-side checks must remain authoritative.

```text
[Mobile/Web User]
        |
        | HTTPS / WSS only
        v
[ParkFlow App]
        |
        | Authentication token; no secrets embedded in app
        v
[WAF / API Gateway / Rate Limits]
        |
        v
[API Authentication] ---> [Identity Provider]
        |
        v
[Server-Side Authorization]
        |
        +------> [API Services] ------> [Restricted Database]
        |                 |
        |                 +-----------> [Validated File Storage]
        |
        +------> [Protected Audit Logs / Security Monitoring]
        |
        +------> [Encrypted Backups / Recovery]
```

---

## 10. Authentication and Authorization

### Authentication

The app’s Axios service identifies public authentication routes and attaches a bearer token to other requests. The SignalR connection obtains a token from the storage wrapper. These client-side behaviors do not prove that the API or hub properly validates tokens.

The project should:

- Validate authentication tokens on the backend, including signature, issuer, audience, expiry, and intended use.
- Define session expiry, refresh, logout, and revocation behavior.
- Protect password reset and email verification flows with short-lived, single-use codes and rate limits.
- Require stronger authentication, such as MFA, for privileged accounts where supported and appropriate.
- Avoid logging authentication tokens or including them in error messages.
- Review web token storage because the web fallback is `localStorage`.

### Proposed Access Control Matrix

| Function / Data | Student / Registered Driver | Visitor | Staff | Administrator |
|---|---:|---:|---:|---:|
| View public information | Yes | Yes | Yes | Yes |
| View or edit own profile | Own data | Limited, if applicable | Own data | As required for support |
| View own vehicle and documents | Own data | No | Only when assigned and authorized | Only when required |
| Create/manage own reservation | Yes, if eligible | Limited, if enabled | Operational access only | As required |
| View other users’ records | No | No | Only assigned operational need | Restricted, audited |
| Approve users or documents | No | No | Only if explicitly authorized | Yes, if assigned |
| Change system configuration | No | No | No | Yes, restricted and audited |

The backend must enforce this matrix. Hiding a screen or button in the app is not an authorization control.

---

## 11. Data Security

### Data at Rest

- Store native session tokens using platform-protected storage.
- Review the web fallback to `localStorage` and assess whether a server-managed secure session is feasible.
- Restrict database and file-store access to services and personnel with a business need.
- Encrypt sensitive data and backups using platform-supported encryption and managed keys.
- Define retention and secure deletion for documents and personal data.

### Data in Transit

- Replace all production HTTP API URLs with HTTPS and use WSS for SignalR.
- Remove iOS arbitrary-load and Android cleartext allowances from production configuration.
- Ensure all document downloads and external service connections use secure transport.
- Do not disable certificate validation to work around deployment problems.

### Password and Credential Security

If the project manages passwords, they must be stored server-side using a modern password-hashing algorithm with unique salts and appropriate parameters. Passwords must never be stored or logged in plaintext. Public client IDs are not secrets.

### Sensitive Data

Identity and registration documents, session tokens, personal contact data, vehicle information, and payment-related records should receive the strongest access restrictions. The application should collect only information necessary for its defined parking functions.

---

## 12. Secure Coding Practices

| Area | Practice |
|---|---|
| Input validation | Validate type, length, format, and allowed values at the API boundary. |
| Authorization | Check user identity, role, and resource ownership on the backend for every sensitive request. |
| Injection protection | Use parameterized queries or safe ORM patterns on the backend. |
| Output and error handling | Return user-safe errors; do not expose stack traces or sensitive messages. |
| Session management | Use secure storage, expiry, revocation, and logout. |
| File uploads | Enforce file type/content and size validation, secure names, and access restrictions. |
| Real-time events | Treat SignalR payloads as untrusted input. |
| Logging | Redact tokens and sensitive data in logs. |
| Secrets | Do not put keys in source code or client configuration. |
| Dependencies | Use lockfiles, review updates, and scan for vulnerabilities. |

---

## 13. Secure Development / Implementation

### Source Code Management

- Restrict repository write and admin access to required members.
- Protect the default branch with pull-request review and required CI checks.
- Review changes to authentication, storage, API config, uploads, and CI/CD workflows with extra attention.
- Keep commits small and attributable.
- Avoid committing secrets or local environment files.

### Secrets Management

Use a dedicated secret manager for API keys, signing secrets, and release credentials. GitHub Actions environment secrets should be protected and limited to the workflows that require them. Values must never be hardcoded into application code or repo history.

### Dependency Management

The repository includes `package.json` and `package-lock.json`. Ensure dependency vulnerability scanning is done regularly and define a process for updating vulnerable packages.

---

## 14. Security Testing

The workflow currently runs TypeScript typechecking and Node tests. However, the repository does not show dedicated security scanning or penetration testing.

### Proposed pre-deployment tests

| Test Area | Test Cases |
|---|---|
| Authentication | Invalid, expired, missing, or revoked tokens; password reset and verification; logout and session expiry |
| Authorization | Access another user’s profile, vehicle, documents, reservation, and history |
| Transport | Confirm production build has no HTTP/WSS downgrade path and no cleartext traffic |
| Input validation | Malformed values, oversized payloads, injection-like input |
| File upload | Unauthorized types, oversized or malicious files, unauthorized retrieval |
| API security | Invalid requests, rate limiting, permission boundaries, token misuse |
| SignalR | Unauthenticated connections, invalid event data, token expiry/reconnect behavior |
| Logging and privacy | Ensure logs do not expose tokens, document contents, or sensitive data |

---

## 15. Vulnerability Assessment

| Finding | Location | Severity | Recommended Fix | Status |
|---|---|---|---|---|
| Production endpoint uses HTTP and cleartext traffic is allowed | `app.config.js`, `services/apiConfig.ts`, `eas.json` | High / release-blocking | Enforce HTTPS/WSS and remove cleartext settings | Pending |
| Web token stored in localStorage | `services/storage.ts` | Medium–High | Review and reduce token exposure | Pending |
| Sensitive logs may include response or event data | `services/axios.ts`, `services/signalr.ts` | Medium | Remove or redact payload logs | Pending |
| Backend authorization not verifiable | Backend outside repo | High | Verify server-side authorization for each route and resource | Unknown |
| Upload validation not verifiable | Backend/file storage outside repo | High | Validate and restrict uploaded files server-side | Unknown |

---

## 16. Secure Deployment

Production deployment should use a separate, restricted configuration and an approved release process.

### Deployment Checklist

- [ ] Production API and SignalR endpoints use HTTPS/WSS.
- [ ] Cleartext traffic is disabled in production builds.
- [ ] Development HTTP exceptions are limited to local development.
- [ ] No private credentials or secrets are in source code or app bundles.
- [ ] Production credentials are stored in approved secret storage with least privilege.
- [ ] Debug logging is reviewed and sensitive payload logging is removed.
- [ ] Backend authorization and upload controls have been tested.
- [ ] Database and file-storage access is restricted to required services and personnel.
- [ ] Default and test accounts are removed or disabled.
- [ ] Release/OTA publishing is limited to authorized maintainers and reviewed changes.
- [ ] Backups and restoration procedures are configured and tested.
- [ ] Monitoring, alerting, and incident escalation contacts are in place.
- [ ] Security tests have passed or documented exceptions have been approved.

---

## 17. Security Monitoring and Logging

Security events should be logged for successful and failed logins, password changes, privilege changes, and administrative actions. Logs must be protected from tampering and restricted to authorized personnel. Suspicious activity should trigger alerts and escalation procedures.

---

## 18. Incident Response Plan

1. Preparation: define roles, contact paths, backup procedure, and escalation rules.
2. Detection and analysis: determine scope, affected systems, and data exposure.
3. Containment: disable compromised accounts, isolate systems, block malicious traffic.
4. Eradication: remove malicious code or misconfigurations, patch vulnerabilities, reset credentials.
5. Recovery: restore from verified backups and monitor closely after recovery.
6. Lessons learned: document the cause, impact, and preventative measures.

---

## 19. Backup and Recovery

The project should maintain a documented backup and restore strategy. Data backups should be encrypted, access-controlled, and tested regularly.

- What is backed up: database, files, configuration, logs, and release data.
- Frequency: based on criticality and data change rate.
- Storage: secure encrypted storage separated from production systems.
- Access: restricted to authorized personnel only.
- Recovery test: validate restoration periodically.

---

## 20. Privacy and Data Protection

The app appears to process or may process personal profiles, vehicle details, registration documents, parking activity, and payment-related information. The project should collect only data necessary for service delivery, set retention limits, and define procedures for correction or deletion. For Philippine-based projects, privacy obligations under the Data Privacy Act of 2012 should be reviewed with the institution’s privacy adviser.

---

## 21. Secure SDLC Implementation Matrix

| SDLC Stage | Security Activity | Deliverable |
|---|---|---|
| Planning | Identify security objectives and user data | Security objectives and data inventory |
| Requirements | Define functional and non-functional security requirements | Security requirement list |
| Risk Analysis | Identify threats and estimate risk | Risk register |
| Design | Create secure architecture and RBAC design | Secure architecture diagram |
| Development | Apply secure coding, review, and secret controls | Reviewed code and secure configuration |
| Testing | Perform security tests | Security testing report |
| Deployment | Harden production environment | Deployment checklist |
| Maintenance | Monitor, update, and patch | Maintenance plan |
| Incident Response | Handle and learn from incidents | Incident response plan |

---

## 22. Security Checklist

- [ ] Authentication implemented
- [ ] Passwords securely hashed
- [ ] Session management implemented
- [ ] Role-based access enforced server-side
- [ ] Input validation implemented
- [ ] File upload validation implemented
- [ ] HTTPS/WSS configured
- [ ] Database access restricted
- [ ] Logs protected and sanitized
- [ ] Backup and recovery procedures in place
- [ ] Incident response procedure documented

---

## 23. Conclusion

ParkFlow Mobile App should be treated as a sensitive application because it handles identity-related data, vehicle information, parking activity, and documentation. The main risks visible in the reviewed repository are transport security weaknesses, web token exposure, and the need for stronger backend authorization and logging controls. These issues should be addressed before production use. By applying Secure SDLC principles from planning through operations and incident handling, the project can reduce risk, improve defense in depth, and better protect its users and data.

---

## 24. References

- OWASP Foundation (n.d.). OWASP Top 10 and API Security guidance. Available at https://owasp.org
- NIST (2022). Secure Software Development Framework (SP 800-218). National Institute of Standards and Technology.
- National Privacy Commission (n.d.). Data Privacy Act of 2012 and implementing rules. Available at https://privacy.gov.ph
- Expo Documentation (n.d.). SecureStore and app configuration guidance. Available at https://docs.expo.dev

