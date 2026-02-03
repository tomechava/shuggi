# Known Vulnerabilities

## Lodash Prototype Pollution (Transitive Dependency)

- Package: lodash
- Introduced via: @nestjs/config
- Severity: Moderate
- CVE: GHSA-xxjr-mmjv-4gpg

### Context
This vulnerability affects lodash functions `_.unset` and `_.omit`.
The affected lodash version is used internally by `@nestjs/config`
for configuration merging.

### Risk Assessment
- No direct usage of lodash in application code
- No user-controlled input is passed to configuration logic
- Attack surface is minimal in current architecture

### Decision
- Do NOT apply `npm audit fix --force`
- Track dependency updates in NestJS
- Re-evaluate before production deployment

### Action Plan
- Monitor @nestjs/config release notes
- Upgrade dependencies during pre-production hardening
