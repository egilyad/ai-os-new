Skip to content
egilyad
ai-os-new
Repository navigation
Code
Issues
Pull requests
Agents
Actions
Projects
Wiki
Security and quality
Insights
Settings
CI
CI #168
All jobs
Run details
Annotations
1 error, 1 warning, and 1 notice
Circular Dependency Check
failed 3 minutes ago in 57s
Search logs
1s
1s
3s
5s
0s
8s
Run npm run check:circular-kernel

> ai-os-new@4.5.0 check:circular-kernel
> madge --circular --extensions ts --ts-config tsconfig.app.json src/kernel/ 2>&1 | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{console.log(d);if(/Found \\d+ circular/.test(d))process.exit(1)})"

- Finding files
Processed 1518 files (7.5s) 

✖ Found 2 circular dependencies!

1) services/database-service.ts > services/dexie-schema.ts > services/agems-audit-service.ts
2) instances.ts > instances/infra.ts > types/service-exports.ts > services/agent-service.ts


Error: Process completed with exit code 1.
0s
0s
0s
0s
